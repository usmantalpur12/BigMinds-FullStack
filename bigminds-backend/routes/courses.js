const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const courseReviewController = require("../controllers/courseReviewController");
const { protect, authorize } = require("../middleware/auth");
const { body, param } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");

const courseCreateValidation = [
  body("title").notEmpty().withMessage("Course title is required"),
  body("description").optional().trim(),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be non-negative"),
  body("category").optional().trim(),
  body("class").optional().trim(),
];

const courseUpdateValidation = [
  body("title")
    .optional()
    .notEmpty()
    .withMessage("Course title cannot be empty"),
  body("description").optional().trim(),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be non-negative"),
];

const reviewValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim(),
];

const lessonValidation = [
  body("title").notEmpty().withMessage("Lesson title is required"),
  body("content").notEmpty().withMessage("Lesson content is required"),
];

const lessonUpdateValidation = [
  body("title").optional().trim(),
  body("content").optional().trim(),
];

const progressValidation = [
  body("studyTime")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Study time must be a positive number"),
  body("lessonCompleted")
    .optional()
    .isBoolean()
    .withMessage("lessonCompleted must be a boolean"),
];

// Public routes
router.get("/", courseController.getCourses);

// Protected routes
router.use(protect);

// Teacher routes - specific routes must come before parameterized routes
router.get(
  "/mine",
  authorize("teacher", "admin"),
  courseController.getMyCourses,
);
router.get(
  "/mine/stats",
  authorize("teacher", "admin"),
  courseController.getTeacherDashboardStats,
);
router.post(
  "/",
  authorize("teacher", "admin"),
  courseCreateValidation,
  validateRequest,
  courseController.createCourse,
);

// Admin routes - specific routes must come before parameterized routes
router.get("/admin/all", authorize("admin"), courseController.getAllCourses);

// Parameterized routes - these must come after specific routes
router.get("/:id", courseController.getCourse);
router.get("/:id/lessons", courseController.getCourseLessons);
router.get("/:id/quizzes", courseController.getCourseQuizzes);
router.get("/:id/forum", courseController.getCourseForum);
router.get("/:id/reviews", courseReviewController.getCourseReviews);
router.get("/:id/reviews/me", courseReviewController.getMyReview);
router.put(
  "/:id/reviews",
  authorize("student"),
  reviewValidation,
  validateRequest,
  courseReviewController.submitReview,
);

// Student routes
router.post(
  "/:id/enroll",
  authorize("student"),
  courseController.enrollInCourse,
);
router.get(
  "/:id/progress",
  authorize("student"),
  courseController.getCourseProgress,
);
router.put(
  "/:id/progress",
  authorize("student"),
  progressValidation,
  validateRequest,
  courseController.updateCourseProgress,
);
router.post(
  "/:id/lessons/:lessonId/complete",
  authorize("student"),
  courseController.completeLesson,
);

// Teacher routes
router.get(
  "/:id/analytics",
  authorize("teacher", "admin"),
  courseController.getCourseAnalytics,
);
router.put(
  "/:id",
  authorize("teacher", "admin"),
  courseController.updateCourse,
);
router.delete(
  "/:id",
  authorize("teacher", "admin"),
  courseController.deleteCourse,
);
router.post(
  "/:id/lessons",
  authorize("teacher", "admin"),
  lessonValidation,
  validateRequest,
  courseController.addLesson,
);
router.put(
  "/:id/lessons/:lessonId",
  authorize("teacher", "admin"),
  lessonUpdateValidation,
  validateRequest,
  courseController.updateLesson,
);
router.delete(
  "/:id/lessons/:lessonId",
  authorize("teacher", "admin"),
  courseController.deleteLesson,
);

// Admin routes
router.put("/:id/publish", authorize("admin"), courseController.publishCourse);
router.put(
  "/:id/unpublish",
  authorize("admin"),
  courseController.unpublishCourse,
);

module.exports = router;
