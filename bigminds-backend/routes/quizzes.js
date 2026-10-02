const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/:id", quizController.getQuiz);

// Protected routes
router.use(protect);

// Student routes
router.get("/:id/questions", authorize("student", "teacher", "admin"), quizController.getQuizQuestions);
router.post("/:id/attempts/start", authorize("student"), quizController.startQuizAttempt);
router.post("/:id/attempts/submit", authorize("student"), quizController.submitQuizAttempt);
router.get("/attempts/:id", authorize("student"), quizController.getQuizAttempt);
router.get("/attempts/:id/result", authorize("student"), quizController.getQuizResult);

// Teacher routes
router.post("/", authorize("teacher", "admin"), quizController.createQuiz);
router.put("/:id", authorize("teacher", "admin"), quizController.updateQuiz);
router.delete("/:id", authorize("teacher", "admin"), quizController.deleteQuiz);
router.post("/:id/questions", authorize("teacher", "admin"), quizController.addQuestion);
router.put("/:id/questions/:questionId", authorize("teacher", "admin"), quizController.updateQuestion);
router.delete("/:id/questions/:questionId", authorize("teacher", "admin"), quizController.deleteQuestion);

// Admin routes
router.get("/admin/all", authorize("admin"), quizController.getAllQuizzes);
router.put("/:id/activate", authorize("admin"), quizController.activateQuiz);
router.put("/:id/deactivate", authorize("admin"), quizController.deactivateQuiz);

module.exports = router; 