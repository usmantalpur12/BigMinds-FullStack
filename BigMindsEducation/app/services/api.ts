// api.ts — BigMinds Education
// ✅ Fixed: Correct IP for physical device testing
// ✅ Fixed: AsyncStorage token persistence
// ✅ Fixed: Removed wrong /v1 prefix

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// 🔧 APNA IP YAHAN DAALEN (CMD → ipconfig → IPv4)
//    Har baar WiFi change ho toh yeh update karna
// ─────────────────────────────────────────────
const LOCAL_IP = '192.168.18.197';
const DEV_PORT = '5000';

// ✅ FIXED: Development mein local, production mein Vercel URL
const API_BASE_URL = __DEV__
  ? `http://${LOCAL_IP}:${DEV_PORT}/api`
  : 'https://bigminds-api.vercel.app/api'; // ✅ Correct Vercel URL

const TOKEN_KEY = 'bigminds_auth_token';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  level: number;
  experience: number;
  points: number;
  streak: number;
  isVerified: boolean;
  createdAt: string;
  lastActive: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    id: string;
    name: string;
    avatar: string;
  };
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  rating: number;
  students: number;
  lessons: number;
  image: string;
  isEnrolled: boolean;
  progress: number;
}

export interface Forum {
  id: string;
  name: string;
  description: string;
  category: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  members: number;
  posts: number;
  isPublic: boolean;
  isJoined: boolean;
  isAdmin: boolean;
  lastActivity: string;
  createdAt: string;
}

export interface Message {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  timestamp: string;
  isCurrentUser: boolean;
}

// ─────────────────────────────────────────────
// API Service Class
// ─────────────────────────────────────────────

