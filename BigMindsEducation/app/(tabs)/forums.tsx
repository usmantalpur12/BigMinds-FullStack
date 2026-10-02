import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, responsive, glassmorphism } from '../theme/colors';
import { ModernCard } from '../components/ModernCard';
import { forumService, Forum } from '../services/forumService';
import { useAuth } from '../context/AuthContext';
import { getFullUrl } from '../services/backendAPI';

const { width, height } = Dimensions.get('window');

const ForumsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [forums, setForums] = useState<Forum[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string; count: number }[]>([]);
  const [userMemberships, setUserMemberships] = useState<Array<{ forumId: string; status: string; role?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showJoinKeyModal, setShowJoinKeyModal] = useState(false);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [joinKeyInput, setJoinKeyInput] = useState('');
  const currentUserId = (user as any)?._id || (user as any)?.id || null;

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const searchScale = useSharedValue(1);

  // Responsive values
  const isSmallDevice = width < 375;
  const responsivePadding = responsive.getPadding(spacing.lg, width);

  useFocusEffect(
    useCallback(() => {
      loadForumsData();
    }, [])
  );

  useEffect(() => {
    // Start animations
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 800 });
      contentTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 200);
  }, []);

  const navigateToCreateForum = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to create a forum');
      return;
    }
    const route = user.role === 'teacher' ? '/teacher/create-forum' : '/create-forum';
    console.log('🔍 [DEBUG] Navigating to create forum:', {
      route,
      userRole: user.role
    });
    router.push(route as any);
  };

  const loadForumsData = async () => {
    try {
      setLoading(true);
      
      // Load data in parallel
      const [forumsResponse, categoriesResponse, membershipsResponse] = await Promise.all([
        forumService.getForums(),
        forumService.getForumCategories(),
        forumService.getUserForumMemberships(),
      ]);

      // Extract data from responses
      const forumsData = forumsResponse.data || forumsResponse || [];
      const categoriesData = categoriesResponse.data || [];
      const membershipsData = membershipsResponse.data || membershipsResponse || [];

      setForums(Array.isArray(forumsData) ? forumsData : []);
      
      // Ensure categories is always an array with proper structure
      const formattedCategories = Array.isArray(categoriesData) 
        ? categoriesData.map((cat: any) => ({
            id: cat.id || cat._id || cat.name || 'unknown',
            name: cat.name || cat.id || 'Unknown',
            icon: cat.icon || '💬',
            count: cat.count || 0,
          }))
        : [];
      
      // Add default categories if none exist
      if (formattedCategories.length === 0) {
        formattedCategories.push(
          { id: 'academic', name: 'Academic', icon: '📚', count: 0 },
          { id: 'general', name: 'General', icon: '💬', count: 0 },
          { id: 'technical', name: 'Technical', icon: '💻', count: 0 },
          { id: 'social', name: 'Social', icon: '👥', count: 0 },
        );
      }
      
      setCategories(formattedCategories);

      const membershipsArray = Array.isArray(membershipsData)
        ? membershipsData
        : Array.isArray((membershipsData as any)?.data)
        ? (membershipsData as any).data
        : [];

      const formattedMemberships = membershipsArray
        .map((entry: any) => {
          // Backend returns ForumMember documents with forumId populated as a Forum object
          const forumId =
            (entry.forumId && typeof entry.forumId === 'object' ? entry.forumId._id : entry.forumId) ||
            (entry.forum && typeof entry.forum === 'object' ? entry.forum._id : entry.forum) ||
            '';

          return {
            forumId: forumId?.toString() || '',
            status: entry.status || 'approved',
            role: entry.role || 'member',
          };
        })
        .filter((membership: { forumId: string }) => !!membership.forumId);

      setUserMemberships(formattedMemberships);
    } catch (error) {
      console.error('Error loading forums data:', error);
      // Set default categories on error
      setCategories([
        { id: 'academic', name: 'Academic', icon: '📚', count: 0 },
        { id: 'general', name: 'General', icon: '💬', count: 0 },
        { id: 'technical', name: 'Technical', icon: '💻', count: 0 },
        { id: 'social', name: 'Social', icon: '👥', count: 0 },
      ]);
      Alert.alert('Error', 'Failed to load forums data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadForumsData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadForumsData();
      return;
    }

    try {
      setSearchLoading(true);
      const searchResults = await forumService.searchForums(
        searchQuery.trim(),
        {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          sort: 'recent'
        }
      );
      setForums(searchResults.data || []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleForumPress = (forum: Forum) => {
    if (!forum._id || !forum._id.trim()) {
      Alert.alert('Error', 'Forum ID is missing or invalid');
      console.error('❌ [ERROR] Forum ID is missing:', { forum });
      return;
    }
    
    const forumId = forum._id.trim();
    const route = `/forum-detail/${forumId}`;
    
    console.log('🔍 [DEBUG] Navigating to forum detail:', {
      route,
      forumId,
      forumTitle: forum.title,
      fullPath: route,
      timestamp: new Date().toISOString(),
      routeType: typeof route
    });
    
    // Simple direct navigation (like course-detail)
    console.log('✅ [NAVIGATION] Navigating to forum:', route);
    router.push(route as any);
  };

  const getMembershipStatus = (forum: Forum): 'owner' | 'member' | 'pending' | 'banned' | 'none' => {
    if (!user) return 'none';

    const ownerId =
      (forum.createdBy as any)?._id ||
      (forum.createdBy as any)?.id ||
      (forum.createdById as any)?._id ||
      forum.createdById ||
      (typeof forum.owner === 'object' && forum.owner ? (forum.owner as any)?._id : null) ||
      (typeof forum.owner === 'string' ? forum.owner : null) ||
      forum.ownerId ||
      (typeof forum.instructor === 'object' && forum.instructor ? (forum.instructor as any)?._id : null) ||
      (typeof forum.instructor === 'string' ? forum.instructor : null);

    if (ownerId && currentUserId && ownerId === currentUserId) {
      return 'owner';
    }

    if (forum.userMembership) {
      if (forum.userMembership.status === 'pending') return 'pending';
      if (forum.userMembership.status === 'banned') return 'banned';
      return 'member';
    }

    const membership = userMemberships.find((entry) => entry.forumId === forum._id);
    if (!membership) return 'none';

    if (membership.status === 'pending') return 'pending';
    if (membership.status === 'banned') return 'banned';
    return 'member';
  };

  const promptJoinKey = (forum: Forum, onValidated: (joinKey?: string) => void) => {
    setSelectedForum(forum);
    setJoinKeyInput('');
    setShowJoinKeyModal(true);
  };

  const handleJoinKeySubmit = async () => {
    if (!selectedForum) return;
    
    if (!joinKeyInput || !joinKeyInput.trim()) {
      Alert.alert('Error', 'Join key is required');
      return;
    }

    setShowJoinKeyModal(false);
    await attemptJoinForum(selectedForum, joinKeyInput.trim());
    setSelectedForum(null);
    setJoinKeyInput('');
  };

  const attemptJoinForum = async (forum: Forum, joinKey?: string) => {
    try {
      // Check if private forum needs join key
      // Handle both isPublic and isPrivate fields
      const isPublicForum = forum.isPublic !== false && !forum.isPrivate;
      const isPrivateForum = forum.isPrivate || !forum.isPublic;
      
      if (isPrivateForum && forum.joinKey) {
        if (!joinKey || !joinKey.trim()) {
          // Show modal to get join key
          promptJoinKey(forum, () => {});
          return;
        }
      }
      
      // Attempt to join
      await forumService.joinForum(forum._id, { joinKey: joinKey?.trim() });
      
      Alert.alert(
        forum.requiresApproval ? 'Request Submitted' : 'Success',
        forum.requiresApproval
          ? 'Your join request has been sent to the forum admins.'
          : 'Joined forum successfully!'
      );
      
      // Reload forums data to update membership status
      await loadForumsData();
    } catch (error: any) {
      console.error('Join forum error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to join forum';
      
      // Handle "already a member" error gracefully
      if (errorMessage.includes('Already a member') || errorMessage.includes('already a member')) {
        Alert.alert('Info', 'You are already a member of this forum');
        // Reload forums data to update membership status, then open the forum
        await loadForumsData();
        handleForumPress(forum);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const confirmLeaveForum = (forum: Forum) => {
    Alert.alert(
      'Leave forum?',
      'You will lose access to future updates until you join again.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await forumService.leaveForum(forum._id);
              await loadForumsData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave forum');
            }
          },
        },
      ]
    );
  };

  const handleForumAction = async (forum: Forum) => {
    const status = getMembershipStatus(forum);
    console.log('🔍 [DEBUG] Forum action clicked:', {
      forumId: forum._id,
      forumTitle: forum.title,
      membershipStatus: status,
      isPublic: forum.isPublic,
      requiresApproval: forum.requiresApproval
    });

    if (status === 'owner' || status === 'member') {
      console.log('✅ [DEBUG] User is owner/member, navigating to forum detail');
      handleForumPress(forum);
      return;
    }

    if (status === 'pending') {
      Alert.alert('Pending Approval', 'Please wait for an admin to approve your request.');
      return;
    }

    if (status === 'banned') {
      Alert.alert('Access denied', 'You have been banned from this forum.');
      return;
    }

    try {
      // Handle both isPublic and isPrivate fields
      const isPublicForum = forum.isPublic !== false && !forum.isPrivate;
      const isPrivateForum = forum.isPrivate || !forum.isPublic;
      
      if (isPrivateForum && forum.joinKey) {
        promptJoinKey(forum, async (joinKey) => {
          try {
            await attemptJoinForum(forum, joinKey);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to join forum');
          }
        });
      } else {
        await attemptJoinForum(forum);
      }
    } catch (error: any) {
      console.error('Forum action error:', error);
      Alert.alert('Error', error.message || 'Action failed');
    }
  };

  const getFilteredForums = () => {
    if (selectedCategory === 'all') return forums;
    return forums.filter(forum => forum.category === selectedCategory);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || '💬';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading forums...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <Animated.View style={[
        {
          backgroundColor: colors.primary,
          paddingTop: 50,
          paddingHorizontal: responsivePadding,
          paddingBottom: responsivePadding,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        },
        headerAnimatedStyle
      ]}>
        <Text style={{ 
          fontSize: responsive.getFontSize(28, width),
          fontWeight: 'bold', 
          color: colors.surface,
          textAlign: 'center',
          marginBottom: 8,
        }}>
          💬 Forums
        </Text>
        
        <Text style={{ 
          fontSize: responsive.getFontSize(16, width),
          color: colors.surface + 'CC',
          textAlign: 'center',
        }}>
          Connect, learn, and share with the BigMinds community
        </Text>
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: responsivePadding }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={contentAnimatedStyle}>
          
          {/* Create Forum Action */}
          {user && (
            <TouchableOpacity
              onPress={navigateToCreateForum}
              style={{ 
                ...glassmorphism.medium,
                padding: responsivePadding,
                borderWidth: 2,
                borderColor: colors.primary,
                borderStyle: 'dashed',
                alignItems: 'center',
                marginBottom: responsive.getSpacing(spacing.lg, width)
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                + {user.role === 'teacher' ? 'Create a new forum' : 'Create a public forum'}
              </Text>
              {user.role !== 'teacher' && (
                <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>
                  Anyone can start a public discussion space
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Search Bar */}
          <View style={{ 
            flexDirection: 'row', 
            marginBottom: responsive.getSpacing(spacing.lg, width),
            gap: 12,
          }}>
            <View style={{ 
              flex: 1, 
              flexDirection: 'row', 
              alignItems: 'center',
              ...glassmorphism.light,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: colors.textPrimary,
                }}
                placeholder="Search forums and topics..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              style={{ 
                backgroundColor: colors.primary,
                padding: 12,
                borderRadius: borderRadius.lg,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleSearch}
              disabled={searchLoading}
            >
              {searchLoading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="search" size={20} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <View style={{ marginBottom: responsive.getSpacing(spacing.lg, width) }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: responsive.getSpacing(spacing.md, width) }}
            >
              <TouchableOpacity
                onPress={() => setSelectedCategory('all')}
                style={{ 
                  backgroundColor: selectedCategory === 'all' ? colors.primary : colors.glassBackground,
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: responsivePadding,
                  paddingVertical: responsive.getPadding(spacing.md, width),
                  alignItems: 'center',
                  minWidth: isSmallDevice ? 80 : 100,
                  borderWidth: 1.5,
                  borderColor: selectedCategory === 'all' ? colors.primary : colors.glassBorder,
                  ...(selectedCategory !== 'all' ? glassmorphism.light : {}),
                }}
              >
                <Text style={{ 
                  fontSize: isSmallDevice ? 20 : 24, 
                  marginBottom: spacing.xs,
                }}>
                  💬
                </Text>
                <Text style={{ 
                  fontSize: responsive.getFontSize(12, width),
                  fontWeight: '600',
                  color: selectedCategory === 'all' ? colors.surface : colors.textPrimary,
                  textAlign: 'center',
                }}>
                  All Forums
                </Text>
              </TouchableOpacity>

              {categories && Array.isArray(categories) && categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={{ 
                    backgroundColor: selectedCategory === category.id ? colors.primary : colors.glassBackground,
                    borderRadius: borderRadius.lg,
                    paddingHorizontal: responsivePadding,
                    paddingVertical: responsive.getPadding(spacing.md, width),
                    alignItems: 'center',
                    minWidth: isSmallDevice ? 80 : 100,
                    borderWidth: 1.5,
                    borderColor: selectedCategory === category.id ? colors.primary : colors.glassBorder,
                    ...(selectedCategory !== category.id ? glassmorphism.light : {}),
                  }}
                >
                  <Text style={{ 
                    fontSize: isSmallDevice ? 20 : 24, 
                    marginBottom: spacing.xs,
                  }}>
                    {category.icon}
                  </Text>
                  <Text style={{ 
                    fontSize: responsive.getFontSize(12, width),
                    fontWeight: '600',
                    color: selectedCategory === category.id ? colors.surface : colors.textPrimary,
                    textAlign: 'center',
                  }}>
                    {category.name}
                  </Text>
                  <Text style={{ 
                    fontSize: responsive.getFontSize(10, width),
                    color: selectedCategory === category.id ? colors.surface + 'CC' : colors.textSecondary,
                    marginTop: 2,
                  }}>
                    {category.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Forums List */}
          <View style={{ gap: 16 }}>
            {getFilteredForums().map((forum) => (
              <TouchableOpacity
                key={forum._id}
                style={{ 
                  ...glassmorphism.medium,
                  padding: responsivePadding,
                }}
                onPress={() => handleForumPress(forum)}
              >
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}>
                    <View style={{ 
                      width: 60, 
                      height: 60, 
                      backgroundColor: colors.primary + '20',
                      borderRadius: borderRadius.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                      overflow: 'hidden',
                    }}>
                      {forum.thumbnail && (forum.thumbnail.includes('/') || forum.thumbnail.includes('\\')) ? (
                        <Image 
                          source={{ uri: getFullUrl(forum.thumbnail) || '' }} 
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 32 }}>{forum.thumbnail || getCategoryIcon(forum.category)}</Text>
                      )}
                    </View>
                  
                  <View style={{ flex: 1 }}>
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      marginBottom: 8,
                    }}>
                      <Text style={{ 
                        fontSize: responsive.getFontSize(18, width),
                        fontWeight: '600', 
                        color: colors.textPrimary,
                        flex: 1,
                      }}>
                        {forum.title}
                      </Text>
                      
                      {forum.isPrivate && (
                        <View style={{ 
                          backgroundColor: colors.warning + '20',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}>
                          <Text style={{ 
                            fontSize: 10, 
                            color: colors.warning,
                            fontWeight: '600',
                          }}>
                            Private
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={{ 
                      fontSize: responsive.getFontSize(14, width),
                      color: colors.textSecondary,
                      marginBottom: 12,
                      lineHeight: 20,
                    }}>
                      {forum.description}
                    </Text>
                    
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      marginTop: 8,
                      gap: 12,
                    }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        gap: 16,
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="people" size={16} color={colors.textSecondary} />
                          <Text style={{ 
                            fontSize: 12, 
                            color: colors.textSecondary,
                            marginLeft: 4,
                          }}>
                            {forum.memberCount}
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="chatbubble" size={16} color={colors.textSecondary} />
                          <Text style={{ 
                            fontSize: 12, 
                            color: colors.textSecondary,
                            marginLeft: 4,
                          }}>
                            {forum.postCount}
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time" size={16} color={colors.textSecondary} />
                          <Text style={{ 
                            fontSize: 12, 
                            color: colors.textSecondary,
                            marginLeft: 4,
                          }}>
                            {formatLastActivity(forum.lastActivityAt || forum.lastActivity || '')}
                          </Text>
                        </View>
                      </View>
                      
                      {(() => {
                        const status = getMembershipStatus(forum);
                        if (status === 'owner' || status === 'member') return null; // Action is already handled by card press

                        const actionText =
                          status === 'pending'
                            ? 'Pending Approval'
                            : status === 'banned'
                            ? 'Access Denied'
                            : 'Join Forum';
                        const buttonColor =
                          status === 'pending' || status === 'banned'
                            ? colors.border
                            : colors.primary;

                        return (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <TouchableOpacity
                              style={{ 
                                backgroundColor: buttonColor,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: borderRadius.md,
                                opacity: status === 'pending' || status === 'banned' ? 0.6 : 1,
                              }}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleForumAction(forum);
                              }}
                              disabled={status === 'pending' || status === 'banned'}
                            >
                              <Text style={{ 
                                fontSize: 12, 
                                fontWeight: '600',
                                color: colors.surface,
                              }}>
                                {actionText}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })()}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Empty State */}
          {getFilteredForums().length === 0 && (
            <View style={{ 
              alignItems: 'center', 
              paddingVertical: 60,
            }}>
              <Text style={{ fontSize: 64, marginBottom: 16 }}>💬</Text>
              <Text style={{ 
                fontSize: responsive.getFontSize(18, width),
                fontWeight: '600', 
                color: colors.textPrimary,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                No forums found
              </Text>
              <Text style={{ 
                fontSize: responsive.getFontSize(14, width),
                color: colors.textSecondary,
                textAlign: 'center',
              }}>
                {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new forums'}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Join Key Modal */}
      <Modal
        visible={showJoinKeyModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowJoinKeyModal(false);
          setSelectedForum(null);
          setJoinKeyInput('');
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: responsivePadding,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: responsive.getFontSize(20, width),
              fontWeight: 'bold',
              color: colors.textPrimary,
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Join Private Forum
            </Text>
            <Text style={{
              fontSize: responsive.getFontSize(14, width),
              color: colors.textSecondary,
              marginBottom: 20,
              textAlign: 'center',
            }}>
              Enter the join key to join this private forum
            </Text>
            
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                padding: 12,
                fontSize: 16,
                color: colors.textPrimary,
                marginBottom: 20,
                backgroundColor: colors.background,
                textTransform: 'uppercase',
              }}
              placeholder="Enter join key"
              placeholderTextColor={colors.textSecondary}
              value={joinKeyInput}
              onChangeText={(text) => setJoinKeyInput(text.toUpperCase())}
              autoCapitalize="characters"
              secureTextEntry={false}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowJoinKeyModal(false);
                  setSelectedForum(null);
                  setJoinKeyInput('');
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  fontWeight: '600',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
                onPress={handleJoinKeySubmit}
              >
                <Text style={{
                  fontSize: 16,
                  color: colors.surface,
                  fontWeight: '600',
                }}>
                  Join
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ForumsScreen; 