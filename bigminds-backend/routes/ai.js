const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// AI Course Helper
router.post("/course-helper", aiController.courseHelper);

module.exports = router;

