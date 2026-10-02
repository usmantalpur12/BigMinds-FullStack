import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { forumService, Forum } from '../services/forumService';
import { useAuth } from '../context/AuthContext';
import ForumFeatures from '../components/ForumFeatures';

interface Topic {
  _id: string;
  title: string;
  content: string;
  author: {
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
}

const ForumDetailScreen = () => {
  const router = useRouter();
  const { forumId } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [forum, setForum] = useState<Forum | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinKey, setJoinKey] = useState('');
  const [showForumFeatures, setShowForumFeatures] = useState(false);

  useEffect(() => {
    loadForumData();
  }, [forumId]);

  const loadForumData = async () => {
    try {
      const [forumData, topicsData] = await Promise.all([
        forumService.getForum(forumId as string),
        forumService.getForumTopics(forumId as string),
      ]);
      
      setForum(forumData.data);
      setTopics(topicsData.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load forum');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadForumData();
  };

  const handleJoinForum = async () => {
    try {
      // Handle both isPublic and isPrivate fields
      const isPublicForum = forum && (forum.isPublic !== false && !forum.isPrivate);
      const isPrivateForum = forum && (forum.isPrivate || (forum.isPublic === false));
      
      if (isPublicForum) {
        // Public forum - join directly
        await forumService.joinForum(forumId as string, { message: joinMessage });
        Alert.alert('Success', 'Successfully joined the forum!');
      } else if (isPrivateForum) {
        // Private forum - require join key
        if (!joinKey || !joinKey.trim()) {
          Alert.alert('Error', 'Join key is required for private forums');
          return;
        }
        await forumService.joinForum(forumId as string, { joinKey: joinKey.trim() });
        Alert.alert('Success', 'Successfully joined the forum!');
      } else {
        // Fallback
        await forumService.joinForum(forumId as string, { message: joinMessage, joinKey: joinKey });
        Alert.alert('Success', forum?.requiresApproval ? 'Join request sent successfully!' : 'Successfully joined the forum!');
      }
      setShowJoinModal(false);
      setJoinMessage('');
      setJoinKey('');
      loadForumData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to join forum';
      
      // Handle "already a member" error gracefully
      if (errorMessage.includes('Already a member') || errorMessage.includes('already a member')) {
        Alert.alert('Info', 'You are already a member of this forum');
        setShowJoinModal(false);
        setJoinMessage('');
        setJoinKey('');
        loadForumData();
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleLeaveForum = () => {
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
              await forumService.leaveForum(forumId as string);
              Alert.alert('Success', 'You have left the forum');
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave forum');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      general: '💬',
      academic: '📚',
      programming: '💻',
      medical: '🏥',
      engineering: '⚙️',
      business: '💼',
      study: '📖',
      career: '🎯',
      technology: '🚀',
      science: '🔬',
    };
    return icons[category] || '💬';
  };

  const getMembershipStatus = () => {
    if (!forum?.userMembership) return null;
    
    switch (forum.userMembership.status) {
      case 'approved':
      case 'active':
        return { text: 'Member', color: '#10B981', icon: 'checkmark-circle' };
      case 'pending':
        return { text: 'Pending', color: '#F59E0B', icon: 'time' };
      case 'banned':
        return { text: 'Banned', color: '#EF4444', icon: 'ban' };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading forum...</Text>
      </View>
    );
  }

  if (!forum) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Forum not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const membershipStatus = getMembershipStatus();
  const isMember = forum.userMembership?.status === 'approved' || forum.userMembership?.status === 'active';
  const isPending = forum.userMembership?.status === 'pending';
  const isAdmin = forum.userMembership?.role === 'admin';
  const isModerator = forum.userMembership?.role === 'moderator';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{forum.title}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Forum Info */}
        <View style={styles.forumInfo}>
          <View style={styles.forumHeader}>
            <Text style={styles.forumTitle}>{forum.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(forum.category)}</Text>
              <Text style={styles.categoryText}>{forum.category}</Text>
            </View>
          </View>

          <Text style={styles.forumDescription}>{forum.description}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{forum.memberCount}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{forum.topicCount}</Text>
              <Text style={styles.statLabel}>Topics</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{forum.messageCount}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
          </View>

          {/* Tags */}
          {forum.tags && forum.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {forum.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Membership Status Badge */}
          {membershipStatus && (
            <View style={[styles.membershipStatus, { backgroundColor: membershipStatus.color + '15', padding: 10, borderRadius: 8 }]}>
              <Ionicons name={membershipStatus.icon as any} size={20} color={membershipStatus.color} />
              <Text style={[styles.membershipText, { color: membershipStatus.color }]}>
                {membershipStatus.text}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isMember && !isPending ? (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => setShowJoinModal(true)}
              >
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>
                  {(forum.isPrivate || forum.isPublic === false) ? 'Join Private Forum' : forum.requiresApproval ? 'Request to Join' : 'Join Forum'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.memberActions}>
                {(isMember) && (
                  <>
                    <TouchableOpacity
                      style={styles.createTopicButton}
                      onPress={() => router.push(`/create-topic?forumId=${forumId}` as any)}
                    >
                      <Ionicons name="add" size={20} color="#4F46E5" />
                      <Text style={styles.createTopicText}>Create Topic</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.featuresButton}
                      onPress={() => setShowForumFeatures(true)}
                    >
                      <Ionicons name="apps" size={20} color="#4F46E5" />
                      <Text style={styles.featuresText}>Features</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {(isAdmin || isModerator) && (
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => router.push(`/forum-settings/${forumId}` as any)}
                  >
                    <Ionicons name="settings" size={20} color="#6B7280" />
                    <Text style={styles.manageText}>Manage</Text>
                  </TouchableOpacity>
                )}

                {isMember && (
                  <TouchableOpacity
                    style={styles.leaveButton}
                    onPress={handleLeaveForum}
                  >
                    <Ionicons name="exit" size={20} color="#EF4444" />
                    <Text style={styles.leaveText}>Leave</Text>
                  </TouchableOpacity>
                )}

                {isPending && (
                  <View style={{ flex: 1, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F59E0B', alignItems: 'center' }}>
                    <Text style={{ color: '#F59E0B', fontWeight: '600' }}>Join Request Pending</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Topics */}
        <View style={styles.topicsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Topics</Text>
            <TouchableOpacity onPress={() => router.push(`/forum-topics/${forumId}` as any)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {topics.length > 0 ? (
            topics.map((topic) => (
              <TouchableOpacity
                key={topic._id}
                style={styles.topicItem}
                onPress={() => router.push(`/topic-detail/${topic._id}`)}
              >
                <View style={styles.topicHeader}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  {topic.isPinned && (
                    <Ionicons name="pin" size={16} color="#F59E0B" />
                  )}
                </View>
                <Text style={styles.topicContent} numberOfLines={2}>
                  {topic.content}
                </Text>
                <View style={styles.topicFooter}>
                  <View style={styles.topicAuthor}>
                    <Text style={styles.authorName}>
                      {topic.author.firstName} {topic.author.lastName}
                    </Text>
                  </View>
                  <View style={styles.topicStats}>
                    <View style={styles.stat}>
                      <Ionicons name="chatbubble" size={14} color="#6B7280" />
                      <Text style={styles.statText}>{topic.replyCount}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Ionicons name="eye" size={14} color="#6B7280" />
                      <Text style={styles.statText}>{topic.viewCount}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No topics yet</Text>
              <Text style={styles.emptySubtext}>
                {isMember ? 'Be the first to start a discussion!' : 'Join the forum to start discussions'}
              </Text>
            </View>
          )}
        </View>

        {/* Rules */}
        {forum.rules.length > 0 && (
          <View style={styles.rulesSection}>
            <Text style={styles.sectionTitle}>Forum Rules</Text>
            {forum.rules.map((rule, index) => (
              <View key={index} style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>{index + 1}.</Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Join Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Forum</Text>
            <Text style={styles.modalDescription}>
              {(forum.isPrivate || forum.isPublic === false)
                ? 'This is a private forum. Please enter the join key to join.'
                : forum.requiresApproval
                ? 'Send a request to join this forum. The admin will review your request.'
                : 'You will be added to this forum immediately.'}
            </Text>
            
            {(forum.isPrivate || forum.isPublic === false) && (
              <TextInput
                style={styles.messageInput}
                value={joinKey}
                onChangeText={setJoinKey}
                placeholder="Enter join key"
                secureTextEntry
                autoCapitalize="characters"
              />
            )}
            
            {!forum.isPrivate && forum.requiresApproval && (
              <TextInput
                style={styles.messageInput}
                value={joinMessage}
                onChangeText={setJoinMessage}
                placeholder="Optional message to admin"
                multiline
                numberOfLines={3}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleJoinForum}
              >
                <Text style={styles.confirmButtonText}>
                  {(forum.isPrivate || forum.isPublic === false) ? 'Join with Key' : forum.requiresApproval ? 'Send Request' : 'Join Forum'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Forum Features Modal */}
      <ForumFeatures
        forumId={forumId as string}
        visible={showForumFeatures}
        onClose={() => setShowForumFeatures(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  moreButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  forumInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 20,
  },
  forumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  forumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  forumDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
  },
  membershipStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  membershipText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  actionButtons: {
    gap: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  createTopicButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    minWidth: 120,
  },
  featuresButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    minWidth: 120,
  },
  featuresText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createTopicText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  manageText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  leaveText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  topicsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  topicItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  topicContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicAuthor: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  topicStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  rulesSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ruleNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginRight: 8,
    marginTop: 2,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ForumDetailScreen;
