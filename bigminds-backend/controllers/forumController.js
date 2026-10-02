const { catchAsync } = require("../middleware/errorHandler");
const Forum = require("../models/Forum");
const ForumThread = require("../models/ForumThread");
const ForumPost = require("../models/ForumPost");
const ForumMember = require("../models/ForumMember");
const User = require("../models/User");

// Get all forums
exports.getForums = catchAsync(async (req, res) => {
  const {
    category,
    search,
    sort = "recent",
    page = 1,
    limit = 20,
    userId,
  } = req.query;

  // Build query
  let query = {};

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Build sort
  let sortBy = {};
  switch (sort) {
    case "recent":
      sortBy = { createdAt: -1 };
      break;
    case "popular":
      sortBy = { memberCount: -1 };
      break;
    case "activity":
      sortBy = { lastActivity: -1 };
      break;
    case "alphabetical":
      sortBy = { title: 1 };
      break;
    default:
      sortBy = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  const forums = await Forum.find(query)
    .populate("createdById", "firstName lastName avatar")
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  // Add user membership info if userId provided
  const forumsArray = forums.map(f => f.toObject());
  if (userId) {
    for (let forum of forumsArray) {
      const membership = await ForumMember.findOne({
        forumId: forum._id,
        userId: userId,
      });
      forum.userMembership = membership;
    }
  }

  const total = await Forum.countDocuments(query);

  res.status(200).json({
    success: true,
    data: forumsArray,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      limit: parseInt(limit),
    },
  });
});

// Get single forum
exports.getForum = catchAsync(async (req, res) => {
  const forum = await Forum.findById(req.params.id).populate(
    "createdById",
    "firstName lastName avatar"
  );

  if (!forum) {
    return res.status(404).json({
      success: false,
      message: "Forum not found",
    });
  }

  // Add user membership info if authenticated
  const forumObj = forum.toObject();
  if (req.user) {
    const membership = await ForumMember.findOne({
      forumId: forum._id,
      userId: req.user.id,
    });
    forumObj.userMembership = membership;
  }

  res.status(200).json({
    success: true,
    data: forumObj,
  });
});

// Create forum
exports.createForum = catchAsync(async (req, res) => {
  const { isPublic, isPrivate, joinKey, ...otherData } = req.body;
  
  // Determine if forum is public or private
  const isPublicForum = isPublic !== false && isPrivate !== true;
  
  // Generate join key for private forums if not provided
  let finalJoinKey = null;
  if (!isPublicForum) {
    if (joinKey && joinKey.trim().length >= 4) {
      finalJoinKey = joinKey.trim().toUpperCase();
    } else {
      // Auto-generate join key
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      finalJoinKey = result;
    }
  }

  const forumData = {
    ...otherData,
    isPublic: isPublicForum,
    joinKey: finalJoinKey,
    createdById: req.user.id,
  };

  const forum = await Forum.create(forumData);

  // Add creator as admin member
  await ForumMember.create({
    forumId: forum._id,
    userId: req.user.id,
    role: "admin",
    status: "approved",
    joinedAt: new Date(),
    approvedAt: new Date(),
    approvedBy: req.user.id,
  });

  // Increment member count
  forum.memberCount = 1;
  await forum.save();

  // Populate creator info
  await forum.populate("createdById", "firstName lastName avatar");

  res.status(201).json({
    success: true,
    data: forum,
    message: "Forum created successfully",
    joinKey: !isPublicForum ? finalJoinKey : undefined, // Return join key for private forums
  });
});

// Update forum
exports.updateForum = catchAsync(async (req, res) => {
  const forum = await Forum.findById(req.params.id);

  if (!forum) {
    return res.status(404).json({
      success: false,
      message: "Forum not found",
    });
  }

  // Check if user is admin or moderator
  const membership = await ForumMember.findOne({
    forumId: forum._id,
    userId: req.user.id,
  });

  if (!membership || !["admin", "moderator"].includes(membership.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or moderator role required.",
    });
  }

  const updatedForum = await Forum.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate("createdById", "firstName lastName avatar");

  res.status(200).json({
    success: true,
    data: updatedForum,
    message: "Forum updated successfully",
  });
});

