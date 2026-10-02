const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");

// Validation middleware
const paymentValidation = [
  body("amount").isFloat({ min: 1 }).withMessage("Amount must be at least 1"),
  body("currency").isIn(["PKR", "USD"]).withMessage("Invalid currency"),
  body("courseId").optional().isMongoId().withMessage("Invalid course ID"),
];

// Routes
router.post(
  "/create-order",
  protect,
  paymentValidation,
  validateRequest,
  paymentController.createOrder,
);
router.post("/verify-payment", protect, paymentController.verifyPayment);
router.get("/history", protect, paymentController.getPaymentHistory);
router.get("/:id", protect, paymentController.getPaymentById);
router.post("/refund/:id", protect, paymentController.refundPayment);
router.get(
  "/subscription/status",
  protect,
  paymentController.getSubscriptionStatus,
);
router.post(
  "/subscription/upgrade",
  protect,
  paymentController.upgradeSubscription,
);
router.post(
  "/subscription/cancel",
  protect,
  paymentController.cancelSubscription,
);

module.exports = router;
