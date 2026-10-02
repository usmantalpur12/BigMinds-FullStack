const Course = require("../models/Course");
const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const Quiz = require("../models/Quiz");
const CourseThread = require("../models/CourseThread");
const CoursePost = require("../models/CoursePost");
const { catchAsync } = require("../middleware/errorHandler");

// Get all published courses
exports.getCourses = catchAsync(async (req, res) => {
  const { category, class: classLevel, level, search, sort = "newest" } = req.query;
  
  let query = { isPublished: true };
  
  if (category && category !== "all") {
    query.category = category;
  }
  
  // Filter by class level (9, 10, 11, 12, o-level, a-level)
  if (classLevel && classLevel !== "all") {
    query.class = classLevel;
  }
  
  if (level && level !== "all") {
    query.level = level;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } }
    ];
  }
  
  // Determine sort option
  let sortOption = {};
  switch (sort) {
    case "newest":
      sortOption = { createdAt: -1 };
      break;
    case "oldest":
      sortOption = { createdAt: 1 };
      break;
    case "popular":
      sortOption = { totalStudents: -1 };
      break;
    case "rating":
      sortOption = { rating: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }
  
  // Fetch courses with sorting
  let courses = await Course.find(query)
    .populate("instructor", "firstName lastName avatar")
    .sort(sortOption)
    .limit(parseInt(req.query.limit) || 20);
  
  // If user is authenticated, add enrollment status
  if (req.user) {
    const Enrollment = require("../models/Enrollment");
    const enrollments = await Enrollment.find({
      studentId: req.user.id,
      courseId: { $in: courses.map(c => c._id) }
    });
    
    const enrollmentMap = {};
    enrollments.forEach(e => {
      enrollmentMap[e.courseId.toString()] = {
        isEnrolled: true,
        progress: e.progress,
        status: e.status,
        enrollmentId: e._id
      };
    });
    
    courses = courses.map(course => {
      const enrollment = enrollmentMap[course._id.toString()];
      return {
        ...course.toObject(),
        isEnrolled: enrollment ? true : false,
        enrollmentProgress: enrollment ? enrollment.progress : 0,
        enrollmentStatus: enrollment ? enrollment.status : null
      };
    });
  }
  
  res.status(200).json({
    success: true,
    data: courses,
    count: courses.length
  });
});

// Get single course
exports.getCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("instructor", "firstName lastName email avatar");
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  // Add enrollment status if user is authenticated
  let courseData = course.toObject();
  
  if (req.user) {
    const enrollment = await Enrollment.findOne({
      courseId: req.params.id,
      studentId: req.user.id
    });
    
    if (enrollment) {
      courseData.isEnrolled = true;
      courseData.enrollmentProgress = enrollment.progress;
      courseData.enrollmentStatus = enrollment.status;
      courseData.enrollmentId = enrollment._id;
    } else {
      courseData.isEnrolled = false;
      courseData.enrollmentProgress = 0;
      courseData.enrollmentStatus = null;
    }
  } else {
    courseData.isEnrolled = false;
    courseData.enrollmentProgress = 0;
    courseData.enrollmentStatus = null;
  }
  
  res.status(200).json({
    success: true,
    data: courseData
  });
});

// Get course lessons
exports.getCourseLessons = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  // Sort lessons by order
  const sortedLessons = course.lessons.sort((a, b) => a.order - b.order);
  
  console.log(`🔍 DEBUG: Fetched ${sortedLessons.length} lessons for course ${req.params.id}`);
  
  res.status(200).json({
    success: true,
    data: sortedLessons
  });
});

// Get course quizzes
exports.getCourseQuizzes = catchAsync(async (req, res) => {
  const quizzes = await Quiz.find({ courseId: req.params.id, isActive: true })
    .select("title totalQuestions duration maxAttempts");
  
  res.status(200).json({
    success: true,
    data: quizzes
  });
});

// Get course forum
exports.getCourseForum = catchAsync(async (req, res) => {
  const threads = await CourseThread.find({ courseId: req.params.id })
    .populate("authorId", "firstName lastName avatar")
    .populate("lastPost.authorId", "firstName lastName")
    .sort({ isPinned: -1, lastActivity: -1 });
  
  res.status(200).json({
    success: true,
    data: threads
  });
});