// Delete forum
exports.deleteForum = catchAsync(async (req, res) => {
  const forum = await Forum.findById(req.params.id);

  if (!forum) {
    return res.status(404).json({
      success: false,
      message: "Forum not found",
    });
  }

  // Check if user is admin
  const membership = await ForumMember.findOne({
    forumId: forum._id,
    userId: req.user.id,
  });

  if (!membership || membership.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    });
  }

  // Delete related data
  await Promise.all([
    ForumMember.deleteMany({ forumId: forum._id }),
    ForumThread.deleteMany({ forumId: forum._id }),
    ForumPost.deleteMany({ forumId: forum._id }),
    Forum.findByIdAndDelete(req.params.id),
  ]);

  res.status(200).json({
    success: true,
    message: "Forum deleted successfully",
  });
});

// Join forum
exports.joinForum = catchAsync(async (req, res) => {
  const forumId = req.params.id;
  const userId = req.user.id;
  
  console.log(`🔍 Join forum request: Forum ID: ${forumId}, User ID: ${userId}`);
  
  const forum = await Forum.findById(forumId);

  if (!forum) {
    console.log(`❌ Forum not found: ${forumId}`);
    return res.status(404).json({
      success: false,
      message: "Forum not found",
    });
  }

  console.log(`✅ Forum found: ${forum.title}, Active: ${forum.isActive}, Public: ${forum.isPublic}`);

  // Check if forum is active
  if (!forum.isActive) {
    console.log(`❌ Forum is not active: ${forumId}`);
    return res.status(400).json({
      success: false,
      message: "Forum is not active",
    });
  }

  // Check if already a member
  const existingMembership = await ForumMember.findOne({
    forumId: forumId,
    userId: userId,
  });

  if (existingMembership) {
    console.log(`⚠️  Existing membership found: Status: ${existingMembership.status}, Role: ${existingMembership.role}`);
    if (existingMembership.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "You are banned from this forum",
        data: {
          status: existingMembership.status,
          bannedAt: existingMembership.bannedAt,
          banReason: existingMembership.banReason,
        },
      });
    }
    
    if (existingMembership.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Your join request is pending approval",
        data: {
          status: existingMembership.status,
          joinedAt: existingMembership.joinedAt,
        },
      });
    }
    
    if (existingMembership.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Your join request was rejected",
        data: {
          status: existingMembership.status,
          rejectedAt: existingMembership.rejectedAt,
          rejectionReason: existingMembership.rejectionReason,
        },
      });
    }
    
    // Status is "approved" - already a member
    return res.status(400).json({
      success: false,
      message: "Already a member of this forum",
      data: {
        status: existingMembership.status,
        joinedAt: existingMembership.joinedAt,
        role: existingMembership.role,
      },
    });
  }

  // Check if private forum requires join key
  if (!forum.isPublic) {
    const providedJoinKey = req.body.joinKey?.trim().toUpperCase();
    
    console.log(`🔐 Private forum - Join key provided: ${!!providedJoinKey}, Required: ${!!forum.joinKey}`);
    
    if (!providedJoinKey) {
      console.log(`❌ Join key missing for private forum: ${forumId}`);
      return res.status(400).json({
        success: false,
        message: "Join key is required for private forums",
      });
    }

    if (forum.joinKey && providedJoinKey !== forum.joinKey) {
      console.log(`❌ Invalid join key provided for forum: ${forumId}`);
      return res.status(403).json({
        success: false,
        message: "Invalid join key",
      });
    }
  }

  // Check if forum is full
  if (forum.maxMembers && forum.memberCount >= forum.maxMembers) {
    console.log(`❌ Forum is full: ${forumId} (${forum.memberCount}/${forum.maxMembers})`);
    return res.status(400).json({
      success: false,
      message: "Forum is full",
    });
  }
  
  console.log(`✅ All checks passed, creating membership for forum: ${forumId}`);

  // Create membership (with error handling for duplicate key)
  let membership;
  try {
    membership = await ForumMember.create({
      forumId: req.params.id,
      userId: req.user.id,
      role: "member",
      status: forum.requiresApproval ? "pending" : "approved",
      joinedAt: new Date(),
      ...(forum.requiresApproval
        ? { message: req.body.message }
        : { approvedAt: new Date(), approvedBy: req.user.id }),
    });
  } catch (error) {
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      // Re-check membership status
      const existingMembership = await ForumMember.findOne({
        forumId: req.params.id,
        userId: req.user.id,
      });
      
      if (existingMembership) {
        if (existingMembership.status === "pending") {
          return res.status(400).json({
            success: false,
            message: "Your join request is already pending approval",
            data: {
              status: existingMembership.status,
              joinedAt: existingMembership.joinedAt,
            },
          });
        }
        return res.status(400).json({
          success: false,
          message: "Already a member of this forum",
          data: {
            status: existingMembership.status,
            joinedAt: existingMembership.joinedAt,
            role: existingMembership.role,
          },
        });
      }
    }
    throw error; // Re-throw if it's not a duplicate key error
  }

  // Update forum member count if approved
  if (!forum.requiresApproval) {
    await Forum.findByIdAndUpdate(req.params.id, {
      $inc: { memberCount: 1 },
    });
    // Refresh forum to get updated member count
    await forum.populate("createdById", "firstName lastName avatar");
  }

  // Populate membership with forum and user data
  await membership.populate("forumId", "title description category memberCount topicCount isPublic joinKey");
  await membership.populate("userId", "firstName lastName avatar");

  res.status(201).json({
    success: true,
    data: {
      membership: membership,
      forum: !forum.requiresApproval ? forum : undefined, // Return forum if immediately approved
    },
    message: forum.requiresApproval
      ? "Join request sent successfully"
      : "Successfully joined forum",
  });
});

