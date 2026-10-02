const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Reminder title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    remindAt: {
      type: Date,
      required: [true, "Reminder time is required"],
      index: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDays: [
      {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    notificationType: {
      type: String,
      enum: ["email", "push", "both"],
      default: "push",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      trim: true,
    },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Reminder", reminderSchema);
