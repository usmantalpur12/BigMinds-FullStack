const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/", userController.getUsers);
router.get("/leaderboard", userController.getLeaderboard);

// Protected routes
router.use(protect);

// User profile routes
router.get("/me", userController.getMe);
router.put("/me", userController.updateMe);
router.put("/me/avatar", userController.updateAvatar);
router.put("/me/password", userController.updatePassword);

router.get("/me/stats", userController.getMyStats);
router.get("/me/enrollments", userController.getMyEnrollments);
router.get("/me/forum-memberships", userController.getMyForumMemberships);
router.get("/me/study-goals", userController.getStudyGoals);
router.get("/me/upcoming-deadlines", userController.getUpcomingDeadlines);

// Course enrollment routes
router.post("/:id/enrollments", authorize("student"), userController.createEnrollment);
router.get("/:id/enrollments", userController.getUserEnrollments);
router.get("/:id/enrollments/:courseId", userController.getEnrollment);
router.put("/:id/enrollments/:courseId", authorize("student"), userController.updateEnrollment);
router.delete("/:id/enrollments/:courseId", authorize("student"), userController.deleteEnrollment);

// Course progress routes
router.get("/:id/enrollments/:courseId/progress", authorize("student"), userController.getEnrollmentProgress);
router.put("/:id/enrollments/:courseId/progress", authorize("student"), userController.updateEnrollmentProgress);

// Admin routes
router.get("/admin/all", authorize("admin"), userController.getAllUsers);
router.get("/admin/stats", authorize("admin"), userController.getAdminStats);
router.get("/:id/stats", authorize("admin"), userController.getUserStats);
router.get("/:id", authorize("admin"), userController.getUserById);
router.put("/:id", authorize("admin"), userController.updateUser);
router.delete("/:id", authorize("admin"), userController.deleteUser);
router.put("/:id/role", authorize("admin"), userController.updateUserRole);
router.put("/:id/status", authorize("admin"), userController.updateUserStatus);

module.exports = router; 