// Leave forum
exports.leaveForum = catchAsync(async (req, res) => {
  const membership = await ForumMember.findOne({
    forumId: req.params.id,
    userId: req.user.id,
  });

  if (!membership) {
    return res.status(400).json({
      success: false,
      message: "Not a member of this forum",
    });
  }

  // Don't allow admin to leave if they're the only admin
  if (membership.role === "admin") {
    const adminCount = await ForumMember.countDocuments({
      forumId: req.params.id,
      role: "admin",
    });

    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot leave forum. You are the only admin.",
      });
    }
  }

  await ForumMember.findByIdAndDelete(membership._id);

  // Update forum member count
  await Forum.findByIdAndUpdate(req.params.id, {
    $inc: { memberCount: -1 },
  });

  res.status(200).json({
    success: true,
    message: "Successfully left forum",
  });
});

// Get forum members
exports.getForumMembers = catchAsync(async (req, res) => {
  const { role, status, page = 1, limit = 20 } = req.query;

  let query = { forumId: req.params.id };

  if (role) {
    query.role = role;
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const members = await ForumMember.find(query)
    .populate("user", "firstName lastName avatar")
    .populate("approvedBy", "firstName lastName")
    .sort({ joinedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ForumMember.countDocuments(query);

  res.status(200).json({
    success: true,
    data: members,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      limit: parseInt(limit),
    },
  });
});

// Approve member
exports.approveMember = catchAsync(async (req, res) => {
  const membership = await ForumMember.findOne({
    forumId: req.params.id,
    userId: req.params.userId,
  });

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: "Membership not found",
    });
  }

  if (membership.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: "Member is not pending approval",
    });
  }

  membership.status = "approved";
  membership.approvedAt = new Date();
  membership.approvedBy = req.user.id;
  await membership.save();

  // Update forum member count
  await Forum.findByIdAndUpdate(req.params.id, {
    $inc: { memberCount: 1 },
  });

  res.status(200).json({
    success: true,
    data: membership,
    message: "Member approved successfully",
  });
});

// Reject member
exports.rejectMember = catchAsync(async (req, res) => {
  const membership = await ForumMember.findOne({
    forumId: req.params.id,
    userId: req.params.userId,
  });

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: "Membership not found",
    });
  }

  await ForumMember.findByIdAndDelete(membership._id);

  res.status(200).json({
    success: true,
    message: "Member request rejected",
  });
});

