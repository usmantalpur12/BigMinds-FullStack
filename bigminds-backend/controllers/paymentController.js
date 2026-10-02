const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Course = require("../models/Course");
const { catchAsync } = require("../middleware/errorHandler");
const { validationResult } = require("express-validator");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret",
});

// Generate unique order ID
const generateOrderId = () => {
  return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// @desc    Create payment order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const { amount, currency = "PKR", courseId, description, subscriptionType = "none" } = req.body;

  // Validate amount
  if (amount < 1) {
    return res.status(400).json({
      success: false,
      message: "Amount must be at least 1",
    });
  }

  // If courseId provided, verify course exists
  if (courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
  }

  // Convert amount to paise (Razorpay uses smallest currency unit)
  const amountInPaise = currency === "PKR" ? amount * 100 : amount * 100;

  // Create Razorpay order
  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency === "PKR" ? "INR" : "USD", // Razorpay uses INR for PKR
      receipt: generateOrderId(),
      notes: {
        userId: req.user.id.toString(),
        courseId: courseId || "none",
        subscriptionType,
      },
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    // If Razorpay fails, create order in database anyway for tracking
    razorpayOrder = {
      id: `order_${Date.now()}`,
      amount: amountInPaise,
      currency: currency === "PKR" ? "INR" : "USD",
      status: "created",
    };
  }

  // Create payment record in database
  const orderId = generateOrderId();
  const payment = await Payment.create({
    userId: req.user.id,
    courseId: courseId || null,
    orderId,
    razorpayOrderId: razorpayOrder.id,
    amount,
    currency,
    status: "pending",
    description: description || `Payment for ${courseId ? "course" : "subscription"}`,
    subscriptionType,
    metadata: {
      receipt: razorpayOrder.receipt || orderId,
    },
  });

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: {
      orderId: payment.orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: payment.amount,
      currency: payment.currency,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
      name: "BigMinds Education",
      description: payment.description,
      prefill: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        contact: req.user.phoneNumber || "",
      },
      theme: {
        color: "#4F46E5",
      },
    },
  });
});

