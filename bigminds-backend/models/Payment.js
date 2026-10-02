const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "PKR",
      enum: ["PKR", "USD"],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: "razorpay",
    },
    description: {
      type: String,
      default: "",
    },
    subscriptionType: {
      type: String,
      enum: ["none", "monthly", "yearly", "lifetime"],
      default: "none",
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

// Virtual for payment duration (for subscriptions)
paymentSchema.virtual("subscriptionDuration").get(function () {
  if (this.subscriptionStartDate && this.subscriptionEndDate) {
    return Math.ceil(
      (this.subscriptionEndDate - this.subscriptionStartDate) / (1000 * 60 * 60 * 24)
    );
  }
  return null;
});

// Pre-save middleware
paymentSchema.pre("save", function (next) {
  if (this.status === "completed" && this.subscriptionType !== "none") {
    if (!this.subscriptionStartDate) {
      this.subscriptionStartDate = new Date();
    }
    if (!this.subscriptionEndDate && this.subscriptionType === "monthly") {
      this.subscriptionEndDate = new Date(
        this.subscriptionStartDate.getTime() + 30 * 24 * 60 * 60 * 1000
      );
    } else if (!this.subscriptionEndDate && this.subscriptionType === "yearly") {
      this.subscriptionEndDate = new Date(
        this.subscriptionStartDate.getTime() + 365 * 24 * 60 * 60 * 1000
      );
    } else if (this.subscriptionType === "lifetime") {
      this.subscriptionEndDate = new Date("2099-12-31");
    }
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);

