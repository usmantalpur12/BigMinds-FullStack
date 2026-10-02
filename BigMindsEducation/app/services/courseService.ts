import { backendAPI } from './backendAPI';

export interface CourseFilters {
  category?: string;
  class?: string;
  level?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'popular' | 'rating';
  limit?: number;
}

export const courseService = {
  async getCourses(filters?: CourseFilters) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.class) params.append('class', filters.class);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.limit) params.append('limit', String(filters.limit));

    const res = await backendAPI.get(`/courses${params.toString() ? `?${params.toString()}` : ''}`);
    return res.data.data as any[];
  },

  async getCourse(courseId: string) {
    const res = await backendAPI.get(`/courses/${courseId}`);
    return res.data.data as any;
  },

  async getLessons(courseId: string) {
    const res = await backendAPI.get(`/courses/${courseId}/lessons`);
    return res.data.data as any[];
  },

  async getQuizzes(courseId: string) {
    const res = await backendAPI.get(`/courses/${courseId}/quizzes`);
    return res.data.data as any[];
  },

  async enroll(courseId: string) {
    const res = await backendAPI.post(`/courses/${courseId}/enroll`);
    return res.data.data as any;
  },

  async getProgress(courseId: string) {
    const res = await backendAPI.get(`/courses/${courseId}/progress`);
    return res.data.data as any;
  },

  async updateProgress(courseId: string, body: { studyTime?: number; lessonCompleted?: boolean }) {
    const res = await backendAPI.put(`/courses/${courseId}/progress`, body);
    return res.data.data as any;
  },

  async completeLesson(courseId: string, lessonId: string) {
    const res = await backendAPI.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
    return res.data.data as any;
  },

  async createCourse(payload: {
    title: string;
    description: string;
    category: string;
    class: string;
    level: string;
    price: number;
    estimatedDuration?: number;
    isPublished?: boolean;
    tags?: string[];
    thumbnail?: string;
    instructorName?: string;
  }) {
    const res = await backendAPI.post(`/courses`, payload);
    return res.data.data as any;
  },

  async getMyCourses() {
    const res = await backendAPI.get(`/courses/mine`);
    return res.data.data as any[];
  },

  async updateCourse(courseId: string, payload: Partial<{
    title: string;
    description: string;
    category: string;
    class: string;
    level: string;
    price: number;
    estimatedDuration: number;
    isPublished: boolean;
    tags: string[];
    thumbnail: string;
  }>) {
    const res = await backendAPI.put(`/courses/${courseId}`, payload);
    return res.data.data as any;
  },

  async deleteCourse(courseId: string) {
    const res = await backendAPI.delete(`/courses/${courseId}`);
    return res.data.data as any;
  },

  async getCourseAnalytics(courseId: string) {
    const res = await backendAPI.get(`/courses/${courseId}/analytics`);
    return res.data.data as any;
  },

  async getCourseReviews(courseId: string, limit = 20, skip = 0) {
    const res = await backendAPI.get(`/courses/${courseId}/reviews?limit=${limit}&skip=${skip}`);
    return res.data.data as { reviews: any[]; total: number; courseRating: number; totalRatings: number };
  },

  async getMyReview(courseId: string) {
    const res = await backendAPI.get(`/courses/${courseId}/reviews/me`);
    return res.data.data as any;
  },

  async submitReview(courseId: string, rating: number, comment?: string) {
    const res = await backendAPI.put(`/courses/${courseId}/reviews`, { rating, comment });
    return res.data.data as any;
  },
}; 