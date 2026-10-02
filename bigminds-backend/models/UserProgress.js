const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    // XP and Leveling System
    xp: {
      type: Number,
      default: 0,
      min: [0, "XP cannot be negative"],
    },
    level: {
      type: Number,
      default: 1,
      min: [1, "Level cannot be less than 1"],
    },
    totalXpEarned: {
      type: Number,
      default: 0,
      min: [0, "Total XP earned cannot be negative"],
    },
    
    // Streak System
    currentStreak: {
      type: Number,
      default: 0,
      min: [0, "Current streak cannot be negative"],
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: [0, "Longest streak cannot be negative"],
    },
    lastActivityDate: {
      type: Date,
      default: Date.now,
    },
    
    // Learning Analytics
    totalStudyTime: {
      type: Number, // in minutes
      default: 0,
      min: [0, "Study time cannot be negative"],
    },
    averageAccuracy: {
      type: Number,
      default: 0,
      min: [0, "Accuracy cannot be negative"],
      max: [100, "Accuracy cannot exceed 100"],
    },
    quizzesTaken: {
      type: Number,
      default: 0,
      min: [0, "Quizzes taken cannot be negative"],
    },
    quizzesPassed: {
      type: Number,
      default: 0,
      min: [0, "Quizzes passed cannot be negative"],
    },
    
    // Course Progress
    coursesEnrolled: {
      type: Number,
      default: 0,
      min: [0, "Courses enrolled cannot be negative"],
    },
    coursesCompleted: {
      type: Number,
      default: 0,
      min: [0, "Courses completed cannot be negative"],
    },
    currentCourses: [{
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      progress: {
        type: Number,
        default: 0,
        min: [0, "Progress cannot be negative"],
        max: [100, "Progress cannot exceed 100"],
      },
      lastAccessed: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // Forum Activity
    forumPosts: {
      type: Number,
      default: 0,
      min: [0, "Forum posts cannot be negative"],
    },
    forumReplies: {
      type: Number,
      default: 0,
      min: [0, "Forum replies cannot be negative"],
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: [0, "Helpful votes cannot be negative"],
    },
    
    // Achievements and Rewards
    achievementsEarned: {
      type: Number,
      default: 0,
      min: [0, "Achievements earned cannot be negative"],
    },
    badgesEarned: {
      type: Number,
      default: 0,
      min: [0, "Badges earned cannot be negative"],
    },
    
    // Weekly and Monthly Stats
    weeklyStats: {
      xpEarned: { type: Number, default: 0 },
      studyTime: { type: Number, default: 0 },
      quizzesTaken: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      weekStart: { type: Date, default: Date.now },
    },
    monthlyStats: {
      xpEarned: { type: Number, default: 0 },
      studyTime: { type: Number, default: 0 },
      quizzesTaken: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      monthStart: { type: Date, default: Date.now },
    },
    
    // Learning Goals
    learningGoals: [{
      title: String,
      target: Number,
      current: { type: Number, default: 0 },
      deadline: Date,
      isCompleted: { type: Boolean, default: false },
      category: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
userProgressSchema.index({ user: 1 });
userProgressSchema.index({ level: -1, xp: -1 });
userProgressSchema.index({ currentStreak: -1 });
userProgressSchema.index({ totalStudyTime: -1 });

// Virtual for completion rate
userProgressSchema.virtual('completionRate').get(function() {
  if (this.coursesEnrolled === 0) return 0;
  return Math.round((this.coursesCompleted / this.coursesEnrolled) * 100);
});

// Virtual for quiz success rate
userProgressSchema.virtual('quizSuccessRate').get(function() {
  if (this.quizzesTaken === 0) return 0;
  return Math.round((this.quizzesPassed / this.quizzesTaken) * 100);
});

// Ensure virtuals are serialized
userProgressSchema.set('toJSON', { virtuals: true });
userProgressSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("UserProgress", userProgressSchema); 