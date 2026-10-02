import { backendAPI } from './backendAPI';

/**
 * Categories supported by the leaderboard UI.
 * The backend /api/gamification/leaderboard accepts a ?category= param
 * and sorts by the corresponding field in UserProgress.
 */
export type LeaderboardCategory = 'overall' | 'courses' | 'forums' | 'quizzes' | 'study_time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  /** The metric value for the current category (e.g. courses completed, forum posts, etc.) */
  score: number;
  /** Human-readable label for the score (e.g. "Courses", "Posts", "XP") */
  scoreLabel: string;
  /** How to format the score: 'xp', 'count', 'time', 'streak', 'level' */
  scoreUnit: string;
  stats?: {
    coursesCompleted: number;
    forumPosts: number;
    quizzesPassed: number;
    totalStudyTime: number;
    currentStreak: number;
  };
}

/**
 * Map frontend category IDs to the backend ?category= query param values.
 * The backend now handles all these categories natively.
 */
const CATEGORY_MAP: Record<LeaderboardCategory, string> = {
  overall:    'overall',
  courses:    'courses',
  forums:     'forums',
  quizzes:    'quizzes',
  study_time: 'study_time',
};

export const leaderboardService = {
  async getLeaderboard(category: LeaderboardCategory = 'overall', limit = 10): Promise<LeaderboardEntry[]> {
    const backendCategory = CATEGORY_MAP[category] ?? 'overall';
    try {
      const res = await backendAPI.get(`/gamification/leaderboard?category=${backendCategory}&limit=${limit}`);
      const data: any[] = res.data?.data ?? [];
      return data.map((entry) => ({
        rank:        entry.rank,
        userId:      entry.userId,
        name:        entry.name ?? 'User',
        avatar:      entry.avatar ?? undefined,
        xp:          entry.xp ?? 0,
        level:       entry.level ?? 1,
        streak:      entry.streak ?? 0,
        score:       entry.score ?? entry.xp ?? 0,
        scoreLabel:  entry.scoreLabel ?? 'XP',
        scoreUnit:   entry.scoreUnit ?? 'xp',
        stats:       entry.stats ?? undefined,
      }));
    } catch (error: any) {
      console.error('[LeaderboardService] Failed to fetch leaderboard:', error?.message);
      return [];
    }
  },
};