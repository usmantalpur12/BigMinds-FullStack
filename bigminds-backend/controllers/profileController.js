const User = require("../models/User");
const UserDocument = require("../models/UserDocument");
const ActivityLog = require("../models/ActivityLog");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const UserProgress = require("../models/UserProgress");
const { catchAsync } = require("../middleware/errorHandler");
const { processAvatar, deleteAvatarFiles } = require("../middleware/imageProcessor");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

// Helper function to log activity
const logActivity = async (userId, action, meta = {}, req) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      meta,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

// Helper function to calculate profile completion
const calculateProfileCompletion = (user) => {
  let completed = 0;
  let total = 0;

  // Basic fields (40 points)
  total += 8;
  if (user.firstName) completed++;
  if (user.lastName) completed++;
  if (user.email) completed++;
  if (user.avatar) completed++;
  if (user.displayName) completed++;
  if (user.bio) completed++;
  if (user.phoneNumber) completed++;
  if (user.location) completed++;

  // Date of birth (5 points)
  total += 1;
  if (user.dateOfBirth) completed++;

  // Gender (5 points)
  total += 1;
  if (user.gender) completed++;

  // Social links (10 points)
  total += 3;
  if (user.socialLinks?.linkedin) completed++;
  if (user.socialLinks?.github) completed++;
  if (user.socialLinks?.website) completed++;

  // Role-specific fields (40 points)
  if (user.role === "student") {
    total += 3;
    if (user.studentProfile?.classLevel) completed++;
    if (user.studentProfile?.category) completed++;
    if (user.studentProfile?.learningGoals) completed++;
  } else if (user.role === "teacher") {
    total += 5;
    if (user.teacherProfile?.qualification) completed++;
    if (user.teacherProfile?.experienceYears !== undefined) completed++;
    if (user.teacherProfile?.subjects?.length > 0) completed++;
    if (user.teacherProfile?.expertiseTags?.length > 0) completed++;
    if (user.teacherProfile?.portfolioLinks?.length > 0) completed++;
  }

  return Math.round((completed / total) * 100);
};



// @desc    Get current user's full profile
// @route   GET /api/profile/me
// @access  Private
exports.getMyProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password -twoFactorSecret")
    .populate("studentProgress.enrolledCourses.course", "title thumbnail");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Get enrollments for students
  let enrollments = [];
  if (user.role === "student") {
    enrollments = await Enrollment.find({ studentId: user._id })
      .populate("courseId", "title thumbnail category class")
      .sort({ enrolledAt: -1 })
      .limit(10);
  }

  // Get documents for teachers
  let documents = [];
  if (user.role === "teacher") {
    documents = await UserDocument.find({ userId: user._id })
      .sort({ uploadedAt: -1 });
  }

  // Calculate profile completion
  const profileCompleted = calculateProfileCompletion(user);

  // Generate extended user stats identical to what /users/me/stats provided
  let stats = {
    totalCourses: 0,
    completedCourses: 0,
    activeCourses: 0,
    completionRate: 0,
    totalWatchTime: 0,
    currentStreak: 0,
    xp: 0,
    level: 1,
    forumStats: {
      questionsAsked: 0,
      answersGiven: 0,
      reputation: 0,
      badges: []
    }
  };

  if (user.role === 'student') {
    const allEnrollments = await Enrollment.find({ studentId: user._id });
    const completed = allEnrollments.filter(e => e.status === 'completed').length;
    stats.totalCourses = allEnrollments.length;
    stats.completedCourses = completed;
    stats.activeCourses = allEnrollments.filter(e => e.status === 'active').length;
    stats.completionRate = allEnrollments.length > 0 ? (completed / allEnrollments.length) * 100 : 0;
  } else if (user.role === 'teacher') {
    const teacherCourses = await Course.find({ instructor: user._id });
    stats.totalCourses = teacherCourses.length;
    stats.activeCourses = teacherCourses.filter(c => c.status === 'published').length;
  }

  // Fetch Gamification Profile for Streak and XP
  const gProfile = await UserProgress.findOne({ user: user._id });
  if (gProfile) {
    stats.currentStreak = gProfile.currentStreak || 0;
    stats.xp = gProfile.xp || 0;
    stats.level = gProfile.level || 1;
    // We mock forum stats if the schema doesn't have it directly, 
    // but we ensure the object shape matches frontend expectations
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
      profileCompleted,
      stats,
      enrollments: enrollments.map(e => ({
        course: e.courseId,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
      })),
      documents,
    },
  });
});

// @desc    Update profile
// @route   PUT /api/profile/update
// @access  Private
exports.updateProfile = catchAsync(async (req, res) => {
  const {
    displayName,
    bio,
    phoneNumber,
    location,
    dateOfBirth,
    gender,
    socialLinks,
  } = req.body;

  const updateData = {};

  if (displayName !== undefined) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (location !== undefined) updateData.location = location;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (gender !== undefined) updateData.gender = gender;
  if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  ).select("-password -twoFactorSecret");

  // Calculate and update profile completion
  const profileCompleted = calculateProfileCompletion(user);
  user.profileCompleted = profileCompleted;
  await user.save();

  // Log activity
  await logActivity(req.user.id, "profile_updated", { fields: Object.keys(updateData) }, req);

  res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
      profileCompleted,
    },
    message: "Profile updated successfully",
  });
});

