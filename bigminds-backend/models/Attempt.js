const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "abandoned", "timeout"],
      default: "in-progress",
    },
    startedAt: {
      type: Date,
      required: [true, "Start time is required"],
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be negative"],
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
      min: [0, "Percentage cannot be negative"],
      max: [100, "Percentage cannot exceed 100"],
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    attemptNumber: {
      type: Number,
      required: [true, "Attempt number is required"],
      min: [1, "Attempt number must be at least 1"],
    },
    questionsAnswered: {
      type: Number,
      default: 0,
    },
    questionsSkipped: {
      type: Number,
      default: 0,
    },
    hintsUsed: {
      type: Number,
      default: 0,
    },
    hintsCost: {
      type: Number,
      default: 0,
    },
    reviewNotes: {
      type: String,
      maxlength: [1000, "Review notes cannot exceed 1000 characters"],
    },
    feedback: {
      type: String,
      maxlength: [500, "Feedback cannot exceed 500 characters"],
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
attemptSchema.index({ quizId: 1, userId: 1 });
attemptSchema.index({ userId: 1, courseId: 1 });
attemptSchema.index({ status: 1 });
attemptSchema.index({ startedAt: -1 });
attemptSchema.index({ score: -1 });

// Virtual for duration
attemptSchema.virtual("duration").get(function () {
  if (!this.submittedAt) return null;
  return Math.round((this.submittedAt - this.startedAt) / 1000);
});

// Virtual for time remaining
attemptSchema.virtual("timeRemaining").get(function () {
  if (this.status !== "in-progress") return 0;
  
  const Quiz = mongoose.model("Quiz");
  // This would need to be populated or fetched separately
  return null;
});

// Method to submit attempt
attemptSchema.methods.submit = async function (answers, timeSpent) {
  const Quiz = mongoose.model("Quiz");
  const Question = mongoose.model("Question");
  const AttemptItem = mongoose.model("AttemptItem");
  
  try {
    // Get quiz details
    const quiz = await Quiz.findById(this.quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    
    // Get questions
    const questions = await Question.find({ quizId: this.quizId, isActive: true })
      .sort({ order: 1 });
    
    this.totalQuestions = questions.length;
    this.timeSpent = timeSpent;
    this.submittedAt = new Date();
    
    // Calculate score
    let totalScore = 0;
    let correctCount = 0;
    let answeredCount = 0;
    
    for (const question of questions) {
      const userAnswer = answers.find(a => a.questionId.toString() === question._id.toString());
      
      if (userAnswer) {
        answeredCount++;
        
        // Check if answer is correct
        if (question.isCorrectAnswer(userAnswer.selectedIndex)) {
          correctCount++;
          totalScore += question.points;
        }
        
        // Create attempt item
        await AttemptItem.create({
          attemptId: this._id,
          questionId: question._id,
          selectedIndex: userAnswer.selectedIndex,
          isCorrect: question.isCorrectAnswer(userAnswer.selectedIndex),
          timeSpent: userAnswer.timeSpent || 0,
          points: question.isCorrectAnswer(userAnswer.selectedIndex) ? question.points : 0,
        });
      }
    }
    
    // Update attempt statistics
    this.score = totalScore;
    this.totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    this.percentage = this.totalPoints > 0 ? Math.round((this.score / this.totalPoints) * 100) : 0;
    this.correctAnswers = correctCount;
    this.questionsAnswered = answeredCount;
    this.questionsSkipped = this.totalQuestions - answeredCount;
    this.isPassed = this.percentage >= quiz.passingScore;
    this.status = "completed";
    
    // Save attempt
    await this.save();
    
    // Update enrollment progress if passed
    if (this.isPassed) {
      const Enrollment = mongoose.model("Enrollment");
      await Enrollment.findOneAndUpdate(
        { courseId: this.courseId, studentId: this.userId },
        { $inc: { quizzesTaken: 1 } }
      );
    }
    
    return this;
  } catch (error) {
    console.error("Error submitting attempt:", error);
    throw error;
  }
};

// Method to abandon attempt
attemptSchema.methods.abandon = function () {
  this.status = "abandoned";
  this.submittedAt = new Date();
  this.timeSpent = Math.round((this.submittedAt - this.startedAt) / 1000);
  return this.save();
};

// Method to timeout attempt
attemptSchema.methods.timeout = function () {
  this.status = "timeout";
  this.submittedAt = new Date();
  this.timeSpent = Math.round((this.submittedAt - this.startedAt) / 1000);
  return this.save();
};

// Static method to get user's best attempt for a quiz
attemptSchema.statics.getBestAttempt = async function (quizId, userId) {
  return this.findOne({ quizId, userId, status: "completed" })
    .sort({ score: -1, timeSpent: 1 })
    .populate("quizId", "title passingScore");
};

// Static method to get user's attempt history for a quiz
attemptSchema.statics.getAttemptHistory = async function (quizId, userId) {
  return this.find({ quizId, userId })
    .sort({ startedAt: -1 })
    .populate("quizId", "title passingScore");
};

module.exports = mongoose.model("Attempt", attemptSchema); 