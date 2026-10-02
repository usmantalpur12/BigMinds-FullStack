const mongoose = require("mongoose");

const collaborativeNoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Note content is required"],
    },
    forumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tags: [String],
    version: {
      type: Number,
      default: 1,
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
collaborativeNoteSchema.index({ forumId: 1, createdAt: -1 });
collaborativeNoteSchema.index({ createdBy: 1 });
collaborativeNoteSchema.index({ collaborators: 1 });

module.exports = mongoose.model("CollaborativeNote", collaborativeNoteSchema);

