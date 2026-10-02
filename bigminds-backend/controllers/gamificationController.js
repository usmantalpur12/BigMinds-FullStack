const User = require("../models/User");
const UserProgress = require("../models/UserProgress");
const Achievement = require("../models/Achievement");
const UserAchievement = require("../models/UserAchievement");
const Quest = require("../models/Quest");
const UserQuest = require("../models/UserQuest");
const Enrollment = require("../models/Enrollment");
const ForumPost = require("../models/ForumPost");
const Attempt = require("../models/Attempt");
const { catchAsync } = require("../middleware/errorHandler");

// Calculate user level based on XP
const calculateLevel = (xp) => {
  const levels = [
    { level: 1, xp: 0 },
    { level: 2, xp: 100 },
    { level: 3, xp: 250 },
    { level: 4, xp: 450 },
    { level: 5, xp: 700 },
    { level: 6, xp: 1000 },
    { level: 7, xp: 1350 },
    { level: 8, xp: 1750 },
    { level: 9, xp: 2200 },
    { level: 10, xp: 2700 },
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xp) {
      return levels[i].level;
    }
  }
  return 1;
};

// Add XP to user
const addXP = async (userId, amount, reason = "") => {
  let userProgress = await UserProgress.findOne({ user: userId });
  
  if (!userProgress) {
    userProgress = new UserProgress({ user: userId });
  }

  const oldXP = userProgress.xp || 0;
  const oldLevel = calculateLevel(oldXP);
  
  userProgress.xp = (userProgress.xp || 0) + amount;
  userProgress.level = calculateLevel(userProgress.xp);
  
  const newLevel = userProgress.level;
  const leveledUp = newLevel > oldLevel;

  await userProgress.save();

  // Check for level-based achievements
  if (leveledUp) {
    await checkLevelAchievements(userId, newLevel);
  }

  return {
    xpAdded: amount,
    totalXP: userProgress.totalXP,
    level: newLevel,
    leveledUp,
    reason,
  };
};

// Check and award achievements
const checkAchievements = async (userId, category, action, value) => {
  const achievements = await Achievement.find({
    category,
    isActive: true,
  });

  const awardedAchievements = [];

  for (const achievement of achievements) {
    const userAchievement = await UserAchievement.findOne({
      userId,
      achievementId: achievement._id,
    });

    if (userAchievement && userAchievement.isCompleted) {
      continue; // Already earned
    }

    let shouldAward = false;
    const requirements = achievement.requirements;

    switch (category) {
      case "course":
        if (requirements.get("coursesCompleted") && value >= requirements.get("coursesCompleted")) {
          shouldAward = true;
        }
        break;
      case "streak":
        if (requirements.get("days") && value >= requirements.get("days")) {
          shouldAward = true;
        }
        break;
      case "forum":
        if (requirements.get("posts") && value >= requirements.get("posts")) {
          shouldAward = true;
        }
        break;
      case "quiz":
        if (requirements.get("quizzesCompleted") && value >= requirements.get("quizzesCompleted")) {
          shouldAward = true;
        }
        break;
    }

    if (shouldAward) {
      if (!userAchievement) {
        await UserAchievement.create({
          userId,
          achievementId: achievement._id,
          isCompleted: true,
          earnedAt: new Date(),
        });
      } else {
        userAchievement.isCompleted = true;
        userAchievement.earnedAt = new Date();
        await userAchievement.save();
      }

      // Award XP
      if (achievement.xpReward > 0) {
        await addXP(userId, achievement.xpReward, `Achievement: ${achievement.name}`);
      }

      awardedAchievements.push(achievement);
    }
  }

  return awardedAchievements;
};

// Check level-based achievements
const checkLevelAchievements = async (userId, level) => {
  const achievements = await Achievement.find({
    category: "milestone",
    isActive: true,
    "requirements.level": level,
  });

  for (const achievement of achievements) {
    const existing = await UserAchievement.findOne({
      userId,
      achievementId: achievement._id,
    });

    if (!existing) {
      await UserAchievement.create({
        userId,
        achievementId: achievement._id,
        isCompleted: true,
        earnedAt: new Date(),
      });

      if (achievement.xpReward > 0) {
        await addXP(userId, achievement.xpReward, `Level Achievement: ${achievement.name}`);
      }
    }
  }
};

// @desc    Get user progress
// @route   GET /api/gamification/progress/:userId
// @access  Private
exports.getUserProgress = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;

  let userProgress = await UserProgress.findOne({ user: userId });
  
  if (!userProgress) {
    userProgress = new UserProgress({ user: userId });
    await userProgress.save();
  }

  const user = await User.findById(userId);
  const level = calculateLevel(userProgress.xp || 0);

  // Calculate stats
  const enrollments = await Enrollment.countDocuments({ studentId: userId });
  const completedCourses = await Enrollment.countDocuments({
    studentId: userId,
    status: "completed",
  });
  const forumPosts = await ForumPost.countDocuments({ author: userId });
  const quizAttempts = await Attempt.countDocuments({ userId });

  res.json({
    success: true,
    data: {
      userId,
      xp: userProgress.xp || 0,
      totalXP: userProgress.xp || 0, // Backward compatibility
      level: level,
      currentLevel: level, // Backward compatibility
      streak: user?.studentProgress?.streak || 0,
      enrollments,
      completedCourses,
      forumPosts,
      quizAttempts,
      lastActiveDate: user?.studentProgress?.lastActiveDate || new Date(),
    },
  });
});

