const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { body, validationResult } = require("express-validator");
const { catchAsync } = require("../middleware/errorHandler");

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// All routes require authentication
router.use(protect);

// Profile Core Routes
router.get("/me", profileController.getMyProfile);

router.put(
  "/update",
  [
    body("displayName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Display name must be between 2 and 100 characters"),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),
    body("phoneNumber")
      .optional()
      .matches(/^(\+92|0)?3[0-9]{2}[0-9]{7}$/)
      .withMessage("Please enter a valid Pakistani phone number"),
    body("location")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Location cannot exceed 100 characters"),
    body("dateOfBirth")
      .optional()
      .isISO8601()
      .withMessage("Please enter a valid date"),
    body("gender")
      .optional()
      .isIn(["male", "female", "other", "prefer-not-to-say"])
      .withMessage("Invalid gender value"),
    body("socialLinks.linkedin")
      .optional()
      .isURL()
      .withMessage("Please enter a valid LinkedIn URL"),
    body("socialLinks.github")
      .optional()
      .isURL()
      .withMessage("Please enter a valid GitHub URL"),
    body("socialLinks.website")
      .optional()
      .isURL()
      .withMessage("Please enter a valid website URL"),
  ],
  validate,
  profileController.updateProfile
);

router.put(
  "/avatar",
  upload.single("avatar"),
  profileController.uploadAvatar
);

router.delete("/avatar", profileController.deleteAvatar);

router.put(
  "/password",
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  ],
  validate,
  profileController.changePassword
);

// Activity Routes (MUST come before /:id)
router.get("/activity", profileController.getActivityLogs);

// Security Routes (MUST come before /:id)
router.put(
  "/security",
  [
    body("twoFactorEnabled")
      .optional()
      .isBoolean()
      .withMessage("twoFactorEnabled must be a boolean"),
  ],
  validate,
  profileController.updateSecurity
);

// Account Management (MUST come before /:id)
router.post(
  "/delete-account",
  [
    body("password")
      .notEmpty()
      .withMessage("Password is required to delete account"),
  ],
  validate,
  profileController.deleteAccount
);

// Student-Specific Routes (MUST come before /:id)
router.put(
  "/student/update",
  authorize("student"),
  [
    body("classLevel")
      .optional()
      .isIn(["9", "10", "11", "12", "o-level", "a-level"])
      .withMessage("Invalid class level"),
    body("category")
      .optional()
      .isIn(["pre-engineering", "pre-medical", "computer-science", "bba", "o-levels", "a-levels"])
      .withMessage("Invalid category"),
    body("learningGoals")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Learning goals cannot exceed 1000 characters"),
  ],
  validate,
  profileController.updateStudentProfile
);

// Teacher-Specific Routes (MUST come before /:id)
router.put(
  "/teacher/update",
  authorize("teacher", "admin"),
  [
    body("qualification")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Qualification cannot exceed 200 characters"),
    body("experienceYears")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Experience years must be a non-negative integer"),
    body("subjects")
      .optional()
      .isArray()
      .withMessage("Subjects must be an array"),
    body("expertiseTags")
      .optional()
      .isArray()
      .withMessage("Expertise tags must be an array"),
    body("portfolioLinks")
      .optional()
      .isArray()
      .withMessage("Portfolio links must be an array"),
    body("portfolioLinks.*")
      .optional()
      .isURL()
      .withMessage("Each portfolio link must be a valid URL"),
  ],
  validate,
  profileController.updateTeacherProfile
);

router.post(
  "/teacher/document",
  authorize("teacher", "admin"),
  upload.single("document"),
  [
    body("type")
      .notEmpty()
      .isIn(["certification", "degree", "diploma", "license", "identity", "other"])
      .withMessage("Valid document type is required"),
    body("title")
      .notEmpty()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage("Document title must be between 3 and 200 characters"),
  ],
  validate,
  profileController.uploadTeacherDocument
);

router.delete(
  "/teacher/document/:id",
  authorize("teacher", "admin"),
  profileController.deleteTeacherDocument
);

// Public Profile Route (MUST be last - after all specific routes)
// Note: Currently requires auth but can be made public by moving before router.use(protect)
router.get("/:id", profileController.getPublicProfile);

module.exports = router;
