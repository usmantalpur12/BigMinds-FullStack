const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const AttemptItem = require("../models/AttemptItem");
const Enrollment = require("../models/Enrollment");
const { catchAsync } = require("../middleware/errorHandler");

// Get quiz
exports.getQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate("courseId", "title");
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found"
    });
  }
  
  if (!quiz.isActive) {
    return res.status(400).json({
      success: false,
      message: "Quiz is not active"
    });
  }
  
  res.status(200).json({
    success: true,
    data: quiz
  });
});

// Get quiz questions (for students taking the quiz)
exports.getQuizQuestions = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found"
    });
  }
  
  if (!quiz.isActive && req.user.role === 'student') {
    return res.status(400).json({
      success: false,
      message: "Quiz is not active"
    });
  }
  
  const questions = await Question.find({ quizId: req.params.id });
  
  res.status(200).json({
    success: true,
    data: questions,
    count: questions.length
  });
});

// Start quiz attempt
exports.startQuizAttempt = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found"
    });
  }
  
  if (!quiz.isActive) {
    return res.status(400).json({
      success: false,
      message: "Quiz is not active"
    });
  }
  
  // Check if user is enrolled in the course (only for course-linked quizzes)
  if (quiz.courseId) {
    const enrollment = await Enrollment.findOne({
      courseId: quiz.courseId,
      studentId: req.user.id
    });
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "Must be enrolled in the course to take this quiz"
      });
    }
  }
  // Random quizzes (courseId is null) can be taken by any authenticated user
  
  // Check attempt limits
  const existingAttempts = await Attempt.find({
    quizId: quiz._id,
    userId: req.user.id
  });
  
  if (existingAttempts.length >= quiz.maxAttempts) {
    return res.status(400).json({
      success: false,
      message: "Maximum attempts reached for this quiz"
    });
  }
  
  // Create new attempt
  const attempt = await Attempt.create({
    quizId: quiz._id,
    userId: req.user.id,
    courseId: quiz.courseId,
    status: "in-progress",
    startedAt: new Date(),
    attemptNumber: existingAttempts.length + 1
  });
  
  res.status(201).json({
    success: true,
    data: attempt,
    message: "Quiz attempt started successfully"
  });
});

// Submit quiz attempt
exports.submitQuizAttempt = catchAsync(async (req, res) => {
  const { answers } = req.body;
  
  const attempt = await Attempt.findOne({
    quizId: req.params.id,
    userId: req.user.id,
    status: "in-progress"
  }).sort({ startedAt: -1 }); // Get the latest in-progress attempt
  
  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: "No in-progress quiz attempt found for this quiz"
    });
  }
  
  if (attempt.status !== "in-progress") {
    return res.status(400).json({
      success: false,
      message: "Attempt is not in progress"
    });
  }
  
  // Get quiz details
  const quiz = await Quiz.findById(attempt.quizId);
  const questions = await Question.find({ quizId: attempt.quizId });
  
  let correctAnswers = 0;
  let totalPoints = 0;
  const attemptItems = [];
  
  // Process answers and calculate score
  for (const answer of answers) {
    const question = questions.find(q => q._id.toString() === answer.questionId);
    
    if (question) {
      const isCorrect = question.isCorrectAnswer(answer.selectedIndex);
      const points = isCorrect ? question.points : 0;
      
      if (isCorrect) {
        correctAnswers++;
      }
      totalPoints += points;
      
      // Create attempt item
      const attemptItem = await AttemptItem.create({
        attemptId: attempt._id,
        questionId: question._id,
        selectedIndex: answer.selectedIndex,
        isCorrect,
        points,
        timeSpent: answer.timeSpent || 0
      });
      
      attemptItems.push(attemptItem);
    }
  }
  
  // Calculate final score
  const totalPossiblePoints = questions.reduce((sum, q) => sum + q.points, 0);
  const percentage = totalPossiblePoints > 0 ? Math.round((totalPoints / totalPossiblePoints) * 100) : 0;
  const isPassed = percentage >= quiz.passingScore;
  
  // Update attempt
  attempt.status = "completed";
  attempt.submittedAt = new Date();
  attempt.score = totalPoints;
  attempt.percentage = percentage;
  attempt.correctAnswers = correctAnswers;
  attempt.isPassed = isPassed;
  await attempt.save();
  
  // Update enrollment progress if passed
  if (isPassed) {
    await Enrollment.findOneAndUpdate(
      { courseId: attempt.courseId, studentId: req.user.id },
      { $inc: { quizzesTaken: 1 } }
    );
  }
  
  res.status(200).json({
    success: true,
    data: {
      attempt,
      attemptItems,
      totalQuestions: questions.length,
      correctAnswers,
      score: totalPoints,
      percentage,
      isPassed
    },
    message: "Quiz submitted successfully"
  });
});

