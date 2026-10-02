// Authentication Service for BigMinds Education App
// Handles user registration, login, logout, and role-based access

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { backendAPI } from './backendAPI';

// User types and interfaces
export interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'institute';
  avatar?: string;
  educationLevel?: 'matriculation' | 'intermediate' | 'bachelor' | 'master' | 'other';
  targetExam?: 'mdcat' | 'ecat' | 'nts' | 'gat' | 'other';
  institution?: string;
  city?: string;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  isPremium: boolean;
  premiumExpiryDate?: string;
  interests?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'teacher';
  educationLevel?: 'matriculation' | 'intermediate' | 'bachelor' | 'master' | 'other';
  targetExam?: 'mdcat' | 'ecat' | 'nts' | 'gat' | 'other';
  institution?: string;
  city?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message: string;
}

// Real authentication service using backend API
class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login for:', credentials.email);
      const response = await backendAPI.post('/auth/login', credentials);
      
      if (response.data.success) {
        // Store token in AsyncStorage
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        console.log('✅ Login successful');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Handle enhanced error messages from backendAPI
      if (error.message) {
        throw new Error(error.message);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.isNetworkError) {
        throw new Error('Network error: Cannot connect to server. Please check your connection and ensure the backend server is running.');
      } else if (error.isTimeout) {
        throw new Error('Request timeout. Please check your internet connection.');
      } else if (error.isConnectionRefused) {
        throw new Error('Cannot connect to server. Please ensure the backend server is running.');
      } else {
        throw new Error('Network error occurred. Please try again.');
      }
    }
  }

  // Register user
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      // Ensure required backend fields have sensible defaults
      const payload = {
        ...userData,
        city: userData.city?.trim() || 'Karachi',
        educationLevel: userData.educationLevel || 'intermediate',
        targetExam: userData.targetExam || 'mdcat',
      };

      const response = await backendAPI.post('/auth/register', payload);
      
      if (response.data.success) {
        // Store token in AsyncStorage
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        console.log('✅ Registration successful');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // Handle enhanced error messages from backendAPI
      if (error.message) {
        throw new Error(error.message);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.isNetworkError) {
        throw new Error('Network error: Cannot connect to server. Please check your connection and ensure the backend server is running.');
      } else if (error.isTimeout) {
        throw new Error('Request timeout. Please check your internet connection.');
      } else if (error.isConnectionRefused) {
        throw new Error('Cannot connect to server. Please ensure the backend server is running.');
      } else {
        throw new Error('Network error occurred. Please try again.');
      }
    }
  }

  // Get current user from storage
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('authToken');
      
      if (userData && token) {
        // Verify token with backend
        try {
          const response = await backendAPI.get('/auth/me');
          if (response.data.success) {
            // Update stored user data
            await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
            return response.data.user;
          }
        } catch (error) {
          // Token might be expired, clear storage
          await this.logout();
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call backend logout first while token is still available
      try {
        await backendAPI.post('/auth/logout');
      } catch (error) {
        // Log backend logout errors, but proceed with local cleanup
        console.warn('Backend logout request failed, proceeding with local cleanup');
      }

      // Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      console.log('✅ Local logout completed');
    } catch (error: any) {
      console.error('Error during logout:', error);
      // Ensure we try to clear storage even on error
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      throw new Error(error.message || 'Failed to logout properly');
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      // Backend exposes profile update at /api/auth/profile
      const response = await backendAPI.put('/auth/profile', updates);
      
      if (response.data.success) {
        // Update stored user data
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        return response.data.user;
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Network error occurred');
      }
    }
  }

  // Refresh user data
  async refreshUserData(): Promise<User> {
    try {
      const response = await backendAPI.get('/auth/me');
      
      if (response.data.success) {
        // Update stored user data
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        return response.data.user;
      } else {
        throw new Error(response.data.message || 'Failed to refresh user data');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Network error occurred');
      }
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Get stored token
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }

  // Get user role
  getUserRole(): 'student' | 'teacher' | 'admin' | null {
    // This would typically get the role from the current user
    // For now, return null - this should be implemented based on your needs
    return null;
  }
}

// Export singleton instance
export const authService = new AuthService(); 