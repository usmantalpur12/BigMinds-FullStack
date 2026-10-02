const User = require("../models/User");
const Enrollment = require("../models/Enrollment");
const UserProgress = require("../models/UserProgress");
const ForumMember = require("../models/ForumMember");
const Assignment = require("../models/Assignment");
const Quiz = require("../models/Quiz");
const { catchAsync } = require("../middleware/errorHandler");
const bcrypt = require("bcryptjs");

// Get current user
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// Update current user
exports.updateMe = catchAsync(async (req, res) => {
  const { firstName, lastName, bio, interests } = req.body;
  
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { firstName, lastName, bio, interests },
    { new: true, runValidators: true }
  ).select("-password");
  
  res.status(200).json({
    success: true,
    data: updatedUser,
    message: "Profile updated successfully"
  });
});

// Update avatar
exports.updateAvatar = catchAsync(async (req, res) => {
  const { avatarUrl } = req.body;
  
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: avatarUrl },
    { new: true }
  ).select("-password");
  
  res.status(200).json({
    success: true,
    data: updatedUser,
    message: "Avatar updated successfully"
  });
});

// Update password
exports.updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user.id).select("+password");
  
  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect"
    });
  }
  
  // Update password (model pre-save hook will handle hashing)
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: "Password updated successfully"
  });
});

// Get user stats
exports.getMyStats = catchAsync(async (req, res) => {
  let userProgress = await UserProgress.findOne({ user: req.user.id });
  
  if (!userProgress) {
    userProgress = new UserProgress({ user: req.user.id });
    await userProgress.save();
  }
  
  // Calculate additional stats
  const enrollments = await Enrollment.find({ studentId: req.user.id });
  const completedCourses = enrollments.filter(e => e.status === "completed").length;
  const activeCourses = enrollments.filter(e => e.status === "active").length;
  
  // Calculate forum stats
  const forumStats = {
    questionsAsked: userProgress.forumPosts || 0,
    answersGiven: userProgress.forumReplies || 0,
    reputation: (userProgress.helpfulVotes || 0) * 10, // Convert helpful votes to reputation points
    badges: [] // No badges system currently
  };
  
  const stats = {
    ...userProgress.toObject(),
    totalCourses: enrollments.length,
    completedCourses,
    activeCourses,
    completionRate: enrollments.length > 0 ? Math.round((completedCourses / enrollments.length) * 100) : 0,
    forumStats
  };
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// Get user enrollments
exports.getMyEnrollments = catchAsync(async (req, res) => {
  const enrollments = await Enrollment.find({ studentId: req.user.id })
    .populate("courseId", "title thumbnail category")
    .populate("courseId.instructor", "firstName lastName")
    .sort({ enrolledAt: -1 });
  
  res.status(200).json({
    success: true,
    data: enrollments
  });
});

// Get user forum memberships
exports.getMyForumMemberships = catchAsync(async (req, res) => {
  const memberships = await ForumMember.find({ userId: req.user.id })
    .populate("forumId", "title description category")
    .sort({ joinedAt: -1 });
  
  res.status(200).json({
    success: true,
    data: memberships
  });
});

// Create enrollment
exports.createEnrollment = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  
  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    courseId,
    studentId: req.user.id
  });
  
  if (existingEnrollment) {
    return res.status(400).json({
      success: false,
      message: "Already enrolled in this course"
    });
  }
  
  const enrollment = await Enrollment.create({
    courseId,
    studentId: req.user.id,
    status: "active",
    enrolledAt: new Date()
  });
  
  res.status(201).json({
    success: true,
    data: enrollment,
    message: "Enrollment created successfully"
  });
});

// Get user enrollments
exports.getUserEnrollments = catchAsync(async (req, res) => {
  const enrollments = await Enrollment.find({ studentId: req.params.id })
    .populate("courseId", "title thumbnail category")
    .populate("courseId.instructor", "firstName lastName")
    .sort({ enrolledAt: -1 });
  
  res.status(200).json({
    success: true,
    data: enrollments
  });
});

// Get specific enrollment
exports.getEnrollment = catchAsync(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    courseId: req.params.courseId,
    studentId: req.params.id
  }).populate("courseId", "title thumbnail category");
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: "Enrollment not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: enrollment
  });
});

// Update enrollment
exports.updateEnrollment = catchAsync(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    courseId: req.params.courseId,
    studentId: req.params.id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: "Enrollment not found"
    });
  }
  
  const updatedEnrollment = await Enrollment.findByIdAndUpdate(
    enrollment._id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: updatedEnrollment,
    message: "Enrollment updated successfully"
  });
});

