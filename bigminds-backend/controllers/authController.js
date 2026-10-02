const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const RevokedToken = require("../models/RevokedToken");

// Safely resolve JWT expiry
const getJwtExpiry = () => {
  const raw = (process.env.JWT_EXPIRE || "").toString().trim();
  if (!raw) return "30d";

  // Accept values like "30d", "7d", "3600", "12h" etc.
  const validPattern = /^(\d+)([smhdwy])?$/;
  if (validPattern.test(raw)) {
    return raw;
  }

  console.error(
    "Invalid JWT_EXPIRE value:",
    process.env.JWT_EXPIRE,
    '- falling back to "30d"',
  );
  return "30d";
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: getJwtExpiry(),
  });
};

const getRefreshTokenExpiry = () => {
  const raw = (process.env.JWT_REFRESH_EXPIRE || "30d").toString().trim();
  return raw;
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: getRefreshTokenExpiry(),
  });
};

/**
 * Hash token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      city,
      educationLevel,
      targetExam,
      phoneNumber,
      role,
    } = req.body;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
      city: city.trim(),
      educationLevel,
      targetExam,
      phoneNumber: phoneNumber?.trim(),
      role: role || "student",
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    // Send verification email (async, don't wait)
    const verificationUrl = `${req.protocol}://${req.get("host")}/api/auth/verify-email/${verificationToken}`;
    sendEmail({
      email: user.email,
      subject: "BigMinds - Email Verification",
      message: `Welcome to BigMinds! Please click on the link to verify your email: ${verificationUrl}`,
    })
      .then((result) => {
        if (!result.success) {
          console.error("Email sending failed:", result.error);
        }
      })
      .catch((error) => {
        console.error("Email sending failed:", error);
      });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email for verification.",
      token,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        city: user.city,
        educationLevel: user.educationLevel,
        targetExam: user.targetExam,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Login validation failed:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`🔍 Login attempt for email: ${normalizedEmail}`);

    // Check if user exists with password field
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );
    if (!user) {
      console.log(`❌ User not found: ${normalizedEmail}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log(
      `✅ User found: ${user.email}, ID: ${user._id}, Active: ${user.isActive}`,
    );

    // Check if user has a password set
    if (!user.password) {
      console.error(
        `❌ User ${user._id} (${normalizedEmail}) has no password set`,
      );
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log(`🔐 Comparing password for user: ${user.email}`);

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Password mismatch for user: ${normalizedEmail}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log(`✅ Password match confirmed for user: ${user.email}`);

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Update login analytics with defensive checks
    const forwardedFor = req.headers["x-forwarded-for"];
    const clientIpFromHeader = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : (forwardedFor || "").split(",")[0].trim();

    const loginData = {
      loginAt: new Date(),
      ipAddress:
        clientIpFromHeader ||
        req.ip ||
        (req.socket && req.socket.remoteAddress) ||
        (req.connection && req.connection.remoteAddress) ||
        "unknown",
      userAgent: req.get("User-Agent"),
    };

    // Initialize analytics if not present
    if (!user.analytics) {
      user.analytics = {
        loginHistory: [],
        appUsage: {
          totalSessions: 0,
          totalTimeSpent: 0,
          lastSessionDuration: 0,
        },
      };
    }

    // Initialize loginHistory if not present
    if (!user.analytics.loginHistory) {
      user.analytics.loginHistory = [];
    }

    // Initialize appUsage if not present
    if (!user.analytics.appUsage) {
      user.analytics.appUsage = {
        totalSessions: 0,
        totalTimeSpent: 0,
        lastSessionDuration: 0,
      };
    }

    // Initialize studentProgress if not present
    if (!user.studentProgress) {
      user.studentProgress = {
        lastActiveDate: new Date(),
      };
    }

    user.analytics.loginHistory.push(loginData);
    user.analytics.appUsage.totalSessions =
      (user.analytics.appUsage.totalSessions || 0) + 1;
    user.studentProgress.lastActiveDate = new Date();

    // Keep only last 10 login records for performance
    if (user.analytics.loginHistory.length > 10) {
      user.analytics.loginHistory = user.analytics.loginHistory.slice(-10);
    }

    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPremium: user.isPremium,
        avatar: user.avatar,
        city: user.city,
        educationLevel: user.educationLevel,
        targetExam: user.targetExam,
        lastActiveDate: user.studentProgress.lastActiveDate,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "studentProgress.enrolledCourses.course",
      "title thumbnail",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // Only allow certain fields to be updated
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "dateOfBirth",
      "institution",
      "city",
      "educationLevel",
      "targetExam",
      "preferences.language",
      "preferences.notifications",
      "preferences.theme",
    ];

    const updateData = {};

    // Filter and validate update data
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        if (typeof req.body[key] === "string") {
          updateData[key] = req.body[key].trim();
        } else {
          updateData[key] = req.body[key];
        }
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during profile update",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const normalizedEmail = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Check if user recently requested reset (prevent spam)
    if (user.resetPasswordExpire && user.resetPasswordExpire > Date.now()) {
      return res.status(429).json({
        success: false,
        message:
          "Password reset already requested. Please check your email or wait before requesting again.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send reset email (async, don't wait)
    const frontendBaseUrl =
      process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;
    sendEmail({
      email: user.email,
      subject: "BigMinds - Password Reset Request",
      message: `You requested a password reset.\n\nPlease open the following link in your browser to set a new password:\n${resetUrl}\n\nThis link will expire in 10 minutes. If you did not request this, you can safely ignore this email.`,
    }).catch((error) => {
      console.error("Password reset email failed:", error);
    });

    res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset request",
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const resetPasswordToken = hashToken(req.params.token);

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    sendEmail({
      email: user.email,
      subject: "BigMinds - Password Changed",
      message:
        "Your password has been successfully changed. If you did not make this change, please contact support immediately.",
    }).catch((error) => {
      console.error("Password change confirmation email failed:", error);
    });

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const verificationToken = hashToken(req.params.token);

    const user = await User.findOne({
      emailVerificationToken: verificationToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send welcome email
    sendEmail({
      email: user.email,
      subject: "BigMinds - Welcome!",
      message: `Welcome to BigMinds, ${user.firstName}! Your email has been verified successfully. You can now access all features of the platform.`,
    }).catch((error) => {
      console.error("Welcome email failed:", error);
    });

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during email verification",
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Check if recently sent (prevent spam)
    if (
      user.emailVerificationExpire &&
      user.emailVerificationExpire > Date.now()
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Verification email already sent. Please check your email or wait before requesting again.",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get("host")}/api/auth/verify-email/${verificationToken}`;
    sendEmail({
      email: user.email,
      subject: "BigMinds - Email Verification",
      message: `Please click on the link to verify your email: ${verificationUrl}`,
    }).catch((error) => {
      console.error("Verification email failed:", error);
    });

    res.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during email resend",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Revoke current access token
    if (req.token) {
      await RevokedToken.create({ token: req.token }).catch((err) => {
        if (err.code !== 11000) {
          throw err;
        }
      });
    }

    // Optionally revoke the provided refresh token as well
    if (req.body.refreshToken) {
      await RevokedToken.create({ token: req.body.refreshToken }).catch(
        (err) => {
          if (err.code !== 11000) {
            throw err;
          }
        },
      );
    }

    // Update last session duration if provided
    if (req.body.sessionDuration) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.analytics.appUsage.lastSessionDuration = req.body.sessionDuration;
        user.analytics.appUsage.totalTimeSpent += req.body.sessionDuration;
        await user.save();
      }
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const revoked = await RevokedToken.exists({ token: refreshToken });
    if (revoked) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has been revoked. Please login again.",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid or the user is no longer active.",
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during refresh token processing",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send confirmation email
    sendEmail({
      email: user.email,
      subject: "BigMinds - Password Changed",
      message:
        "Your password has been successfully changed. If you did not make this change, please contact support immediately.",
    }).catch((error) => {
      console.error("Password change confirmation email failed:", error);
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password change",
    });
  }
};
