const express = require("express");
const router = express.Router();
const gamificationController = require("../controllers/gamificationController");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/leaderboard", gamificationController.getLeaderboard);

// Protected routes
router.use(protect);

// User progress
router.get("/progress/:userId", gamificationController.getUserProgress);
router.get("/progress", gamificationController.getUserProgress);

// XP management
router.post("/xp/:userId", gamificationController.addXP);
router.post("/xp", gamificationController.addXP);

// Streak management
router.put("/streak/:userId", gamificationController.updateStreak);
router.put("/streak", gamificationController.updateStreak);

// Achievements
router.get("/achievements/:userId", gamificationController.getUserAchievements);
router.get("/achievements", gamificationController.getUserAchievements);

// Quests
router.get("/quests/:userId", gamificationController.getQuests);
router.get("/quests", gamificationController.getQuests);
router.post("/quests/:userId/start", gamificationController.startQuest);
router.post("/quests/start", gamificationController.startQuest);
router.put("/quests/:userId/progress", gamificationController.updateQuestProgress);
router.put("/quests/progress", gamificationController.updateQuestProgress);

// Analytics
router.get("/analytics/:userId", gamificationController.getUserAnalytics);
router.get("/analytics", gamificationController.getUserAnalytics);

module.exports = router;

