const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Assignment description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    instructions: {
      type: String,
      maxlength: [1000, "Instructions cannot exceed 1000 characters"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    maxScore: {
      type: Number,
      required: [true, "Maximum score is required"],
      min: [1, "Max score must be at least 1"],
      default: 100,
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    latePenalty: {
      type: Number,
      default: 0,
      min: [0, "Late penalty cannot be negative"],
      max: [100, "Late penalty cannot exceed 100"],
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
assignmentSchema.index({ courseId: 1, isPublished: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ createdBy: 1 });

// Virtual for assignment status
assignmentSchema.virtual("status").get(function () {
  const now = new Date();
  
  if (!this.isPublished) return "draft";
  if (this.dueDate < now) return "closed";
  return "open";
});

// Virtual for time remaining
assignmentSchema.virtual("timeRemaining").get(function () {
  const now = new Date();
  const remaining = this.dueDate.getTime() - now.getTime();
  
  return remaining > 0 ? remaining : 0;
});

// Method to check if assignment is available
assignmentSchema.methods.isAvailable = function () {
  if (!this.isPublished) return false;
  
  const now = new Date();
  if (this.dueDate < now && !this.allowLateSubmission) return false;
  
  return true;
};

module.exports = mongoose.model("Assignment", assignmentSchema);

