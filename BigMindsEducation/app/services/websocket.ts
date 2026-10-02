// WebSocket Service for BigMinds Education App
// Handles real-time communication for chat, notifications, and live updates

interface WebSocketMessage {
  type: 'chat' | 'notification' | 'forum_update' | 'course_update' | 'user_status' | 'typing';
  data: any;
  timestamp: string;
  userId?: string;
  forumId?: string;
  courseId?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  timestamp: string;
  forumId: string;
}

interface Notification {
  id: string;
  type: 'message' | 'achievement' | 'course' | 'forum' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
}

interface UserStatus {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
}

interface TypingIndicator {
  userId: string;
  userName: string;
  forumId: string;
  isTyping: boolean;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private listeners: Map<string, Function[]> = new Map();
  private isConnected = false;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Initialize WebSocket connection
  async connect(userId: string, token: string): Promise<void> {
    this.userId = userId;
    
    try {
      // In a real app, you'd connect to your WebSocket server
      // For demo purposes, we'll simulate the connection
      console.log('Connecting to WebSocket server...');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('WebSocket connected successfully');
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Process queued messages
      this.processMessageQueue();
      
      // Emit connection event
      this.emit('connected', { userId, timestamp: new Date().toISOString() });
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.isConnected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    console.log('WebSocket disconnected');
    this.emit('disconnected', { timestamp: new Date().toISOString() });
  }

  // Send message through WebSocket
  sendMessage(message: WebSocketMessage): void {
    if (this.isConnected) {
      // In a real app, send via WebSocket
      console.log('Sending message:', message);
      
      // Simulate message processing
      setTimeout(() => {
        this.handleIncomingMessage(message);
      }, 100);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      // Only log in development
      if (__DEV__) {
        console.log('Message queued, waiting for connection');
      }
    }
  }

  // Send chat message
  sendChatMessage(forumId: string, text: string): void {
    const message: WebSocketMessage = {
      type: 'chat',
      data: {
        text,
        forumId,
      },
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      forumId,
    };
    
    this.sendMessage(message);
  }

  // Send typing indicator
  sendTypingIndicator(forumId: string, isTyping: boolean): void {
    const message: WebSocketMessage = {
      type: 'typing',
      data: {
        isTyping,
        forumId,
      },
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      forumId,
    };
    
    this.sendMessage(message);
  }

  // Join forum room
  joinForum(forumId: string): void {
    const message: WebSocketMessage = {
      type: 'forum_update',
      data: {
        action: 'join',
        forumId,
      },
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      forumId,
    };
    
    this.sendMessage(message);
  }

  // Leave forum room
  leaveForum(forumId: string): void {
    const message: WebSocketMessage = {
      type: 'forum_update',
      data: {
        action: 'leave',
        forumId,
      },
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      forumId,
    };
    
    this.sendMessage(message);
  }

  // Subscribe to course updates
  subscribeToCourse(courseId: string): void {
    const message: WebSocketMessage = {
      type: 'course_update',
      data: {
        action: 'subscribe',
        courseId,
      },
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      courseId,
    };
    
    this.sendMessage(message);
  }

  // Update user status
  updateUserStatus(status: 'online' | 'offline' | 'away'): void {
    const message: WebSocketMessage = {
      type: 'user_status',
      data: {
        status,
        lastSeen: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
    };
    
    this.sendMessage(message);
  }

  // Event listeners
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
    }
  }

  // Handle incoming messages
  private handleIncomingMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'chat':
        this.handleChatMessage(message.data as ChatMessage);
        break;
      case 'notification':
        this.handleNotification(message.data as Notification);
        break;
      case 'forum_update':
        this.handleForumUpdate(message.data);
        break;
      case 'course_update':
        this.handleCourseUpdate(message.data);
        break;
      case 'user_status':
        this.handleUserStatus(message.data as UserStatus);
        break;
      case 'typing':
        this.handleTypingIndicator(message.data as TypingIndicator);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleChatMessage(chatMessage: ChatMessage): void {
    this.emit('chat_message', chatMessage);
  }

  private handleNotification(notification: Notification): void {
    this.emit('notification', notification);
  }

  private handleForumUpdate(data: any): void {
    this.emit('forum_update', data);
  }

  private handleCourseUpdate(data: any): void {
    this.emit('course_update', data);
  }

  private handleUserStatus(userStatus: UserStatus): void {
    this.emit('user_status', userStatus);
  }

  private handleTypingIndicator(typingIndicator: TypingIndicator): void {
    this.emit('typing_indicator', typingIndicator);
  }

  // Reconnection logic
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(this.userId!, 'token'); // In real app, get fresh token
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('connection_failed', { 
        attempts: this.reconnectAttempts,
        timestamp: new Date().toISOString() 
      });
    }
  }

  // Heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        const heartbeat: WebSocketMessage = {
          type: 'user_status',
          data: {
            status: 'online',
            lastSeen: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
          userId: this.userId || undefined,
        };
        
        this.sendMessage(heartbeat);
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  // Process queued messages
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get queued message count
  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  // Simulate incoming messages for demo
  simulateIncomingMessage(type: string, data: any): void {
    const message: WebSocketMessage = {
      type: type as any,
      data,
      timestamp: new Date().toISOString(),
    };
    
    this.handleIncomingMessage(message);
  }
}

// Create and export a singleton instance
export const websocketService = WebSocketService.getInstance();

// Export types for use in components
export type { 
  WebSocketMessage, 
  ChatMessage, 
  Notification, 
  UserStatus, 
  TypingIndicator 
}; 