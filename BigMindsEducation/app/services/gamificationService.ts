import { backendAPI } from './backendAPI';

export interface Quest {
  _id: string;
  title: string;
  description: string;
  type: string;
  xpReward: number;
  requirements: Record<string, number>;
  isActive: boolean;
  status?: 'not_started' | 'in_progress' | 'completed';
  progress?: Record<string, number>;
}

export const gamificationService = {
  async getQuests(type?: string): Promise<Quest[]> {
    const params = type && type !== 'all' ? `?type=${type}` : '';
    const res = await backendAPI.get(`/gamification/quests/me${params}`);
    return res.data?.data || [];
  },
  
  async startQuest(questId: string): Promise<void> {
    await backendAPI.post(`/gamification/quests/me/start`, { questId });
  }
};
