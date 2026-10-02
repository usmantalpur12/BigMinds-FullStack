const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RevokedToken = require("../models/RevokedToken");

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  try {
    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Set token from Bearer token in header
      token = req.headers.authorization.split(" ")[1];
      req.token = token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject revoked tokens immediately
    const revoked = await RevokedToken.exists({ token });
    if (revoked) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked. Please login again.",
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is no longer valid. User not found.",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Access denied.",
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Access denied.",
      });
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Token verification failed. Access denied.",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}. Current role: ${req.user.role}`,
      });
    }
    next();
  };
};

// Check if user is premium
exports.checkPremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!req.user.isPremium) {
      return res.status(403).json({
        success: false,
        message: "Premium subscription required to access this feature",
        upgradeRequired: true,
      });
    }

    // Check if premium has expired
    if (req.user.premiumExpiryDate && req.user.premiumExpiryDate < new Date()) {
      // Update user status
      await User.findByIdAndUpdate(req.user.id, {
        isPremium: false,
        premiumExpiryDate: null,
      });

      return res.status(403).json({
        success: false,
        message: "Premium subscription has expired",
        upgradeRequired: true,
      });
    }

    next();
  } catch (error) {
    console.error("Premium check error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during premium verification",
    });
  }
};

// Check if user is verified
exports.checkVerified = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email to access this feature",
      emailVerificationRequired: true,
    });
  }
  next();
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const revoked = await RevokedToken.exists({ token });

        if (!revoked) {
          const user = await User.findById(decoded.id);

          if (user && user.isActive) {
            req.user = user;
          }
        }
      }
    }
  } catch (err) {
    // Silently fail for optional auth
    console.log("Optional auth failed:", err.message);
  }

  next();
};

// Check if user owns resource or is admin
exports.checkOwnership = (resourceUserField = "user") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Admins can access anything
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId =
      req.body[resourceUserField] || req.params.userId || req.user.id;

    if (req.user.id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own resources.",
      });
    }

    next();
  };
};
