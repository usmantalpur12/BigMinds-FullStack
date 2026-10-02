const mongoose = require("mongoose");

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "Assignment ID is required"],
    },
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
    submissionText: {
      type: String,
      maxlength: [5000, "Submission text cannot exceed 5000 characters"],
    },
    attachments: [
      {
        title: String,
        type: {
          type: String,
          enum: ["pdf", "doc", "docx", "ppt", "pptx", "image", "video", "link", "other"],
        },
        url: String,
        fileUrl: String,
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: null,
      min: [0, "Score cannot be negative"],
    },
    maxScore: {
      type: Number,
      default: 100,
    },
    feedback: {
      type: String,
      maxlength: [1000, "Feedback cannot exceed 1000 characters"],
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["submitted", "graded", "returned"],
      default: "submitted",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one submission per student per assignment
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

// Indexes for performance
assignmentSubmissionSchema.index({ courseId: 1, studentId: 1 });
assignmentSubmissionSchema.index({ assignmentId: 1, status: 1 });
assignmentSubmissionSchema.index({ submittedAt: -1 });

// Virtual for percentage score
assignmentSubmissionSchema.virtual("percentageScore").get(function () {
  if (!this.score || !this.maxScore) return null;
  return Math.round((this.score / this.maxScore) * 100);
});

// Virtual for grade
assignmentSubmissionSchema.virtual("grade").get(function () {
  if (!this.score || !this.maxScore) return null;
  
  const percentage = (this.score / this.maxScore) * 100;
  
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
});

module.exports = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);

