const mongoose = require("mongoose");

const attemptItemSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: [true, "Attempt ID is required"],
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question ID is required"],
    },
    selectedIndex: {
      type: Number,
      required: [true, "Selected answer index is required"],
      min: [0, "Selected index cannot be negative"],
    },
    isCorrect: {
      type: Boolean,
      required: [true, "Correctness flag is required"],
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
      min: [0, "Time spent cannot be negative"],
    },
    points: {
      type: Number,
      default: 0,
      min: [0, "Points cannot be negative"],
    },
    hintsUsed: {
      type: Number,
      default: 0,
      min: [0, "Hints used cannot be negative"],
    },
    hintsCost: {
      type: Number,
      default: 0,
      min: [0, "Hints cost cannot be negative"],
    },
    reviewNotes: {
      type: String,
      maxlength: [300, "Review notes cannot exceed 300 characters"],
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      enum: ["unclear", "typo", "wrong-answer", "other"],
    },
    flagDescription: {
      type: String,
      maxlength: [200, "Flag description cannot exceed 200 characters"],
    },
    confidence: {
      type: Number,
      min: [1, "Confidence must be at least 1"],
      max: [5, "Confidence cannot exceed 5"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
attemptItemSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });
attemptItemSchema.index({ attemptId: 1 });
attemptItemSchema.index({ questionId: 1 });
attemptItemSchema.index({ isCorrect: 1 });

// Virtual for final points (after hints deduction)
attemptItemSchema.virtual("finalPoints").get(function () {
  return Math.max(0, this.points - this.hintsCost);
});

// Virtual for efficiency score
attemptItemSchema.virtual("efficiencyScore").get(function () {
  if (this.timeSpent === 0) return 0;
  return Math.round((this.finalPoints / this.timeSpent) * 100) / 100;
});

// Method to add hint usage
attemptItemSchema.methods.useHint = function (hintCost) {
  this.hintsUsed += 1;
  this.hintsCost += hintCost;
  return this.save();
};

// Method to flag question
attemptItemSchema.methods.flagQuestion = function (reason, description) {
  this.isFlagged = true;
  this.flagReason = reason;
  this.flagDescription = description;
  return this.save();
};

// Method to set confidence level
attemptItemSchema.methods.setConfidence = function (level) {
  if (level >= 1 && level <= 5) {
    this.confidence = level;
    return this.save();
  }
  throw new Error("Confidence level must be between 1 and 5");
};

// Static method to get question statistics
attemptItemSchema.statics.getQuestionStats = async function (questionId) {
  const stats = await this.aggregate([
    { $match: { questionId: mongoose.Types.ObjectId(questionId) } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        correctAttempts: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        averageTime: { $avg: "$timeSpent" },
        averagePoints: { $avg: "$finalPoints" },
        hintsUsed: { $sum: "$hintsUsed" },
        flaggedCount: { $sum: { $cond: ["$isFlagged", 1, 0] } },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalAttempts: 0,
      correctAttempts: 0,
      successRate: 0,
      averageTime: 0,
      averagePoints: 0,
      hintsUsed: 0,
      flaggedCount: 0,
    };
  }

  const stat = stats[0];
  return {
    totalAttempts: stat.totalAttempts,
    correctAttempts: stat.correctAttempts,
    successRate: Math.round((stat.correctAttempts / stat.totalAttempts) * 100),
    averageTime: Math.round(stat.averageTime * 100) / 100,
    averagePoints: Math.round(stat.averagePoints * 100) / 100,
    hintsUsed: stat.hintsUsed,
    flaggedCount: stat.flaggedCount,
  };
};

// Static method to get user's question history
attemptItemSchema.statics.getUserQuestionHistory = async function (userId, questionId) {
  return this.aggregate([
    {
      $lookup: {
        from: "attempts",
        localField: "attemptId",
        foreignField: "_id",
        as: "attempt",
      },
    },
    {
      $match: {
        "attempt.userId": mongoose.Types.ObjectId(userId),
        questionId: mongoose.Types.ObjectId(questionId),
      },
    },
    {
      $sort: { "attempt.startedAt": -1 },
    },
    {
      $project: {
        selectedIndex: 1,
        isCorrect: 1,
        timeSpent: 1,
        points: 1,
        hintsUsed: 1,
        confidence: 1,
        "attempt.startedAt": 1,
        "attempt.score": 1,
      },
    },
  ]);
};

module.exports = mongoose.model("AttemptItem", attemptItemSchema); 