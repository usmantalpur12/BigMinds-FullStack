const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const assignmentController = require("../controllers/assignmentController");
const { protect, authorize } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

// Protected routes
router.use(protect);

const assignmentCreateValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid ISO8601 date"),
  body("allowLateSubmission")
    .optional()
    .isBoolean()
    .withMessage("allowLateSubmission must be boolean"),
  body("maxScore")
    .optional()
    .isNumeric()
    .withMessage("Max score must be a number")
    .custom((value) => value >= 0)
    .withMessage("Max score must be at least 0"),
];

const assignmentUpdateValidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid ISO8601 date"),
  body("allowLateSubmission")
    .optional()
    .isBoolean()
    .withMessage("allowLateSubmission must be boolean"),
  body("maxScore")
    .optional()
    .isNumeric()
    .withMessage("Max score must be a number")
    .custom((value) => value >= 0)
    .withMessage("Max score must be at least 0"),
];

const submissionValidation = [
  body("submissionText")
    .trim()
    .notEmpty()
    .withMessage("Submission text is required"),
  body("attachments")
    .optional()
    .isArray()
    .withMessage("Attachments must be an array"),
];

const gradeValidation = [
  body("score")
    .notEmpty()
    .withMessage("Score is required")
    .isNumeric()
    .withMessage("Score must be a number"),
  body("feedback")
    .optional()
    .isString()
    .withMessage("Feedback must be a string"),
];

// Course assignment routes
router.get(
  "/courses/:courseId/assignments",
  assignmentController.getCourseAssignments,
);
router.post(
  "/courses/:courseId/assignments",
  authorize("teacher", "admin"),
  assignmentCreateValidation,
  validateRequest,
  assignmentController.createAssignment,
);

// Assignment routes
router.get("/:id", assignmentController.getAssignment);
router.put(
  "/:id",
  authorize("teacher", "admin"),
  assignmentUpdateValidation,
  validateRequest,
  assignmentController.updateAssignment,
);
router.delete(
  "/:id",
  authorize("teacher", "admin"),
  assignmentController.deleteAssignment,
);

// Submission routes
router.post(
  "/:assignmentId/submit",
  authorize("student"),
  submissionValidation,
  validateRequest,
  assignmentController.submitAssignment,
);
router.put(
  "/submissions/:submissionId",
  authorize("student"),
  submissionValidation,
  validateRequest,
  assignmentController.updateSubmission,
);
router.get(
  "/:assignmentId/submissions",
  authorize("teacher", "admin"),
  assignmentController.getAssignmentSubmissions,
);
router.post(
  "/submissions/:submissionId/grade",
  authorize("teacher", "admin"),
  gradeValidation,
  validateRequest,
  assignmentController.gradeAssignment,
);

// Student routes
router.get(
  "/student/my-submissions",
  authorize("student"),
  assignmentController.getMySubmissions,
);

module.exports = router;
