import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { forumService, Forum } from '../services/forumService';
import { useAuth } from '../context/AuthContext';

const ForumNavigationScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { value: '', label: 'All Forums', icon: '🌐', color: '#4F46E5' },
    { value: 'general', label: 'General', icon: '💬', color: '#10B981' },
    { value: 'academic', label: 'Academic', icon: '📚', color: '#F59E0B' },
    { value: 'programming', label: 'Programming', icon: '💻', color: '#8B5CF6' },
    { value: 'medical', label: 'Medical', icon: '🏥', color: '#EF4444' },
    { value: 'engineering', label: 'Engineering', icon: '⚙️', color: '#06B6D4' },
    { value: 'business', label: 'Business', icon: '💼', color: '#84CC16' },
    { value: 'study', label: 'Study Groups', icon: '📖', color: '#F97316' },
    { value: 'career', label: 'Career', icon: '🎯', color: '#EC4899' },
    { value: 'technology', label: 'Technology', icon: '🚀', color: '#6366F1' },
    { value: 'science', label: 'Science', icon: '🔬', color: '#14B8A6' },
  ];

  useEffect(() => {
    loadForums();
  }, [selectedCategory]);

  const loadForums = async () => {
    try {
      setLoading(true);
      const response = await forumService.getForums({
        category: selectedCategory || undefined,
        sort: 'activity',
        limit: 10,
      });
      setForums(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load forums');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadForums();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.value === category);
    return categoryData?.icon || '💬';
  };

  const getCategoryColor = (category: string) => {
    const categoryData = categories.find(cat => cat.value === category);
    return categoryData?.color || '#6B7280';
  };

  const getMembershipStatus = (forum: Forum) => {
    if (!forum.userMembership) return null;
    
    switch (forum.userMembership.status) {
      case 'approved':
        return { text: 'Member', color: '#10B981', icon: 'checkmark-circle' };
      case 'pending':
        return { text: 'Pending', color: '#F59E0B', icon: 'time' };
      case 'banned':
        return { text: 'Banned', color: '#EF4444', icon: 'ban' };
      default:
        return null;
    }
  };

  const renderForumCard = (forum: Forum) => {
    const membershipStatus = getMembershipStatus(forum);
    const isPrivate = forum.isPrivate;
    const requiresApproval = forum.requiresApproval;

    return (
      <TouchableOpacity
        key={forum._id}
        style={styles.forumCard}
        onPress={() => router.push(`/forum-detail/${forum._id}`)}
      >
        <View style={styles.forumHeader}>
          <View style={styles.forumTitleContainer}>
            <Text style={styles.forumTitle}>{forum.title}</Text>
            <View style={styles.forumMeta}>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(forum.category) + '20' }]}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(forum.category)}</Text>
                <Text style={[styles.categoryText, { color: getCategoryColor(forum.category) }]}>
                  {forum.category}
                </Text>
              </View>
              {isPrivate && (
                <View style={styles.privateBadge}>
                  <Ionicons name="lock-closed" size={12} color="#EF4444" />
                  <Text style={styles.privateText}>Private</Text>
                </View>
              )}
              {requiresApproval && (
                <View style={styles.approvalBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#F59E0B" />
                  <Text style={styles.approvalText}>Approval Required</Text>
                </View>
              )}
            </View>
          </View>
          {membershipStatus && (
            <View style={[styles.membershipBadge, { backgroundColor: membershipStatus.color + '20' }]}>
              <Ionicons name={membershipStatus.icon as any} size={14} color={membershipStatus.color} />
              <Text style={[styles.membershipText, { color: membershipStatus.color }]}>
                {membershipStatus.text}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.forumDescription} numberOfLines={2}>
          {forum.description}
        </Text>

        <View style={styles.forumStats}>
          <View style={styles.stat}>
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.statText}>{forum.memberCount}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubbles" size={16} color="#6B7280" />
            <Text style={styles.statText}>{forum.topicCount}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble" size={16} color="#6B7280" />
            <Text style={styles.statText}>{forum.messageCount}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.statText}>
              {new Date(forum.lastActivity).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {forum.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {forum.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {forum.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{forum.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Forums</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/create-forum')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          Join discussions, ask questions, and connect with fellow students
        </Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryOption,
                selectedCategory === category.value && styles.categorySelected,
                { borderColor: category.color },
              ]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryLabel,
                selectedCategory === category.value && styles.categoryLabelSelected,
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/create-forum')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#4F46E5' }]}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionText}>Create Forum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/forum-list' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#10B981' }]}>
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionText}>Search Forums</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/my-forums' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionText}>My Forums</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/forum-topics' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.quickActionText}>Recent Topics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Forums List */}
      <View style={styles.forumsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory ? `${categories.find(c => c.value === selectedCategory)?.label} Forums` : 'Popular Forums'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/forum-list')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.forumsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {forums.length > 0 ? (
            forums.map(renderForumCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Forums Found</Text>
              <Text style={styles.emptyDescription}>
                {selectedCategory ? 'Try a different category' : 'Be the first to create a forum!'}
              </Text>
              {!selectedCategory && (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/create-forum')}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Forum</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  categorySection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categorySelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryLabelSelected: {
    color: '#4F46E5',
  },
  quickActionsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  forumsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  forumsList: {
    flex: 1,
  },
  forumCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  forumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  forumTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  forumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  forumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  privateText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 4,
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvalText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 4,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  membershipText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  forumDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  forumStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});

export default ForumNavigationScreen;
