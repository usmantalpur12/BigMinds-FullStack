const mongoose = require("mongoose");

const courseReviewSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

courseReviewSchema.index({ courseId: 1, studentId: 1 }, { unique: true });
courseReviewSchema.index({ courseId: 1 });
courseReviewSchema.index({ studentId: 1 });

module.exports = mongoose.model("CourseReview", courseReviewSchema);
