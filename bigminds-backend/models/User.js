const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot be more than 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    // Profile Information
    avatar: {
      type: String,
      default: null,
    },
    avatarSmall: {
      type: String,
      default: null,
    },
    avatarMedium: {
      type: String,
      default: null,
    },
    avatarLarge: {
      type: String,
      default: null,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [100, "Display name cannot be more than 100 characters"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot be more than 500 characters"],
    },
    phoneNumber: {
      type: String,
      match: [
        /^(\+92|0)?3[0-9]{2}[0-9]{7}$/,
        "Please enter a valid Pakistani phone number",
      ],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot be more than 100 characters"],
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v <= new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer-not-to-say"],
    },
    socialLinks: {
      linkedin: {
        type: String,
        match: [/^https?:\/\/(www\.)?linkedin\.com\/.*/, "Please enter a valid LinkedIn URL"],
      },
      github: {
        type: String,
        match: [/^https?:\/\/(www\.)?github\.com\/.*/, "Please enter a valid GitHub URL"],
      },
      website: {
        type: String,
        match: [/^https?:\/\/.+/, "Please enter a valid website URL"],
      },
    },
    profileCompleted: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    // Academic Information
    educationLevel: {
      type: String,
      enum: ["matriculation", "intermediate", "bachelor", "master", "other"],
      default: "intermediate",
    },
    targetExam: {
      type: String,
      enum: ["mdcat", "ecat", "nts", "gat", "other"],
      default: "mdcat",
    },
    institution: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    
    // Student Specific Fields
    studentProfile: {
      classLevel: {
        type: String,
        enum: ["9", "10", "11", "12", "o-level", "a-level"],
      },
      category: {
        type: String,
        enum: ["pre-engineering", "pre-medical", "computer-science", "bba", "o-levels", "a-levels"],
      },
      learningGoals: {
        type: String,
        maxlength: [1000, "Learning goals cannot be more than 1000 characters"],
      },
    },

    // Account Status
    role: {
      type: String,
      enum: ["student", "teacher", "admin", "institute"],
      default: "student",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiryDate: {
      type: Date,
      default: null,
    },

    // Verification Tokens
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Teacher Specific Fields
    teacherProfile: {
      qualification: {
        type: String,
        maxlength: [200, "Qualification cannot be more than 200 characters"],
      },
      experienceYears: {
        type: Number,
        min: [0, "Experience cannot be negative"],
        default: 0,
      },
      subjects: [{
        type: String,
        trim: true,
      }],
      expertiseTags: [{
        type: String,
        trim: true,
      }],
      portfolioLinks: [{
        type: String,
        match: [/^https?:\/\/.+/, "Please enter a valid URL"],
      }],
      isVerified: {
        type: Boolean,
        default: false,
      },
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
    },

    // Student Progress Tracking
    studentProgress: {
      enrolledCourses: [
        {
          course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
          },
          enrolledAt: {
            type: Date,
            default: Date.now,
          },
          progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
          },
          completedVideos: [
            {
              video: String,
              completedAt: Date,
            },
          ],
          quizScores: [
            {
              quiz: String,
              score: Number,
              attemptedAt: Date,
            },
          ],
        },
      ],
      totalWatchTime: {
        type: Number,
        default: 0, // in minutes
      },
      streak: {
        type: Number,
        default: 0,
      },
      lastActiveDate: {
        type: Date,
        default: Date.now,
      },
    },

    // Forum Activity
    forumStats: {
      questionsAsked: {
        type: Number,
        default: 0,
      },
      answersGiven: {
        type: Number,
        default: 0,
      },
      reputation: {
        type: Number,
        default: 0,
      },
      badges: [String],
    },

    // Preferences & Settings
    preferences: {
      language: {
        type: String,
        enum: ["english", "urdu"],
        default: "english",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        courseUpdates: {
          type: Boolean,
          default: true,
        },
        forumActivity: {
          type: Boolean,
          default: true,
        },
      },
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
    },

    // Analytics & Tracking
    analytics: {
      deviceInfo: {
        platform: String, // android, ios, web
        version: String,
        deviceModel: String,
      },
      loginHistory: [
        {
          loginAt: {
            type: Date,
            default: Date.now,
          },
          ipAddress: String,
          userAgent: String,
        },
      ],
      appUsage: {
        totalSessions: {
          type: Number,
          default: 0,
        },
        totalTimeSpent: {
          type: Number,
          default: 0, // in minutes
        },
        lastSessionDuration: {
          type: Number,
          default: 0,
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
userSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ "studentProgress.enrolledCourses.course": 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate auth token
userSchema.methods.generateAuthToken = function () {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model("User", userSchema);

