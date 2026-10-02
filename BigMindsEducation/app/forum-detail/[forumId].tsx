import React, { useState, useEffect, useCallback } from 'react';
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
  Dimensions,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, responsive } from '../theme/colors';
import { forumService, Forum, Topic, ForumPost } from '../services/forumService';
import { useAuth } from '../context/AuthContext';
import { getFullUrl } from '../services/backendAPI';

const { width } = Dimensions.get('window');

export default function ForumDetailScreen() {
  const { forumId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [forum, setForum] = useState<Forum | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<'owner' | 'member' | 'pending' | 'banned' | 'none'>('none');
  const [joinKey, setJoinKey] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Validate forumId on mount only
  useEffect(() => {
    if (!forumId || forumId === 'undefined' || forumId === 'null') {
      Alert.alert('Error', 'Invalid forum link.');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(tabs)/forums');
      }
    }
  }, []);

  // Reload data every time this screen comes into focus (same pattern as forums list)
  // This ensures that when navigating back to this screen, membership state is always fresh
  useFocusEffect(
    useCallback(() => {
      if (forumId && forumId !== 'undefined' && forumId !== 'null') {
        console.log('🔍 [FORUM DETAIL] Screen focused, reloading forum:', forumId);
        loadForumData();
      }
    }, [forumId])
  );

  // Re-run membership check if user auth state loads after the forum data
  useEffect(() => {
    if (forum && user) {
      checkMembershipStatus(forum);
    }
  }, [(user as any)?._id, (user as any)?.id]);

  const loadForumData = async () => {
    try {
      setLoading(true);
      const [forumResponse, topicsResponse] = await Promise.all([
        forumService.getForum(forumId as string),
        forumService.getForumTopics(forumId as string)
      ]);

      const forumData = forumResponse?.data || forumResponse;
      const topicsData = topicsResponse?.data || [];
      
      setForum(forumData);
      setTopics(Array.isArray(topicsData) ? topicsData : []);

      // Check membership status
      await checkMembershipStatus(forumData);
      console.log('✅ [FORUM DETAIL] Forum data loaded successfully');
    } catch (error: any) {
      console.error('❌ [FORUM DETAIL] Error loading forum data:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load forum data';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkMembershipStatus = async (forumData: Forum) => {
    // Support both user._id (MongoDB style) and user.id (transformed style)
    const currentUserId = (user as any)?._id || (user as any)?.id;
    if (!currentUserId || !forumData) {
      console.log('🔍 [MEMBERSHIP CHECK] No user or forum data');
      setMembershipStatus('none');
      return;
    }

    try {
      console.log('🔍 [MEMBERSHIP CHECK] Checking membership for forum:', forumData._id, 'userId:', currentUserId);

      // ── 1. Check if user is the owner via forum's createdBy ────────────────
      const ownerId = (forumData.createdBy as any)?._id ||
                      (forumData.createdBy as any)?.id ||
                      (forumData.createdById as any)?._id ||
                      forumData.createdById ||
                      (typeof forumData.owner === 'object' && forumData.owner ? (forumData.owner as any)?._id : null) ||
                      (typeof forumData.owner === 'string' ? forumData.owner : null) ||
                      forumData.ownerId;

      if (ownerId && (currentUserId === ownerId || currentUserId.toString() === ownerId.toString())) {
        console.log('✅ [MEMBERSHIP CHECK] User is owner (via createdBy)');
        setMembershipStatus('owner');
        return;
      }

      // ── 2. Check userMembership embedded in forum response (from getForum) ──
      if (forumData.userMembership) {
        const { status, role } = forumData.userMembership;
        console.log('✅ [MEMBERSHIP CHECK] userMembership in forum data — status:', status, 'role:', role);
        if (role === 'admin') { setMembershipStatus('owner'); }
        else if (status === 'pending') { setMembershipStatus('pending'); }
        else if (status === 'banned') { setMembershipStatus('banned'); }
        else { setMembershipStatus('member'); }
        return;
      }

      // ── 3. ALWAYS fetch fresh memberships list as the reliable source ──────
      console.log('🔍 [MEMBERSHIP CHECK] Fetching fresh membership list...');
      const membershipsResponse = await forumService.getUserForumMemberships();
      const memberships: any[] = Array.isArray(membershipsResponse)
        ? membershipsResponse
        : Array.isArray((membershipsResponse as any)?.data)
        ? (membershipsResponse as any).data
        : [];

      console.log('🔍 [MEMBERSHIP CHECK] Total memberships found:', memberships.length);

      const membership = memberships.find((entry: any) => {
        const entryForumId =
          (entry?.forumId && typeof entry.forumId === 'object' ? entry.forumId._id : entry?.forumId) ||
          (entry?.forum && typeof entry.forum === 'object' ? entry.forum._id : entry?.forum);
        return entryForumId && entryForumId.toString() === forumData._id.toString();
      });

      if (membership) {
        const { status, role } = membership;
        console.log('✅ [MEMBERSHIP CHECK] Found in memberships list — status:', status, 'role:', role);
        if (role === 'admin') { setMembershipStatus('owner'); }
        else if (status === 'pending') { setMembershipStatus('pending'); }
        else if (status === 'banned') { setMembershipStatus('banned'); }
        else { setMembershipStatus('member'); }
        return;
      }

      console.log('❌ [MEMBERSHIP CHECK] No membership found — user is not a member');
      setMembershipStatus('none');
    } catch (error) {
      console.error('❌ [MEMBERSHIP CHECK] Error during check:', error);
      setMembershipStatus('none');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadForumData();
    setRefreshing(false);
  };

  const handleJoinForum = async () => {
    if (!forum) return;

    if (!forum.isPublic && forum.joinKey) {
      if (!joinKey.trim()) {
        Alert.alert('Error', 'Join key is required for private forums');
        return;
      }
      if (joinKey.trim().toUpperCase() !== forum.joinKey.toUpperCase()) {
        Alert.alert('Error', 'Invalid join key');
        return;
      }
    }

    try {
      setJoining(true);
      const response = await forumService.joinForum(forumId as string, { 
        joinKey: !forum.isPublic ? joinKey.trim() : undefined 
      });
      
      console.log('✅ [JOIN FORUM] Join response:', response);
      
      // Check if membership was created or already exists
      const resData = response?.data as any;
      if (resData?.membership || resData?.data?.membership || resData?.status) {
        const membership = resData.membership || resData.data?.membership || resData;
        const status = membership.status;
        
        if (status === 'pending') {
          setMembershipStatus('pending');
          Alert.alert('Success', 'Join request sent! Waiting for approval.');
        } else if (status === 'approved' || status === 'active') {
          setMembershipStatus('member');
          Alert.alert('Success', 'Joined forum successfully!');
        }
      } else {
        // Fallback: refresh forum data to get updated membership
        await loadForumData();
        Alert.alert('Success', 'Joined forum successfully!');
      }
      
      setShowJoinModal(false);
      setJoinKey('');
    } catch (error: any) {
      console.error('❌ [JOIN FORUM] Error joining forum:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to join forum';
      
      // Handle "already a member" error gracefully
      if (errorMessage.includes('Already a member') || 
          errorMessage.includes('already a member') ||
          errorMessage.includes('already a member of this forum')) {
        // User is already a member, refresh the forum data to update UI
        console.log('ℹ️ [JOIN FORUM] User is already a member, refreshing data...');
        setMembershipStatus('member'); // Set status immediately
        Alert.alert('Info', 'You are already a member of this forum');
        setShowJoinModal(false);
        setJoinKey('');
        await loadForumData(); // Refresh to get latest data
      } else if (errorMessage.includes('pending approval') || errorMessage.includes('pending')) {
        setMembershipStatus('pending');
        Alert.alert('Info', 'Your join request is pending approval');
        setShowJoinModal(false);
        setJoinKey('');
        await loadForumData();
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setJoining(false);
    }
  };

  const [deleting, setDeleting] = useState(false);

  const handleLeaveForum = async () => {
    if (!forum) return;

    Alert.alert(
      'Leave Forum',
      'Are you sure you want to leave this forum?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLeaving(true);
              await forumService.leaveForum(forumId as string);
              Alert.alert('Success', 'Left forum successfully');
              await loadForumData();
            } catch (error: any) {
              console.error('Error leaving forum:', error);
              const errorMessage = error?.response?.data?.message || error?.message || 'Failed to leave forum';
              Alert.alert('Error', errorMessage);
            } finally {
              setLeaving(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteForum = async () => {
    if (!forum) return;

    Alert.alert(
      'Delete Forum',
      'Are you sure you want to completely delete this forum? This will remove all members, topics, and messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await forumService.deleteForum(forumId as string);
              Alert.alert('Success', 'Forum deleted successfully');
              router.replace('/(tabs)/forums');
            } catch (error: any) {
              console.error('Error deleting forum:', error);
              const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete forum';
              Alert.alert('Error', errorMessage);
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      Alert.alert('Validation', 'Please provide both title and content');
      return;
    }

    try {
      setCreatingTopic(true);
      await forumService.createTopic(forumId as string, {
        title: newTopicTitle.trim(),
        content: newTopicContent.trim(),
        category: 'general',
        tags: []
      });
      
      Alert.alert('Success', 'Topic created successfully!');
      setNewTopicTitle('');
      setNewTopicContent('');
      setShowNewTopicForm(false);
      await loadForumData();
    } catch (error: any) {
      console.error('Error creating topic:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create topic';
      Alert.alert('Error', errorMessage);
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleTopicPress = (topic: Topic) => {
    const route = `/topic-detail/${topic._id}`;
    console.log('🔍 [FORUM DETAIL] Navigating to topic:', route);
    router.push(route as any);
  };

  const isOwner = membershipStatus === 'owner' || user?.role === 'teacher';
  const canCreateTopic = isOwner || membershipStatus === 'member';
  const canJoin = !isOwner && membershipStatus === 'none' && user?.role !== 'teacher'; // Never allow join button for the owner/teacher
  const canLeave = membershipStatus === 'member';
  const canDelete = isOwner;
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 [FORUM DETAIL] Membership status changed:', {
      membershipStatus,
      canJoin,
      canLeave,
      canCreateTopic,
    });
  }, [membershipStatus, canJoin, canLeave, canCreateTopic]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading forum...</Text>
      </View>
    );
  }

  if (!forum) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Forum not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{forum.title}</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>{forum.memberCount || 0} members</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Forum Info */}
        <View style={styles.forumInfo}>
          <View style={styles.thumbnailContainer}>
            {forum.thumbnail && (forum.thumbnail.includes('/') || forum.thumbnail.includes('\\')) ? (
              <Image 
                source={{ uri: getFullUrl(forum.thumbnail) || '' }} 
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.thumbnail}>{forum.thumbnail || '💬'}</Text>
            )}
          </View>
          <View style={styles.forumDetails}>
            <Text style={styles.forumDescription}>{forum.description}</Text>
            <View style={styles.forumMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={16} color="#666" />
                <Text style={styles.metaText}>{forum.memberCount || 0} members</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="chatbubbles" size={16} color="#666" />
                <Text style={styles.metaText}>{forum.topicCount || 0} topics</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.metaText}>
                  {forum.lastActivity ? new Date(forum.lastActivity).toLocaleDateString() : 'No activity'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Membership Status Badge */}
        {membershipStatus !== 'none' && (
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>
              {membershipStatus === 'owner' ? '👑 Owner' :
               membershipStatus === 'member' ? '✅ Member' :
               membershipStatus === 'pending' ? '⏳ Pending Approval' :
               '🚫 Banned'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {canJoin && (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={() => {
                if (!forum.isPublic) {
                  setShowJoinModal(true);
                } else {
                  handleJoinForum();
                }
              }}
            >
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={styles.actionButtonText}>Join Forum</Text>
            </TouchableOpacity>
          )}
          
          {canLeave && (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={handleLeaveForum}
              disabled={leaving}
            >
              {leaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="person-remove" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Leave Forum</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteForum}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Delete Forum</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {canCreateTopic && (
            <TouchableOpacity
              style={[styles.actionButton, styles.createTopicButton]}
              onPress={() => setShowNewTopicForm(true)}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.actionButtonText}>New Topic</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Topics List */}
        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>Topics ({topics.length})</Text>
          
          {topics.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No topics yet</Text>
              {canCreateTopic && (
                <Text style={styles.emptyStateSubtext}>Be the first to start a discussion!</Text>
              )}
            </View>
          ) : (
            <View style={styles.topicsList}>
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic._id}
                  style={styles.topicCard}
                  onPress={() => handleTopicPress(topic)}
                >
                  <View style={styles.topicHeader}>
                    <Text style={styles.topicTitle} numberOfLines={2}>{topic.title}</Text>
                    {topic.isPinned && (
                      <Ionicons name="pin" size={16} color={colors.primary} />
                    )}
                  </View>
                  <Text style={styles.topicContent} numberOfLines={2}>{topic.content}</Text>
                  <View style={styles.topicFooter}>
                    <View style={styles.topicAuthor}>
                      <Ionicons name="person" size={14} color={colors.textSecondary} />
                      <Text style={styles.topicAuthorText}>
                        {((topic.author || topic.authorId) as any)?.firstName || 'Unknown'}
                      </Text>
                    </View>
                    <View style={styles.topicStats}>
                      <View style={styles.topicStat}>
                        <Ionicons name="chatbubble" size={14} color={colors.textSecondary} />
                        <Text style={styles.topicStatText}>{topic.replyCount || 0}</Text>
                      </View>
                      <View style={styles.topicStat}>
                        <Ionicons name="eye" size={14} color={colors.textSecondary} />
                        <Text style={styles.topicStatText}>{topic.viewCount || 0}</Text>
                      </View>
                      <Text style={styles.topicDate}>
                        {new Date(topic.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Join Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Private Forum</Text>
            <Text style={styles.modalSubtitle}>Enter the join key to join this forum</Text>
            <TextInput
              style={styles.joinKeyInput}
              placeholder="Enter join key"
              value={joinKey}
              onChangeText={setJoinKey}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinKey('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.joinModalButton]}
                onPress={handleJoinForum}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Topic Modal */}
      <Modal
        visible={showNewTopicForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewTopicForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Topic</Text>
            <TextInput
              style={styles.topicInput}
              placeholder="Topic Title"
              value={newTopicTitle}
              onChangeText={setNewTopicTitle}
              maxLength={100}
            />
            <TextInput
              style={[styles.topicInput, styles.topicContentInput]}
              placeholder="Topic Content"
              value={newTopicContent}
              onChangeText={setNewTopicContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewTopicForm(false);
                  setNewTopicTitle('');
                  setNewTopicContent('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createTopicModalButton]}
                onPress={handleCreateTopic}
                disabled={creatingTopic || !newTopicTitle.trim() || !newTopicContent.trim()}
              >
                {creatingTopic ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerStats: {
    marginLeft: spacing.md,
  },
  headerStatsText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  forumInfo: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    ...shadows.sm,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  thumbnail: {
    fontSize: 32,
  },
  forumDetails: {
    flex: 1,
  },
  forumDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  forumMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  membershipBadge: {
    backgroundColor: colors.primary + '20',
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  membershipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  joinButton: {
    backgroundColor: colors.success,
  },
  leaveButton: {
    backgroundColor: colors.error,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  createTopicButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  topicsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  topicsList: {
    gap: spacing.md,
  },
  topicCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  topicTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  topicContent: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicAuthorText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  topicStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicStatText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  topicDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  joinKeyInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicContentInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  joinModalButton: {
    backgroundColor: colors.success,
  },
  createTopicModalButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