// Enroll in course
exports.enrollInCourse = catchAsync(async (req, res) => {
  const courseId = req.params.id; // Route uses :id, not :courseId
  
  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    courseId,
    studentId: req.user.id
  });
  
  if (existingEnrollment) {
    return res.status(400).json({
      success: false,
      message: "Already enrolled in this course",
      data: {
        enrollment: existingEnrollment,
        course: course,
        isEnrolled: true
      }
    });
  }
  
  // Create enrollment
  const enrollment = await Enrollment.create({
    courseId,
    studentId: req.user.id,
    status: "active",
    enrolledAt: new Date(),
    progress: 0,
    lastAccessed: new Date()
  });
  
  // Update course student count - Handled by Enrollment pre-save hook
  // await Course.findByIdAndUpdate(courseId, {
  //   $inc: { totalStudents: 1 }
  // });
  
  // Populate course data
  await course.populate("instructor", "firstName lastName email avatar");
  
  res.status(201).json({
    success: true,
    data: {
      enrollment: enrollment,
      course: {
        ...course.toObject(),
        isEnrolled: true,
        enrollmentProgress: 0,
        enrollmentStatus: "active"
      }
    },
    message: "Successfully enrolled in course"
  });
});

// Get course progress
exports.getCourseProgress = catchAsync(async (req, res) => {
  const courseId = req.params.id; // Route uses :id, not :courseId
  
  const enrollment = await Enrollment.findOne({
    courseId,
    studentId: req.user.id
  }).populate("courseId", "title lessons");
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: "Not enrolled in this course"
    });
  }
  
  const course = enrollment.courseId;
  const totalLessons = course.lessons.length;
  const lessonsCompleted = enrollment.lessonsCompleted || 0;
  const progressPercentage = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;
  
  const progress = {
    ...enrollment.toObject(),
    totalLessons,
    progressPercentage,
    courseTitle: course.title
  };
  
  res.status(200).json({
    success: true,
    data: progress
  });
});

// Update course progress
exports.updateCourseProgress = catchAsync(async (req, res) => {
  const courseId = req.params.id; // Route uses :id, not :courseId
  const { studyTime, lessonCompleted } = req.body;
  
  const enrollment = await Enrollment.findOne({
    courseId,
    studentId: req.user.id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: "Not enrolled in this course"
    });
  }
  
  if (studyTime) {
    enrollment.totalStudyTime += studyTime;
  }
  
  if (lessonCompleted) {
    enrollment.lessonsCompleted += 1;
  }
  
  await enrollment.save();
  
  res.status(200).json({
    success: true,
    data: enrollment,
    message: "Progress updated successfully"
  });
});

// Complete lesson
exports.completeLesson = catchAsync(async (req, res) => {
  const courseId = req.params.id; // Route uses :id, not :courseId
  const lessonId = req.params.lessonId;
  
  const enrollment = await Enrollment.findOne({
    courseId,
    studentId: req.user.id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: "Not enrolled in this course"
    });
  }
  
  // Mark lesson as completed
  if (!enrollment.completedLessons) {
    enrollment.completedLessons = [];
  }
  
  if (!enrollment.completedLessons.includes(lessonId)) {
    enrollment.completedLessons.push(lessonId);
    enrollment.lessonsCompleted = enrollment.completedLessons.length;
  }
  
  await enrollment.save();
  
  res.status(200).json({
    success: true,
    data: enrollment,
    message: "Lesson marked as completed"
  });
});

// Create course (Teacher/Admin only)
exports.createCourse = catchAsync(async (req, res) => {
  req.body.instructor = req.user.id;

  // Ensure instructorName is set based on current user
  if (!req.body.instructorName) {
    const currentUser = await User.findById(req.user.id).select("firstName lastName");
    const fullName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ").trim();
    req.body.instructorName = fullName || "Instructor";
  }

  // Process lessons array - ensure order is set for each lesson
  if (req.body.lessons && Array.isArray(req.body.lessons)) {
    req.body.lessons = req.body.lessons.map((lesson, index) => ({
      ...lesson,
      order: lesson.order !== undefined ? lesson.order : index + 1,
    }));
    
    // Update totalVideos if not set
    if (!req.body.totalVideos && req.body.lessons.length > 0) {
      req.body.totalVideos = req.body.lessons.length;
    }
  }

  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    data: course,
    message: "Course created successfully"
  });
});

