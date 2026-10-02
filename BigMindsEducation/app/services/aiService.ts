import { backendAPI } from './backendAPI';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export const aiService = {
  async courseHelper(courseId: string, message: string, conversationHistory: AIMessage[] = []) {
    const res = await backendAPI.post('/ai/course-helper', {
      courseId,
      message,
      conversationHistory,
    });
    return res.data.data as {
      response: string;
      courseId: string;
      timestamp: string;
    };
  },
};

