const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz ID is required"],
    },
    stem: {
      type: String,
      required: [true, "Question stem is required"],
      trim: true,
      maxlength: [1000, "Question stem cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: ["multiple-choice", "true-false", "fill-blank"],
      default: "multiple-choice",
    },
    options: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Option text cannot exceed 500 characters"],
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        explanation: {
          type: String,
          maxlength: [300, "Explanation cannot exceed 300 characters"],
        },
      },
    ],
    correctIndex: {
      type: Number,
      required: [true, "Correct answer index is required"],
      min: [0, "Correct index cannot be negative"],
    },
    explanation: {
      type: String,
      maxlength: [500, "Explanation cannot exceed 500 characters"],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    points: {
      type: Number,
      default: 1,
      min: [1, "Points must be at least 1"],
      max: [10, "Points cannot exceed 10"],
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    audioUrl: {
      type: String,
      default: null,
    },
    timeLimit: {
      type: Number, // in seconds
      default: null,
      min: [5, "Time limit must be at least 5 seconds"],
    },
    hints: [
      {
        text: {
          type: String,
          required: true,
          maxlength: [200, "Hint text cannot exceed 200 characters"],
        },
        cost: {
          type: Number,
          default: 0, // points deducted for using hint
          min: [0, "Hint cost cannot be negative"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
questionSchema.index({ quizId: 1, isActive: 1 });
questionSchema.index({ quizId: 1, order: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });

// Validation middleware
questionSchema.pre("validate", function (next) {
  // Ensure at least 2 options for multiple choice
  if (this.type === "multiple-choice" && this.options.length < 2) {
    return next(new Error("Multiple choice questions must have at least 2 options"));
  }
  
  // Ensure exactly one correct answer
  const correctOptions = this.options.filter(option => option.isCorrect);
  if (correctOptions.length !== 1) {
    return next(new Error("Question must have exactly one correct answer"));
  }
  
  // Set correctIndex based on correct option
  const correctOptionIndex = this.options.findIndex(option => option.isCorrect);
  if (correctOptionIndex !== -1) {
    this.correctIndex = correctOptionIndex;
  } else {
    return next(new Error("Could not determine correct answer index"));
  }
  
  next();
});

// Method to check if answer is correct
questionSchema.methods.isCorrectAnswer = function (selectedIndex) {
  return selectedIndex === this.correctIndex;
};

// Method to get correct answer text
questionSchema.methods.getCorrectAnswer = function () {
  return this.options[this.correctIndex]?.text || null;
};

// Method to calculate points for answer
questionSchema.methods.calculatePoints = function (selectedIndex, timeUsed = null) {
  if (!this.isCorrectAnswer(selectedIndex)) {
    return 0;
  }
  
  let points = this.points;
  
  // Bonus points for quick answers (if time limit exists)
  if (this.timeLimit && timeUsed) {
    const timeRatio = timeUsed / this.timeLimit;
    if (timeRatio < 0.5) {
      points = Math.round(points * 1.2); // 20% bonus for quick answers
    }
  }
  
  return points;
};

// Method to get question without correct answer (for students)
questionSchema.methods.getStudentVersion = function () {
  const studentQuestion = this.toObject();
  
  // Remove correct answer information
  studentQuestion.options = studentQuestion.options.map(option => ({
    text: option.text,
    explanation: option.explanation,
  }));
  
  delete studentQuestion.correctIndex;
  delete studentQuestion.explanation;
  
  return studentQuestion;
};

// Method to shuffle options
questionSchema.methods.shuffleOptions = function () {
  const shuffledOptions = [...this.options];
  
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  
  // Update correctIndex after shuffling
  const originalCorrectOption = this.options[this.correctIndex];
  const newCorrectIndex = shuffledOptions.findIndex(option => option.text === originalCorrectOption.text);
  
  return {
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
  };
};

module.exports = mongoose.model("Question", questionSchema); 