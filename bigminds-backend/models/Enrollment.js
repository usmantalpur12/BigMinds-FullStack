const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active",
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
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
    totalStudyTime: {
      type: Number,
      default: 0, // in minutes
    },
    lessonsCompleted: {
      type: Number,
      default: 0,
    },
    quizzesTaken: {
      type: Number,
      default: 0,
    },
    averageQuizScore: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be negative"],
      max: [100, "Score cannot exceed 100"],
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateIssuedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique enrollment per student per course
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

// Index for performance
enrollmentSchema.index({ studentId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });

// Virtual for completion status
enrollmentSchema.virtual("isCompleted").get(function () {
  return this.status === "completed";
});

// Virtual for active status
enrollmentSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

// Method to update progress
enrollmentSchema.methods.updateProgress = function (newProgress) {
  this.progress = Math.min(100, Math.max(0, newProgress));
  this.lastAccessed = new Date();
  
  // Auto-complete if progress reaches 100%
  if (this.progress >= 100 && this.status !== "completed") {
    this.status = "completed";
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Method to add study time
enrollmentSchema.methods.addStudyTime = function (minutes) {
  this.totalStudyTime += minutes;
  this.lastAccessed = new Date();
  return this.save();
};

// Method to complete lesson
enrollmentSchema.methods.completeLesson = function () {
  this.lessonsCompleted += 1;
  return this.save();
};

// Method to add quiz result
enrollmentSchema.methods.addQuizResult = function (score) {
  this.quizzesTaken += 1;
  
  // Calculate new average score
  const totalScore = this.averageQuizScore * (this.quizzesTaken - 1) + score;
  this.averageQuizScore = totalScore / this.quizzesTaken;
  
  return this.save();
};

// Pre-save middleware to update course enrollment count
enrollmentSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const Course = mongoose.model("Course");
      await Course.findByIdAndUpdate(this.courseId, {
        $inc: { totalStudents: 1 },
      });
    } catch (error) {
      console.error("Error updating course enrollment count:", error);
    }
  }
  next();
});

// Pre-remove middleware to update course enrollment count
enrollmentSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const Course = mongoose.model("Course");
    await Course.findByIdAndUpdate(this.courseId, {
      $inc: { totalStudents: -1 },
    });
  } catch (error) {
    console.error("Error updating course enrollment count:", error);
  }
  next();
});

module.exports = mongoose.model("Enrollment", enrollmentSchema); 