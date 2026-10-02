const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Achievement name is required"],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Achievement description is required"],
    },
    category: {
      type: String,
      enum: ["course", "streak", "forum", "quiz", "special", "milestone"],
      required: true,
    },
    rarity: {
      type: String,
      enum: ["common", "rare", "epic", "legendary"],
      default: "common",
    },
    icon: {
      type: String,
      default: "🏆",
    },
    xpReward: {
      type: Number,
      default: 0,
      min: 0,
    },
    requirements: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
achievementSchema.index({ category: 1, isActive: 1 });
achievementSchema.index({ rarity: 1 });

module.exports = mongoose.model("Achievement", achievementSchema);