// Ban member
exports.banMember = catchAsync(async (req, res) => {
  const membership = await ForumMember.findOne({
    forumId: req.params.id,
    userId: req.params.userId,
  });

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: "Membership not found",
    });
  }

  membership.status = "banned";
  membership.bannedAt = new Date();
  membership.bannedBy = req.user.id;
  await membership.save();

  res.status(200).json({
    success: true,
    data: membership,
    message: "Member banned successfully",
  });
});

// Unban member
exports.unbanMember = catchAsync(async (req, res) => {
  const membership = await ForumMember.findOne({
    forumId: req.params.id,
    userId: req.params.userId,
  });

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: "Membership not found",
    });
  }

  membership.status = "approved";
  membership.unbannedAt = new Date();
  membership.unbannedBy = req.user.id;
  await membership.save();

  res.status(200).json({
    success: true,
    data: membership,
    message: "Member unbanned successfully",
  });
});

// Remove member
exports.removeMember = catchAsync(async (req, res) => {
  const membership = await ForumMember.findOne({
    forumId: req.params.id,
    userId: req.params.userId,
  });

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: "Membership not found",
    });
  }

  await ForumMember.findByIdAndDelete(membership._id);

  // Update forum member count
  await Forum.findByIdAndUpdate(req.params.id, {
    $inc: { memberCount: -1 },
  });

  res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
});

// Get forum topics
exports.getForumTopics = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = "recent",
    category,
    status,
  } = req.query;

  let query = { forumId: req.params.id };

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  let sortBy = {};
  switch (sort) {
    case "recent":
      sortBy = { createdAt: -1 };
      break;
    case "popular":
      sortBy = { replyCount: -1 };
      break;
    case "activity":
      sortBy = { lastReplyAt: -1 };
      break;
    default:
      sortBy = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  const topics = await ForumThread.find(query)
    .populate("authorId", "firstName lastName avatar")
    .populate("lastReplyBy", "firstName lastName")
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ForumThread.countDocuments(query);

  res.status(200).json({
    success: true,
    data: topics,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      limit: parseInt(limit),
    },
  });
});

// Create topic
exports.createTopic = catchAsync(async (req, res) => {
  // Check if user is member of forum
  const membership = await ForumMember.findOne({
    forumId: req.params.id,
    userId: req.user.id,
    status: "approved",
  });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You must be a member to create topics.",
    });
  }

  const topicData = {
    ...req.body,
    forumId: req.params.id,
    authorId: req.user.id,
  };

  const topic = await ForumThread.create(topicData);

  // Update forum topic count
  await Forum.findByIdAndUpdate(req.params.id, {
    $inc: { topicCount: 1 },
    lastActivity: new Date(),
  });

  // Populate author info
  await topic.populate("authorId", "firstName lastName avatar");

  res.status(201).json({
    success: true,
    data: topic,
    message: "Topic created successfully",
  });
});

// Get single topic
exports.getTopic = catchAsync(async (req, res) => {
  const topic = await ForumThread.findById(req.params.id)
    .populate("authorId", "firstName lastName avatar")
    .populate("lastReplyBy", "firstName lastName");

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: "Topic not found",
    });
  }

  // Increment view count
  await ForumThread.findByIdAndUpdate(req.params.id, {
    $inc: { viewCount: 1 },
  });

  res.status(200).json({
    success: true,
    data: topic,
  });
});

// Update topic
exports.updateTopic = catchAsync(async (req, res) => {
  const topic = await ForumThread.findById(req.params.id);

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: "Topic not found",
    });
  }

  // Check if user is author or moderator/admin
  const membership = await ForumMember.findOne({
    forumId: topic.forumId,
    userId: req.user.id,
  });

  const isAuthor = topic.authorId.toString() === req.user.id;
  const isModerator = membership && ["admin", "moderator"].includes(membership.role);

  if (!isAuthor && !isModerator) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only edit your own topics.",
    });
  }

  const updatedTopic = await ForumThread.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate("authorId", "firstName lastName avatar");

  res.status(200).json({
    success: true,
    data: updatedTopic,
    message: "Topic updated successfully",
  });
});

