const { catchAsync } = require("../middleware/errorHandler");
const CourseThread = require("../models/CourseThread");
const CoursePost = require("../models/CoursePost");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// Get course discussion messages (group chat style - returns all posts as messages)
exports.getCourseMessages = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { limit = 50, before } = req.query;

  // Check if user is enrolled
  if (req.user.role === "student") {
    const enrollment = await Enrollment.findOne({
      courseId,
      studentId: req.user.id,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to view discussions",
      });
    }
  }

  // Get all threads for this course
  const threads = await CourseThread.find({ courseId })
    .populate("authorId", "firstName lastName avatar")
    .sort({ createdAt: 1 })
    .limit(parseInt(limit));

  // Get all posts for these threads
  const threadIds = threads.map(t => t._id);
  let postsQuery = { threadId: { $in: threadIds }, isDeleted: false };
  
  if (before) {
    postsQuery.createdAt = { $lt: new Date(before) };
  }

  const posts = await CoursePost.find(postsQuery)
    .populate("authorId", "firstName lastName avatar role")
    .sort({ createdAt: 1 })
    .limit(parseInt(limit));

  // Combine threads and posts into a single message list (group chat style)
  const messages = [];

  // Add thread starters as messages
  threads.forEach(thread => {
    messages.push({
      _id: thread._id,
      type: "thread",
      content: thread.content,
      author: thread.authorId,
      createdAt: thread.createdAt,
      threadTitle: thread.title,
    });
  });

  // Add posts as messages
  posts.forEach(post => {
    messages.push({
      _id: post._id,
      type: "post",
      content: post.content,
      author: post.authorId,
      createdAt: post.createdAt,
      threadId: post.threadId,
      upvotes: post.upvotes.length,
      downvotes: post.downvotes.length,
    });
  });

  // Sort by creation time
  messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.status(200).json({
    success: true,
    data: messages,
    count: messages.length,
  });
});

// Send message to course discussion (creates a post in a thread or new thread)
exports.sendMessage = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { content, threadId, title } = req.body;

  // Check if user is enrolled
  if (req.user.role === "student") {
    const enrollment = await Enrollment.findOne({
      courseId,
      studentId: req.user.id,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to post messages",
      });
    }
  }

  if (threadId) {
    // Reply to existing thread
    const thread = await CourseThread.findById(threadId);
    if (!thread || thread.courseId.toString() !== courseId) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    if (thread.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Thread is locked",
      });
    }

    const post = await CoursePost.create({
      threadId,
      authorId: req.user.id,
      content,
    });

    await post.populate("authorId", "firstName lastName avatar role");

    // Update thread reply count
    await thread.updateReplyCount();

    res.status(201).json({
      success: true,
      data: {
        _id: post._id,
        type: "post",
        content: post.content,
        author: post.authorId,
        createdAt: post.createdAt,
        threadId: post.threadId,
      },
      message: "Message sent successfully",
    });
  } else {
    // If no threadId but title is provided, create a new specific thread
    if (title) {
      const thread = await CourseThread.create({
        courseId,
        authorId: req.user.id,
        title,
        content,
        category: req.body.category || "general",
      });

      await thread.populate("authorId", "firstName lastName avatar role");

      return res.status(201).json({
        success: true,
        data: {
          _id: thread._id,
          type: "thread",
          content: thread.content,
          author: thread.authorId,
          createdAt: thread.createdAt,
          threadTitle: thread.title,
        },
        message: "Thread created successfully",
      });
    }

    // Default: Find or create "General Discussion" thread for this course
    let generalThread = await CourseThread.findOne({ 
      courseId, 
      title: "General Discussion" 
    });

    if (!generalThread) {
      generalThread = await CourseThread.create({
        courseId,
        authorId: req.user.id, // The current user becomes the "creator" of the general thread
        title: "General Discussion",
        content: "Welcome to the general discussion for this course!",
        category: "general"
      });
    }

    // Post to the general thread
    const post = await CoursePost.create({
      threadId: generalThread._id,
      authorId: req.user.id,
      content,
    });

    await post.populate("authorId", "firstName lastName avatar role");
    await generalThread.updateReplyCount();

    res.status(201).json({
      success: true,
      data: {
        _id: post._id,
        type: "post",
        content: post.content,
        author: post.authorId,
        createdAt: post.createdAt,
        threadId: post.threadId,
      },
      message: "Message sent successfully",
    });
  }
});

// Get course threads (for thread list view)
exports.getCourseThreads = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  // Check if user is enrolled
  if (req.user.role === "student") {
    const enrollment = await Enrollment.findOne({
      courseId,
      studentId: req.user.id,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to view discussions",
      });
    }
  }

  const threads = await CourseThread.find({ courseId })
    .populate("authorId", "firstName lastName avatar")
    .populate("lastReplyBy", "firstName lastName")
    .sort({ isPinned: -1, lastReplyAt: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    data: threads,
    count: threads.length,
  });
});

// Get thread with posts
exports.getThread = catchAsync(async (req, res) => {
  const { threadId } = req.params;

  const thread = await CourseThread.findById(threadId)
    .populate("authorId", "firstName lastName avatar role")
    .populate("courseId", "title");

  if (!thread) {
    return res.status(404).json({
      success: false,
      message: "Thread not found",
    });
  }

  // Check enrollment
  if (req.user.role === "student") {
    const enrollment = await Enrollment.findOne({
      courseId: thread.courseId._id,
      studentId: req.user.id,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to view discussions",
      });
    }
  }

  // Increment view count
  await thread.incrementView();

  const posts = await CoursePost.find({ threadId, isDeleted: false })
    .populate("authorId", "firstName lastName avatar role")
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: {
      thread,
      posts,
    },
  });
});

