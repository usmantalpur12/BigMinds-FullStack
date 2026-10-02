const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        // Profile actions
        "profile_updated",
        "avatar_uploaded",
        "avatar_deleted",
        "password_changed",
        "email_changed",
        "two_factor_enabled",
        "two_factor_disabled",
        // Student actions
        "class_level_updated",
        "category_updated",
        "learning_goals_updated",
        "course_enrolled",
        "course_completed",
        // Teacher actions
        "qualification_updated",
        "experience_updated",
        "document_uploaded",
        "document_deleted",
        // Account actions
        "account_deleted",
        "login",
        "logout",
        "settings_updated",
      ],
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

// Static method to get user activity logs
activityLogSchema.statics.getUserLogs = async function (userId, options = {}) {
  const { limit = 50, action, startDate, endDate } = options;

  const query = { userId };

  if (action) query.action = action;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
};

module.exports = mongoose.model("ActivityLog", activityLogSchema);

