// Push Notification Service for BigMinds Education App
// Handles push notifications, local notifications, and notification management

// import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface NotificationData {
  id: string;
  type: 'message' | 'achievement' | 'course' | 'forum' | 'system' | 'reminder';
  title: string;
  body: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationSettings {
  enabled: boolean;
  messages: boolean;
  achievements: boolean;
  courses: boolean;
  forums: boolean;
  system: boolean;
  reminders: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notifications: NotificationData[] = [];
  private settings: NotificationSettings = {
    enabled: true,
    messages: true,
    achievements: true,
    courses: true,
    forums: true,
    system: true,
    reminders: true,
    sound: true,
    vibration: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  };

  private constructor() {
    this.configureNotifications();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Configure notification behavior
  private async configureNotifications(): Promise<void> {
    // Set notification handler
    // Notifications.setNotificationHandler({
    //   handleNotification: async () => ({
    //     shouldShowAlert: true,
    //     shouldPlaySound: this.settings.sound,
    //     shouldSetBadge: true,
    //   }),
    // });

    // Request permissions
    await this.requestPermissions();
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    // Simple check for device vs simulator
    const isDevice = Platform.OS !== 'web';
    
    if (!isDevice) {
      console.log('Notifications not available on simulator');
      return false;
    }

    try {
      // const { status: existingStatus } = await Notifications.getPermissionsAsync();
      // let finalStatus = existingStatus;

      // if (existingStatus !== 'granted') {
      //   const { status } = await Notifications.requestPermissionsAsync();
      //   finalStatus = status;
      // }

      // if (finalStatus !== 'granted') {
      //   console.log('Notification permissions not granted');
      //   return false;
      // }

      // Get push token
      await this.getPushToken();
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Get Expo push token
  async getPushToken(): Promise<string | null> {
    try {
      // const token = await Notifications.getExpoPushTokenAsync({
      //   projectId: 'your-project-id', // Replace with your Expo project ID
      // });
      
      // this.expoPushToken = token.data;
      // console.log('Expo push token:', token.data);
      // return token.data;
      return null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Send local notification
  async sendLocalNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>): Promise<string> {
    if (!this.settings.enabled) {
      console.log('Notifications disabled');
      return '';
    }

    // Check quiet hours
    if (this.isInQuietHours()) {
      console.log('In quiet hours, notification suppressed');
      return '';
    }

    // Check notification type settings
    const typeKey = notification.type as keyof NotificationSettings;
    if (typeKey && !this.settings[typeKey]) {
      console.log(`Notifications for ${notification.type} disabled`);
      return '';
    }

    try {
      // const notificationId = await Notifications.scheduleNotificationAsync({
      //   content: {
      //     title: notification.title,
      //     body: notification.body,
      //     data: notification.data || {},
      //     sound: this.settings.sound ? 'default' : undefined,
      //   },
      //   trigger: null, // Send immediately
      // });

      // Add to local notifications list
      const localNotification: NotificationData = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      this.notifications.unshift(localNotification);
      this.emitNotificationReceived(localNotification);

      return localNotification.id;
    } catch (error) {
      console.error('Error sending local notification:', error);
      return '';
    }
  }

  // Send scheduled notification
  async scheduleNotification(
    notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>,
    trigger: any
  ): Promise<string> {
    if (!this.settings.enabled) {
      return '';
    }

    try {
      // const notificationId = await Notifications.scheduleNotificationAsync({
      //   content: {
      //     title: notification.title,
      //     body: notification.body,
      //     data: notification.data || {},
      //     sound: this.settings.sound ? 'default' : undefined,
      //   },
      //   trigger,
      // });

      return Date.now().toString();
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return '';
    }
  }

  // Send course reminder
  async sendCourseReminder(courseId: string, courseTitle: string, dueDate: Date): Promise<void> {
    const notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'> = {
      type: 'reminder',
      title: 'Course Reminder',
      body: `Don't forget to complete "${courseTitle}"!`,
      data: { courseId, dueDate: dueDate.toISOString() },
      actionUrl: `/courses/${courseId}`,
    };

    // Schedule for due date
    const trigger = {
      date: dueDate,
    };

    await this.scheduleNotification(notification, trigger);
  }

  // Send achievement notification
  async sendAchievementNotification(achievementName: string, points: number): Promise<void> {
    const notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'> = {
      type: 'achievement',
      title: '🎉 Achievement Unlocked!',
      body: `You earned "${achievementName}" and ${points} points!`,
      data: { achievementName, points },
      actionUrl: '/profile',
    };

    await this.sendLocalNotification(notification);
  }

  // Send message notification
  async sendMessageNotification(senderName: string, message: string, forumId: string): Promise<void> {
    const notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'> = {
      type: 'message',
      title: `New message from ${senderName}`,
      body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
      data: { senderName, forumId },
      actionUrl: `/forum-chat?forumId=${forumId}`,
    };

    await this.sendLocalNotification(notification);
  }

  // Send forum update notification
  async sendForumUpdateNotification(forumName: string, updateType: string): Promise<void> {
    const notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'> = {
      type: 'forum',
      title: 'Forum Update',
      body: `${updateType} in "${forumName}"`,
      data: { forumName, updateType },
      actionUrl: '/forums',
    };

    await this.sendLocalNotification(notification);
  }

  // Send course update notification
  async sendCourseUpdateNotification(courseTitle: string, updateType: string): Promise<void> {
    const notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'> = {
      type: 'course',
      title: 'Course Update',
      body: `${updateType} in "${courseTitle}"`,
      data: { courseTitle, updateType },
      actionUrl: '/courses',
    };

    await this.sendLocalNotification(notification);
  }

  // Get all notifications
  getNotifications(): NotificationData[] {
    return this.notifications;
  }

  // Get unread notifications
  getUnreadNotifications(): NotificationData[] {
    return this.notifications.filter(notification => !notification.isRead);
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.isRead = true;
    });
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = [];
    // Notifications.dismissAllNotificationsAsync();
  }

  // Get notification settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Update notification settings
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Check if in quiet hours
  private isInQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = this.settings.quietHours.start;
    const end = this.settings.quietHours.end;

    if (start <= end) {
      // Same day (e.g., 09:00 to 17:00)
      return currentTime >= start && currentTime <= end;
    } else {
      // Overnight (e.g., 22:00 to 08:00)
      return currentTime >= start || currentTime <= end;
    }
  }

  // Event listeners for notification handling
  private listeners: Map<string, Function[]> = new Map();

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
          console.error('Error in notification event callback:', error);
        }
      });
    }
  }

  private emitNotificationReceived(notification: NotificationData): void {
    this.emit('notification_received', notification);
  }

  // Handle notification response (when user taps notification)
  async handleNotificationResponse(response: any): Promise<void> {
    const { notification } = response;
    const data = notification.request.content.data;

    // Mark as read
    this.markAsRead(notification.request.identifier);

    // Handle action
    if (data?.actionUrl) {
      // Navigate to the specified URL
      this.emit('notification_action', {
        actionUrl: data.actionUrl,
        data,
      });
    }
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    // return await Notifications.getBadgeCountAsync();
    return 0;
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    // await Notifications.setBadgeCountAsync(count);
  }

  // Cancel scheduled notification
  async cancelNotification(notificationId: string): Promise<void> {
    // await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    // await Notifications.cancelAllScheduledNotificationsAsync();
  }


  // Test notification
  async sendTestNotification(): Promise<void> {
    const notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'> = {
      type: 'system',
      title: 'Test Notification',
      body: 'This is a test notification from BigMinds!',
      data: { test: true },
    };

    await this.sendLocalNotification(notification);
  }
}

// Create and export a singleton instance
export const notificationService = NotificationService.getInstance();

// Export types for use in components
export type { NotificationData, NotificationSettings }; 