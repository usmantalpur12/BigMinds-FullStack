const mongoose = require("mongoose");

const forumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Forum title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Forum description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    joinKey: {
      type: String,
      default: null, // For private forums
      minlength: [4, "Join key must be at least 4 characters"],
      maxlength: [20, "Join key cannot exceed 20 characters"],
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
    },
    category: {
      type: String,
      enum: ["general", "academic", "social", "support", "announcements"],
      default: "general",
    },
    tags: [String],
    coverImage: {
      type: String,
      default: null,
    },
    rules: [
      {
        title: String,
        description: String,
        order: Number,
      },
    ],
    memberCount: {
      type: Number,
      default: 0,
    },
    topicCount: {
      type: Number,
      default: 0,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: false, // Whether new members need admin approval
    },
    maxMembers: {
      type: Number,
      default: null, // No limit if null
      min: [1, "Max members must be at least 1"],
    },
    allowAnonymous: {
      type: Boolean,
      default: false,
    },
    allowAttachments: {
      type: Boolean,
      default: true,
    },
    maxAttachmentSize: {
      type: Number, // in MB
      default: 10,
      min: [1, "Max attachment size must be at least 1 MB"],
      max: [100, "Max attachment size cannot exceed 100 MB"],
    },
    allowedFileTypes: [String], // e.g., ["jpg", "png", "pdf"]
    moderationLevel: {
      type: String,
      enum: ["none", "basic", "strict"],
      default: "basic",
    },
    autoModeration: {
      enabled: {
        type: Boolean,
        default: false,
      },
      keywords: [String], // Words that trigger moderation
      action: {
        type: String,
        enum: ["flag", "hide", "delete"],
        default: "flag",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
forumSchema.index({ isPublic: 1, isActive: 1 });
forumSchema.index({ createdById: 1 });
forumSchema.index({ category: 1 });
forumSchema.index({ tags: 1 });
forumSchema.index({ lastActivity: -1 });
forumSchema.index({ memberCount: -1 });

// Virtual for forum status
forumSchema.virtual("status").get(function () {
  if (!this.isActive) return "inactive";
  if (this.isPublic) return "public";
  return "private";
});

// Virtual for join type
forumSchema.virtual("joinType").get(function () {
  if (this.isPublic) return "open";
  if (this.joinKey) return "key-required";
  if (this.requiresApproval) return "approval-required";
  return "invite-only";
});

// Method to check if user can join
forumSchema.methods.canUserJoin = function (userId) {
  if (!this.isActive) return { canJoin: false, reason: "Forum is inactive" };
  
  if (this.maxMembers && this.memberCount >= this.maxMembers) {
    return { canJoin: false, reason: "Forum is full" };
  }
  
  return { canJoin: true, reason: "User can join" };
};

// Method to generate join key
forumSchema.methods.generateJoinKey = function () {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.joinKey = result;
  return this.save();
};

// Method to remove join key
forumSchema.methods.removeJoinKey = function () {
  this.joinKey = null;
  return this.save();
};

// Method to update activity
forumSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

// Method to increment member count
forumSchema.methods.incrementMemberCount = function () {
  this.memberCount += 1;
  return this.save();
};

// Method to decrement member count
forumSchema.methods.decrementMemberCount = function () {
  this.memberCount = Math.max(0, this.memberCount - 1);
  return this.save();
};

// Method to increment topic count
forumSchema.methods.incrementTopicCount = function () {
  this.topicCount += 1;
  this.updateActivity();
  return this.save();
};

// Method to increment message count
forumSchema.methods.incrementMessageCount = function () {
  this.messageCount += 1;
  this.updateActivity();
  return this.save();
};

// Static method to get forums with pagination
forumSchema.statics.getForums = async function (options = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    isPublic,
    search,
    sortBy = "lastActivity",
    sortOrder = "desc",
    userId = null, // To check user's membership
  } = options;

  const query = { isActive: true };

  // Apply filters
  if (category) query.category = category;
  if (isPublic !== undefined) query.isPublic = isPublic;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const [forums, total] = await Promise.all([
    this.find(query)
      .populate("createdById", "firstName lastName avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  // If userId provided, check membership status
  if (userId) {
    const ForumMember = mongoose.model("ForumMember");
    for (const forum of forums) {
      const membership = await ForumMember.findOne({
        forumId: forum._id,
        userId: userId,
      });
      forum.membershipStatus = membership ? membership.status : null;
      forum.userRole = membership ? membership.role : null;
    }
  }

  return {
    forums,
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

// Static method to get user's forums
forumSchema.statics.getUserForums = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    status = "all", // all, pending, approved, admin
  } = options;

  const ForumMember = mongoose.model("ForumMember");
  
  let memberQuery = { userId: userId };
  if (status !== "all") {
    if (status === "admin") {
      memberQuery.role = "admin";
    } else {
      memberQuery.status = status;
    }
  }

  const memberships = await ForumMember.find(memberQuery)
    .populate("forumId")
    .sort({ "forumId.lastActivity": -1 });

  const forumIds = memberships.map(m => m.forumId._id);
  
  const forums = await this.find({
    _id: { $in: forumIds },
    isActive: true,
  })
    .populate("createdById", "firstName lastName avatar")
    .sort({ lastActivity: -1 });

  // Add membership info
  for (const forum of forums) {
    const membership = memberships.find(m => m.forumId._id.toString() === forum._id.toString());
    forum.membershipStatus = membership.status;
    forum.userRole = membership.role;
    forum.joinedAt = membership.createdAt;
  }

  const skip = (page - 1) * limit;
  const paginatedForums = forums.slice(skip, skip + limit);

  return {
    forums: paginatedForums,
    pagination: {
      page,
      limit,
      total: forums.length,
      pages: Math.ceil(forums.length / limit),
      hasNext: page * limit < forums.length,
      hasPrev: page > 1,
    },
  };
};

module.exports = mongoose.model("Forum", forumSchema); 