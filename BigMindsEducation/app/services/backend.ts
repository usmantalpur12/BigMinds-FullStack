// Backend Connection Service for BigMinds Education App
// Integrates all advanced features: WebSocket, Notifications, File Upload, Performance

import { apiService } from './api';
import { backendAPI } from './backendAPI';
import { storageService } from './storage';
import { websocketService } from './websocket';
import { notificationService } from './notifications';
import { fileUploadService } from './fileUpload';
import { performanceService } from './performance';
import { AppState } from 'react-native';

interface BackendConfig {
  apiUrl: string;
  wsUrl: string;
  enableRealTime: boolean;
  enableNotifications: boolean;
  enableFileUpload: boolean;
  enablePerformanceMonitoring: boolean;
  autoSync: boolean;
  syncInterval: number; // in milliseconds
}

interface SyncStatus {
  lastSync: string;
  isOnline: boolean;
  pendingActions: number;
  syncInProgress: boolean;
}

class BackendService {
  private static instance: BackendService;
  private config: BackendConfig = {
    apiUrl: 'https://api.bigminds.education',
    wsUrl: 'wss://api.bigminds.education/ws',
    enableRealTime: true,
    enableNotifications: true,
    enableFileUpload: true,
    enablePerformanceMonitoring: true,
    autoSync: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
  };
  private syncStatus: SyncStatus = {
    lastSync: '',
    isOnline: true,
    pendingActions: 0,
    syncInProgress: false,
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializeBackend();
  }

  static getInstance(): BackendService {
    if (!BackendService.instance) {
      BackendService.instance = new BackendService();
    }
    return BackendService.instance;
  }

  // Initialize backend services
  private async initializeBackend(): Promise<void> {
    console.log('Initializing backend services...');

    try {
      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.initializePerformanceMonitoring();
      }

      // Initialize notifications
      if (this.config.enableNotifications) {
        await this.initializeNotifications();
      }

      // Initialize WebSocket connection
      if (this.config.enableRealTime) {
        await this.initializeWebSocket();
      }

      // Start auto-sync
      if (this.config.autoSync) {
        this.startAutoSync();
      }

      // Set up event listeners
      this.setupEventListeners();

      console.log('Backend services initialized successfully');
    } catch (error) {
      console.error('Error initializing backend services:', error);
    }
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    // Monitor API calls
    performanceService.on('api_response', (data) => {
      this.handleApiPerformance(data);
    });

    // Monitor memory usage
    performanceService.on('memory_warning', (data) => {
      this.handleMemoryWarning(data);
    });