// Delete topic
exports.deleteTopic = catchAsync(async (req, res) => {
  const topic = await ForumThread.findById(req.params.id);

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: "Topic not found",
    });
  }

  // Check if user is author or moderator/admin
  const membership = await ForumMember.findOne({
    forumId: topic.forumId,
    userId: req.user.id,
  });

  const isAuthor = topic.authorId.toString() === req.user.id;
  const isModerator = membership && ["admin", "moderator"].includes(membership.role);

  if (!isAuthor && !isModerator) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only delete your own topics.",
    });
  }

  // Delete related posts
  await ForumPost.deleteMany({ threadId: req.params.id });

  // Delete topic
  await ForumThread.findByIdAndDelete(req.params.id);

  // Update forum counts
  await Forum.findByIdAndUpdate(topic.forumId, {
    $inc: { topicCount: -1, messageCount: -topic.replyCount },
  });

  res.status(200).json({
    success: true,
    message: "Topic deleted successfully",
  });
});

// Pin topic
exports.pinTopic = catchAsync(async (req, res) => {
  const topic = await ForumThread.findById(req.params.id);

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: "Topic not found",
    });
  }

  topic.isPinned = !topic.isPinned;
  await topic.save();

  res.status(200).json({
    success: true,
    data: topic,
    message: `Topic ${topic.isPinned ? "pinned" : "unpinned"} successfully`,
  });
});

// Lock topic
exports.lockTopic = catchAsync(async (req, res) => {
  const topic = await ForumThread.findById(req.params.id);

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: "Topic not found",
    });
  }

  topic.isLocked = !topic.isLocked;
  await topic.save();

  res.status(200).json({
    success: true,
    data: topic,
    message: `Topic ${topic.isLocked ? "locked" : "unlocked"} successfully`,
  });
});

// Move topic
exports.moveTopic = catchAsync(async (req, res) => {
  const { newForumId } = req.body;
  const topic = await ForumThread.findById(req.params.id);

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: "Topic not found",
    });
  }

  // Check if user has permission in both forums
  const [currentMembership, newMembership] = await Promise.all([
    ForumMember.findOne({
      forumId: topic.forumId,
      userId: req.user.id,
    }),
    ForumMember.findOne({
      forumId: newForumId,
      userId: req.user.id,
    }),
  ]);

  const isCurrentModerator = currentMembership && ["admin", "moderator"].includes(currentMembership.role);
  const isNewModerator = newMembership && ["admin", "moderator"].includes(newMembership.role);

  if (!isCurrentModerator || !isNewModerator) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Moderator role required in both forums.",
    });
  }

  // Update topic forum
  topic.forumId = newForumId;
  await topic.save();

  // Update forum counts
  await Promise.all([
    Forum.findByIdAndUpdate(topic.forumId, {
      $inc: { topicCount: -1, messageCount: -topic.replyCount },
    }),
    Forum.findByIdAndUpdate(newForumId, {
      $inc: { topicCount: 1, messageCount: topic.replyCount },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: topic,
    message: "Topic moved successfully",
  });
});

// Get topic posts
exports.getTopicPosts = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, sort = "oldest" } = req.query;

  let sortBy = {};
  switch (sort) {
    case "oldest":
      sortBy = { createdAt: 1 };
      break;
    case "newest":
      sortBy = { createdAt: -1 };
      break;
    case "popular":
      sortBy = { likes: -1 };
      break;
    default:
      sortBy = { createdAt: 1 };
  }

  const skip = (page - 1) * limit;

  const posts = await ForumPost.find({ threadId: req.params.id })
    .populate("authorId", "firstName lastName avatar")
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ForumPost.countDocuments({ threadId: req.params.id });

  res.status(200).json({
    success: true,
    data: posts,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      limit: parseInt(limit),
    },
  });
});

