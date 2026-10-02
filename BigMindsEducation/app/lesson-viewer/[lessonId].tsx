import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { colors, spacing, borderRadius } from '../theme/colors';
import { aiService, AIMessage } from '../services/aiService';
import { getFullUrl } from '../services/backendAPI';

const { width } = Dimensions.get('window');

const LessonViewerScreen = () => {
  const router = useRouter();
  const { lessonId, courseId, videoUrl, title } = useLocalSearchParams();
  
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const videoRef = useRef<Video>(null);

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSending(true);

    try {
      // Create a contextual message injecting the lesson details behind the scenes
      // if this is the first message about the lesson topic.
      let contextualMessage = inputMessage.trim();
      if (messages.length === 0) {
        contextualMessage = `(Context: The student is currently watching a lesson titled "${title}"). \n\n${inputMessage.trim()}`;
      }

      const response = await aiService.courseHelper(
        courseId as string,
        contextualMessage,
        messages
      );

      const aiMessage: AIMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('AI chat error:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error answering your question. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {videoUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: getFullUrl(videoUrl as string) || '' }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            style={styles.videoPlayer}
          />
        ) : (
          <View style={styles.noVideoContainer}>
            <Ionicons name="videocam-off" size={48} color={colors.textSecondary} />
            <Text style={styles.noVideoText}>Video unavailable</Text>
          </View>
        )}
      </View>

      {/* AI Chat Header */}
      <View style={styles.chatHeader}>
        <Ionicons name="sparkles" size={20} color={colors.primary} />
        <Text style={styles.chatTitle}>AI Lesson Assistant</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Stuck on something in this video? Ask me for a detailed explanation of the concepts covered in "{title}".
            </Text>
          </View>
        )}

        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userMessageText : styles.aiMessageText,
                ]}
              >
                {message.content}
              </Text>
            </View>
          </View>
        ))}

        {sending && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={[styles.messageBubble, styles.aiBubble, { flexDirection: 'row', alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.messageText, styles.aiMessageText, { marginLeft: 8 }]}>
                Thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Chat Input Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question about the lesson..."
          placeholderTextColor={colors.textSecondary}
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputMessage.trim() || sending}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputMessage.trim() && !sending ? colors.surface : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  videoContainer: {
    width: '100%',
    height: width * (9 / 16),
    backgroundColor: 'black',
  },
  videoPlayer: {
    flex: 1,
  },
  noVideoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontSize: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatTitle: {
    marginLeft: spacing.sm,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
  },
  welcomeContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
  },
  welcomeText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.surface,
  },
  aiMessageText: {
    color: colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});

export default LessonViewerScreen;
