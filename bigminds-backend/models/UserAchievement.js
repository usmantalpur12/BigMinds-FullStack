const mongoose = require("mongoose");

const userAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Achievement",
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    progress: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for uniqueness
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
userAchievementSchema.index({ userId: 1, earnedAt: -1 });

module.exports = mongoose.model("UserAchievement", userAchievementSchema);

