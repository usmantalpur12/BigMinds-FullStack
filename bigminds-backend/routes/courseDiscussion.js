const express = require("express");
const router = express.Router();
const courseDiscussionController = require("../controllers/courseDiscussionController");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Course discussion routes (group chat style)
router.get("/courses/:courseId/messages", courseDiscussionController.getCourseMessages);
router.post("/courses/:courseId/messages", courseDiscussionController.sendMessage);

// Thread-based routes
router.get("/courses/:courseId/threads", courseDiscussionController.getCourseThreads);
router.get("/threads/:threadId", courseDiscussionController.getThread);

module.exports = router;

