import { backendAPI } from './backendAPI';
import { uploadImage } from './fileUpload';

export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName?: string;
  avatar?: string;
  avatarSmall?: string;
  avatarMedium?: string;
  avatarLarge?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  socialLinks?: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
  profileCompleted?: number;
  twoFactorEnabled?: boolean;
  lastActiveAt?: string;
  role: 'student' | 'teacher' | 'admin' | 'institute';
  studentProfile?: {
    classLevel?: string;
    category?: string;
    learningGoals?: string;
  };
  teacherProfile?: {
    qualification?: string;
    experienceYears?: number;
    subjects?: string[];
    expertiseTags?: string[];
    portfolioLinks?: string[];
    isVerified?: boolean;
    rating?: number;
    totalRatings?: number;
  };
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalCourses: number;
  completedCourses: number;
  activeCourses: number;
  completionRate: number;
  totalWatchTime: number;
  currentStreak: number;
  forumStats: {
    questionsAsked: number;
    answersGiven: number;
    reputation: number;
    badges: string[];
  };
}

export interface UserDocument {
  _id: string;
  type: 'certification' | 'degree' | 'diploma' | 'license' | 'identity' | 'other';
  title: string;
  fileUrl: string;
  fileName: string;
  verified: boolean;
  verifiedAt?: string;
  uploadedAt: string;
}

export interface ActivityLog {
  _id: string;
  action: string;
  meta: any;
  createdAt: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  interests?: string[];
  location?: string;
  city?: string;
  institution?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  socialLinks?: {
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

export interface UpdateStudentProfileData {
  classLevel?: string;
  category?: string;
  learningGoals?: string;
}

export interface UpdateTeacherProfileData {
  qualification?: string;
  experienceYears?: number;
  subjects?: string[];
  expertiseTags?: string[];
  portfolioLinks?: string[];
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class ProfileService {
  // Get current user profile
  async getProfile(): Promise<UserProfile & { enrollments?: any[]; documents?: UserDocument[] }> {
    const response = await backendAPI.get('/profile/me');
    return response.data.data;
  }

  // Update user profile
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await backendAPI.put('/profile/update', data);
    return response.data.data;
  }

  // Update student profile
  async updateStudentProfile(data: UpdateStudentProfileData): Promise<UserProfile> {
    const response = await backendAPI.put('/profile/student/update', data);
    return response.data.data;
  }

  // Update teacher profile
  async updateTeacherProfile(data: UpdateTeacherProfileData): Promise<UserProfile> {
    const response = await backendAPI.put('/profile/teacher/update', data);
    return response.data.data;
  }

  // Upload avatar
  async uploadAvatar(imageUri: string): Promise<{ avatar: string; avatarSmall: string; avatarMedium: string; avatarLarge: string; profileCompleted: number }> {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || `avatar_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('avatar', {
      uri: imageUri,
      type: type,
      name: filename,
    } as any);

    const response = await backendAPI.put('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: () => formData,
    });

    return response.data.data;
  }

  // Delete avatar
  async deleteAvatar(): Promise<void> {
    await backendAPI.delete('/profile/avatar');
  }

  // Change password
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await backendAPI.put('/profile/password', data);
    return response.data;
  }



  // Get activity logs
  async getActivityLogs(limit = 50): Promise<ActivityLog[]> {
    const response = await backendAPI.get(`/profile/activity?limit=${limit}`);
    return response.data.data;
  }

  // Upload teacher document
  async uploadTeacherDocument(fileUri: string, type: string, title: string): Promise<UserDocument> {
    const formData = new FormData();
    formData.append('document', {
      uri: fileUri,
      type: 'application/pdf',
      name: `document_${Date.now()}.pdf`,
    } as any);
    formData.append('type', type);
    formData.append('title', title);

    const response = await backendAPI.post('/profile/teacher/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  // Delete teacher document
  async deleteTeacherDocument(documentId: string): Promise<void> {
    await backendAPI.delete(`/profile/teacher/document/${documentId}`);
  }

  // Update security settings
  async updateSecurity(twoFactorEnabled: boolean): Promise<{ twoFactorEnabled: boolean }> {
    const response = await backendAPI.put('/profile/security', { twoFactorEnabled });
    return response.data.data;
  }

  // Delete account
  async deleteAccount(password: string): Promise<void> {
    await backendAPI.post('/profile/delete-account', { password });
  }

  // Get public profile
  async getPublicProfile(userId: string): Promise<UserProfile & { stats?: any }> {
    const response = await backendAPI.get(`/profile/${userId}`);
    return response.data.data;
  }
}

export const profileService = new ProfileService();
