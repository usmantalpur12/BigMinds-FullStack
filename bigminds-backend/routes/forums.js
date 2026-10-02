const express = require("express");
const router = express.Router();
const forumController = require("../controllers/forumController");
const forumEnhancementController = require("../controllers/forumEnhancementController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");

// Public routes
router.get("/", forumController.getForums);
router.get("/categories", forumController.getForumCategories);
router.get("/search", forumController.searchForums);
router.get("/topics/:topicId", forumController.getTopic);
router.get("/topics/:topicId/posts", forumController.getTopicPosts);
router.get("/topics/:id/posts", forumController.getTopicPosts); // alias for legacy compatibility
router.get("/:id", optionalAuth, forumController.getForum);
router.get("/:id/stats", forumController.getForumStats);
router.get("/:id/topics", forumController.getForumTopics);

// Protected routes
router.use(protect);

// Topic management
router.put("/topics/:topicId", forumController.updateTopic);
router.delete("/topics/:topicId", forumController.deleteTopic);
router.put(
  "/topics/:topicId/pin",
  authorize("admin", "moderator"),
  forumController.pinTopic,
);
router.put(
  "/topics/:topicId/lock",
  authorize("admin", "moderator"),
  forumController.lockTopic,
);
router.put(
  "/topics/:topicId/move",
  authorize("admin", "moderator"),
  forumController.moveTopic,
);

// Topic posts
router.get("/topics/:topicId/messages", forumController.getTopicPosts);
router.post("/topics/:topicId/messages", forumController.createPost);
router.post("/topics/:id/posts", forumController.createPost); // alias for legacy compatibility

// Post management
router.put("/topics/messages/:postId", forumController.updatePost);
router.put("/topics/:id/posts/:postId", forumController.updatePost); // alias for legacy compatibility
router.delete("/topics/messages/:postId", forumController.deletePost);
router.delete("/topics/:id/posts/:postId", forumController.deletePost); // alias for legacy compatibility
router.post("/topics/messages/:postId/like", forumController.likePost);
router.post("/topics/messages/:postId/unlike", forumController.unlikePost);
router.post(
  "/topics/messages/:postId/solution",
  forumController.markAsSolution,
);

// Forum management
router.post("/", forumController.createForum);
router.put("/:id", forumController.updateForum);
router.delete("/:id", forumController.deleteForum);

// Forum membership
router.post("/:id/join", forumController.joinForum);
router.post("/:id/leave", forumController.leaveForum);
router.get("/:id/members", forumController.getForumMembers);

// Member management (admin/moderator only)
router.put(
  "/:id/members/:userId/approve",
  authorize("admin", "moderator"),
  forumController.approveMember,
);
router.put(
  "/:id/members/:userId/reject",
  authorize("admin", "moderator"),
  forumController.rejectMember,
);
router.put(
  "/:id/members/:userId/ban",
  authorize("admin", "moderator"),
  forumController.banMember,
);
router.put(
  "/:id/members/:userId/unban",
  authorize("admin", "moderator"),
  forumController.unbanMember,
);
router.delete(
  "/:id/members/:userId",
  authorize("admin", "moderator"),
  forumController.removeMember,
);

// Topics
router.post("/:id/topics", forumController.createTopic);

// Topic routes have been moved above Forum Management to avoid routing conflicts

// User forum memberships
router.get(
  "/users/me/forum-memberships",
  forumController.getUserForumMemberships,
);
router.get(
  "/users/:userId/forum-memberships",
  authorize("admin"),
  forumController.getUserForumMemberships,
);

router.get("/:id/study-groups", forumEnhancementController.getStudyGroups);
router.post("/:id/study-groups", forumEnhancementController.createStudyGroup);
router.post(
  "/study-groups/:groupId/join",
  forumEnhancementController.joinStudyGroup,
);
router.post(
  "/study-groups/:groupId/leave",
  forumEnhancementController.leaveStudyGroup,
);

router.get("/:id/study-sessions", forumEnhancementController.getStudySessions);
router.post(
  "/:id/study-sessions",
  forumEnhancementController.createStudySession,
);
router.post(
  "/study-sessions/:sessionId/join",
  forumEnhancementController.joinStudySession,
);

router.get("/:id/resources", forumEnhancementController.getResources);
router.post("/:id/resources", forumEnhancementController.createResource);
router.get(
  "/resources/:resourceId/download",
  forumEnhancementController.downloadResource,
);

router.get("/:id/expert-qa", forumEnhancementController.getExpertQnA);
router.post("/:id/expert-qa", forumEnhancementController.createExpertQnA);
router.post(
  "/expert-qa/:qaId/answer",
  forumEnhancementController.answerQuestion,
);
router.post(
  "/expert-qa/:qaId/upvote",
  forumEnhancementController.upvoteQuestion,
);
router.post(
  "/expert-qa/:qaId/downvote",
  forumEnhancementController.downvoteQuestion,
);

router.get("/:id/reminders", forumEnhancementController.getReminders);
router.post("/:id/reminders", forumEnhancementController.createReminder);
router.put("/reminders/:reminderId", forumEnhancementController.updateReminder);
router.delete(
  "/reminders/:reminderId",
  forumEnhancementController.deleteReminder,
);
router.put(
  "/reminders/:reminderId/complete",
  forumEnhancementController.completeReminder,
);

router.post(
  "/collaborative-notes",
  forumEnhancementController.createCollaborativeNote,
);
router.get(
  "/:id/collaborative-notes",
  forumEnhancementController.getCollaborativeNotes,
);
router.put(
  "/collaborative-notes/:noteId",
  forumEnhancementController.updateCollaborativeNote,
);

router.get("/:id/study-partners", forumEnhancementController.getStudyPartners);

module.exports = router;
