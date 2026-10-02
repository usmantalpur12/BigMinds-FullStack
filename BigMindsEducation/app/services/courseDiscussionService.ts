import { backendAPI } from './backendAPI';

export interface CourseMessage {
  _id: string;
  type: 'thread' | 'post';
  content: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role?: string;
  };
  createdAt: string;
  threadTitle?: string;
  threadId?: string;
  upvotes?: number;
  downvotes?: number;
}

export const courseDiscussionService = {
  async getCourseMessages(courseId: string, limit = 50, before?: string) {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (before) params.append('before', before);

    const res = await backendAPI.get(`/course-discussion/courses/${courseId}/messages?${params.toString()}`);
    return res.data.data as CourseMessage[];
  },

  async sendMessage(courseId: string, data: { content: string; threadId?: string; title?: string }) {
    const res = await backendAPI.post(`/course-discussion/courses/${courseId}/messages`, data);
    return res.data.data as CourseMessage;
  },

  async getCourseThreads(courseId: string) {
    const res = await backendAPI.get(`/course-discussion/courses/${courseId}/threads`);
    return res.data.data as any[];
  },

  async getThread(threadId: string) {
    const res = await backendAPI.get(`/course-discussion/threads/${threadId}`);
    return res.data.data as { thread: any; posts: any[] };
  },
};