class ApiService {
  private token: string | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    // Constructor mein token load karte hain
    this.loadToken();
  }

  // ── Token Management ──────────────────────

  async loadToken(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (stored) {
        this.token = stored;
      }
    } catch (e) {
      console.warn('[API] Token load failed:', e);
    }
  }

  async saveToken(token: string): Promise<void> {
    try {
      this.token = token;
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('[API] Token save failed:', e);
    }
  }

  async clearToken(): Promise<void> {
    try {
      this.token = null;
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('[API] Token clear failed:', e);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // ── Headers ───────────────────────────────

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // ── Core Request Method ───────────────────

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Token memory mein nahi toh AsyncStorage se dobara try karo
    if (!this.token) {
      await this.loadToken();
    }

    const url = `${this.baseUrl}${endpoint}`;

    // Debug ke liye — production mein hata sakte ho
    if (__DEV__) {
      console.log(`[API] ${options.method || 'GET'} ${url}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {}),
        },
      });

      // Response body parse karo
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // JSON nahi aaya — text as error
        const text = await response.text();
        return {
          success: false,
          error: `Server error: ${text.substring(0, 100)}`,
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || data?.error || `Error ${response.status}`,
        };
      }

      return {
        success: true,
        data,
        message: data?.message,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('[API] Request failed:', error);
      }

      // Network error — IP ya backend check karo
      if (error.message?.includes('Network request failed')) {
        return {
          success: false,
          error: `Server se connect nahi ho saka. Check karein:\n1. Backend chal raha hai?\n2. IP sahi hai: ${LOCAL_IP}\n3. Phone aur PC ek WiFi pe hain?`,
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  // ─────────────────────────────────────────────
  // Auth Endpoints
  // ─────────────────────────────────────────────

  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.makeRequest<{ user: User; token: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    // Login successful → token save karo
    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher';
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.makeRequest<{ user: User; token: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );

    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.makeRequest<void>('/auth/logout', { method: 'POST' });
    } catch (_) {
      // Logout locally even if server fails
    } finally {
      await this.clearToken();
    }
    return { success: true };
  }

  // ─────────────────────────────────────────────
  // User / Profile
  // ─────────────────────────────────────────────

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest('/auth/me');
    // Note: aapke backend mein /user/profile ya /auth/me check karo
    // jo bhi route hai woh yahan daalen
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.makeRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserStats(): Promise<ApiResponse<{
    level: number;
    experience: number;
    points: number;
    streak: number;
    achievements: number;
    coursesEnrolled: number;
    coursesCompleted: number;
    forumPosts: number;
  }>> {
    return this.makeRequest('/gamification/stats');
  }

  // ─────────────────────────────────────────────
  // Courses
  // ─────────────────────────────────────────────

  async getCourses(filters?: {
    category?: string;
    level?: string;
    search?: string;
  }): Promise<ApiResponse<Course[]>> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString();
    return this.makeRequest(`/courses${query ? `?${query}` : ''}`);
  }

  async getCourse(courseId: string): Promise<ApiResponse<Course>> {
    return this.makeRequest(`/courses/${courseId}`);
  }

  async enrollCourse(courseId: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  }

  async updateCourseProgress(
    courseId: string,
    lessonId: string,
    progress: number
  ): Promise<ApiResponse<void>> {
    return this.makeRequest(`/courses/${courseId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ lessonId, progress }),
    });
  }

  async getEnrolledCourses(): Promise<ApiResponse<Course[]>> {
    return this.makeRequest('/courses/enrolled');
  }

  // Teacher course management
  async createCourse(courseData: FormData): Promise<ApiResponse<Course>> {
    // FormData ke liye Content-Type set mat karo — browser khud set karta hai
    if (!this.token) await this.loadToken();
    try {
      const response = await fetch(`${this.baseUrl}/courses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          // Content-Type intentionally omitted for FormData
        },
        body: courseData,
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.message || 'Course create failed' };
      }
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateCourse(
    courseId: string,
    courseData: FormData | object
  ): Promise<ApiResponse<Course>> {
    if (courseData instanceof FormData) {
      if (!this.token) await this.loadToken();
      try {
        const response = await fetch(`${this.baseUrl}/courses/${courseId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${this.token}` },
          body: courseData,
        });
        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data?.message || 'Update failed' };
        }
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
    return this.makeRequest(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(courseId: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/courses/${courseId}`, { method: 'DELETE' });
  }

  async getTeacherCourses(): Promise<ApiResponse<Course[]>> {
    return this.makeRequest('/courses/teacher/my-courses');
  }

  // ─────────────────────────────────────────────
  // Forums
  // ─────────────────────────────────────────────

  async getForums(filters?: {
    category?: string;
    joined?: boolean;
    search?: string;
  }): Promise<ApiResponse<Forum[]>> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.joined !== undefined)
      params.append('joined', filters.joined.toString());
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString();
    return this.makeRequest(`/forums${query ? `?${query}` : ''}`);
  }

  async getForum(forumId: string): Promise<ApiResponse<Forum>> {
    return this.makeRequest(`/forums/${forumId}`);
  }

  async createForum(forumData: {
    name: string;
    description: string;
    category: string;
    isPublic: boolean;
  }): Promise<ApiResponse<Forum>> {
    return this.makeRequest('/forums', {
      method: 'POST',
      body: JSON.stringify(forumData),
    });
  }

  async updateForum(
    forumId: string,
    forumData: Partial<{ name: string; description: string; category: string; isPublic: boolean }>
  ): Promise<ApiResponse<Forum>> {
    return this.makeRequest(`/forums/${forumId}`, {
      method: 'PUT',
      body: JSON.stringify(forumData),
    });
  }

  async deleteForum(forumId: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/forums/${forumId}`, { method: 'DELETE' });
  }

  async joinForum(forumId: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/forums/${forumId}/join`, { method: 'POST' });
  }

  async leaveForum(forumId: string): Promise<ApiResponse<void>> {
    return this.makeRequest(`/forums/${forumId}/leave`, { method: 'POST' });
  }

  async getForumMembers(forumId: string): Promise<ApiResponse<User[]>> {
    return this.makeRequest(`/forums/${forumId}/members`);
  }

  // ─────────────────────────────────────────────
  // Forum Messages / Chat
  // ─────────────────────────────────────────────

  async getMessages(
    forumId: string,
    limit = 50,
    offset = 0
  ): Promise<ApiResponse<Message[]>> {
    return this.makeRequest(
      `/forums/${forumId}/messages?limit=${limit}&offset=${offset}`
    );
  }

  async sendMessage(
    forumId: string,
    text: string
  ): Promise<ApiResponse<Message>> {
    return this.makeRequest(`/forums/${forumId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // ─────────────────────────────────────────────
  // Leaderboard & Gamification
  // ─────────────────────────────────────────────

  async getLeaderboard(filters?: {
    timeRange?: 'week' | 'month' | 'all';
  }): Promise<ApiResponse<{
    users: Array<{
      id: string;
      name: string;
      avatar: string;
      points: number;
      level: number;
      streak: number;
      rank: number;
    }>;
    currentUser: {
      rank: number;
      points: number;
      level: number;
      streak: number;
    };
  }>> {
    const params = new URLSearchParams();
    if (filters?.timeRange) params.append('timeRange', filters.timeRange);
    const query = params.toString();
    return this.makeRequest(`/gamification/leaderboard${query ? `?${query}` : ''}`);
  }

  async getAchievements(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    unlocked: boolean;
    unlockedAt?: string;
  }>>> {
    return this.makeRequest('/gamification/achievements');
  }

  // ─────────────────────────────────────────────
  // Quiz
  // ─────────────────────────────────────────────

  async getQuiz(quizId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/quizzes/${quizId}`);
  }

  async submitQuiz(
    quizId: string,
    answers: Record<string, string>
  ): Promise<ApiResponse<{ score: number; passed: boolean; feedback: any }>> {
    return this.makeRequest(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }
}

// ─────────────────────────────────────────────
// Singleton export
// ─────────────────────────────────────────────
export const apiService = new ApiService();