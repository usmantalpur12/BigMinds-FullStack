const mongoose = require("mongoose");

const userDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      required: [true, "Document type is required"],
      enum: [
        "certification",
        "degree",
        "diploma",
        "license",
        "identity",
        "other",
      ],
    },
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationNotes: {
      type: String,
      maxlength: [500, "Verification notes cannot exceed 500 characters"],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userDocumentSchema.index({ userId: 1, type: 1 });
userDocumentSchema.index({ verified: 1 });
userDocumentSchema.index({ uploadedAt: -1 });

// Virtual for document status
userDocumentSchema.virtual("status").get(function () {
  if (this.verified) return "verified";
  return "pending";
});

module.exports = mongoose.model("UserDocument", userDocumentSchema);