// Get quiz attempt
exports.getQuizAttempt = catchAsync(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id)
    .populate("quizId", "title duration totalQuestions")
    .populate("courseId", "title");
  
  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: "Quiz attempt not found"
    });
  }
  
  if (attempt.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view this attempt"
    });
  }
  
  res.status(200).json({
    success: true,
    data: attempt
  });
});

// Get quiz result
exports.getQuizResult = catchAsync(async (req, res) => {
  const attempt = await Attempt.findById(req.params.id)
    .populate("quizId", "title passingScore")
    .populate("courseId", "title");
  
  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: "Quiz attempt not found"
    });
  }
  
  if (attempt.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view this result"
    });
  }
  
  if (attempt.status !== "completed") {
    return res.status(400).json({
      success: false,
      message: "Attempt is not completed"
    });
  }
  
  const attemptItems = await AttemptItem.find({ attemptId: attempt._id })
    .populate("questionId", "stem options explanation");
  
  res.status(200).json({
    success: true,
    data: {
      attempt,
      attemptItems,
      totalQuestions: attemptItems.length,
      correctAnswers: attempt.correctAnswers,
      score: attempt.score,
      percentage: attempt.percentage,
      isPassed: attempt.isPassed,
      passingScore: attempt.quizId.passingScore
    }
  });
});

// Create quiz (Teacher/Admin only)
exports.createQuiz = catchAsync(async (req, res) => {
  req.body.createdBy = req.user.id;
  
  const quiz = await Quiz.create(req.body);
  
  res.status(201).json({
    success: true,
    data: quiz,
    message: "Quiz created successfully"
  });
});

// Update quiz (Teacher/Admin only)
exports.updateQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found"
    });
  }
  
  // Check if user is creator or admin
  if (quiz.createdBy && quiz.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this quiz"
    });
  }
  
  const updatedQuiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: updatedQuiz,
    message: "Quiz updated successfully"
  });
});

// Delete quiz (Teacher/Admin only)
exports.deleteQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found"
    });
  }
  
  // Check if user is creator or admin
  if (quiz.createdBy && quiz.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this quiz"
    });
  }
  
  await quiz.deleteOne();
  
  res.status(200).json({
    success: true,
    message: "Quiz deleted successfully"
  });
});

// Add question to quiz (Teacher/Admin only)
exports.addQuestion = catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found"
    });
  }
  
  // Check if user is creator or admin
  if (quiz.createdBy && quiz.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to add questions to this quiz"
    });
  }
  
  req.body.quizId = req.params.id;
  const question = await Question.create(req.body);
  
  // Update quiz question count
  await Quiz.findByIdAndUpdate(req.params.id, {
    $inc: { totalQuestions: 1 }
  });
  
  res.status(201).json({
    success: true,
    data: question,
    message: "Question added successfully"
  });
});

// Update question (Teacher/Admin only)
exports.updateQuestion = catchAsync(async (req, res) => {
  const question = await Question.findById(req.params.questionId);
  
  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found"
    });
  }
  
  // Check if user is quiz creator or admin
  const quiz = await Quiz.findById(question.quizId);
  if (quiz.createdBy && quiz.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this question"
    });
  }
  
  const updatedQuestion = await Question.findByIdAndUpdate(
    req.params.questionId,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: updatedQuestion,
    message: "Question updated successfully"
  });
});

// Delete question (Teacher/Admin only)
exports.deleteQuestion = catchAsync(async (req, res) => {
  const question = await Question.findById(req.params.questionId);
  
  if (!question) {
    return res.status(404).json({
      success: false,
      message: "Question not found"
    });
  }
  
  // Check if user is quiz creator or admin
  const quiz = await Quiz.findById(question.quizId);
  if (quiz.createdBy && quiz.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this question"
    });
  }
  
  await question.deleteOne();
  
  // Update quiz question count
  await Quiz.findByIdAndUpdate(question.quizId, {
    $inc: { totalQuestions: -1 }
  });
  
  res.status(200).json({
    success: true,
    message: "Question deleted successfully"
  });
});

// Get all quizzes (Admin only)
exports.getAllQuizzes = catchAsync(async (req, res) => {
  const quizzes = await Quiz.find()
    .populate("courseId", "title")
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    data: quizzes,
    count: quizzes.length
  });
});

// Activate quiz (Admin only)
exports.activateQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  );
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: quiz,
    message: "Quiz activated successfully"
  });
});

// Deactivate quiz (Admin only)
exports.deactivateQuiz = catchAsync(async (req, res) => {
  const quiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: "Quiz not found"
    });
  }
  
  res.status(200).json({
    success: true,
    data: quiz,
    message: "Quiz deactivated successfully"
  });
}); 