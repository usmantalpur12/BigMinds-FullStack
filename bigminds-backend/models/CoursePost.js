const mongoose = require("mongoose");

const coursePostSchema = new mongoose.Schema(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseThread",
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
      maxlength: [5000, "Content cannot exceed 5000 characters"],
    },
    parentPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoursePost",
      default: null, // For nested replies
    },
    isAnswer: {
      type: Boolean,
      default: false, // Marks if this post is the accepted answer
    },
    isAccepted: {
      type: Boolean,
      default: false, // Marks if this post is accepted as the answer
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    upvotes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    downvotes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletionReason: {
      type: String,
      maxlength: [200, "Deletion reason cannot exceed 200 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
coursePostSchema.index({ threadId: 1, createdAt: 1 });
coursePostSchema.index({ authorId: 1 });
coursePostSchema.index({ parentPostId: 1 });
coursePostSchema.index({ isAnswer: 1 });
coursePostSchema.index({ moderationStatus: 1 });
coursePostSchema.index({ isDeleted: 1 });

// Virtual for vote count
coursePostSchema.virtual("voteCount").get(function () {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for upvote count
coursePostSchema.virtual("upvoteCount").get(function () {
  return this.upvotes.length;
});

// Virtual for downvote count
coursePostSchema.virtual("downvoteCount").get(function () {
  return this.downvotes.length;
});

// Virtual for author display name
coursePostSchema.virtual("authorDisplayName").get(function () {
  if (this.isAnonymous) return "Anonymous";
  return null; // Will be populated when querying
});

// Method to add upvote
coursePostSchema.methods.addUpvote = function (userId) {
  // Remove existing downvote if exists
  this.downvotes = this.downvotes.filter(vote => vote.userId.toString() !== userId.toString());
  
  // Add upvote if not already exists
  const existingUpvote = this.upvotes.find(vote => vote.userId.toString() === userId.toString());
  if (!existingUpvote) {
    this.upvotes.push({ userId, createdAt: new Date() });
  }
  
  return this.save();
};

// Method to add downvote
coursePostSchema.methods.addDownvote = function (userId) {
  // Remove existing upvote if exists
  this.upvotes = this.upvotes.filter(vote => vote.userId.toString() !== userId.toString());
  
  // Add downvote if not already exists
  const existingDownvote = this.downvotes.find(vote => vote.userId.toString() === userId.toString());
  if (!existingDownvote) {
    this.downvotes.push({ userId, createdAt: new Date() });
  }
  
  return this.save();
};

// Method to remove vote
coursePostSchema.methods.removeVote = function (userId) {
  this.upvotes = this.upvotes.filter(vote => vote.userId.toString() !== userId.toString());
  this.downvotes = this.downvotes.filter(vote => vote.userId.toString() !== userId.toString());
  return this.save();
};

// Method to check if user has voted
coursePostSchema.methods.hasUserVoted = function (userId) {
  const hasUpvoted = this.upvotes.some(vote => vote.userId.toString() === userId.toString());
  const hasDownvoted = this.downvotes.some(vote => vote.userId.toString() === userId.toString());
  
  if (hasUpvoted) return "upvote";
  if (hasDownvoted) return "downvote";
  return null;
};

// Method to accept as answer
coursePostSchema.methods.acceptAsAnswer = function (acceptedBy) {
  this.isAccepted = true;
  this.acceptedAt = new Date();
  this.acceptedBy = acceptedBy;
  
  // Update thread if this is the first accepted answer
  if (!this.isAnswer) {
    this.isAnswer = true;
  }
  
  return this.save();
};

// Method to edit post
coursePostSchema.methods.editPost = function (newContent, editedBy, reason = null) {
  // Add to edit history
  this.editHistory.push({
    content: this.content,
    editedAt: this.editedAt || this.createdAt,
    editedBy: editedBy,
    reason: reason,
  });
  
  // Update current content
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  
  return this.save();
};

// Method to soft delete post
coursePostSchema.methods.softDelete = function (deletedBy, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deletionReason = reason;
  return this.save();
};

// Method to restore deleted post
coursePostSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  this.deletionReason = null;
  return this.save();
};

// Method to flag for moderation
coursePostSchema.methods.flagForModeration = function (reason) {
  this.moderationStatus = "flagged";
  this.moderationNotes = reason;
  return this.save();
};

// Static method to get thread posts with pagination
coursePostSchema.statics.getThreadPosts = async function (
  threadId,
  options = {}
) {
  const {
    page = 1,
    limit = 50,
    sortBy = "createdAt",
    sortOrder = "asc",
    includeDeleted = false,
  } = options;

  const query = { threadId };
  
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    this.find(query)
      .populate("authorId", "firstName lastName avatar role")
      .populate("acceptedBy", "firstName lastName")
      .populate("deletedBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
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

// Static method to get user's posts
coursePostSchema.statics.getUserPosts = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    includeDeleted = false,
  } = options;

  const query = { authorId: userId };
  
  if (!includeDeleted) {
    query.isDeleted = false;
  }

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    this.find(query)
      .populate("threadId", "title courseId")
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
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

// Pre-save middleware to update thread reply count
coursePostSchema.pre("save", async function (next) {
  if (this.isNew && !this.isDeleted) {
    try {
      const CourseThread = mongoose.model("CourseThread");
      await CourseThread.findByIdAndUpdate(this.threadId, {
        $inc: { replyCount: 1 },
        lastReplyAt: new Date(),
        lastReplyBy: this.authorId,
      });
    } catch (error) {
      console.error("Error updating thread reply count:", error);
    }
  }
  next();
});

// Pre-remove middleware to update thread reply count
coursePostSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const CourseThread = mongoose.model("CourseThread");
    await CourseThread.findByIdAndUpdate(this.threadId, {
      $inc: { replyCount: -1 },
    });
  } catch (error) {
    console.error("Error updating thread reply count:", error);
  }
  next();
});

module.exports = mongoose.model("CoursePost", coursePostSchema); 