// @desc    Upload avatar
// @route   PUT /api/profile/avatar
// @access  Private
exports.uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image file",
    });
  }

  const user = await User.findById(req.user.id);

  // Delete old avatar files if they exist
  if (user.avatar) {
    try {
      const oldBaseName = path.basename(user.avatar, path.extname(user.avatar)).replace("_original", "");
      await deleteAvatarFiles(oldBaseName);
    } catch (error) {
      console.error("Error deleting old avatar:", error);
    }
  }

  // Process avatar into multiple sizes
  const baseName = path.basename(req.file.filename, path.extname(req.file.filename));
  const processedImages = await processAvatar(req.file.path, baseName);

  // Update user with new avatar paths
  user.avatar = processedImages.original;
  user.avatarSmall = processedImages.small;
  user.avatarMedium = processedImages.medium;
  user.avatarLarge = processedImages.large;

  // Calculate profile completion
  const profileCompleted = calculateProfileCompletion(user);
  user.profileCompleted = profileCompleted;

  await user.save();

  // Log activity
  await logActivity(req.user.id, "avatar_uploaded", { avatarUrl: processedImages.original }, req);

  res.status(200).json({
    success: true,
    data: {
      avatar: user.avatar,
      avatarSmall: user.avatarSmall,
      avatarMedium: user.avatarMedium,
      avatarLarge: user.avatarLarge,
      profileCompleted,
    },
    message: "Avatar uploaded successfully",
  });
});

// @desc    Delete avatar
// @route   DELETE /api/profile/avatar
// @access  Private
exports.deleteAvatar = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user.avatar) {
    return res.status(400).json({
      success: false,
      message: "No avatar to delete",
    });
  }

  // Delete avatar files
  try {
    const baseName = path.basename(user.avatar, path.extname(user.avatar)).replace("_original", "");
    await deleteAvatarFiles(baseName);
  } catch (error) {
    console.error("Error deleting avatar files:", error);
  }

  // Clear avatar fields
  user.avatar = null;
  user.avatarSmall = null;
  user.avatarMedium = null;
  user.avatarLarge = null;

  // Recalculate profile completion
  const profileCompleted = calculateProfileCompletion(user);
  user.profileCompleted = profileCompleted;

  await user.save();

  // Log activity
  await logActivity(req.user.id, "avatar_deleted", {}, req);

  res.status(200).json({
    success: true,
    message: "Avatar deleted successfully",
    data: {
      profileCompleted,
    },
  });
});

// @desc    Change password
// @route   PUT /api/profile/password
// @access  Private
exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters long",
    });
  }

  const user = await User.findById(req.user.id).select("+password");

  // Check current password
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

  // Log activity
  await logActivity(req.user.id, "password_changed", {}, req);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// @desc    Get public profile
// @route   GET /api/profile/:id
// @access  Public
exports.getPublicProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("firstName lastName displayName avatar avatarMedium bio role city location socialLinks teacherProfile studentProfile")
    .populate("studentProgress.enrolledCourses.course", "title thumbnail");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Get public stats
  let stats = {};
  if (user.role === "student") {
    const enrollments = await Enrollment.find({ studentId: user._id });
    stats = {
      enrolledCourses: enrollments.length,
      completedCourses: enrollments.filter(e => e.status === "completed").length,
      totalProgress: enrollments.length > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
        : 0,
    };
  } else if (user.role === "teacher") {
    const Course = require("../models/Course");
    const courses = await Course.find({ instructor: user._id });
    stats = {
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0),
      rating: user.teacherProfile?.rating || 0,
      totalRatings: user.teacherProfile?.totalRatings || 0,
    };
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
      stats,
    },
  });
});

// @desc    Update student profile fields
// @route   PUT /api/profile/student/update
// @access  Private (Student only)
exports.updateStudentProfile = catchAsync(async (req, res) => {
  const { classLevel, category, learningGoals } = req.body;

  if (req.user.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Only students can update student profile fields",
    });
  }

  const updateData = {};
  if (classLevel !== undefined) updateData["studentProfile.classLevel"] = classLevel;
  if (category !== undefined) updateData["studentProfile.category"] = category;
  if (learningGoals !== undefined) updateData["studentProfile.learningGoals"] = learningGoals;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password -twoFactorSecret");

  // Calculate profile completion
  const profileCompleted = calculateProfileCompletion(user);
  user.profileCompleted = profileCompleted;
  await user.save();

  // Log activity
  const actions = [];
  if (classLevel !== undefined) actions.push("class_level_updated");
  if (category !== undefined) actions.push("category_updated");
  if (learningGoals !== undefined) actions.push("learning_goals_updated");

  for (const action of actions) {
    await logActivity(req.user.id, action, { value: req.body[action.replace("_updated", "")] }, req);
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
      profileCompleted,
    },
    message: "Student profile updated successfully",
  });
});

