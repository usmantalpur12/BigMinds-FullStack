import { backendAPI } from "./backendAPI";

export interface StudyGroup {
  _id: string;
  forumId: string;
  name: string;
  subject: string;
  maxMembers: number;
  currentMembers: number;
  meetingTime: string;
  meetingDay: string;
  isActive: boolean;
  createdBy: string;
  members: string[];
  topics: string[];
}

export interface StudySession {
  _id: string;
  forumId: string;
  title: string;
  description: string;
  startTime: string;
  duration: number; // in minutes
  maxParticipants: number;
  currentParticipants: number;
  topics: string[];
  isLive: boolean;
  recordingUrl?: string;
}

export interface ResourceShare {
  _id: string;
  title: string;
  description: string;
  type: "document" | "video" | "link" | "quiz";
  url: string;
  uploadedBy: string;
  forumId: string;
  tags: string[];
  downloads: number;
  rating: number;
  createdAt: string;
}

export interface ExpertQnA {
  _id: string;
  question: string;
  answer?: string;
  askedBy: string;
  answeredBy?: string;
  forumId: string;
  subject: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "open" | "answered" | "closed";
  upvotes: number;
  createdAt: string;
  answeredAt?: string;
}

export interface StudyReminder {
  _id: string;
  userId: string;
  forumId: string;
  title: string;
  description: string;
  reminderTime: string;
  isRecurring: boolean;
  recurringDays?: string[];
  isActive: boolean;
}

class ForumEnhancementService {
  // Study Groups
  async createStudyGroup(data: Partial<StudyGroup>): Promise<StudyGroup> {
    const response = await backendAPI.post(
      `/forums/${data.forumId}/study-groups`,
      data,
    );
    return response.data.data;
  }

  async getStudyGroups(forumId: string): Promise<StudyGroup[]> {
    const response = await backendAPI.get(`/forums/${forumId}/study-groups`);
    return response.data.data;
  }

  async joinStudyGroup(groupId: string): Promise<{ message: string }> {
    const response = await backendAPI.post(
      `/forums/study-groups/${groupId}/join`,
    );
    return response.data;
  }

  async leaveStudyGroup(groupId: string): Promise<{ message: string }> {
    const response = await backendAPI.post(
      `/forums/study-groups/${groupId}/leave`,
    );
    return response.data;
  }

  // Study Sessions
  async createStudySession(data: Partial<StudySession>): Promise<StudySession> {
    const response = await backendAPI.post(
      `/forums/${data.forumId}/study-sessions`,
      data,
    );
    return response.data.data;
  }

  async getStudySessions(forumId: string): Promise<StudySession[]> {
    const response = await backendAPI.get(`/forums/${forumId}/study-sessions`);
    return response.data.data;
  }

  async joinStudySession(sessionId: string): Promise<{ message: string }> {
    const response = await backendAPI.post(
      `/forums/study-sessions/${sessionId}/join`,
    );
    return response.data;
  }

  async startLiveSession(
    sessionId: string,
  ): Promise<{ message: string; streamUrl: string }> {
    const response = await backendAPI.post(
      `/forums/study-sessions/${sessionId}/start-live`,
    );
    return response.data;
  }

  // Resource Sharing
  async shareResource(data: Partial<ResourceShare>): Promise<ResourceShare> {
    const response = await backendAPI.post(
      `/forums/${data.forumId}/resources`,
      data,
    );
    return response.data.data;
  }

  async getResources(forumId: string, type?: string): Promise<ResourceShare[]> {
    const url = type
      ? `/forums/${forumId}/resources?type=${type}`
      : `/forums/${forumId}/resources`;
    const response = await backendAPI.get(url);
    return response.data.data;
  }

  async downloadResource(
    resourceId: string,
  ): Promise<{ message: string; downloadUrl: string }> {
    const response = await backendAPI.post(
      `/forums/resources/${resourceId}/download`,
    );
    return response.data;
  }

  async rateResource(
    resourceId: string,
    rating: number,
  ): Promise<{ message: string }> {
    const response = await backendAPI.post(
      `/forums/resources/${resourceId}/rate`,
      { rating },
    );
    return response.data;
  }

  // Expert Q&A
  async askQuestion(data: Partial<ExpertQnA>): Promise<ExpertQnA> {
    const response = await backendAPI.post(
      `/forums/${data.forumId}/expert-qa`,
      data,
    );
    return response.data.data;
  }

