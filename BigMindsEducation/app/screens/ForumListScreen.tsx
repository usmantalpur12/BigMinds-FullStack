import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { forumService, Forum } from '../services/forumService';

const ForumListScreen = () => {
  const router = useRouter();
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const categories = [
    { value: '', label: 'All Categories', icon: '🌐' },
    { value: 'general', label: 'General', icon: '💬' },
    { value: 'academic', label: 'Academic', icon: '📚' },
    { value: 'programming', label: 'Programming', icon: '💻' },
    { value: 'medical', label: 'Medical', icon: '🏥' },
    { value: 'engineering', label: 'Engineering', icon: '⚙️' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'study', label: 'Study Groups', icon: '📖' },
    { value: 'career', label: 'Career', icon: '🎯' },
    { value: 'technology', label: 'Technology', icon: '🚀' },
    { value: 'science', label: 'Science', icon: '🔬' },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'members', label: 'Most Members' },
    { value: 'activity', label: 'Most Active' },
  ];

  useEffect(() => {
    loadForums();
  }, [selectedCategory, sortBy]);

  const loadForums = async () => {
    try {
      setLoading(true);
      const response = await forumService.getForums({
        category: selectedCategory || undefined,
        sort: sortBy,
        limit: 20,
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadForums();
      return;
    }

    try {
      setLoading(true);
      const response = await forumService.searchForums(searchQuery, {
        category: selectedCategory || undefined,
        sort: sortBy,
        limit: 20,
      });
      setForums(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.value === category);
    return categoryData?.icon || '💬';
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

  const renderForumItem = ({ item: forum }: { item: Forum }) => {
    const membershipStatus = getMembershipStatus(forum);
    const isPrivate = forum.isPrivate;
    const requiresApproval = forum.requiresApproval;

    return (
      <TouchableOpacity
        style={styles.forumItem}
        onPress={() => router.push(`/forum-detail/${forum._id}`)}
      >
        <View style={styles.forumHeader}>
          <View style={styles.forumTitleContainer}>
            <Text style={styles.forumTitle}>{forum.title}</Text>
            <View style={styles.forumMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(forum.category)}</Text>
                <Text style={styles.categoryText}>{forum.category}</Text>
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

        <View style={styles.forumFooter}>
          <View style={styles.createdBy}>
            <Text style={styles.createdByText}>
              Created by {forum.createdBy.firstName} {forum.createdBy.lastName}
            </Text>
            <Text style={styles.createdAtText}>
              {new Date(forum.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Forums Found</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a forum!'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create-forum')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Forum</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search forums..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  loadForums();
                }}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryOption,
                  selectedCategory === category.value && styles.categorySelected,
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

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.sortOptions}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.sortOptionSelected,
                ]}
                onPress={() => setSortBy(option.value)}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Forums List */}
      <FlatList
        data={forums}
        renderItem={renderForumItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
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
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  filterContainer: {
    marginBottom: 16,
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
    borderColor: '#4F46E5',
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  sortOptionSelected: {
    backgroundColor: '#4F46E5',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  forumItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 18,
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#4F46E5',
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
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
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
  forumFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdBy: {
    flex: 1,
  },
  createdByText: {
    fontSize: 12,
    color: '#6B7280',
  },
  createdAtText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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

export default ForumListScreen;