// @desc    Update teacher profile fields
// @route   PUT /api/profile/teacher/update
// @access  Private (Teacher only)
exports.updateTeacherProfile = catchAsync(async (req, res) => {
  const { qualification, experienceYears, subjects, expertiseTags, portfolioLinks } = req.body;

  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only teachers can update teacher profile fields",
    });
  }

  const updateData = {};
  if (qualification !== undefined) updateData["teacherProfile.qualification"] = qualification;
  if (experienceYears !== undefined) updateData["teacherProfile.experienceYears"] = experienceYears;
  if (subjects !== undefined) updateData["teacherProfile.subjects"] = subjects;
  if (expertiseTags !== undefined) updateData["teacherProfile.expertiseTags"] = expertiseTags;
  if (portfolioLinks !== undefined) updateData["teacherProfile.portfolioLinks"] = portfolioLinks;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password -twoFactorSecret");

  // Calculate profile completion
  const profileCompleted = calculateProfileCompletion(user);
  user.profileCompleted = profileCompleted;
  await user.save();

  // Log activity
  const actions = [];
  if (qualification !== undefined) actions.push("qualification_updated");
  if (experienceYears !== undefined) actions.push("experience_updated");

  for (const action of actions) {
    await logActivity(req.user.id, action, { value: req.body[action.replace("_updated", "")] }, req);
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toObject(),
      profileCompleted,
    },
    message: "Teacher profile updated successfully",
  });
});

// @desc    Upload teacher document
// @route   POST /api/profile/teacher/document
// @access  Private (Teacher only)
exports.uploadTeacherDocument = catchAsync(async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only teachers can upload documents",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload a document file",
    });
  }

  const { type, title } = req.body;

  if (!type || !title) {
    return res.status(400).json({
      success: false,
      message: "Document type and title are required",
    });
  }

  const document = await UserDocument.create({
    userId: req.user.id,
    type,
    title,
    fileUrl: `/uploads/documents/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
  });

  // Log activity
  await logActivity(req.user.id, "document_uploaded", {
    documentId: document._id,
    type,
    title,
  }, req);

  res.status(201).json({
    success: true,
    data: document,
    message: "Document uploaded successfully",
  });
});

// @desc    Delete teacher document
// @route   DELETE /api/profile/teacher/document/:id
// @access  Private (Teacher only)
exports.deleteTeacherDocument = catchAsync(async (req, res) => {
  const document = await UserDocument.findById(req.params.id);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: "Document not found",
    });
  }

  if (document.userId.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this document",
    });
  }

  // Delete file from filesystem
  const filePath = path.join(__dirname, "..", document.fileUrl);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error("Error deleting document file:", error);
    }
  }

  await document.deleteOne();

  // Log activity
  await logActivity(req.user.id, "document_deleted", {
    documentId: document._id,
    type: document.type,
  }, req);

  res.status(200).json({
    success: true,
    message: "Document deleted successfully",
  });
});

// @desc    Get activity logs
// @route   GET /api/profile/activity
// @access  Private
exports.getActivityLogs = catchAsync(async (req, res) => {
  const { limit = 50, action, startDate, endDate } = req.query;

  const logs = await ActivityLog.getUserLogs(req.user.id, {
    limit,
    action,
    startDate,
    endDate,
  });

  res.status(200).json({
    success: true,
    data: logs,
    count: logs.length,
  });
});

// @desc    Update security settings
// @route   PUT /api/profile/security
// @access  Private
exports.updateSecurity = catchAsync(async (req, res) => {
  const { twoFactorEnabled } = req.body;

  const user = await User.findById(req.user.id);

  if (twoFactorEnabled !== undefined) {
    user.twoFactorEnabled = twoFactorEnabled;

    // Log activity
    await logActivity(
      req.user.id,
      twoFactorEnabled ? "two_factor_enabled" : "two_factor_disabled",
      {},
      req
    );
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      twoFactorEnabled: user.twoFactorEnabled,
    },
    message: "Security settings updated successfully",
  });
});

// @desc    Delete account
// @route   POST /api/profile/delete-account
// @access  Private
exports.deleteAccount = catchAsync(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required to delete account",
    });
  }

  const user = await User.findById(req.user.id).select("+password");

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Incorrect password",
    });
  }

  // Delete user documents
  const documents = await UserDocument.find({ userId: user._id });
  for (const doc of documents) {
    const filePath = path.join(__dirname, "..", doc.fileUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  }
  await UserDocument.deleteMany({ userId: user._id });

  // Delete avatar files
  if (user.avatar) {
    try {
      const baseName = path.basename(user.avatar, path.extname(user.avatar)).replace("_original", "");
      await deleteAvatarFiles(baseName);
    } catch (error) {
      console.error("Error deleting avatar:", error);
    }
  }

  // Log activity before deletion
  await logActivity(req.user.id, "account_deleted", {}, req);

  // Delete user
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});