// @desc    Verify payment
// @route   POST /api/payments/verify-payment
// @access  Private
exports.verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: "Missing payment verification parameters",
    });
  }

  // Find payment record
  const payment = await Payment.findOne({
    $or: [{ orderId }, { razorpayOrderId: razorpay_order_id }],
    userId: req.user.id,
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment order not found",
    });
  }

  if (payment.status === "completed") {
    return res.status(400).json({
      success: false,
      message: "Payment already verified",
    });
  }

  // Verify signature
  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret")
    .update(text)
    .digest("hex");

  const isSignatureValid = generatedSignature === razorpay_signature;

  if (!isSignatureValid) {
    payment.status = "failed";
    await payment.save();

    return res.status(400).json({
      success: false,
      message: "Payment verification failed - Invalid signature",
    });
  }

  // Verify payment with Razorpay
  try {
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (razorpayPayment.status === "authorized" || razorpayPayment.status === "captured") {
      // Update payment record
      payment.status = "completed";
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      await payment.save();

      // Update user subscription if applicable
      if (payment.subscriptionType !== "none") {
        const user = await User.findById(req.user.id);
        user.isPremium = true;
        user.premiumExpiryDate = payment.subscriptionEndDate;
        await user.save();
      }

      // If course payment, enroll user
      if (payment.courseId) {
        const Enrollment = require("../models/Enrollment");
        const existingEnrollment = await Enrollment.findOne({
          courseId: payment.courseId,
          studentId: req.user.id,
        });

        if (!existingEnrollment) {
          await Enrollment.create({
            courseId: payment.courseId,
            studentId: req.user.id,
            status: "active",
            enrolledAt: new Date(),
          });
        }
      }

      res.json({
        success: true,
        message: "Payment verified successfully",
        data: payment,
      });
    } else {
      payment.status = "failed";
      await payment.save();

      res.status(400).json({
        success: false,
        message: "Payment verification failed - Payment not authorized",
      });
    }
  } catch (error) {
    console.error("Razorpay payment verification error:", error);
    
    // If Razorpay API fails but signature is valid, mark as completed
    payment.status = "completed";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    res.json({
      success: true,
      message: "Payment verified successfully (offline verification)",
      data: payment,
    });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  let query = { userId: req.user.id };
  if (status) {
    query.status = status;
  }

  const payments = await Payment.find(query)
    .populate("courseId", "title thumbnail")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.json({
    success: true,
    data: payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = catchAsync(async (req, res) => {
  const payment = await Payment.findOne({
    _id: req.params.id,
    userId: req.user.id,
  }).populate("courseId", "title thumbnail description");

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  res.json({
    success: true,
    data: payment,
  });
});

// @desc    Refund payment
// @route   POST /api/payments/refund/:id
// @access  Private
exports.refundPayment = catchAsync(async (req, res) => {
  const { refundAmount, reason } = req.body;

  const payment = await Payment.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  if (payment.status !== "completed") {
    return res.status(400).json({
      success: false,
      message: "Only completed payments can be refunded",
    });
  }

  if (payment.status === "refunded") {
    return res.status(400).json({
      success: false,
      message: "Payment already refunded",
    });
  }

  const refundAmountValue = refundAmount || payment.amount;
  if (refundAmountValue > payment.amount - payment.refundAmount) {
    return res.status(400).json({
      success: false,
      message: "Refund amount exceeds available amount",
    });
  }

  // Process refund with Razorpay if payment ID exists
  if (payment.razorpayPaymentId) {
    try {
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: refundAmountValue * 100, // Convert to paise
        notes: {
          reason: reason || "Customer request",
        },
      });

      // Update payment record
      payment.refundAmount = (payment.refundAmount || 0) + refundAmountValue;
      payment.refundReason = reason || "Customer request";
      payment.refundedAt = new Date();

      if (payment.refundAmount >= payment.amount) {
        payment.status = "refunded";
      }

      await payment.save();

      // Update user subscription if fully refunded
      if (payment.status === "refunded" && payment.subscriptionType !== "none") {
        const user = await User.findById(req.user.id);
        user.isPremium = false;
        user.premiumExpiryDate = null;
        await user.save();
      }

      res.json({
        success: true,
        message: "Refund processed successfully",
        data: {
          payment,
          refundId: refund.id,
        },
      });
    } catch (error) {
      console.error("Razorpay refund error:", error);
      return res.status(500).json({
        success: false,
        message: "Refund processing failed",
        error: error.message,
      });
    }
  } else {
    // Manual refund (for testing or offline payments)
    payment.refundAmount = (payment.refundAmount || 0) + refundAmountValue;
    payment.refundReason = reason || "Customer request";
    payment.refundedAt = new Date();

    if (payment.refundAmount >= payment.amount) {
      payment.status = "refunded";
    }

    await payment.save();

    res.json({
      success: true,
      message: "Refund processed successfully (manual)",
      data: payment,
    });
  }
});

// @desc    Get subscription status
// @route   GET /api/payments/subscription/status
// @access  Private
exports.getSubscriptionStatus = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  const activeSubscription = await Payment.findOne({
    userId: req.user.id,
    subscriptionType: { $ne: "none" },
    status: "completed",
    subscriptionEndDate: { $gte: new Date() },
  }).sort({ createdAt: -1 });

  const subscriptionStatus = {
    isPremium: user.isPremium || false,
    subscriptionType: activeSubscription?.subscriptionType || "none",
    startDate: activeSubscription?.subscriptionStartDate || null,
    endDate: user.premiumExpiryDate || activeSubscription?.subscriptionEndDate || null,
    isActive: user.isPremium && user.premiumExpiryDate && user.premiumExpiryDate > new Date(),
    daysRemaining: null,
  };

  if (subscriptionStatus.endDate) {
    const daysRemaining = Math.ceil(
      (new Date(subscriptionStatus.endDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    subscriptionStatus.daysRemaining = daysRemaining > 0 ? daysRemaining : 0;
  }

  res.json({
    success: true,
    data: subscriptionStatus,
  });
});

// @desc    Upgrade subscription
// @route   POST /api/payments/subscription/upgrade
// @access  Private
exports.upgradeSubscription = catchAsync(async (req, res) => {
  const { subscriptionType, amount } = req.body;

  if (!subscriptionType || !["monthly", "yearly", "lifetime"].includes(subscriptionType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid subscription type",
    });
  }

  // Pricing (can be moved to config)
  const pricing = {
    monthly: 500,
    yearly: 5000,
    lifetime: 15000,
  };

  const subscriptionAmount = amount || pricing[subscriptionType];

  // Create payment order for subscription
  const amountInPaise = subscriptionAmount * 100;

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: generateOrderId(),
      notes: {
        userId: req.user.id.toString(),
        subscriptionType,
      },
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    razorpayOrder = {
      id: `order_${Date.now()}`,
      amount: amountInPaise,
      currency: "INR",
      status: "created",
    };
  }

  const orderId = generateOrderId();
  const payment = await Payment.create({
    userId: req.user.id,
    orderId,
    razorpayOrderId: razorpayOrder.id,
    amount: subscriptionAmount,
    currency: "PKR",
    status: "pending",
    description: `Subscription upgrade to ${subscriptionType}`,
    subscriptionType,
  });

  res.status(201).json({
    success: true,
    message: "Subscription upgrade order created",
    data: {
      orderId: payment.orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: payment.amount,
      currency: payment.currency,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
      subscriptionType,
    },
  });
});

// @desc    Cancel subscription
// @route   POST /api/payments/subscription/cancel
// @access  Private
exports.cancelSubscription = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user.isPremium) {
    return res.status(400).json({
      success: false,
      message: "No active subscription to cancel",
    });
  }

  // Find active subscription payment
  const activeSubscription = await Payment.findOne({
    userId: req.user.id,
    subscriptionType: { $ne: "none" },
    status: "completed",
    subscriptionEndDate: { $gte: new Date() },
  }).sort({ createdAt: -1 });

  if (!activeSubscription) {
    return res.status(404).json({
      success: false,
      message: "Active subscription not found",
    });
  }

  // Update user subscription
  user.isPremium = false;
  user.premiumExpiryDate = null;
  await user.save();

  // Mark subscription as cancelled
  activeSubscription.status = "cancelled";
  await activeSubscription.save();

  res.json({
    success: true,
    message: "Subscription cancelled successfully",
    data: {
      cancelledAt: new Date(),
      subscriptionEndDate: activeSubscription.subscriptionEndDate,
    },
  });
});
