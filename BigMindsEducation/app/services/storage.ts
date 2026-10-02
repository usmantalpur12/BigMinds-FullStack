// Data Persistence Service for BigMinds Education App
// Handles local storage using AsyncStorage for offline functionality

import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
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

interface Course {
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

interface Forum {
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

interface Message {
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

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  emailUpdates: boolean;
  autoSync: boolean;
  language: string;
}

interface OfflineData {
  lastSync: string;
  courses: Course[];
  forums: Forum[];
  messages: { [forumId: string]: Message[] };
  userProgress: { [courseId: string]: number };
}

class StorageService {
  private static instance: StorageService;

  // Storage keys
  private readonly KEYS = {
    // Authentication
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    
    // App Data
    COURSES: 'courses',
    FORUMS: 'forums',
    MESSAGES: 'messages',
    USER_PROGRESS: 'user_progress',
    
    // Settings
    APP_SETTINGS: 'app_settings',
    THEME: 'theme',
    LANGUAGE: 'language',
    
    // Offline Data
    OFFLINE_DATA: 'offline_data',
    LAST_SYNC: 'last_sync',
    
    // Cache
    CACHE_COURSES: 'cache_courses',
    CACHE_FORUMS: 'cache_forums',
    CACHE_LEADERBOARD: 'cache_leaderboard',
    
    // Temporary Data
    DRAFT_MESSAGES: 'draft_messages',
    UNSENT_ACTIONS: 'unsent_actions',
  };

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Generic storage methods
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading data:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Authentication methods
  async saveAuthToken(token: string): Promise<void> {
    await this.setItem(this.KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    return this.getItem<string>(this.KEYS.AUTH_TOKEN);
  }

  async saveRefreshToken(token: string): Promise<void> {
    await this.setItem(this.KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.getItem<string>(this.KEYS.REFRESH_TOKEN);
  }

  async saveUserData(user: User): Promise<void> {
    await this.setItem(this.KEYS.USER_DATA, user);
  }

  async getUserData(): Promise<User | null> {
    return this.getItem<User>(this.KEYS.USER_DATA);
  }

  async clearAuthData(): Promise<void> {
    await Promise.all([
      this.removeItem(this.KEYS.AUTH_TOKEN),
      this.removeItem(this.KEYS.REFRESH_TOKEN),
      this.removeItem(this.KEYS.USER_DATA),
    ]);
  }

  // Course methods
  async saveCourses(courses: Course[]): Promise<void> {
    await this.setItem(this.KEYS.COURSES, courses);
  }

  async getCourses(): Promise<Course[]> {
    return (this.getItem<Course[]>(this.KEYS.COURSES) || []) as Course[];
  }

  async saveCourse(course: Course): Promise<void> {
    const courses = await this.getCourses();
    const existingIndex = courses.findIndex(c => c.id === course.id);
    
    if (existingIndex >= 0) {
      courses[existingIndex] = course;
    } else {
      courses.push(course);
    }
    
    await this.saveCourses(courses);
  }

  async getCourse(courseId: string): Promise<Course | null> {
    const courses = await this.getCourses();
    return courses.find(c => c.id === courseId) || null;
  }

  async updateCourseProgress(courseId: string, progress: number): Promise<void> {
    const course = await this.getCourse(courseId);
    if (course) {
      course.progress = progress;
      await this.saveCourse(course);
    }
  }

  // Forum methods
  async saveForums(forums: Forum[]): Promise<void> {
    await this.setItem(this.KEYS.FORUMS, forums);
  }

  async getForums(): Promise<Forum[]> {
    return (this.getItem<Forum[]>(this.KEYS.FORUMS) || []) as Forum[];
  }

  async saveForum(forum: Forum): Promise<void> {
    const forums = await this.getForums();
    const existingIndex = forums.findIndex(f => f.id === forum.id);
    
    if (existingIndex >= 0) {
      forums[existingIndex] = forum;
    } else {
      forums.push(forum);
    }
    
    await this.saveForums(forums);
  }

  async getForum(forumId: string): Promise<Forum | null> {
    const forums = await this.getForums();
    return forums.find(f => f.id === forumId) || null;
  }

  // Message methods
  async saveMessages(forumId: string, messages: Message[]): Promise<void> {
    const allMessages = await this.getItem<{ [forumId: string]: Message[] }>(this.KEYS.MESSAGES) || {};
    allMessages[forumId] = messages;
    await this.setItem(this.KEYS.MESSAGES, allMessages);
  }

  async getMessages(forumId: string): Promise<Message[]> {
    const allMessages = await this.getItem<{ [forumId: string]: Message[] }>(this.KEYS.MESSAGES) || {};
    return allMessages[forumId] || [];
  }

  async addMessage(forumId: string, message: Message): Promise<void> {
    const messages = await this.getMessages(forumId);
    messages.push(message);
    await this.saveMessages(forumId, messages);
  }

  async saveDraftMessage(forumId: string, text: string): Promise<void> {
    const drafts = await this.getItem<{ [forumId: string]: string }>(this.KEYS.DRAFT_MESSAGES) || {};
    drafts[forumId] = text;
    await this.setItem(this.KEYS.DRAFT_MESSAGES, drafts);
  }

  async getDraftMessage(forumId: string): Promise<string | null> {
    const drafts = await this.getItem<{ [forumId: string]: string }>(this.KEYS.DRAFT_MESSAGES) || {};
    return drafts[forumId] || null;
  }

  async clearDraftMessage(forumId: string): Promise<void> {
    const drafts = await this.getItem<{ [forumId: string]: string }>(this.KEYS.DRAFT_MESSAGES) || {};
    delete drafts[forumId];
    await this.setItem(this.KEYS.DRAFT_MESSAGES, drafts);
  }

  // User progress methods
  async saveUserProgress(progress: { [courseId: string]: number }): Promise<void> {
    await this.setItem(this.KEYS.USER_PROGRESS, progress);
  }

  async getUserProgress(): Promise<{ [courseId: string]: number }> {
    return (this.getItem<{ [courseId: string]: number }>(this.KEYS.USER_PROGRESS) || {}) as { [courseId: string]: number };
  }

  async updateProgress(courseId: string, progress: number): Promise<void> {
    const userProgress = await this.getUserProgress();
    userProgress[courseId] = progress;
    await this.saveUserProgress(userProgress);
  }

  // Settings methods
  async saveAppSettings(settings: AppSettings): Promise<void> {
    await this.setItem(this.KEYS.APP_SETTINGS, settings);
  }

  async getAppSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      theme: 'light',
      notifications: true,
      emailUpdates: true,
      autoSync: true,
      language: 'en',
    };
    
    return (this.getItem<AppSettings>(this.KEYS.APP_SETTINGS) || defaultSettings) as AppSettings;
  }

