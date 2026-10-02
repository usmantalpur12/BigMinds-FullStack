const { catchAsync } = require("../middleware/errorHandler");
const CourseReview = require("../models/CourseReview");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// Submit or update review (student only, must be enrolled)
exports.submitReview = catchAsync(async (req, res) => {
  const { id: courseId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5",
    });
  }

  // Primary check: Enrollment document (current enrollment system)
  let enrollment = await Enrollment.findOne({
    courseId,
    studentId: req.user.id,
  });

  if (!enrollment) {
    // Fallback check: legacy enrollment stored on Course.enrolledStudents
    const legacyCourse = await Course.findOne({
      _id: courseId,
      "enrolledStudents.student": req.user.id,
    }).select("_id");

    if (!legacyCourse) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to submit a review",
      });
    }
  }

  const review = await CourseReview.findOneAndUpdate(
    { courseId, studentId: req.user.id },
    { rating: Number(rating), comment: comment || "" },
    { new: true, upsert: true, runValidators: true }
  ).populate("studentId", "firstName lastName");

  // Update course aggregate rating
  const reviews = await CourseReview.find({ courseId });
  const totalRatings = reviews.length;
  const avgRating =
    totalRatings > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;
  await Course.findByIdAndUpdate(courseId, {
    rating: Math.round(avgRating * 10) / 10,
    totalRatings,
  });

  res.status(200).json({
    success: true,
    data: review,
    message: "Review submitted successfully",
  });
});

// Get reviews for a course (public for listing)
exports.getCourseReviews = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { limit = 20, skip = 0 } = req.query;

  const reviews = await CourseReview.find({ courseId })
    .populate("studentId", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .lean();

  const total = await CourseReview.countDocuments({ courseId });
  const course = await Course.findById(courseId).select("rating totalRatings").lean();

  res.status(200).json({
    success: true,
    data: {
      reviews,
      total,
      courseRating: course?.rating ?? 0,
      totalRatings: course?.totalRatings ?? 0,
    },
  });
});

// Get my review for a course (student)
exports.getMyReview = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const review = await CourseReview.findOne({
    courseId,
    studentId: req.user.id,
  }).lean();
  res.status(200).json({
    success: true,
    data: review,
  });
});

module.exports = exports;
