import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { quizService } from "../services/quizService";

interface Question {
  _id: string;
  stem: string;
  type: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  explanation: string;
  points: number;
}

interface Quiz {
  _id: string;
  title: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
}

interface QuizAttempt {
  _id: string;
  quizId: string;
  userId: string;
  status: "in-progress" | "completed" | "abandoned";
  startedAt: string;
  submittedAt?: string;
  score?: number;
  percentage?: number;
  correctAnswers?: number;
  isPassed?: boolean;
}

const QuizScreen = () => {
  const { quizId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: number;
  }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState<{ [key: string]: boolean }>(
    {},
  );

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQuizData();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId]);

  useEffect(() => {
    if (timeRemaining > 0 && !showResults) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, showResults]);

  const fetchQuizData = async () => {
    try {
      const quizIdString = String(quizId);
      const attempt = await quizService.startAttempt(quizIdString);
      setAttemptId(attempt._id);

      const quizDetails = await quizService.getQuiz(quizIdString);
      setQuiz(quizDetails);

      const questionsData = await quizService.getQuizQuestions(quizIdString);
      setQuestions(questionsData);

      setTimeRemaining(attempt.duration || quizDetails.duration * 60);
    } catch (error: any) {
      console.error("Error starting quiz:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to start quiz",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    Alert.alert(
      "Time Up!",
      "Quiz time has expired. Submitting your answers...",
    );
    submitQuiz();
  };

  const selectAnswer = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const submitQuiz = async () => {
    if (Object.keys(selectedAnswers).length === 0) {
      Alert.alert(
        "No Answers",
        "Please answer at least one question before submitting.",
      );
      return;
    }

    if (!quizId) {
      Alert.alert("Error", "Quiz identifier is missing.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = Object.entries(selectedAnswers).map(
        ([questionId, selectedIndex]) => ({
          questionId,
          selectedIndex,
        }),
      );

      await quizService.submitAttempt(String(quizId), payload);
      const result = await quizService.getAttemptResult(
        attemptId || String(quizId),
      );

      setQuizResults(result);
      setShowResults(true);

      const score = result.percentage || 0;
      if (score >= 80) {
        // await addXp(100, 'Excellent Quiz Performance');
      } else if (score >= 60) {
        // await addXp(50, 'Good Quiz Performance');
      } else {
        // await addXp(25, 'Quiz Completion');
      }
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit quiz",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSolution = (questionId: string) => {
    setShowSolution((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getQuestionStatus = (index: number) => {
    const question = questions[index];
    if (selectedAnswers[question._id] !== undefined) {
      return "answered";
    }
    return "unanswered";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  if (showResults && quizResults) {
    return (
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Quiz Results</Text>
          <Text style={styles.resultsSubtitle}>{quiz?.title || "Quiz"}</Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreText}>{quizResults.percentage}%</Text>
          <Text style={styles.scoreLabel}>
            {quizResults.isPassed ? "Passed!" : "Not Passed"}
          </Text>
          <Text style={styles.scoreDetails}>
            {quizResults.correctAnswers} out of {questions.length} correct
          </Text>
        </View>

        <ScrollView style={styles.resultsList}>
          {questions.map((question, index) => (
            <View key={question._id} style={styles.resultItem}>
              <View style={styles.resultQuestionHeader}>
                <Text style={styles.resultQuestionNumber}>Q{index + 1}</Text>
                <Text style={styles.resultQuestionText}>{question.stem}</Text>
              </View>

              <View style={styles.resultOptions}>
                {question.options.map((option, optionIndex) => (
                  <View
                    key={optionIndex}
                    style={[
                      styles.resultOption,
                      optionIndex === selectedAnswers[question._id] &&
                        styles.selectedOption,
                      option.isCorrect && styles.correctOption,
                      optionIndex === selectedAnswers[question._id] &&
                        !option.isCorrect &&
                        styles.incorrectOption,
                    ]}
                  >
                    <Text style={styles.resultOptionText}>{option.text}</Text>
                    {option.isCorrect && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#10B981"
                      />
                    )}
                    {optionIndex === selectedAnswers[question._id] &&
                      !option.isCorrect && (
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#EF4444"
                        />
                      )}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.solutionButton}
                onPress={() => toggleSolution(question._id)}
              >
                <Text style={styles.solutionButtonText}>
                  {showSolution[question._id]
                    ? "Hide Solution"
                    : "See Solution"}
                </Text>
              </TouchableOpacity>

              {showSolution[question._id] && (
                <View style={styles.solutionContainer}>
                  <Text style={styles.solutionTitle}>Explanation:</Text>
                  <Text style={styles.solutionText}>
                    {question.explanation}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.resultsActions}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retakeButtonText}>Back to Course</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>No Questions</Text>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 18,
              color: "#4B5563",
              textAlign: "center",
            }}
          >
            This quiz currently has no questions available.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quiz?.title}</Text>
        <View style={styles.timerContainer}>
          <Ionicons name="time" size={20} color="white" />
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      {/* Question Navigation */}
      <ScrollView
        horizontal
        style={styles.questionNavigation}
        showsHorizontalScrollIndicator={false}
      >
        {questions.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.questionDot,
              index === currentQuestionIndex && styles.currentQuestionDot,
              getQuestionStatus(index) === "answered" &&
                styles.answeredQuestionDot,
            ]}
            onPress={() => goToQuestion(index)}
          >
            <Text style={styles.questionDotText}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Question Content */}
      <ScrollView style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.stem}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswers[currentQuestion._id] === index &&
                  styles.selectedOptionButton,
              ]}
              onPress={() => selectAnswer(currentQuestion._id, index)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionRadio}>
                  {selectedAnswers[currentQuestion._id] === index && (
                    <View style={styles.optionRadioSelected} />
                  )}
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === 0 && styles.disabledNavButton,
          ]}
          onPress={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentQuestionIndex === 0 ? "#9CA3AF" : "#4F46E5"}
          />
          <Text
            style={[
              styles.navButtonText,
              currentQuestionIndex === 0 && styles.disabledNavButtonText,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex === questions.length - 1 ? (
          <TouchableOpacity
            style={[
              styles.submitButton,
              Object.keys(selectedAnswers).length === 0 &&
                styles.disabledSubmitButton,
            ]}
            onPress={submitQuiz}
            disabled={Object.keys(selectedAnswers).length === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Quiz</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.navButton} onPress={nextQuestion}>
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#4F46E5",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginLeft: 16,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  progressContainer: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  questionNavigation: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  questionDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  currentQuestionDot: {
    backgroundColor: "#4F46E5",
  },
  answeredQuestionDot: {
    backgroundColor: "#10B981",
  },
  questionDotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    marginBottom: 24,
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    color: "#1F2937",
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  selectedOptionButton: {
    borderColor: "#4F46E5",
    backgroundColor: "#F0F4FF",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4F46E5",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    lineHeight: 22,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
    marginHorizontal: 8,
  },
  disabledNavButton: {
    backgroundColor: "#F3F4F6",
  },
  disabledNavButtonText: {
    color: "#9CA3AF",
  },
  submitButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  disabledSubmitButton: {
    backgroundColor: "#9CA3AF",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  resultsHeader: {
    backgroundColor: "#4F46E5",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },
  scoreCard: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  scoreDetails: {
    fontSize: 16,
    color: "#6B7280",
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultQuestionHeader: {
    marginBottom: 16,
  },
  resultQuestionNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 8,
  },
  resultQuestionText: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 22,
  },
  resultOptions: {
    marginBottom: 16,
  },
  resultOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: "#F0F4FF",
    borderWidth: 1,
    borderColor: "#4F46E5",
  },
  correctOption: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  incorrectOption: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  resultOptionText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  solutionButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  solutionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  solutionContainer: {
    backgroundColor: "#F0F4FF",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
    marginBottom: 8,
  },
  solutionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  resultsActions: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  retakeButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  retakeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default QuizScreen;