    // Monitor errors
    performanceService.on('error', (data) => {
      this.handleError(data);
    });
  }

  // Initialize notifications
  private async initializeNotifications(): Promise<void> {
    // Request notification permissions
    const hasPermission = await notificationService.requestPermissions();
    
    if (hasPermission) {
      // Set up notification handlers
      notificationService.on('notification_received', (notification) => {
        this.handleNotificationReceived(notification);
      });

      notificationService.on('notification_action', (action) => {
        this.handleNotificationAction(action);
      });
    }
  }

  // Initialize WebSocket connection
  private async initializeWebSocket(): Promise<void> {
    // Get user data for WebSocket connection
    const userData = await storageService.getUserData();
    const authToken = await storageService.getAuthToken();

    if (userData && authToken) {
      await websocketService.connect(userData.id, authToken);

      // Set up WebSocket event handlers
      websocketService.on('chat_message', (message) => {
        this.handleChatMessage(message);
      });

      websocketService.on('notification', (notification) => {
        this.handleWebSocketNotification(notification);
      });

      websocketService.on('user_status', (status) => {
        this.handleUserStatusUpdate(status);
      });

      websocketService.on('typing_indicator', (indicator) => {
        this.handleTypingIndicator(indicator);
      });

      websocketService.on('connected', () => {
        this.updateSyncStatus({ isOnline: true });
      });

      websocketService.on('disconnected', () => {
        this.updateSyncStatus({ isOnline: false });
      });
    }
  }

  // Set up event listeners
  private setupEventListeners(): void {
    // Listen for network status changes
    this.monitorNetworkStatus();

    // Listen for app state changes
    this.monitorAppState();
  }

  // Monitor network status
  private monitorNetworkStatus(): void {
    // In a real app, you'd use NetInfo
    // For demo purposes, we'll simulate network monitoring
    setInterval(() => {
      const isOnline = Math.random() > 0.1; // 90% online
      this.updateSyncStatus({ isOnline });
    }, 10000); // Check every 10 seconds
  }

  // Monitor app state
  private monitorAppState(): void {
    // Use React Native AppState instead of document
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        this.handleAppBackground();
      } else if (nextAppState === 'active') {
        this.handleAppForeground();
      }
    });
  }

  // Start auto-sync
  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, this.config.syncInterval);
  }

  // Perform data synchronization
  private async performSync(): Promise<void> {
    if (this.syncStatus.syncInProgress || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.emit('sync_started', { timestamp: new Date().toISOString() });

    try {
      // Sync user data
      await this.syncUserData();

      // Sync courses
      await this.syncCourses();

      // Sync forums
      await this.syncForums();

      // Sync messages
      await this.syncMessages();

      // Sync user progress
      await this.syncUserProgress();

      // Process pending actions
      await this.processPendingActions();

      this.syncStatus.lastSync = new Date().toISOString();
      this.emit('sync_completed', { 
        timestamp: this.syncStatus.lastSync,
        pendingActions: this.syncStatus.pendingActions,
      });

    } catch (error) {
      console.error('Sync error:', error);
      this.emit('sync_error', { 
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  // Sync user data
  private async syncUserData(): Promise<void> {
    try {
      const userData = await apiService.getCurrentUser();
      if (userData.success && userData.data) {
        await storageService.saveUserData(userData.data);
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }

  // Sync courses
  private async syncCourses(): Promise<void> {
    try {
      const courses = await apiService.getCourses();
      if (courses.success && courses.data) {
        await storageService.saveCourses(courses.data);
      }
    } catch (error) {
      console.error('Error syncing courses:', error);
    }
  }

  // Sync forums
  private async syncForums(): Promise<void> {
    try {
      const forums = await apiService.getForums();
      if (forums.success && forums.data) {
        await storageService.saveForums(forums.data);
      }
    } catch (error) {
      console.error('Error syncing forums:', error);
    }
  }

  // Sync messages
  private async syncMessages(): Promise<void> {
    try {
      const forums = await storageService.getForums();
      if (!forums || !Array.isArray(forums)) {
        // Only log in development
        if (__DEV__) {
          console.log('No forums to sync messages for');
        }
        return;
      }
      for (const forum of forums) {
        if (!forum || !forum.id) {
          continue;
        }
        try {
          const messages = await apiService.getMessages(forum.id);
          if (messages.success && messages.data) {
            await storageService.saveMessages(forum.id, messages.data);
          }
        } catch (error) {
          console.error(`Error syncing messages for forum ${forum.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error syncing messages:', error);
    }
  }

  // Sync user progress
  private async syncUserProgress(): Promise<void> {
    try {
      const userProgress = await storageService.getUserProgress();
      if (userProgress && typeof userProgress === 'object') {
        // In a real app, you'd send progress to server
        if (__DEV__) {
          console.log('Syncing user progress:', userProgress);
        }
      } else {
        // Only log in development
        if (__DEV__) {
          console.log('No user progress to sync');
        }
      }
    } catch (error) {
      console.error('Error syncing user progress:', error);
    }
  }

  // Process pending actions
  private async processPendingActions(): Promise<void> {
    try {
      const pendingActions = await storageService.getUnsentActions();
      
      if (!pendingActions || !Array.isArray(pendingActions)) {
        return;
      }
      
      for (const action of pendingActions) {
        if (!action || !action.type) {
          continue;
        }
        try {
          await this.processAction(action);
          if (this.syncStatus.pendingActions > 0) {
            this.syncStatus.pendingActions--;
          }
        } catch (error) {
          console.error('Error processing action:', error);
          // Don't throw - continue processing other actions
        }
      }
    } catch (error) {
      console.error('Error processing pending actions:', error);
    }
  }

  // Process individual action
  private async processAction(action: {
    type: string;
    data: any;
    timestamp: number;
  }): Promise<void> {
    if (!action || !action.type) {
      console.error('Invalid action:', action);
      return;
    }
    
    switch (action.type) {
      case 'send_message':
        await this.processSendMessage(action.data);
        break;
      case 'join_forum':
        await this.processJoinForum(action.data);
        break;
      case 'enroll_course':
        await this.processEnrollCourse(action.data);
        break;
      case 'update_progress':
        await this.processUpdateProgress(action.data);
        break;
      default:
        console.log('Unknown action type:', action.type);
    }
  }

  // Process send message action
  private async processSendMessage(data: any): Promise<void> {
    try {
      const response = await apiService.sendMessage(data.forumId, data.text);
      if (response.success) {
        // Message sent successfully
        console.log('Message sent successfully');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Process join forum action
  private async processJoinForum(data: any): Promise<void> {
    try {
      if (!data || !data.forumId) {
        throw new Error('Invalid forum data');
      }
      const response = await apiService.joinForum(data.forumId);
      if (response.success) {
        console.log('Joined forum successfully');
      }
    } catch (error: any) {
      // Handle "already a member" error gracefully
      const errorMessage = error?.response?.data?.message || error?.message || '';
      if (errorMessage.includes('Already a member') || errorMessage.includes('already a member')) {
        console.log('User is already a member of this forum');
        return; // Don't throw - this is not an error
      }
      console.error('Error joining forum:', error);
      throw error;
    }
  }

  // Process enroll course action
  private async processEnrollCourse(data: any): Promise<void> {
    try {
      const response = await apiService.enrollCourse(data.courseId);
      if (response.success) {
        console.log('Enrolled in course successfully');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  // Process update progress action
  private async processUpdateProgress(data: any): Promise<void> {
    try {
      const response = await apiService.updateCourseProgress(data.courseId, data.progress);
      if (response.success) {
        console.log('Progress updated successfully');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  // Handle API performance
  private handleApiPerformance(data: any): void {
    // Record API response time
    performanceService.recordApiResponseTime(data.endpoint, data.responseTime);
    
    // Check for slow responses
    if (data.responseTime > 5000) {
      this.emit('slow_api_detected', data);
    }
  }

  // Handle memory warning
  private handleMemoryWarning(data: any): void {
    // Clear cache to free memory
    performanceService.clearCache();
    
    // Emit memory warning event
    this.emit('memory_warning', data);
  }

  // Handle error
  private handleError(data: any): void {
    // Log error
    console.error('Application error:', data);
    
    // Emit error event
    this.emit('error', data);
    
    // Send error to analytics (in real app)
    this.sendErrorToAnalytics(data);
  }

  // Handle notification received
  private handleNotificationReceived(notification: any): void {
    // Store notification locally
    const notifications = notificationService.getNotifications();
    notifications.unshift(notification);
    
    // Emit notification event
    this.emit('notification_received', notification);
  }

  // Handle notification action
  private handleNotificationAction(action: any): void {
    // Handle notification tap
    this.emit('notification_action', action);
  }

  // Handle WebSocket notification
  private handleWebSocketNotification(notification: any): void {
    // Show local notification
    notificationService.sendLocalNotification({
      type: notification.type,
      title: notification.title,
      body: notification.message,
      data: notification.data,
    });
  }

  // Handle chat message
  private handleChatMessage(message: any): void {
    // Store message locally
    storageService.addMessage(message.forumId, message);
    
    // Show notification if app is in background
    // Use AppState instead of document.hidden
    const currentAppState = AppState.currentState;
    if (currentAppState === 'background' || currentAppState === 'inactive') {
      notificationService.sendMessageNotification(
        message.user.name,
        message.text,
        message.forumId
      );
    }
  }

  // Handle user status update
  private handleUserStatusUpdate(status: any): void {
    // Update user status in local storage
    this.emit('user_status_update', status);
  }

  // Handle typing indicator
  private handleTypingIndicator(indicator: any): void {
    // Emit typing indicator event
    this.emit('typing_indicator', indicator);
  }

  // Handle app background
  private handleAppBackground(): void {
    // Update user status to away
    websocketService.updateUserStatus('away');
    
    // Emit app background event
    this.emit('app_background', { timestamp: new Date().toISOString() });
  }

  // Handle app foreground
  private handleAppForeground(): void {
    // Update user status to online
    websocketService.updateUserStatus('online');
    
    // Perform sync
    this.performSync();
    
    // Emit app foreground event
    this.emit('app_foreground', { timestamp: new Date().toISOString() });
  }

  // Update sync status
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.emit('sync_status_update', this.syncStatus);
  }

  // Send error to analytics
  private sendErrorToAnalytics(error: any): void {
    // In a real app, you'd send to your analytics service
    console.log('Sending error to analytics:', error);
  }

  // Public methods

  // Get sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Force sync
  async forceSync(): Promise<void> {
    await this.performSync();
  }

  // Disconnect from backend
  disconnect(): void {
    // Stop auto-sync
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Disconnect WebSocket
    websocketService.disconnect();

    // Clear cache
    performanceService.clearCache();

    console.log('Disconnected from backend');
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
          console.error('Error in backend event callback:', error);
        }
      });
    }
  }

  // Get backend configuration
  getConfig(): BackendConfig {
    return { ...this.config };
  }

  // Update backend configuration
  updateConfig(updates: Partial<BackendConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config_updated', this.config);
  }

  // HTTP methods that delegate to backendAPI
  async get<T = any>(endpoint: string): Promise<{ data: T }> {
    const response = await backendAPI.get(endpoint);
    return { data: response.data as T };
  }

  async post<T = any>(endpoint: string, data?: any): Promise<{ data: T }> {
    const response = await backendAPI.post(endpoint, data);
    return { data: response.data as T };
  }

  async put<T = any>(endpoint: string, data?: any): Promise<{ data: T }> {
    const response = await backendAPI.put(endpoint, data);
    return { data: response.data as T };
  }

  async delete<T = any>(endpoint: string): Promise<{ data: T }> {
    const response = await backendAPI.delete(endpoint);
    return { data: response.data as T };
  }
}

// Create and export a singleton instance
export const backendService = BackendService.getInstance();
export const backend = backendService;

// Export types for use in components
export type { BackendConfig, SyncStatus }; 