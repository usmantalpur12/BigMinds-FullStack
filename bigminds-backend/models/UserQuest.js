const mongoose = require("mongoose");

const userQuestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quest",
      required: true,
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "expired"],
      default: "not_started",
    },
    progress: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index
userQuestSchema.index({ userId: 1, questId: 1 });
userQuestSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("UserQuest", userQuestSchema);

