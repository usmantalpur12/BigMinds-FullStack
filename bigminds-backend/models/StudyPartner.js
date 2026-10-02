const mongoose = require("mongoose");

const studyPartnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Partner is required"],
      index: true,
    },
    forumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: false,
    },
    subject: {
      type: String,
      trim: true,
    },
    goals: [{ type: String, trim: true }],
    preferredStudyTime: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
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

studyPartnerSchema.index({ userId: 1, partnerId: 1 });

module.exports = mongoose.model("StudyPartner", studyPartnerSchema);
