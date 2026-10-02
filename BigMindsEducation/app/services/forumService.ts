// Forum Service for BigMinds Education App
// Handles all forum-related API calls and data management

import { backendAPI } from "./backendAPI";

export interface Forum {
  _id: string;
  title: string;
  description: string;
  category: string;
  isPrivate: boolean;
  isPublic?: boolean; // Alias for !isPrivate
  requiresApproval: boolean;
  maxMembers: number;
  memberCount: number;
  topicCount: number;
  messageCount: number;
  postCount?: number; // Alias for messageCount
  tags: string[];
  rules: string[];
  joinKey?: string; // For private forums
  thumbnail?: string; // Emoji or image
  coverImage?: string; // Cover image URL
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  createdById?: string; // Legacy support
  owner?: { _id: string } | string; // Legacy support
  ownerId?: string; // Legacy support
  instructor?: { _id: string } | string; // Legacy support
  createdAt: string;
  lastActivity: string;
  lastActivityAt?: string; // Alias for lastActivity
  userMembership?: {
    role: string;
    status: string;
    joinedAt: string;
  };
}

export interface Topic {
  _id: string;
  title: string;
  content: string;
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  authorId?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  createdAt: string;
  replyCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  category: string;
  tags: string[];
  lastReply?: {
    author: {
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  };
}

export interface ForumPost {
  _id: string;
  content: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
  likes?: number | Array<any>;
  dislikes?: number | Array<any>;
  likeCount?: number;
  dislikeCount?: number;
  upvotes?: number;
  downvotes?: number;
  isSolution: boolean;
}

export interface ForumMember {
  _id: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  userId?: string;
  forumId: string | Forum;
  role: "admin" | "moderator" | "member";
  status: "approved" | "pending" | "rejected" | "banned";
  joinedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface CreateForumData {
  title: string;
  description: string;
  category: string;
  isPrivate: boolean;
  isPublic?: boolean; // Optional, defaults to !isPrivate
  requiresApproval: boolean;
  maxMembers: number;
  tags: string[];
  rules: string[];
  joinKey?: string | null;
  coverImage?: string;
}

export interface CreateTopicData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  isAnonymous?: boolean;
}

export interface CreatePostData {
  content: string;
  isAnonymous?: boolean;
}

class ForumService {
  // Get all forums
  async getForums(
    filters: {
      category?: string;
      search?: string;
      sort?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: Forum[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await backendAPI.get(`/forums?${params.toString()}`);
      // Normalize response format
      if (response.data && response.data.data) {
        return response.data;
      }
      return {
        data: Array.isArray(response.data) ? response.data : [],
        pagination: response.data.pagination || {},
      };
    } catch (error: any) {
      console.error("Error fetching forums:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch forums",
      );
    }
  }

  // Get single forum
  async getForum(forumId: string): Promise<{ data: Forum }> {
    try {
      const response = await backendAPI.get(`/forums/${forumId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch forum");
    }
  }

  // Create forum
  async createForum(
    forumData: CreateForumData,
  ): Promise<{ data: Forum; message: string }> {
    try {
      const response = await backendAPI.post("/forums", forumData);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create forum",
      );
    }
  }

  // Update forum
  async updateForum(
    forumId: string,
    forumData: Partial<CreateForumData>,
  ): Promise<{ data: Forum; message: string }> {
    try {
      const response = await backendAPI.put(`/forums/${forumId}`, forumData);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update forum",
      );
    }
  }

  // Delete forum
  async deleteForum(forumId: string): Promise<{ message: string }> {
    try {
      const response = await backendAPI.delete(`/forums/${forumId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete forum",
      );
    }
  }

  // Join forum
  async joinForum(
    forumId: string,
    options?: { message?: string; joinKey?: string },
  ): Promise<{
    data: ForumMember | { membership: ForumMember; forum?: Forum };
    message: string;
  }> {
    try {
      const response = await backendAPI.post(`/forums/${forumId}/join`, {
        message: options?.message,
        joinKey: options?.joinKey,
      });

      // The backend now returns { membership, forum } for immediate joins
      // or just { membership } for pending approvals
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to join forum";
      throw new Error(errorMessage);
    }
  }

  // Leave forum
  async leaveForum(forumId: string): Promise<{ message: string }> {
    try {
      const response = await backendAPI.post(`/forums/${forumId}/leave`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to leave forum");
    }
  }

  // Get forum topics
  async getForumTopics(
    forumId: string,
    filters: {
      page?: number;
      limit?: number;
      sort?: string;
      category?: string;
      status?: string;
    } = {},
  ): Promise<{ data: Topic[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.category) params.append("category", filters.category);
      if (filters.status) params.append("status", filters.status);

      const response = await backendAPI.get(
        `/forums/${forumId}/topics?${params.toString()}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch forum topics",
      );
    }
  }

  // Get single topic
  async getTopic(topicId: string): Promise<{ data: Topic }> {
    try {
      const response = await backendAPI.get(`/forums/topics/${topicId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch topic");
    }
  }

  // Create topic
  async createTopic(
    forumId: string,
    topicData: CreateTopicData,
  ): Promise<{ data: Topic; message: string }> {
    try {
      const response = await backendAPI.post(
        `/forums/${forumId}/topics`,
        topicData,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create topic",
      );
    }
  }

  // Update topic
  async updateTopic(
    topicId: string,
    topicData: Partial<CreateTopicData>,
  ): Promise<{ data: Topic; message: string }> {
    try {
      const response = await backendAPI.put(
        `/forums/topics/${topicId}`,
        topicData,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update topic",
      );
    }
  }

  // Delete topic
  async deleteTopic(topicId: string): Promise<{ message: string }> {
    try {
      const response = await backendAPI.delete(`/forums/topics/${topicId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete topic",
      );
    }
  }

  // Get topic posts
  async getTopicPosts(
    topicId: string,
    filters: {
      page?: number;
      limit?: number;
      sort?: string;
    } = {},
  ): Promise<{ data: ForumPost[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.sort) params.append("sort", filters.sort);

      const response = await backendAPI.get(
        `/forums/topics/${topicId}/posts?${params.toString()}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch topic posts",
      );
    }
  }

  // Create post
  async createPost(
    topicId: string,
    postData: CreatePostData,
  ): Promise<{ data: ForumPost; message: string }> {
    try {
      const response = await backendAPI.post(
        `/forums/topics/${topicId}/posts`,
        postData,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create post");
    }
  }

  // Update post
  async updatePost(
    topicId: string,
    postId: string,
    postData: Partial<CreatePostData>,
  ): Promise<{ data: ForumPost; message: string }> {
    try {
      const response = await backendAPI.put(
        `/forums/topics/${topicId}/posts/${postId}`,
        postData,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update post");
    }
  }

  // Delete post
  async deletePost(
    topicId: string,
    postId: string,
  ): Promise<{ message: string }> {
    try {
      const response = await backendAPI.delete(
        `/forums/topics/${topicId}/posts/${postId}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete post");
    }
  }

  // Get forum members
  async getForumMembers(
    forumId: string,
    filters: {
      role?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: ForumMember[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await backendAPI.get(
        `/forums/${forumId}/members?${params.toString()}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch forum members",
      );
    }
  }

  // Approve member
  async approveMember(
    forumId: string,
    userId: string,
  ): Promise<{ data: ForumMember; message: string }> {
    try {
      const response = await backendAPI.put(
        `/forums/${forumId}/members/${userId}/approve`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to approve member",
      );
    }
  }

  // Reject member
  async rejectMember(
    forumId: string,
    userId: string,
  ): Promise<{ message: string }> {
    try {
      const response = await backendAPI.put(
        `/forums/${forumId}/members/${userId}/reject`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to reject member",
      );
    }
  }

  // Ban member
  async banMember(
    forumId: string,
    userId: string,
  ): Promise<{ data: ForumMember; message: string }> {
    try {
      const response = await backendAPI.put(
        `/forums/${forumId}/members/${userId}/ban`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to ban member");
    }
  }

  // Unban member
  async unbanMember(
    forumId: string,
    userId: string,
  ): Promise<{ data: ForumMember; message: string }> {
    try {
      const response = await backendAPI.put(
        `/forums/${forumId}/members/${userId}/unban`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to unban member",
      );
    }
  }

  // Remove member
  async removeMember(
    forumId: string,
    userId: string,
  ): Promise<{ message: string }> {
    try {
      const response = await backendAPI.delete(
        `/forums/${forumId}/members/${userId}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to remove member",
      );
    }
  }

  // Pin topic
  async pinTopic(topicId: string): Promise<{ data: Topic; message: string }> {
    try {
      const response = await backendAPI.put(`/forums/topics/${topicId}/pin`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to pin topic");
    }
  }

  // Lock topic
  async lockTopic(topicId: string): Promise<{ data: Topic; message: string }> {
    try {
      const response = await backendAPI.put(`/forums/topics/${topicId}/lock`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to lock topic");
    }
  }

  // Move topic
  async moveTopic(
    topicId: string,
    newForumId: string,
  ): Promise<{ data: Topic; message: string }> {
    try {
      const response = await backendAPI.put(`/forums/topics/${topicId}/move`, {
        newForumId,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to move topic");
    }
  }

  // Get forum categories
  async getForumCategories(): Promise<{
    data: Array<{ id: string; name: string; icon: string; count: number }>;
  }> {
    try {
      const response = await backendAPI.get("/forums/categories");
      // Ensure we return data in the expected format
      if (response.data && response.data.data) {
        return response.data;
      }
      // If response format is different, normalize it
      return {
        data: response.data || [],
      };
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      // Return default categories on error
      return {
        data: [
          { id: "academic", name: "Academic", icon: "📚", count: 0 },
          { id: "general", name: "General", icon: "💬", count: 0 },
          { id: "technical", name: "Technical", icon: "💻", count: 0 },
          { id: "social", name: "Social", icon: "👥", count: 0 },
        ],
      };
    }
  }

  // Search forums
  async searchForums(
    query: string,
    filters: {
      category?: string;
      sort?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: Forum[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      params.append("search", query);
      if (filters.category) params.append("category", filters.category);
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await backendAPI.get(`/forums?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to search forums",
      );
    }
  }

  // Get user's forum memberships
  async getUserForumMemberships(
    userId?: string,
  ): Promise<{ success: boolean; data: ForumMember[] }> {
    try {
      const endpoint = userId
        ? `/forums/users/${userId}/forum-memberships`
        : "/forums/users/me/forum-memberships";
      const response = await backendAPI.get(endpoint);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch user forum memberships",
      );
    }
  }

  // Convenience helper to get just the forums the current user is part of/owns
  async getMyForums(): Promise<Forum[]> {
    const membershipsResponse = await this.getUserForumMemberships();
    const entries = membershipsResponse?.data || [];

    if (__DEV__) {
      console.log(
        `[ForumService] Mapping ${entries.length} memberships to forums...`,
      );
      if (entries.length > 0) {
        console.log(
          `[ForumService] First entry keys: ${Object.keys(entries[0]).join(", ")}`,
        );
        if (entries[0].forumId) {
          console.log(
            `[ForumService] forumId type: ${typeof entries[0].forumId}`,
          );
        }
      }
    }

    const mapped = entries
      .map((entry: any) => {
        // Backend returns ForumMember documents with the 'forumId' field populated
        if (
          entry.forumId &&
          typeof entry.forumId === "object" &&
          entry.forumId._id
        ) {
          return entry.forumId;
        }
        // Legacy fallback
        if (entry.forum && typeof entry.forum === "object" && entry.forum._id) {
          return entry.forum;
        }
        return null;
      })
      .filter(
        (forum: any): forum is Forum =>
          !!forum && typeof forum === "object" && !!forum._id,
      );

    if (__DEV__) {
      console.log(
        `[ForumService] Mapped to ${mapped.length} valid forum objects.`,
      );
    }

    return mapped;
  }

  // Like post
  async likePost(
    postId: string,
  ): Promise<{ data: ForumPost; message: string }> {
    try {
      const response = await backendAPI.post(
        `/forums/topics/messages/${postId}/like`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to like post");
    }
  }

  // Unlike post
  async unlikePost(
    postId: string,
  ): Promise<{ data: ForumPost; message: string }> {
    try {
      const response = await backendAPI.post(
        `/forums/topics/messages/${postId}/unlike`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to unlike post");
    }
  }

  // Mark post as solution
  async markAsSolution(
    postId: string,
  ): Promise<{ data: ForumPost; message: string }> {
    try {
      const response = await backendAPI.post(
        `/forums/topics/messages/${postId}/solution`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to mark as solution",
      );
    }
  }

  // Get forum statistics
  async getForumStats(forumId: string): Promise<{ data: any }> {
    try {
      const response = await backendAPI.get(`/forums/${forumId}/stats`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch forum statistics",
      );
    }
  }
}

// Create and export a singleton instance
export const forumService = new ForumService();
