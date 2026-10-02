const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

// Validation middleware
const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("educationLevel")
    .isIn(["matriculation", "intermediate", "bachelor", "master", "other"])
    .withMessage("Invalid education level"),
  body("targetExam")
    .isIn(["mdcat", "ecat", "nts", "gat", "other"])
    .withMessage("Invalid target exam"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

const resetPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
];

const newPasswordValidation = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password confirmation does not match password");
    }
    return true;
  }),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Password confirmation does not match new password");
    }
    return true;
  }),
];

// Routes
router.post(
  "/register",
  registerValidation,
  validateRequest,
  authController.register,
);
router.post("/login", loginValidation, validateRequest, authController.login);
router.post(
  "/refresh",
  refreshTokenValidation,
  validateRequest,
  authController.refreshAccessToken,
);
router.post(
  "/forgot-password",
  resetPasswordValidation,
  validateRequest,
  authController.forgotPassword,
);
router.post(
  "/reset-password/:token",
  newPasswordValidation,
  validateRequest,
  authController.resetPassword,
);
router.post("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", protect, authController.resendVerification);
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);
router.put(
  "/change-password",
  protect,
  changePasswordValidation,
  validateRequest,
  authController.changePassword,
);

module.exports = router;
