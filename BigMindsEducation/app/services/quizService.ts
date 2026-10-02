import { backendAPI } from "./backendAPI";

export interface CreateQuizPayload {
  courseId: string;
  title: string;
  description?: string;
  duration: number; // seconds
  totalQuestions: number;
  passingScore?: number;
  maxAttempts?: number;
  isActive?: boolean;
}

export interface CreateQuestionPayload {
  stem: string;
  options: { text: string; isCorrect: boolean }[];
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface QuizAttemptAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface QuizAttempt {
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
  duration?: number;
}

export const quizService = {
  async startAttempt(quizId: string) {
    const res = await backendAPI.post(`/quizzes/${quizId}/attempts/start`);
    return res.data.data as QuizAttempt;
  },
  async submitAttempt(quizId: string, answers: QuizAttemptAnswer[]) {
    const res = await backendAPI.post(`/quizzes/${quizId}/attempts/submit`, {
      answers,
    });
    return res.data.data as any;
  },
  async getAttempt(attemptId: string) {
    const res = await backendAPI.get(`/quizzes/attempts/${attemptId}`);
    return res.data.data as any;
  },
  async getAttemptResult(attemptId: string) {
    const res = await backendAPI.get(`/quizzes/attempts/${attemptId}/result`);
    return res.data.data as any;
  },
  async createQuiz(payload: CreateQuizPayload) {
    const res = await backendAPI.post("/quizzes", payload);
    return res.data.data as any;
  },
  async updateQuiz(id: string, payload: Partial<CreateQuizPayload>) {
    const res = await backendAPI.put(`/quizzes/${id}`, payload);
    return res.data.data as any;
  },
  async getQuiz(id: string) {
    const res = await backendAPI.get(`/quizzes/${id}`);
    return res.data.data as any;
  },
  async getQuizQuestions(id: string) {
    const res = await backendAPI.get(`/quizzes/${id}/questions`);
    return res.data.data as any;
  },
  async addQuestion(quizId: string, payload: CreateQuestionPayload) {
    const res = await backendAPI.post(`/quizzes/${quizId}/questions`, payload);
    return res.data.data as any;
  },
  async deleteQuiz(quizId: string) {
    const res = await backendAPI.delete(`/quizzes/${quizId}`);
    return res.data;
  },
};