// Update course (Teacher/Admin only)
exports.updateCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  // Check if user is instructor or admin
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this course"
    });
  }
  
  const updatedCourse = await Course.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: updatedCourse,
    message: "Course updated successfully"
  });
});

// Delete course (Teacher/Admin only)
exports.deleteCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  // Check if user is instructor or admin
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this course"
    });
  }
  
  console.log("DEBUG: Deleting course with ID:", req.params.id);
  console.log("DEBUG: course.deleteOne type:", typeof course.deleteOne);
  console.log("DEBUG: course.remove type:", typeof course.remove);
  await course.deleteOne();
  
  res.status(200).json({
    success: true,
    message: "Course deleted successfully"
  });
});

// Add lesson to course (Teacher/Admin only)
exports.addLesson = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  // Check if user is instructor or admin
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to add lessons to this course"
    });
  }
  
  // Set lesson order
  req.body.order = course.lessons.length + 1;
  
  course.lessons.push(req.body);
  await course.save();
  
  res.status(201).json({
    success: true,
    data: course.lessons[course.lessons.length - 1],
    message: "Lesson added successfully"
  });
});

// Update lesson (Teacher/Admin only)
exports.updateLesson = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  // Check if user is instructor or admin
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update lessons in this course"
    });
  }
  
  const lessonIndex = course.lessons.findIndex(
    lesson => lesson._id.toString() === req.params.lessonId
  );
  
  if (lessonIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Lesson not found"
    });
  }
  
  course.lessons[lessonIndex] = { ...course.lessons[lessonIndex], ...req.body };
  await course.save();
  
  res.status(200).json({
    success: true,
    data: course.lessons[lessonIndex],
    message: "Lesson updated successfully"
  });
});

// Delete lesson (Teacher/Admin only)
exports.deleteLesson = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  // Check if user is instructor or admin
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete lessons from this course"
    });
  }
  
  const lessonIndex = course.lessons.findIndex(
    lesson => lesson._id.toString() === req.params.lessonId
  );
  
  if (lessonIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Lesson not found"
    });
  }
  
  course.lessons.splice(lessonIndex, 1);
  
  // Reorder remaining lessons
  course.lessons.forEach((lesson, index) => {
    lesson.order = index + 1;
  });
  
  await course.save();
  
  res.status(200).json({
    success: true,
    message: "Lesson deleted successfully"
  });
});

// Get all courses (Admin only)
exports.getAllCourses = catchAsync(async (req, res) => {
  const courses = await Course.find()
    .populate("instructor", "firstName lastName")
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    data: courses,
    count: courses.length
  });
});

// Publish course (Admin only)
exports.publishCourse = catchAsync(async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { isPublished: true },
    { new: true }
  );
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: course,
    message: "Course published successfully"
  });
});

// Unpublish course (Admin only)
exports.unpublishCourse = catchAsync(async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { isPublished: false },
    { new: true }
  );
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: course,
    message: "Course unpublished successfully"
  });
}); 