// Create post
exports.createPost = catchAsync(async (req, res) => {
  const topic = await ForumThread.findById(req.params.id);

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: "Topic not found",
    });
  }

  if (topic.isLocked) {
    return res.status(400).json({
      success: false,
      message: "Topic is locked. Cannot add new posts.",
    });
  }

  // Check if user is member of forum
  const membership = await ForumMember.findOne({
    forumId: topic.forumId,
    userId: req.user.id,
    status: "approved",
  });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You must be a member to post.",
    });
  }

  const postData = {
    ...req.body,
    threadId: req.params.id,
    forumId: topic.forumId,
    authorId: req.user.id,
  };

  const post = await ForumPost.create(postData);

  // Update topic reply count and last reply
  await ForumThread.findByIdAndUpdate(req.params.id, {
    $inc: { replyCount: 1 },
    lastReplyAt: new Date(),
    lastReplyBy: req.user.id,
  });

  // Update forum message count
  await Forum.findByIdAndUpdate(topic.forumId, {
    $inc: { messageCount: 1 },
    lastActivity: new Date(),
  });

  // Populate author info
  await post.populate("authorId", "firstName lastName avatar");

  res.status(201).json({
    success: true,
    data: post,
    message: "Post created successfully",
  });
});

// Update post
exports.updatePost = catchAsync(async (req, res) => {
  const post = await ForumPost.findById(req.params.postId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Check if user is author or moderator/admin
  const membership = await ForumMember.findOne({
    forumId: post.forumId,
    userId: req.user.id,
  });

  const isAuthor = post.authorId.toString() === req.user.id;
  const isModerator = membership && ["admin", "moderator"].includes(membership.role);

  if (!isAuthor && !isModerator) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only edit your own posts.",
    });
  }

  const updatedPost = await ForumPost.findByIdAndUpdate(
    req.params.postId,
    { ...req.body, isEdited: true, editedAt: new Date() },
    { new: true, runValidators: true }
  ).populate("authorId", "firstName lastName avatar");

  res.status(200).json({
    success: true,
    data: updatedPost,
    message: "Post updated successfully",
  });
});

// Delete post
exports.deletePost = catchAsync(async (req, res) => {
  const post = await ForumPost.findById(req.params.postId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Check if user is author or moderator/admin
  const membership = await ForumMember.findOne({
    forumId: post.forumId,
    userId: req.user.id,
  });

  const isAuthor = post.authorId.toString() === req.user.id;
  const isModerator = membership && ["admin", "moderator"].includes(membership.role);

  if (!isAuthor && !isModerator) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only delete your own posts.",
    });
  }

  await ForumPost.findByIdAndDelete(req.params.postId);

  // Update topic reply count
  await ForumThread.findByIdAndUpdate(post.threadId, {
    $inc: { replyCount: -1 },
  });

  // Update forum message count
  await Forum.findByIdAndUpdate(post.forumId, {
    $inc: { messageCount: -1 },
  });

  res.status(200).json({
    success: true,
    message: "Post deleted successfully",
  });
});

// Like post
exports.likePost = catchAsync(async (req, res) => {
  const post = await ForumPost.findById(req.params.postId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Check if user already liked
  const existingLike = await ForumPost.findOne({
    _id: req.params.postId,
    likes: req.user.id,
  });

  if (existingLike) {
    return res.status(400).json({
      success: false,
      message: "Post already liked",
    });
  }

  // Add like
  await ForumPost.findByIdAndUpdate(req.params.postId, {
    $inc: { likes: 1 },
    $push: { likes: req.user.id },
  });

  res.status(200).json({
    success: true,
    message: "Post liked successfully",
  });
});

// Unlike post
exports.unlikePost = catchAsync(async (req, res) => {
  const post = await ForumPost.findById(req.params.postId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Remove like
  await ForumPost.findByIdAndUpdate(req.params.postId, {
    $inc: { likes: -1 },
    $pull: { likes: req.user.id },
  });

  res.status(200).json({
    success: true,
    message: "Post unliked successfully",
  });
});

// Mark as solution
exports.markAsSolution = catchAsync(async (req, res) => {
  const post = await ForumPost.findById(req.params.postId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    });
  }

  // Check if user is topic author or moderator/admin
  const topic = await ForumThread.findById(post.threadId);
  const membership = await ForumMember.findOne({
    forumId: topic.forumId,
    userId: req.user.id,
  });

  const isTopicAuthor = topic.authorId.toString() === req.user.id;
  const isModerator = membership && ["admin", "moderator"].includes(membership.role);

  if (!isTopicAuthor && !isModerator) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only topic author or moderators can mark solutions.",
    });
  }

  // Remove solution from other posts in the same topic
  await ForumPost.updateMany(
    { threadId: post.threadId, _id: { $ne: req.params.postId } },
    { isSolution: false }
  );

  // Mark this post as solution
  post.isSolution = true;
  await post.save();

  // Mark topic as resolved
  await ForumThread.findByIdAndUpdate(post.threadId, {
    isResolved: true,
    resolvedBy: req.user.id,
    resolvedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    data: post,
    message: "Post marked as solution successfully",
  });
});