// @desc    Add XP to user
// @route   POST /api/gamification/xp/:userId
// @access  Private
exports.addXP = catchAsync(async (req, res) => {
  const { amount, reason } = req.body;
  const userId = req.params.userId || req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid XP amount",
    });
  }

  const result = await addXP(userId, amount, reason);

  res.json({
    success: true,
    message: "XP added successfully",
    data: result,
  });
});

// @desc    Update user streak
// @route   PUT /api/gamification/streak/:userId
// @access  Private
exports.updateStreak = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const lastActive = user.studentProgress?.lastActiveDate || new Date(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActiveDate = new Date(lastActive);
  lastActiveDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Already active today
    return res.json({
      success: true,
      data: {
        streak: user.studentProgress?.streak || 0,
        message: "Already active today",
      },
    });
  } else if (daysDiff === 1) {
    // Continue streak
    user.studentProgress.streak = (user.studentProgress?.streak || 0) + 1;
    user.studentProgress.lastActiveDate = new Date();
    await user.save();

    // Check streak achievements
    await checkAchievements(userId, "streak", "update", user.studentProgress.streak);

    // Award streak bonus XP
    const streakBonus = Math.min(user.studentProgress.streak * 5, 50);
    await addXP(userId, streakBonus, "Daily streak bonus");

    res.json({
      success: true,
      message: "Streak updated",
      data: {
        streak: user.studentProgress.streak,
        xpBonus: streakBonus,
      },
    });
  } else {
    // Reset streak
    user.studentProgress.streak = 1;
    user.studentProgress.lastActiveDate = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Streak reset and started",
      data: {
        streak: 1,
      },
    });
  }
});

// @desc    Get user achievements
// @route   GET /api/gamification/achievements/:userId
// @access  Private
exports.getUserAchievements = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;

  const userAchievements = await UserAchievement.find({ userId })
    .populate("achievementId")
    .sort({ earnedAt: -1 });

  const allAchievements = await Achievement.find({ isActive: true });
  const earnedAchievementIds = userAchievements
    .filter(ua => ua.isCompleted)
    .map(ua => ua.achievementId._id.toString());

  const achievements = allAchievements.map(achievement => ({
    ...achievement.toObject(),
    earned: earnedAchievementIds.includes(achievement._id.toString()),
    earnedAt: userAchievements.find(
      ua => ua.achievementId._id.toString() === achievement._id.toString() && ua.isCompleted
    )?.earnedAt || null,
  }));

  res.json({
    success: true,
    data: achievements,
  });
});

// @desc    Get available quests
// @route   GET /api/gamification/quests/:userId
// @access  Private
exports.getQuests = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const { type } = req.query;

  let query = { isActive: true };
  if (type) {
    query.type = type;
  }

  const quests = await Quest.find(query).sort({ createdAt: -1 });
  const userQuests = await UserQuest.find({ userId });

  const questsWithProgress = quests.map(quest => {
    const userQuest = userQuests.find(uq => uq.questId.toString() === quest._id.toString());
    
    return {
      ...quest.toObject(),
      status: userQuest?.status || "not_started",
      progress: userQuest?.progress || {},
      startedAt: userQuest?.startedAt || null,
      completedAt: userQuest?.completedAt || null,
      completionCount: userQuest?.completionCount || 0,
    };
  });

  res.json({
    success: true,
    data: questsWithProgress,
  });
});

// @desc    Start a quest
// @route   POST /api/gamification/quests/:userId/start
// @access  Private
exports.startQuest = catchAsync(async (req, res) => {
  const { questId } = req.body;
  const userId = req.params.userId || req.user.id;

  const quest = await Quest.findById(questId);
  if (!quest || !quest.isActive) {
    return res.status(404).json({
      success: false,
      message: "Quest not found",
    });
  }

  let userQuest = await UserQuest.findOne({ userId, questId });
  
  if (!userQuest) {
    userQuest = new UserQuest({
      userId,
      questId,
      status: "in_progress",
      startedAt: new Date(),
    });
  } else {
    userQuest.status = "in_progress";
    userQuest.startedAt = new Date();
  }

  await userQuest.save();

  res.json({
    success: true,
    message: "Quest started",
    data: userQuest,
  });
});