// Delete enrollment
exports.deleteEnrollment = catchAsync(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    courseId: req.params.courseId,
    studentId: req.params.id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: "Enrollment not found"
    });
  }
  
  await enrollment.deleteOne();
  
  res.status(200).json({
    success: true,
    message: "Enrollment deleted successfully"
  });
});

// Get enrollment progress
exports.getEnrollmentProgress = catchAsync(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    courseId: req.params.courseId,
    studentId: req.params.id
  }).populate("courseId", "title lessons");
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: "Enrollment not found"
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

// Update enrollment progress
exports.updateEnrollmentProgress = catchAsync(async (req, res) => {
  const { studyTime, lessonCompleted } = req.body;
  
  const enrollment = await Enrollment.findOne({
    courseId: req.params.courseId,
    studentId: req.params.id
  });
  
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: "Enrollment not found"
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

// Get all users (Admin only)
exports.getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, search, role, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  let query = {};
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }
  
  if (role) {
    query.role = role;
  }
  
  if (status !== undefined) {
    query.isActive = status === "true" || status === true;
  }
  
  const total = await User.countDocuments(query);
  
  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Get user by ID (Admin only)
exports.getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// Update user (Admin only)
exports.updateUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select("-password");
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: user,
    message: "User updated successfully"
  });
});

// Delete user (Admin only)
exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }
  
  await user.deleteOne();
  
  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});

// Update user role (Admin only)
exports.updateUserRole = catchAsync(async (req, res) => {
  const { role } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select("-password");
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: user,
    message: "User role updated successfully"
  });
});

// Update user status (Admin only)
exports.updateUserStatus = catchAsync(async (req, res) => {
  const { isActive } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true }
  ).select("-password");
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: user,
    message: "User status updated successfully"
  });
});

// Get specific user stats (Admin only)
exports.getUserStats = catchAsync(async (req, res) => {
  const userId = req.params.id;
  let userProgress = await UserProgress.findOne({ user: userId });
  
  if (!userProgress) {
    userProgress = new UserProgress({ user: userId });
    await userProgress.save();
  }
  
  // Calculate additional stats
  const enrollments = await Enrollment.find({ studentId: userId });
  const completedCourses = enrollments.filter(e => e.status === "completed").length;
  const activeCourses = enrollments.filter(e => e.status === "active").length;
  
  // Calculate forum stats
  const forumStats = {
    questionsAsked: userProgress.forumPosts || 0,
    answersGiven: userProgress.forumReplies || 0,
    reputation: (userProgress.helpfulVotes || 0) * 10,
    badges: []
  };
  
  const stats = {
    ...userProgress.toObject(),
    totalCourses: enrollments.length,
    completedCourses,
    activeCourses,
    completionRate: enrollments.length > 0 ? Math.round((completedCourses / enrollments.length) * 100) : 0,
    forumStats
  };
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// Get public users list
exports.getUsers = catchAsync(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  let query = { isActive: true };
  
  if (role) {
    query.role = role;
  }
  
  if (search) {
    // Optimized search with text index support
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }
  
  // Get total count for pagination
  const total = await User.countDocuments(query);
  
  // Get paginated users with limit
  const users = await User.find(query)
    .select("firstName lastName avatar role email")
    .sort({ firstName: 1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Get leaderboard
exports.getLeaderboard = catchAsync(async (req, res) => {
  const { category = "overall", timeRange = "all" } = req.query;
  
  let matchStage = {};
  
  // Apply time range filter
  if (timeRange !== "all") {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null;
    }
    
    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }
  }
  
  // Apply category filter
  if (category !== "overall") {
    matchStage.role = "student";
    if (category === "pre-engineering") {
      matchStage.targetExam = { $in: ["ecat", "nts"] };
    } else if (category === "pre-medical") {
      matchStage.targetExam = "mdcat";
    }
  }
  
  const leaderboard = await UserProgress.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userInfo"
      }
    },
    { $unwind: "$userInfo" },
    {
      $project: {
        _id: 1,
        xp: 1,
        level: 1,
        currentStreak: 1,
        totalStudyTime: 1,
        totalQuizzesTaken: 1,
        averageQuizScore: 1,
        totalPosts: 1,
        totalThreads: 1,
        "userInfo.firstName": 1,
        "userInfo.lastName": 1,
        "userInfo.avatar": 1,
        "userInfo.role": 1,
        "userInfo.targetExam": 1
      }
    },
    { $sort: { xp: -1, level: -1 } },
    { $limit: 50 }
  ]);
  
  // Add rank to each entry
  const leaderboardWithRank = leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
  
  // Get current user's rank if authenticated
  let currentUserRank = null;
  if (req.user) {
    const currentUserProgress = await UserProgress.findOne({ user: req.user.id });
    if (currentUserProgress) {
      const userRank = leaderboardWithRank.findIndex(entry => 
        entry.userInfo._id.toString() === req.user.id.toString()
      );
      if (userRank !== -1) {
        currentUserRank = {
          rank: userRank + 1,
          xp: currentUserProgress.xp,
          level: currentUserProgress.level,
          currentStreak: currentUserProgress.currentStreak,
          totalStudyTime: currentUserProgress.totalStudyTime,
          totalQuizzesTaken: currentUserProgress.totalQuizzesTaken,
          averageQuizScore: currentUserProgress.averageQuizScore,
          totalPosts: currentUserProgress.totalPosts,
          totalThreads: currentUserProgress.totalThreads
        };
      }
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      leaderboard: leaderboardWithRank,
      currentUser: currentUserRank,
      category,
      timeRange
    }
  });
});