  async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    const settings = await this.getAppSettings();
    settings[key] = value;
    await this.saveAppSettings(settings);
  }

  // Offline data methods
  async saveOfflineData(data: OfflineData): Promise<void> {
    await this.setItem(this.KEYS.OFFLINE_DATA, data);
  }

  async getOfflineData(): Promise<OfflineData | null> {
    return this.getItem<OfflineData>(this.KEYS.OFFLINE_DATA);
  }

  async updateLastSync(): Promise<void> {
    await this.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
  }

  async getLastSync(): Promise<string | null> {
    return this.getItem<string>(this.KEYS.LAST_SYNC);
  }

  // Cache methods
  async saveCache<T>(key: string, data: T, ttl: number = 3600000): Promise<void> {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await this.setItem(key, cacheData);
  }

  async getCache<T>(key: string): Promise<T | null> {
    const cacheData = await this.getItem<{ data: T; timestamp: number; ttl: number }>(key);
    
    if (!cacheData) return null;
    
    const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;
    if (isExpired) {
      await this.removeItem(key);
      return null;
    }
    
    return cacheData.data;
  }

  async clearCache(): Promise<void> {
    const keys = [
      this.KEYS.CACHE_COURSES,
      this.KEYS.CACHE_FORUMS,
      this.KEYS.CACHE_LEADERBOARD,
    ];
    
    await Promise.all(keys.map(key => this.removeItem(key)));
  }

  // Unsent actions (for offline functionality)
  async saveUnsentAction(action: {
    type: string;
    data: any;
    timestamp: number;
  }): Promise<void> {
    const actions = await this.getItem<Array<{
      type: string;
      data: any;
      timestamp: number;
    }>>(this.KEYS.UNSENT_ACTIONS) || [];
    
    actions.push(action);
    await this.setItem(this.KEYS.UNSENT_ACTIONS, actions);
  }

  async getUnsentActions(): Promise<Array<{
    type: string;
    data: any;
    timestamp: number;
  }>> {
    return (this.getItem<Array<{
      type: string;
      data: any;
      timestamp: number;
    }>>(this.KEYS.UNSENT_ACTIONS) || []) as Array<{
      type: string;
      data: any;
      timestamp: number;
    }>;
  }

  async clearUnsentActions(): Promise<void> {
    await this.removeItem(this.KEYS.UNSENT_ACTIONS);
  }

  // Utility methods
  async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  async cleanupOldData(): Promise<void> {
    try {
      // Clear expired cache
      await this.clearCache();
      
      // Clear old draft messages (older than 7 days)
      const drafts = await this.getItem<{ [forumId: string]: string }>(this.KEYS.DRAFT_MESSAGES) || {};
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      // Note: This is a simplified cleanup. In a real app, you'd store timestamps with drafts
      // and clean up based on those timestamps
      
      // Clear old unsent actions (older than 24 hours)
      const actions = await this.getUnsentActions();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentActions = actions.filter(action => action.timestamp > oneDayAgo);
      
      if (recentActions.length !== actions.length) {
        await this.setItem(this.KEYS.UNSENT_ACTIONS, recentActions);
      }
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  // Migration methods (for app updates)
  async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    try {
      console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
      
      // Add migration logic here when needed
      // Example: Restructure data format, add new fields, etc.
      
      // Update app version
      await this.setItem('app_version', toVersion);
    } catch (error) {
      console.error('Error during data migration:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const storageService = StorageService.getInstance();

// Export types for use in components
export type { User, Course, Forum, Message, AppSettings, OfflineData }; 