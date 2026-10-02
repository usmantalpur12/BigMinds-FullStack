import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { backendAPI } from '../services/backendAPI';

interface ChatMessage {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
}

interface ForumChatProps {
  forumId: string;
  visible: boolean;
  onClose: () => void;
}

const ForumChat: React.FC<ForumChatProps> = ({ forumId, visible, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible || !user || !forumId) return;

    // Initialize Socket.IO connection
    const getBaseURL = () => {
      if (__DEV__) {
        return 'http://192.168.18.197:5000'; // Adjust to your backend URL
      }
      return 'https://api.bigminds.education';
    };

    const newSocket = io(getBaseURL(), {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      // Join forum room
      newSocket.emit('join_forum', forumId);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Listen for forum messages
    newSocket.on('forum_message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    // Listen for typing indicators
    newSocket.on('forum_typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      // Handle typing indicator (optional)
      console.log('User typing:', data);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave_forum', forumId);
        newSocket.disconnect();
      }
    };
  }, [visible, forumId, user]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !user) return;

    const messageData = {
      forumId,
      message: newMessage.trim(),
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
    };

    socket.emit('forum_message', messageData);
    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.user.id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.messageContent}>
          {!isOwnMessage && (
            <Text style={styles.userName}>{item.user.name}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownBubble : styles.otherBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.text}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forum Chat</Text>
        <View style={styles.headerRight}>
          <View style={[styles.statusIndicator, isConnected && styles.statusConnected]} />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
          editable={isConnected}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || !isConnected) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || !isConnected}
        >
          <Ionicons
            name="send"
            size={20}
            color={newMessage.trim() && isConnected ? 'white' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  statusConnected: {
    backgroundColor: colors.success,
  },
  closeButton: {
    padding: spacing.xs,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  messageContent: {
    maxWidth: '75%',
  },
  userName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
});

export default ForumChat;