// Get study goals
exports.getStudyGoals = catchAsync(async (req, res) => {
  let userProgress = await UserProgress.findOne({ user: req.user.id });
  
  if (!userProgress) {
    userProgress = new UserProgress({ user: req.user.id });
    await userProgress.save();
  }
  
  // Format study goals for frontend
  const studyGoals = (userProgress.learningGoals || []).map((goal, index) => ({
    _id: goal._id || `goal_${index}`,
    title: goal.title,
    targetDate: goal.deadline,
    progress: goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0,
    category: goal.category || 'general',
    isCompleted: goal.isCompleted || false,
    target: goal.target,
    current: goal.current || 0
  }));
  
  res.status(200).json({
    success: true,
    data: studyGoals
  });
});

// Get upcoming deadlines (assignments and quizzes)
exports.getUpcomingDeadlines = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
  
  // Get user's enrollments
  const enrollments = await Enrollment.find({ studentId: req.user.id });
  const courseIds = enrollments.map(e => e.courseId);
  
  // Get upcoming assignments
  const assignments = await Assignment.find({
    courseId: { $in: courseIds },
    isPublished: true,
    dueDate: { $gte: now, $lte: futureDate }
  })
    .populate("courseId", "title")
    .sort({ dueDate: 1 })
    .limit(parseInt(limit));
  
  // Get upcoming quizzes
  const quizzes = await Quiz.find({
    courseId: { $in: courseIds },
    isActive: true,
    endDate: { $gte: now, $lte: futureDate }
  })
    .populate("courseId", "title")
    .sort({ endDate: 1 })
    .limit(parseInt(limit));
  
  // Format deadlines
  const deadlines = [
    ...assignments.map(a => ({
      _id: a._id,
      title: a.title,
      dueDate: a.dueDate,
      type: 'assignment',
      course: a.courseId?.title || 'Unknown Course',
      priority: a.dueDate.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000 ? 'high' : 
                a.dueDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'medium' : 'low'
    })),
    ...quizzes.map(q => ({
      _id: q._id,
      title: q.title,
      dueDate: q.endDate,
      type: 'quiz',
      course: q.courseId?.title || 'Unknown Course',
      priority: q.endDate.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000 ? 'high' : 
                q.endDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'medium' : 'low'
    }))
  ].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: deadlines
  });
});

// Get admin statistics
exports.getAdminStats = catchAsync(async (req, res) => {
  const Course = require("../models/Course");
  const Forum = require("../models/Forum");
  
  // Get total counts
  const [
    totalUsers,
    activeUsers,
    totalCourses,
    totalForums,
    pendingUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Course.countDocuments({ isPublished: true }),
    Forum.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false })
  ]);
  
  // Calculate active users in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentActiveUsers = await User.countDocuments({
    lastActiveAt: { $gte: sevenDaysAgo }
  });
  
  // Get storage info (mock for now - would need actual file system stats)
  const storageUsed = "2.3 GB"; // This would be calculated from actual uploads
  const storageTotal = "10 GB";
  
  // Calculate system health
  const systemHealth = activeUsers > 0 && totalCourses > 0 ? "Excellent" : "Good";
  
  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      recentActiveUsers,
      totalCourses,
      totalForums,
      pendingApprovals: pendingUsers,
      systemHealth,
      storageUsed,
      storageTotal
    }
  });
}); 