  async answerQuestion(qaId: string, answer: string): Promise<ExpertQnA> {
    const response = await backendAPI.post(`/forums/expert-qa/${qaId}/answer`, {
      answer,
    });
    return response.data.data;
  }

  async getExpertQnA(forumId: string, status?: string): Promise<ExpertQnA[]> {
    const url = status
      ? `/forums/${forumId}/expert-qa?status=${status}`
      : `/forums/${forumId}/expert-qa`;
    const response = await backendAPI.get(url);
    return response.data.data;
  }

  async upvoteQuestion(qaId: string): Promise<{ message: string }> {
    const response = await backendAPI.post(`/forums/expert-qa/${qaId}/upvote`);
    return response.data;
  }

  // Study Reminders
  async createReminder(data: Partial<StudyReminder>): Promise<StudyReminder> {
    const response = await backendAPI.post("/forums/reminders", data);
    return response.data.data;
  }

  async getReminders(forumId: string): Promise<StudyReminder[]> {
    const response = await backendAPI.get(`/forums/${forumId}/reminders`);
    return response.data.data;
  }

  async updateReminder(
    reminderId: string,
    data: Partial<StudyReminder>,
  ): Promise<StudyReminder> {
    const response = await backendAPI.put(
      `/forums/reminders/${reminderId}`,
      data,
    );
    return response.data.data;
  }

  async deleteReminder(reminderId: string): Promise<{ message: string }> {
    const response = await backendAPI.delete(`/forums/reminders/${reminderId}`);
    return response.data;
  }

  // Smart Recommendations
  async getRecommendedTopics(
    forumId: string,
    userId: string,
  ): Promise<string[]> {
    const response = await backendAPI.get(
      `/forums/${forumId}/recommendations?userId=${userId}`,
    );
    return response.data.data;
  }

  async getSimilarQuestions(
    question: string,
    forumId: string,
  ): Promise<ExpertQnA[]> {
    const response = await backendAPI.post(
      `/forums/${forumId}/similar-questions`,
      { question },
    );
    return response.data.data;
  }

  async getStudyPartners(
    forumId: string,
    subject: string,
  ): Promise<
    {
      userId: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      expertise: string[];
      availability: string[];
      matchScore: number;
    }[]
  > {
    const response = await backendAPI.get(
      `/forums/${forumId}/study-partners?subject=${subject}`,
    );
    return response.data.data;
  }

  // Progress Tracking
  async getForumProgress(
    forumId: string,
    userId: string,
  ): Promise<{
    topicsCreated: number;
    postsWritten: number;
    helpfulVotes: number;
    reputation: number;
    studyTime: number;
    resourcesShared: number;
    questionsAnswered: number;
    streak: number;
  }> {
    const response = await backendAPI.get(
      `/forums/${forumId}/progress?userId=${userId}`,
    );
    return response.data.data;
  }

  // Collaborative Features
  async createCollaborativeNote(data: {
    title: string;
    content: string;
    forumId: string;
    collaborators: string[];
    tags: string[];
  }): Promise<{
    _id: string;
    title: string;
    content: string;
    forumId: string;
    collaborators: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }> {
    const response = await backendAPI.post("/forums/collaborative-notes", data);
    return response.data.data;
  }

  async getCollaborativeNotes(forumId: string): Promise<
    {
      _id: string;
      title: string;
      content: string;
      forumId: string;
      collaborators: string[];
      tags: string[];
      createdAt: string;
      updatedAt: string;
    }[]
  > {
    const response = await backendAPI.get(
      `/forums/${forumId}/collaborative-notes`,
    );
    return response.data.data;
  }

  // Gamification for Learning
  async earnPoints(
    action: string,
    forumId: string,
    points: number,
  ): Promise<{
    message: string;
    pointsEarned: number;
    totalPoints: number;
    level: number;
  }> {
    const response = await backendAPI.post("/forums/earn-points", {
      action,
      forumId,
      points,
    });
    return response.data;
  }

  async getLeaderboard(forumId: string): Promise<
    {
      userId: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      points: number;
      level: number;
      rank: number;
      contributions: number;
    }[]
  > {
    const response = await backendAPI.get(`/forums/${forumId}/leaderboard`);
    return response.data.data;
  }
}

export const forumEnhancementService = new ForumEnhancementService();
