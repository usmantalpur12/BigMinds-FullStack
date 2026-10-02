const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
      maxlength: [150, "Resource title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Resource description cannot exceed 500 characters"],
    },
    url: {
      type: String,
      required: [true, "Resource URL is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Resource type is required"],
      enum: ["document", "video", "link", "audio", "tool", "other"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Resource owner is required"],
    },
    category: {
      type: String,
      trim: true,
    },
    tags: [{ type: String, trim: true }],
    isPublic: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

resourceSchema.index({ owner: 1 });
resourceSchema.index({ type: 1 });
resourceSchema.index({ category: 1 });

module.exports = mongoose.model("Resource", resourceSchema);
