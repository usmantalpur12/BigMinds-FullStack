const mongoose = require("mongoose");

const forumMemberSchema = new mongoose.Schema(
  {
    forumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: [true, "Forum ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    role: {
      type: String,
      enum: ["admin", "moderator", "member"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "banned"],
      default: "pending",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      maxlength: [200, "Rejection reason cannot exceed 200 characters"],
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    banReason: {
      type: String,
      maxlength: [200, "Ban reason cannot exceed 200 characters"],
    },
    banExpiresAt: {
      type: Date,
      default: null, // Permanent ban if null
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    postCount: {
      type: Number,
      default: 0,
    },
    topicCount: {
      type: Number,
      default: 0,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    mutedUntil: {
      type: Date,
      default: null,
    },
    muteReason: {
      type: String,
      maxlength: [200, "Mute reason cannot exceed 200 characters"],
    },
    permissions: {
      canPost: {
        type: Boolean,
        default: true,
      },
      canReply: {
        type: Boolean,
        default: true,
      },
      canCreateTopics: {
        type: Boolean,
        default: true,
      },
      canModerate: {
        type: Boolean,
        default: false,
      },
      canInvite: {
        type: Boolean,
        default: false,
      },
      canBan: {
        type: Boolean,
        default: false,
      },
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique membership per user per forum
forumMemberSchema.index({ forumId: 1, userId: 1 }, { unique: true });

// Indexes for performance
forumMemberSchema.index({ forumId: 1, status: 1 });
forumMemberSchema.index({ forumId: 1, role: 1 });
forumMemberSchema.index({ userId: 1, status: 1 });
forumMemberSchema.index({ status: 1, createdAt: 1 });

// Virtual for membership status
forumMemberSchema.virtual("membershipStatus").get(function () {
  if (this.isMuted && this.mutedUntil && this.mutedUntil > new Date()) {
    return "muted";
  }
  if (this.status === "banned") {
    if (this.banExpiresAt && this.banExpiresAt < new Date()) {
      return "expired-ban";
    }
    return "banned";
  }
  return this.status;
});

// Virtual for can post
forumMemberSchema.virtual("canPost").get(function () {
  if (this.status !== "approved") return false;
  if (this.isMuted && this.mutedUntil && this.mutedUntil > new Date()) return false;
  return this.permissions.canPost;
});

// Method to approve membership
forumMemberSchema.methods.approve = function (approvedBy) {
  this.status = "approved";
  this.approvedAt = new Date();
  this.approvedBy = approvedBy;
  this.rejectedAt = null;
  this.rejectedBy = null;
  this.rejectionReason = null;
  return this.save();
};

// Method to reject membership
forumMemberSchema.methods.reject = function (rejectedBy, reason) {
  this.status = "rejected";
  this.rejectedAt = new Date();
  this.rejectedBy = rejectedBy;
  this.rejectionReason = reason;
  this.approvedAt = null;
  this.approvedBy = null;
  return this.save();
};

// Method to ban member
forumMemberSchema.methods.ban = function (bannedBy, reason, expiresAt = null) {
  this.status = "banned";
  this.bannedAt = new Date();
  this.bannedBy = bannedBy;
  this.banReason = reason;
  this.banExpiresAt = expiresAt;
  return this.save();
};

// Method to unban member
forumMemberSchema.methods.unban = function () {
  this.status = "approved";
  this.bannedAt = null;
  this.bannedBy = null;
  this.banReason = null;
  this.banExpiresAt = null;
  return this.save();
};

// Method to mute member
forumMemberSchema.methods.mute = function (duration, reason) {
  this.isMuted = true;
  this.mutedUntil = new Date(Date.now() + duration * 1000); // duration in seconds
  this.muteReason = reason;
  return this.save();
};

// Method to unmute member
forumMemberSchema.methods.unmute = function () {
  this.isMuted = false;
  this.mutedUntil = null;
  this.muteReason = null;
  return this.save();
};

// Method to promote to moderator
forumMemberSchema.methods.promoteToModerator = function () {
  this.role = "moderator";
  this.permissions.canModerate = true;
  this.permissions.canInvite = true;
  return this.save();
};

// Method to promote to admin
forumMemberSchema.methods.promoteToAdmin = function () {
  this.role = "admin";
  this.permissions.canModerate = true;
  this.permissions.canInvite = true;
  this.permissions.canBan = true;
  return this.save();
};

// Method to demote to member
forumMemberSchema.methods.demoteToMember = function () {
  this.role = "member";
  this.permissions.canModerate = false;
  this.permissions.canInvite = false;
  this.permissions.canBan = false;
  return this.save();
};

// Method to update activity
forumMemberSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  return this.save();
};

// Method to increment post count
forumMemberSchema.methods.incrementPostCount = function () {
  this.postCount += 1;
  this.updateActivity();
  return this.save();
};

// Method to increment topic count
forumMemberSchema.methods.incrementTopicCount = function () {
  this.topicCount += 1;
  this.updateActivity();
  return this.save();
};

// Static method to get forum members with pagination
forumMemberSchema.statics.getForumMembers = async function (
  forumId,
  options = {}
) {
  const {
    page = 1,
    limit = 50,
    status,
    role,
    search,
    sortBy = "joinedAt",
    sortOrder = "desc",
  } = options;

  const query = { forumId: forumId };

  // Apply filters
  if (status) query.status = status;
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { notes: { $regex: search, $options: "i" } },
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    this.find(query)
      .populate("userId", "firstName lastName avatar email")
      .populate("approvedBy", "firstName lastName")
      .populate("rejectedBy", "firstName lastName")
      .populate("bannedBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return {
    members,
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

// Static method to check if user is member
forumMemberSchema.statics.isMember = async function (forumId, userId) {
  const membership = await this.findOne({ forumId, userId });
  return membership && membership.status === "approved";
};

// Static method to check if user is admin
forumMemberSchema.statics.isAdmin = async function (forumId, userId) {
  const membership = await this.findOne({ forumId, userId });
  return membership && membership.role === "admin";
};

// Static method to check if user is moderator
forumMemberSchema.statics.isModerator = async function (forumId, userId) {
  const membership = await this.findOne({ forumId, userId });
  return membership && (membership.role === "admin" || membership.role === "moderator");
};

// Pre-save middleware to update forum member count
forumMemberSchema.pre("save", async function (next) {
  if (this.isNew && this.status === "approved") {
    try {
      const Forum = mongoose.model("Forum");
      await Forum.findByIdAndUpdate(this.forumId, {
        $inc: { memberCount: 1 },
      });
    } catch (error) {
      console.error("Error updating forum member count:", error);
    }
  }
  next();
});

// Pre-remove middleware to update forum member count
forumMemberSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const Forum = mongoose.model("Forum");
    await Forum.findByIdAndUpdate(this.forumId, {
      $inc: { memberCount: -1 },
    });
  } catch (error) {
    console.error("Error updating forum member count:", error);
  }
  next();
});

module.exports = mongoose.model("ForumMember", forumMemberSchema); 