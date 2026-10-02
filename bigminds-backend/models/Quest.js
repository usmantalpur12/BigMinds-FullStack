const mongoose = require("mongoose");

const questSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Quest title is required"],
    },
    description: {
      type: String,
      required: [true, "Quest description is required"],
    },
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly", "special"],
      required: true,
    },
    category: {
      type: String,
      enum: ["course", "forum", "quiz", "study", "social"],
      required: true,
    },
    xpReward: {
      type: Number,
      required: true,
      min: 0,
    },
    requirements: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    maxCompletions: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
questSchema.index({ type: 1, isActive: 1 });
questSchema.index({ category: 1, isActive: 1 });
questSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("Quest", questSchema);

