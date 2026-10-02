import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { forumService, Topic, ForumPost } from '../services/forumService';
import { useAuth } from '../context/AuthContext';

const TopicDetailScreen = () => {
  const { topicId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  // Edit state
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadTopicData();
  }, [topicId]);

  const loadTopicData = async () => {
    try {
      setLoading(true);
      const [topicResponse, postsResponse] = await Promise.all([
        forumService.getTopic(topicId as string),
        forumService.getTopicPosts(topicId as string),
      ]);
      setTopic(topicResponse?.data || topicResponse);
      setPosts(postsResponse?.data || []);
    } catch (error) {
      console.error('Error loading topic data:', error);
      Alert.alert('Error', 'Failed to load topic data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopicData();
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    try {
      setCreatingPost(true);
      await forumService.createPost(topicId as string, { content: newPost.trim() });
      setNewPost('');
      await loadTopicData();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setCreatingPost(false);
    }
  };

  // ── Open options for a post the current user owns ──────────────────────────
  const handlePostOptions = (post: ForumPost) => {
    const isOwner =
      post.author?._id === user?._id || post.author?._id === (user as any)?.id;

    if (!isOwner) return; // Only owner sees actions

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit Message', 'Delete Message'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) openEdit(post);
          if (buttonIndex === 2) confirmDelete(post);
        }
      );
    } else {
      // Android — use Alert with buttons
      Alert.alert('Message Options', 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        { text: '✏️  Edit', onPress: () => openEdit(post) },
        { text: '🗑️  Delete', style: 'destructive', onPress: () => confirmDelete(post) },
      ]);
    }
  };

  const openEdit = (post: ForumPost) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const confirmDelete = (post: ForumPost) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeletePost(post),
        },
      ]
    );
  };

  const handleDeletePost = async (post: ForumPost) => {
    try {
      await forumService.deletePost(topicId as string, post._id);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPost || !editContent.trim()) return;
    if (editContent.trim() === editingPost.content) {
      setEditingPost(null);
      return;
    }
    try {
      setSavingEdit(true);
      const response = await forumService.updatePost(topicId as string, editingPost._id, {
        content: editContent.trim(),
      });
      const updated = response?.data;
      if (updated) {
        setPosts((prev) => prev.map((p) => (p._id === editingPost._id ? updated : p)));
      }
      setEditingPost(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to edit message');
    } finally {
      setSavingEdit(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const isMyPost = (post: any) => {
    if (!user) return false;
    const author = post.author || post.authorId;
    return author?._id === user._id || author?._id === (user as any)?.id || author === user._id || author === (user as any)?.id;
  };

  const getAuthor = (post: any) => post.author || post.authorId || {};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading topic...</Text>
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Topic not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getTopicAuthor = (t: any) => t.author || t.authorId || {};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {topic.title}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Topic Details */}
        <View style={styles.topicCard}>
          <View style={styles.topicHeader}>
            <View style={styles.authorInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getTopicAuthor(topic)?.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>
                  {getTopicAuthor(topic)?.firstName} {getTopicAuthor(topic)?.lastName}
                </Text>
                <Text style={styles.topicDate}>{formatDate(topic.createdAt)}</Text>
              </View>
            </View>
            {topic.isPinned && <Ionicons name="pin" size={16} color={colors.warning} />}
          </View>

          <Text style={styles.topicContent}>{topic.content}</Text>

          <View style={styles.topicMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="eye" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{topic.viewCount} views</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="chatbubbles" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{topic.replyCount} replies</Text>
            </View>
            {topic.tags && topic.tags.length > 0 && (
              <View style={styles.tags}>
                {topic.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Posts / Replies */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Replies ({posts.length})</Text>

          {posts.map((post) => (
            <TouchableOpacity
              key={post._id}
              style={[
                styles.postCard,
                isMyPost(post) && styles.myPostCard,
              ]}
              onLongPress={() => handlePostOptions(post)}
              delayLongPress={400}
              activeOpacity={0.85}
            >
              <View style={styles.postHeader}>
                <View style={styles.authorInfo}>
                  <View style={[styles.avatar, isMyPost(post) && styles.myAvatar]}>
                    <Text style={styles.avatarText}>
                      {getAuthor(post)?.firstName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <View>
                    <View style={styles.nameRow}>
                      <Text style={styles.authorName}>
                        {getAuthor(post)?.firstName} {getAuthor(post)?.lastName}
                      </Text>
                      {isMyPost(post) && (
                        <Text style={styles.youBadge}>You</Text>
                      )}
                    </View>
                    <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
                  </View>
                </View>

                <View style={styles.postHeaderRight}>
                  {post.isSolution && (
                    <View style={styles.solutionBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={styles.solutionText}>Solution</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.isEdited && (
                <Text style={styles.editedLabel}>
                  ✏️ edited {post.editedAt ? formatDate(post.editedAt) : ''}
                </Text>
              )}

              <View style={styles.postActions}>
                {isMyPost(post) && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteInline]}
                    onPress={() => confirmDelete(post)}
                  >
                    <Ionicons name="trash-outline" size={15} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {posts.length === 0 && (
            <View style={styles.emptyPosts}>
              <Ionicons name="chatbubble-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No replies yet. Be the first to reply!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create New Post */}
      <View style={styles.createPostSection}>
        <TextInput
          style={styles.postInput}
          placeholder="Write your reply..."
          placeholderTextColor={colors.textLight}
          value={newPost}
          onChangeText={setNewPost}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.postButton, !newPost.trim() && styles.postButtonDisabled]}
          onPress={handleCreatePost}
          disabled={!newPost.trim() || creatingPost}
        >
          {creatingPost ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.postButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Edit Modal ─────────────────────────────────────────────────────────── */}
      <Modal
        visible={!!editingPost}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingPost(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Message</Text>
              <TouchableOpacity onPress={() => setEditingPost(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              autoFocus
              maxLength={1000}
              placeholder="Edit your message..."
              placeholderTextColor={colors.textLight}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setEditingPost(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.saveBtn,
                  (!editContent.trim() || savingEdit) && styles.saveBtnDisabled,
                ]}
                onPress={handleSaveEdit}
                disabled={!editContent.trim() || savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: { marginTop: spacing.md, fontSize: 16, color: colors.textSecondary },
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: { fontSize: 18, color: colors.error, marginBottom: spacing.lg },
  backButton: {
    padding: spacing.md, backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  backButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: { marginRight: spacing.md },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: 'white' },
  content: { flex: 1 },
  // Topic
  topicCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  topicDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  topicContent: { fontSize: 16, lineHeight: 24, color: colors.textPrimary, marginBottom: spacing.md },
  topicMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md, marginBottom: spacing.sm },
  metaText: { fontSize: 12, color: colors.textSecondary, marginLeft: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  tag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm, marginRight: spacing.sm, marginBottom: spacing.xs,
  },
  tagText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  // Posts
  postsSection: { margin: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md },
  postCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  myPostCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  postHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  authorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm,
  },
  myAvatar: { backgroundColor: colors.primary },
  avatarText: { color: 'white', fontSize: 18, fontWeight: '600' },
  authorName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  youBadge: {
    fontSize: 11, color: colors.primary, fontWeight: '700',
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 8,
  },
  postDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  optionsBtn: { padding: 4 },
  solutionBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  solutionText: { fontSize: 12, color: colors.success, fontWeight: '600', marginLeft: spacing.xs },
  postContent: { fontSize: 14, lineHeight: 20, color: colors.textPrimary, marginBottom: spacing.sm },
  editedLabel: { fontSize: 11, color: colors.textLight, marginBottom: spacing.sm, fontStyle: 'italic' },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteInline: {},
  actionText: { fontSize: 12, color: colors.textSecondary },
  emptyPosts: { alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  // Compose bar
  createPostSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  postInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  postButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  postButtonDisabled: { backgroundColor: colors.disabled ?? '#ccc' },
  postButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  // Edit modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  editInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalBtn: {
    flex: 1, paddingVertical: spacing.md,
    borderRadius: borderRadius.md, alignItems: 'center',
  },
  cancelBtn: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { backgroundColor: colors.primary },
  saveBtnDisabled: { backgroundColor: colors.disabled ?? '#ccc' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: 'white' },
});

export default TopicDetailScreen;