// Get course analytics (Teacher/Admin only)
exports.getCourseAnalytics = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found"
    });
  }
  
  // Check if user is instructor or admin
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view analytics for this course"
    });
  }
  
  // Get enrollment data
  const enrollments = await Enrollment.find({ courseId: req.params.id })
    .populate("studentId", "firstName lastName email")
    .sort({ enrolledAt: -1 });
  
  // Calculate statistics
  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter(e => e.status === "active").length;
  const completedEnrollments = enrollments.filter(e => e.status === "completed").length;
  
  // Calculate average progress
  const avgProgress = enrollments.length > 0
    ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
    : 0;
  
  // Calculate revenue from payments
  const Payment = require("../models/Payment");
  const payments = await Payment.find({
    courseId: req.params.id,
    status: "completed"
  });
  
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPurchases = payments.length;
  
  // Get quiz statistics
  const Quiz = require("../models/Quiz");
  const quizzes = await Quiz.find({ courseId: req.params.id });
  const totalQuizzes = quizzes.length;
  
  // Get forum statistics
  const CourseThread = require("../models/CourseThread");
  const threads = await CourseThread.find({ courseId: req.params.id });
  const totalThreads = threads.length;
  const totalReplies = threads.reduce((sum, t) => sum + (t.replyCount || 0), 0);
  
  // Recent enrollments (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentEnrollments = enrollments.filter(e => new Date(e.enrolledAt) >= sevenDaysAgo).length;
  
  // Completion rate
  const completionRate = totalEnrollments > 0
    ? Math.round((completedEnrollments / totalEnrollments) * 100)
    : 0;
  
  // Get course reviews for teacher
  const CourseReview = require("../models/CourseReview");
  const reviews = await CourseReview.find({ courseId: req.params.id })
    .populate("studentId", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const analytics = {
    course: {
      title: course.title,
      price: course.price,
      isPremium: course.isPremium,
      createdAt: course.createdAt,
      rating: course.rating,
      totalRatings: course.totalRatings,
    },
    enrollments: {
      total: totalEnrollments,
      active: activeEnrollments,
      completed: completedEnrollments,
      recent: recentEnrollments,
      completionRate,
      averageProgress: Math.round(avgProgress),
    },
    revenue: {
      total: totalRevenue,
      purchases: totalPurchases,
      averagePurchase: totalPurchases > 0 ? Math.round(totalRevenue / totalPurchases) : 0,
    },
    engagement: {
      totalQuizzes,
      totalThreads,
      totalReplies,
    },
    reviews: reviews.map(r => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      studentName: r.studentId ? `${r.studentId.firstName || ''} ${r.studentId.lastName || ''}`.trim() : 'Student',
      createdAt: r.createdAt,
    })),
    recentEnrollments: enrollments.slice(0, 10).map(e => ({
      student: {
        name: `${e.studentId?.firstName || ''} ${e.studentId?.lastName || ''}`.trim(),
        email: e.studentId?.email,
      },
      enrolledAt: e.enrolledAt,
      progress: e.progress || 0,
      status: e.status,
    })),
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// Get my courses (Teacher/Admin only) with enrolled + completed counts
exports.getMyCourses = catchAsync(async (req, res) => {
  const courses = await Course.find({ instructor: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const courseIds = courses.map(c => c._id);
  const completedByCourse = await Enrollment.aggregate([
    { $match: { courseId: { $in: courseIds }, status: "completed" } },
    { $group: { _id: "$courseId", count: { $sum: 1 } } },
  ]);

  const completedMap = {};
  completedByCourse.forEach(item => { completedMap[item._id.toString()] = item.count; });

  const coursesWithStats = courses.map(c => ({
    ...c,
    enrolledCount: c.totalStudents || 0,
    completedCount: completedMap[c._id.toString()] || 0,
  }));

  res.status(200).json({
    success: true,
    data: coursesWithStats,
    count: coursesWithStats.length
  });
});

// Get aggregate stats for teacher dashboard
exports.getTeacherDashboardStats = catchAsync(async (req, res) => {
  const Course = require("../models/Course");
  const Enrollment = require("../models/Enrollment");
  
  const courses = await Course.find({ instructor: req.user.id });
  const courseIds = courses.map(c => c._id);
  
  const enrollments = await Enrollment.find({ courseId: { $in: courseIds } });
  
  const totalStudents = enrollments.length;
  const activeStudents = enrollments.filter(e => e.status === "active").length;
  const completedStudents = enrollments.filter(e => e.status === "completed").length;
  const totalCourses = courses.length;
  
  const avgProgress = totalStudents > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalStudents)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      totalCourses,
      totalStudents,
      activeStudents,
      completedStudents,
      averageProgress: avgProgress
    }
  });
}); 