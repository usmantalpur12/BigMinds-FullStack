const mongoose = require("mongoose");

const courseThreadSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
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
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
courseThreadSchema.index({ courseId: 1, createdAt: -1 });
courseThreadSchema.index({ courseId: 1, category: 1 });
courseThreadSchema.index({ authorId: 1 });
courseThreadSchema.index({ isPinned: 1, createdAt: -1 });
courseThreadSchema.index({ isResolved: 1 });
courseThreadSchema.index({ moderationStatus: 1 });
courseThreadSchema.index({ tags: 1 });

// Virtual for thread status
courseThreadSchema.virtual("status").get(function () {
  if (this.isLocked) return "locked";
  if (this.isResolved) return "resolved";
  if (this.moderationStatus === "rejected") return "rejected";
  if (this.moderationStatus === "pending") return "pending";
  return "active";
});

// Virtual for author display name
courseThreadSchema.virtual("authorDisplayName").get(function () {
  if (this.isAnonymous) return "Anonymous";
  return null; // Will be populated when querying
});

// Method to increment view count
courseThreadSchema.methods.incrementView = function () {
  this.viewCount += 1;
  return this.save();
};

// Method to update reply count
courseThreadSchema.methods.updateReplyCount = async function () {
  const CoursePost = mongoose.model("CoursePost");
  const replyCount = await CoursePost.countDocuments({ threadId: this._id });
  
  this.replyCount = replyCount;
  
  if (replyCount > 0) {
    const lastReply = await CoursePost.findOne({ threadId: this._id })
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
courseThreadSchema.methods.togglePin = function () {
  this.isPinned = !this.isPinned;
  return this.save();
};

// Method to lock/unlock thread
courseThreadSchema.methods.toggleLock = function () {
  this.isLocked = !this.isLocked;
  return this.save();
};

// Method to resolve thread
courseThreadSchema.methods.resolve = function (resolvedBy) {
  this.isResolved = true;
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  return this.save();
};

// Method to flag for moderation
courseThreadSchema.methods.flagForModeration = function (reason) {
  this.moderationStatus = "flagged";
  this.moderationNotes = reason;
  return this.save();
};

// Static method to get course threads with pagination
courseThreadSchema.statics.getCourseThreads = async function (
  courseId,
  options = {}
) {
  const {
    page = 1,
    limit = 20,
    category,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const query = { courseId };

  // Apply filters
  if (category) query.category = category;
  if (status === "pinned") query.isPinned = true;
  if (status === "resolved") query.isResolved = true;
  if (status === "active") {
    query.isPinned = false;
    query.isResolved = false;
    query.isLocked = false;
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Build sort object
  const sort = {};
  if (sortBy === "pinned") {
    sort.isPinned = -1;
    sort.createdAt = -1;
  } else if (sortBy === "replies") {
    sort.replyCount = -1;
    sort.createdAt = -1;
  } else if (sortBy === "views") {
    sort.viewCount = -1;
    sort.createdAt = -1;
  } else {
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;
  }

  const skip = (page - 1) * limit;

  const [threads, total] = await Promise.all([
    this.find(query)
      .populate("authorId", "firstName lastName avatar role")
      .populate("lastReplyBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    threads,
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

// Static method to get thread statistics
courseThreadSchema.statics.getThreadStats = async function (courseId) {
  const stats = await this.aggregate([
    { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalThreads: { $sum: 1 },
        totalReplies: { $sum: "$replyCount" },
        totalViews: { $sum: "$viewCount" },
        pinnedThreads: { $sum: { $cond: ["$isPinned", 1, 0] } },
        resolvedThreads: { $sum: { $cond: ["$isResolved", 1, 0] } },
        categoryCounts: {
          $push: {
            category: "$category",
            count: 1,
          },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalThreads: 0,
      totalReplies: 0,
      totalViews: 0,
      pinnedThreads: 0,
      resolvedThreads: 0,
      categoryBreakdown: {},
    };
  }

  const stat = stats[0];
  
  // Process category breakdown
  const categoryBreakdown = {};
  stat.categoryCounts.forEach(({ category, count }) => {
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + count;
  });

  return {
    totalThreads: stat.totalThreads,
    totalReplies: stat.totalReplies,
    totalViews: stat.totalViews,
    pinnedThreads: stat.pinnedThreads,
    resolvedThreads: stat.resolvedThreads,
    categoryBreakdown,
  };
};

module.exports = mongoose.model("CourseThread", courseThreadSchema); 