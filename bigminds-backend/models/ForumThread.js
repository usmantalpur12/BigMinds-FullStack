const mongoose = require("mongoose");

const forumThreadSchema = new mongoose.Schema(
  {
    forumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: [true, "Forum ID is required"],
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author ID is required"],
    },
    title: {
      type: String,
      required: [true, "Thread title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Thread content is required"],
      maxlength: [2000, "Content cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      enum: ["general", "question", "discussion", "announcement", "help"],
      default: "general",
    },
    tags: [String],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    lastReplyAt: {
      type: Date,
      default: null,
    },
    lastReplyBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "approved",
    },
    moderationNotes: {
      type: String,
      maxlength: [500, "Moderation notes cannot exceed 500 characters"],
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    lastPost: {
      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      content: String,
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
forumThreadSchema.index({ forumId: 1, createdAt: -1 });
forumThreadSchema.index({ forumId: 1, category: 1 });
forumThreadSchema.index({ authorId: 1 });
forumThreadSchema.index({ isPinned: 1, createdAt: -1 });
forumThreadSchema.index({ isResolved: 1 });
forumThreadSchema.index({ moderationStatus: 1 });
forumThreadSchema.index({ tags: 1 });

// Virtual for thread status
forumThreadSchema.virtual("status").get(function () {
  if (this.isLocked) return "locked";
  if (this.isResolved) return "resolved";
  if (this.moderationStatus === "rejected") return "rejected";
  if (this.moderationStatus === "pending") return "pending";
  return "active";
});

// Virtual for author display name
forumThreadSchema.virtual("authorDisplayName").get(function () {
  if (this.isAnonymous) return "Anonymous";
  return null; // Will be populated when querying
});

// Method to increment view count
forumThreadSchema.methods.incrementView = function () {
  this.viewCount += 1;
  return this.save();
};

// Method to update reply count
forumThreadSchema.methods.updateReplyCount = async function () {
  const ForumPost = mongoose.model("ForumPost");
  const replyCount = await ForumPost.countDocuments({ threadId: this._id });
  
  this.replyCount = replyCount;
  
  if (replyCount > 0) {
    const lastReply = await ForumPost.findOne({ threadId: this._id })
      .sort({ createdAt: -1 })
      .select("authorId createdAt");
    
    if (lastReply) {
      this.lastReplyAt = lastReply.createdAt;
      this.lastReplyBy = lastReply.authorId;
    }
  }
  
  return this.save();
};

// Method to pin/unpin thread
forumThreadSchema.methods.togglePin = function () {
  this.isPinned = !this.isPinned;
  return this.save();
};

// Method to lock/unlock thread
forumThreadSchema.methods.toggleLock = function () {
  this.isLocked = !this.isLocked;
  return this.save();
};

// Method to resolve thread
forumThreadSchema.methods.resolve = function (resolvedBy) {
  this.isResolved = true;
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  return this.save();
};

// Method to flag for moderation
forumThreadSchema.methods.flagForModeration = function (reason) {
  this.moderationStatus = "flagged";
  this.moderationNotes = reason;
  return this.save();
};

module.exports = mongoose.model("ForumThread", forumThreadSchema);
