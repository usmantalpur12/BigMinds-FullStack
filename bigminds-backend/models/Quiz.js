const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null, // Nullable for random/general quizzes not linked to courses
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    duration: {
      type: Number, // in seconds
      required: [true, "Quiz duration is required"],
      min: [60, "Duration must be at least 60 seconds"],
      max: [7200, "Duration cannot exceed 2 hours"],
    },
    totalQuestions: {
      type: Number,
      required: [true, "Total questions count is required"],
      min: [1, "Quiz must have at least 1 question"],
      max: [100, "Quiz cannot have more than 100 questions"],
    },
    passingScore: {
      type: Number,
      required: [true, "Passing score is required"],
      min: [0, "Passing score cannot be negative"],
      max: [100, "Passing score cannot exceed 100"],
      default: 70,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: [1, "Max attempts must be at least 1"],
      max: [10, "Max attempts cannot exceed 10"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isTimed: {
      type: Boolean,
      default: true,
    },
    allowReview: {
      type: Boolean,
      default: true,
    },
    showResults: {
      type: Boolean,
      default: true,
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    shuffleOptions: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    instructions: {
      type: String,
      maxlength: [1000, "Instructions cannot exceed 1000 characters"],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
quizSchema.index({ courseId: 1, isActive: 1 });
quizSchema.index({ startDate: 1, endDate: 1 });
quizSchema.index({ tags: 1 });

// Virtual for quiz status
quizSchema.virtual("status").get(function () {
  const now = new Date();
  
  if (!this.isActive) return "inactive";
  if (this.startDate > now) return "scheduled";
  if (this.endDate && this.endDate < now) return "expired";
  return "active";
});

// Virtual for time remaining
quizSchema.virtual("timeRemaining").get(function () {
  if (!this.isTimed || !this.endDate) return null;
  
  const now = new Date();
  const remaining = this.endDate.getTime() - now.getTime();
  
  return remaining > 0 ? remaining : 0;
});

// Method to check if quiz is available
quizSchema.methods.isAvailable = function () {
  const now = new Date();
  
  if (!this.isActive) return false;
  if (this.startDate > now) return false;
  if (this.endDate && this.endDate < now) return false;
  
  return true;
};

// Method to get quiz statistics
quizSchema.methods.getStats = async function () {
  const Attempt = mongoose.model("Attempt");
  
  const stats = await Attempt.aggregate([
    { $match: { quizId: this._id } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: "$score" },
        highestScore: { $max: "$score" },
        lowestScore: { $min: "$score" },
        passCount: {
          $sum: { $cond: [{ $gte: ["$score", this.passingScore] }, 1, 0] }
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passCount: 0,
      passRate: 0
    };
  }
  
  const stat = stats[0];
  return {
    totalAttempts: stat.totalAttempts,
    averageScore: Math.round(stat.averageScore * 100) / 100,
    highestScore: stat.highestScore,
    lowestScore: stat.lowestScore,
    passCount: stat.passCount,
    passRate: Math.round((stat.passCount / stat.totalAttempts) * 100)
  };
};

module.exports = mongoose.model("Quiz", quizSchema); 