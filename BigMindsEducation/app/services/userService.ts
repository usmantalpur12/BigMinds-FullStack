import { backendAPI } from './backendAPI';

export interface UpdateMePayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  interests?: string[];
  avatar?: string | null;
}

export const userService = {
  async getMe() {
    const res = await backendAPI.get('/users/me');
    return res.data.data as any;
  },
  async updateMe(payload: UpdateMePayload) {
    const res = await backendAPI.put('/users/me', payload);
    return res.data.data as any;
  },
  async updateAvatar(avatarUrl: string) {
    const res = await backendAPI.put('/users/me/avatar', { avatarUrl });
    return res.data.data as any;
  },
  async updatePassword(currentPassword: string, newPassword: string) {
    const res = await backendAPI.put('/users/me/password', { currentPassword, newPassword });
    return res.data as any;
  }
}; 