// Get forum categories
exports.getForumCategories = catchAsync(async (req, res) => {
  const categories = await Forum.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const categoryData = categories.map((cat) => ({
    id: cat._id,
    name: cat._id,
    count: cat.count,
  }));

  res.status(200).json({
    success: true,
    data: categoryData,
  });
});

// Search forums
exports.searchForums = catchAsync(async (req, res) => {
  const { q, category, sort = "recent", page = 1, limit = 20 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  let query = {
    $or: [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ],
  };

  if (category) {
    query.category = category;
  }

  let sortBy = {};
  switch (sort) {
    case "recent":
      sortBy = { createdAt: -1 };
      break;
    case "popular":
      sortBy = { memberCount: -1 };
      break;
    case "activity":
      sortBy = { lastActivity: -1 };
      break;
    default:
      sortBy = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  const forums = await Forum.find(query)
    .populate("createdById", "firstName lastName avatar")
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Forum.countDocuments(query);

  res.status(200).json({
    success: true,
    data: forums,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      limit: parseInt(limit),
    },
  });
});

// Get forum stats
exports.getForumStats = catchAsync(async (req, res) => {
  const forumId = req.params.id;
  const cache = require("../utils/cache");
  const cacheKey = `forum_stats_${forumId}`;

  // Try to get from cache first
  const cachedStats = cache.get(cacheKey);
  if (cachedStats) {
    return res.status(200).json({
      success: true,
      data: cachedStats,
      cached: true,
    });
  }

  // If not in cache, fetch from database
  const stats = await Promise.all([
    Forum.findById(forumId).select("memberCount topicCount messageCount"),
    ForumMember.countDocuments({ forumId, status: "approved" }),
    ForumMember.countDocuments({ forumId, status: "pending" }),
    ForumThread.countDocuments({ forumId }),
    ForumPost.countDocuments({ forumId }),
  ]);

  const [forum, approvedMembers, pendingMembers, totalTopics, totalPosts] = stats;

  if (!forum) {
    return res.status(404).json({
      success: false,
      message: "Forum not found",
    });
  }

  const statsData = {
    memberCount: forum.memberCount,
    approvedMembers,
    pendingMembers,
    topicCount: forum.topicCount,
    totalTopics,
    messageCount: forum.messageCount,
    totalPosts,
  };

  // Cache for 5 minutes
  cache.set(cacheKey, statsData, 300000);

  res.status(200).json({
    success: true,
    data: statsData,
    cached: false,
  });
});

// Get user forum memberships
exports.getUserForumMemberships = catchAsync(async (req, res) => {
  // The /users/me/forum-memberships route has no :userId param, so req.params.userId is undefined.
  // The /:userId/forum-memberships route passes the actual userId.
  let userId = req.params.userId;

  // If userId is missing (me route) or explicitly 'me', use authenticated user's id
  if (!userId || userId === 'me') {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access your forum memberships',
      });
    }
    userId = req.user.id;
  }

  console.log(`🔍 Fetching forum memberships for userId: ${userId}`);

  const memberships = await ForumMember.find({ userId })
    .populate('forumId', 'title description category isPublic isPrivate memberCount topicCount messageCount joinKey createdAt')
    .sort({ joinedAt: -1 });

  console.log(`✅ Found ${memberships.length} memberships for user ${userId}`);

  res.status(200).json({
    success: true,
    data: memberships,
  });
});
