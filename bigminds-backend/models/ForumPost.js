const mongoose = require("mongoose");

const forumPostSchema = new mongoose.Schema(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumThread",
      required: [true, "Thread ID is required"],
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author ID is required"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      maxlength: [2000, "Content cannot exceed 2000 characters"],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    editReason: {
      type: String,
      maxlength: [200, "Edit reason cannot exceed 200 characters"],
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
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    dislikes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        dislikedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isSolution: {
      type: Boolean,
      default: false,
    },
    markedAsSolutionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    markedAsSolutionAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
forumPostSchema.index({ threadId: 1, createdAt: 1 });
forumPostSchema.index({ authorId: 1 });
forumPostSchema.index({ moderationStatus: 1 });
forumPostSchema.index({ isSolution: 1 });

// Virtual for like count
forumPostSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for dislike count
forumPostSchema.virtual("dislikeCount").get(function () {
  return this.dislikes.length;
});

// Virtual for net score
forumPostSchema.virtual("score").get(function () {
  return this.likes.length - this.dislikes.length;
});

// Virtual for author display name
forumPostSchema.virtual("authorDisplayName").get(function () {
  if (this.isAnonymous) return "Anonymous";
  return null; // Will be populated when querying
});

// Method to like a post
forumPostSchema.methods.like = function (userId) {
  // Remove from dislikes if exists
  this.dislikes = this.dislikes.filter(dislike => dislike.userId.toString() !== userId.toString());
  
  // Add to likes if not already liked
  const alreadyLiked = this.likes.some(like => like.userId.toString() === userId.toString());
  if (!alreadyLiked) {
    this.likes.push({ userId, likedAt: new Date() });
  }
  
  return this.save();
};

// Method to dislike a post
forumPostSchema.methods.dislike = function (userId) {
  // Remove from likes if exists
  this.likes = this.likes.filter(like => like.userId.toString() !== userId.toString());
  
  // Add to dislikes if not already disliked
  const alreadyDisliked = this.dislikes.some(dislike => dislike.userId.toString() === userId.toString());
  if (!alreadyDisliked) {
    this.dislikes.push({ userId, dislikedAt: new Date() });
  }
  
  return this.save();
};

// Method to remove like/dislike
forumPostSchema.methods.removeReaction = function (userId) {
  this.likes = this.likes.filter(like => like.userId.toString() !== userId.toString());
  this.dislikes = this.dislikes.filter(dislike => dislike.userId.toString() !== userId.toString());
  return this.save();
};

// Method to mark as solution
forumPostSchema.methods.markAsSolution = function (userId) {
  this.isSolution = true;
  this.markedAsSolutionBy = userId;
  this.markedAsSolutionAt = new Date();
  return this.save();
};

// Method to unmark as solution
forumPostSchema.methods.unmarkAsSolution = function () {
  this.isSolution = false;
  this.markedAsSolutionBy = null;
  this.markedAsSolutionAt = null;
  return this.save();
};

// Method to edit post
forumPostSchema.methods.editPost = function (newContent, reason) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  if (reason) {
    this.editReason = reason;
  }
  return this.save();
};

// Method to flag for moderation
forumPostSchema.methods.flagForModeration = function (reason) {
  this.moderationStatus = "flagged";
  this.moderationNotes = reason;
  return this.save();
};

// Static method to get thread posts with pagination
forumPostSchema.statics.getThreadPosts = async function (threadId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "asc",
  } = options;

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    this.find({ threadId })
      .populate("authorId", "firstName lastName avatar role")
      .populate("markedAsSolutionBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments({ threadId }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

module.exports = mongoose.model("ForumPost", forumPostSchema);
