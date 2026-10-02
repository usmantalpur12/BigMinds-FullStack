import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, responsive, glassmorphism, cardStyles } from '../theme/colors';
import { ModernCard } from '../components/ModernCard';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { backendAPI, getFullUrl } from '../services/backendAPI';
import { forumService, Forum } from '../services/forumService';

const { width, height } = Dimensions.get('window');

interface HomeStats {
  totalCourses: number;
  completedCourses: number;
  activeCourses: number;
  completionRate: number;
  totalStudyTime: number;
  currentStreak: number;
  forumPosts: number;
  helpfulVotes: number;
}

interface RecentCourse {
  _id: string;
  title: string;
  thumbnail?: string;
  instructor: {
    firstName: string;
    lastName: string;
  };
  progress: number;
  lastAccessed: string;
  category: string;
}

// StudyGoal and UpcomingDeadline interfaces removed as requested

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const [joinedForums, setJoinedForums] = useState<Forum[]>([]);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const cardScale = useSharedValue(1);

  // Responsive values
  const isSmallDevice = responsive.isSmallDevice(width);
  const isLargeDevice = responsive.isLargeDevice(width);
  const responsiveSpacing = responsive.getSpacing(spacing.lg, width);
  const responsivePadding = responsive.getPadding(spacing.lg, width);

  useEffect(() => {
    loadHomeData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 600 });
      contentTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 200);
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [statsData, coursesData, forumsData] = await Promise.all([
        backendAPI.get('/users/me/stats').catch(() => ({ data: { data: null } })), // Handle 400 error gracefully
        backendAPI.get('/users/me/enrollments?limit=5').catch(() => ({ data: { data: [] } })),
        forumService.getMyForums().catch(() => []), // Get user's joined forums
      ]);

      // Handle stats data - use defaults if API fails
      if (statsData?.data?.data) {
        setStats(statsData.data.data);
      } else {
        // Set default stats if API fails
        setStats({
          totalCourses: 0,
          completedCourses: 0,
          activeCourses: 0,
          completionRate: 0,
          totalStudyTime: 0,
          currentStreak: 0,
          forumPosts: 0,
          helpfulVotes: 0,
        });
      }
      
      const enrollments = coursesData?.data?.data || [];
      const mappedCourses = enrollments.map((enrollment: any) => {
        const courseData = enrollment.courseId || {};
        return {
          _id: courseData._id || enrollment._id, // Use course ID to navigate correctly
          title: courseData.title || 'Untitled Course',
          thumbnail: courseData.thumbnail,
          instructor: courseData.instructor || { firstName: '', lastName: '' },
          progress: enrollment.progress || 0,
          lastAccessed: enrollment.lastAccessed || enrollment.enrolledAt || new Date().toISOString(),
          category: courseData.category || 'General'
        };
      });
      setRecentCourses(mappedCourses);
      
      setJoinedForums(Array.isArray(forumsData) ? forumsData.slice(0, 4) : []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const handleCardPress = () => {
    cardScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'alert-circle';
      case 'medium': return 'warning';
      case 'low': return 'checkmark-circle';
      default: return 'information-circle';
    }
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

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your learning dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Enhanced Header */}
      <Animated.View style={[headerAnimatedStyle, styles.header]}>
        <View style={styles.headerTop}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.firstName || 'Student'}! 👋
            </Text>
            <Text style={styles.subtitleText}>
              Ready to continue your learning journey?
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            {user?.avatar || (user as any)?.avatarMedium ? (
              <Image
                source={{ uri: getFullUrl((user as any).avatar || (user as any).avatarMedium) || '' }}
                style={styles.profileAvatar}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Enhanced Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="book" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{stats?.totalCourses || 0}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>{stats?.completionRate || 0}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="flame" size={24} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>{stats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={24} color={colors.accent} />
            </View>
            <Text style={styles.statNumber}>
              {stats?.totalStudyTime ? Math.round(stats.totalStudyTime / 60) : 0}h
            </Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </View>
        </View>
      </Animated.View>

      {/* Enhanced Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={contentAnimatedStyle}>
          {/* Continue Learning Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Learning</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recentCourses.map((course) => (
                <TouchableOpacity
                  key={course._id}
                  style={styles.courseCard}
                  onPress={() => router.push(`/course-detail/${course._id}`)}
                >
                  <View style={styles.courseThumbnail}>
                    {course.thumbnail && (course.thumbnail.includes('/') || course.thumbnail.includes('\\')) ? (
                      <Image 
                        source={{ uri: getFullUrl(course.thumbnail) || '' }} 
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.courseEmoji}>
                        {course.thumbnail || '📚'}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {course.title}
                    </Text>
                    <Text style={styles.courseInstructor}>
                      by {course.instructor?.firstName} {course.instructor?.lastName}
                    </Text>
                    
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${course.progress || 0}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {course.progress || 0}% Complete
                      </Text>
                    </View>
                    
                    <Text style={styles.lastAccessed}>
                      Last accessed {formatTimeAgo(course.lastAccessed)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {recentCourses.length === 0 && (
                <View style={styles.emptyCourses}>
                  <Text style={styles.emptyText}>No courses yet</Text>
                  <TouchableOpacity 
                    style={styles.enrollButton}
                    onPress={() => router.push('/(tabs)/courses')}
                  >
                    <Text style={styles.enrollButtonText}>Browse Courses</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Joined Forums Section */}
          {joinedForums.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Forums</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/forums')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {joinedForums.map((forum) => (
                  <TouchableOpacity
                    key={forum._id}
                    style={styles.forumCard}
                    onPress={() => router.push(`/forum-detail/${forum._id}`)}
                  >
                    <View style={styles.forumThumbnail}>
                      <Text style={styles.forumEmoji}>
                        {forum.thumbnail || '💬'}
                      </Text>
                    </View>
                    
                    <View style={styles.forumInfo}>
                      <Text style={styles.forumTitle} numberOfLines={2}>
                        {forum.title}
                      </Text>
                      <Text style={styles.forumDescription} numberOfLines={2}>
                        {forum.description}
                      </Text>
                      
                      <View style={styles.forumStats}>
                        <View style={styles.forumStatItem}>
                          <Ionicons name="people" size={14} color={colors.textSecondary} />
                          <Text style={styles.forumStatText}>{forum.memberCount}</Text>
                        </View>
                        <View style={styles.forumStatItem}>
                          <Ionicons name="chatbubble" size={14} color={colors.textSecondary} />
                          <Text style={styles.forumStatText}>{forum.topicCount}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/forums')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="chatbubbles" size={24} color={colors.primary} />
                </View>
                <Text style={styles.actionTitle}>Join Forums</Text>
                <Text style={styles.actionSubtitle}>Connect with peers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="trending-up" size={24} color={colors.success} />
                </View>
                <Text style={styles.actionTitle}>View Progress</Text>
                <Text style={styles.actionSubtitle}>Track your learning</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/leaderboard')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="trophy" size={24} color={colors.warning} />
                </View>
                <Text style={styles.actionTitle}>Leaderboard</Text>
                <Text style={styles.actionSubtitle}>See rankings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/courses')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="search" size={24} color={colors.accent} />
                </View>
                <Text style={styles.actionTitle}>Find Courses</Text>
                <Text style={styles.actionSubtitle}>Discover new topics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    ...shadows.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.surface,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    fontSize: 16,
    color: colors.surface,
    opacity: 0.9,
  },
  notificationButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.md,
  },
  profileButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.md,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '23%',
    ...glassmorphism.light,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
    minWidth: 70,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  horizontalScroll: {
    gap: spacing.md,
  },
  courseCard: {
    width: 260,
    ...glassmorphism.medium,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  courseThumbnail: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  courseEmoji: {
    fontSize: 32,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  courseInstructor: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  lastAccessed: {
    fontSize: 11,
    color: colors.textLight,
  },
  emptyCourses: {
    width: 280,
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  enrollButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  enrollButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  goalsContainer: {
    gap: spacing.md,
  },
  goalCard: {
    ...glassmorphism.light,
    padding: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  goalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  goalStatus: {
    alignItems: 'center',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  goalDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deadlinesContainer: {
    gap: spacing.md,
  },
  deadlineCard: {
    ...glassmorphism.light,
    padding: spacing.md,
  },
  deadlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deadlineIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  deadlineCourse: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deadlinePriority: {
    alignItems: 'center',
  },
  deadlineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlineDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  quickActionCard: {
    width: '48%',
    ...glassmorphism.medium,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    minWidth: 140,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  forumCard: {
    width: 260,
    ...glassmorphism.medium,
    padding: spacing.md,
    borderWidth: 1.5,
    marginRight: spacing.md,
  },
  forumThumbnail: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  forumEmoji: {
    fontSize: 32,
  },
  forumInfo: {
    flex: 1,
  },
  forumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  forumDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  forumStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  forumStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forumStatText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
}); 