const mongoose = require("mongoose");

const gamificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Gamification item name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: ["system", "reward", "badge", "setting", "milestone"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    settings: {
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
  },
);

gamificationSchema.index({ type: 1 });

gamificationSchema.index({ isActive: 1 });

module.exports = mongoose.model("Gamification", gamificationSchema);