// @desc    Update quest progress
// @route   PUT /api/gamification/quests/:userId/progress
// @access  Private
exports.updateQuestProgress = catchAsync(async (req, res) => {
  const { questId, progress } = req.body;
  const userId = req.params.userId || req.user.id;

  const quest = await Quest.findById(questId);
  if (!quest) {
    return res.status(404).json({
      success: false,
      message: "Quest not found",
    });
  }

  let userQuest = await UserQuest.findOne({ userId, questId });
  
  if (!userQuest) {
    userQuest = new UserQuest({
      userId,
      questId,
      status: "in_progress",
      startedAt: new Date(),
    });
  }

  // Update progress
  if (progress) {
    userQuest.progress = new Map(Object.entries(progress));
  }

  // Check if quest is completed
  const requirements = quest.requirements;
  let isCompleted = true;

  for (const [key, value] of requirements.entries()) {
    const currentProgress = userQuest.progress.get(key) || 0;
    if (currentProgress < value) {
      isCompleted = false;
      break;
    }
  }

  if (isCompleted && userQuest.status !== "completed") {
    userQuest.status = "completed";
    userQuest.completedAt = new Date();
    userQuest.completionCount += 1;

    // Award XP
    if (quest.xpReward > 0) {
      await addXP(userId, quest.xpReward, `Quest completed: ${quest.title}`);
    }
  }

  await userQuest.save();

  res.json({
    success: true,
    message: "Quest progress updated",
    data: userQuest,
  });
});

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public
exports.getLeaderboard = catchAsync(async (req, res) => {
  const { category = "overall", limit = 10 } = req.query;
  const parsedLimit = Math.min(parseInt(limit) || 10, 50);

  // Map category to sort field and display label
  const categoryConfig = {
    overall:    { sortField: "xp",               scoreField: "xp",               scoreLabel: "XP",       scoreUnit: "xp"      },
    xp:         { sortField: "xp",               scoreField: "xp",               scoreLabel: "XP",       scoreUnit: "xp"      },
    courses:    { sortField: "coursesCompleted",  scoreField: "coursesCompleted",  scoreLabel: "Courses",  scoreUnit: "count"   },
    forums:     { sortField: "forumPosts",        scoreField: "forumPosts",        scoreLabel: "Posts",    scoreUnit: "count"   },
    quizzes:    { sortField: "quizzesPassed",     scoreField: "quizzesPassed",     scoreLabel: "Quizzes",  scoreUnit: "count"   },
    study_time: { sortField: "totalStudyTime",    scoreField: "totalStudyTime",    scoreLabel: "Minutes",  scoreUnit: "time"    },
    streak:     { sortField: "currentStreak",     scoreField: "currentStreak",     scoreLabel: "Day Streak", scoreUnit: "streak" },
    level:      { sortField: "level",             scoreField: "level",             scoreLabel: "Level",    scoreUnit: "level"   },
  };

  const config = categoryConfig[category] || categoryConfig["overall"];

  const userProgresses = await UserProgress.find()
    .populate("user", "firstName lastName avatar studentProgress")
    .sort({ [config.sortField]: -1, xp: -1 }) // secondary sort by xp for tiebreaking
    .limit(parsedLimit);

  const leaderboard = userProgresses
    .filter(p => p.user) // Filter out deleted users
    .map((progress, index) => {
      const scoreValue = progress[config.scoreField] || 0;
      // For streak category, also check user.studentProgress.streak as fallback
      const streak = progress.currentStreak || progress.user?.studentProgress?.streak || 0;

      return {
        rank: index + 1,
        userId: progress.user._id,
        name: `${progress.user.firstName || ''} ${progress.user.lastName || ''}`.trim() || 'Anonymous',
        avatar: progress.user.avatar || null,
        xp: progress.xp || 0,
        level: progress.level || 1,
        streak,
        score: category === "streak" ? streak : scoreValue,
        scoreLabel: config.scoreLabel,
        scoreUnit: config.scoreUnit,
        // Include full stats for richer display
        stats: {
          coursesCompleted: progress.coursesCompleted || 0,
          forumPosts: progress.forumPosts || 0,
          quizzesPassed: progress.quizzesPassed || 0,
          totalStudyTime: progress.totalStudyTime || 0,
          currentStreak: streak,
        },
      };
    });

  res.json({
    success: true,
    category,
    scoreLabel: config.scoreLabel,
    data: leaderboard,
  });
});

// @desc    Get user analytics
// @route   GET /api/gamification/analytics/:userId
// @access  Private
exports.getUserAnalytics = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;

  const userProgress = await UserProgress.findOne({ user: userId });
  const enrollments = await Enrollment.find({ studentId: userId });
  const forumPosts = await ForumPost.find({ author: userId });
  const quizAttempts = await Attempt.find({ userId });

  const analytics = {
    totalXP: userProgress?.xp || 0,
    currentLevel: userProgress?.level || 1,
    totalCourses: enrollments.length,
    completedCourses: enrollments.filter(e => e.status === "completed").length,
    totalForumPosts: forumPosts.length,
    totalQuizAttempts: quizAttempts.length,
    averageQuizScore: quizAttempts.length > 0
      ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length
      : 0,
    studyTime: userProgress?.totalStudyTime || 0,
  };

  res.json({
    success: true,
    data: analytics,
  });
});

