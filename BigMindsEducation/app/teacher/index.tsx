import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, responsive, glassmorphism } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { forumService } from '../services/forumService';
import { getFullUrl } from '../services/backendAPI';

const { width, height } = Dimensions.get('window');

const teacherChallenges = [
  {
    id: 1,
    title: 'First Course Master',
    description: 'Create your first course',
    reward: 'Rs 500',
    progress: 0,
    target: 1,
    icon: '🎯',
    color: colors.primary,
    completed: false
  },
  {
    id: 2,
    title: 'Student Magnet',
    description: 'Get 50+ students enrolled',
    reward: 'Rs 1000',
    progress: 0,
    target: 50,
    icon: '👥',
    color: colors.success,
    completed: false
  },
  {
    id: 3,
    title: 'Rating Champion',
    description: 'Achieve 4.5+ average rating',
    reward: 'Rs 750',
    progress: 0,
    target: 4.5,
    icon: '⭐',
    color: colors.warning,
    completed: false
  },
  {
    id: 4,
    title: 'Forum Creator',
    description: 'Create 3 active forums',
    reward: 'Rs 300',
    progress: 0,
    target: 3,
    icon: '💬',
    color: colors.error,
    completed: false
  },
];

const quickActions = [
  { id: 1, title: 'Create Quiz', icon: '📝', color: colors.primary, route: '/teacher/create-quiz' },
  { id: 2, title: 'Analytics', icon: '📊', color: colors.success, route: '/teacher/analytics' },
  { id: 3, title: 'Students', icon: '👨‍🎓', color: colors.warning, route: '/teacher/students' },
  { id: 4, title: 'Settings', icon: '⚙️', color: colors.error, route: '/teacher/settings' },
];

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [myForums, setMyForums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherStats, setTeacherStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    totalRevenue: 0,
    avgRating: 0
  });

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);

  const isSmallDevice = responsive.isSmallDevice(width);
  const responsiveSpacing = responsive.getSpacing(spacing.lg, width);
  const responsivePadding = responsive.getPadding(spacing.lg, width);

  const userId = (user as any)?._id || (user as any)?.id || null;

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 600 });
      contentTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 200);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [userId]);

  const loadData = async () => {
    const currentUserId = user?._id || user?.id || '';
    setLoading(true);
    setError(null);
    try {
      let courses = [];
      try {
        courses = await courseService.getMyCourses();
      } catch {
        try {
          const allCourses = await courseService.getCourses();
          courses = (allCourses || []).filter((course: any) => {
            const instructorId = course.instructor?._id || course.instructorId || course.instructor || (course.createdBy as any)?._id;
            return instructorId === currentUserId;
          });
        } catch (generalError) {
          throw generalError;
        }
      }

      setMyCourses(Array.isArray(courses) ? courses : []);

      let forums: any[] = [];
      try {
        forums = await forumService.getMyForums();
      } catch {
        forums = [];
      }
      setMyForums(forums);

      const totalStudents = (courses || []).reduce((sum, course) => {
        if (Array.isArray(course.enrolledStudents)) {
          return sum + course.enrolledStudents.length;
        }
        return sum + (course.enrolledStudents || 0);
      }, 0);
      const activeCourses = (courses || []).filter(course => course.isPublished).length;
      const totalRevenue = (courses || []).reduce((sum, course) => sum + ((course.price || 0) * (course.enrolledStudents || 0)), 0);
      const avgRating = (courses || []).length > 0 ? (courses || []).reduce((sum, course) => sum + (course.rating || 0), 0) / (courses || []).length : 0;

      setTeacherStats({
        totalStudents,
        activeCourses,
        totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10
      });

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please check your connection and try again.');

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('404')) {
        Alert.alert('API Error', 'The courses API endpoint is not available.');
      } else if (errorMessage.includes('401')) {
        Alert.alert('Authentication Error', 'You are not properly logged in.');
      } else {
        Alert.alert('Connection Error', 'Unable to connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const BottomNavButton = ({ icon, label, onPress, isActive = false }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        backgroundColor: isActive ? colors.primary + '10' : 'transparent',
        borderRadius: borderRadius.md,
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>
      <Text style={{
        fontSize: 12,
        color: isActive ? colors.primary : colors.textSecondary,
        fontWeight: isActive ? '600' : '400'
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCourseCard = (course: any, index: number) => (
    <TouchableOpacity
      key={course._id}
      onPress={() => router.push({ pathname: '/course-detail/[courseId]', params: { courseId: course._id } } as any)}
      style={{
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        ...shadows.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{
        height: 120,
        backgroundColor: colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {course.thumbnail && (course.thumbnail.includes('/') || course.thumbnail.includes('\\')) ? (
          <Image source={{ uri: getFullUrl(course.thumbnail) || '' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 48 }}>{course.thumbnail || '📚'}</Text>
        )}
      </View>

      <View style={{ padding: spacing.md }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        }} numberOfLines={2}>
          {course.title}
        </Text>

        <Text style={{
          fontSize: 11,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        }} numberOfLines={1}>
          {course.category} • {course.level}
        </Text>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.primary,
          }}>
            Rs {course.price}
          </Text>

          <View style={{
            backgroundColor: course.isPublished ? colors.success + '20' : colors.warning + '20',
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: borderRadius.sm,
          }}>
            <Text style={{
              fontSize: 10,
              color: course.isPublished ? colors.success : colors.warning,
              fontWeight: '600',
            }}>
              {course.isPublished ? 'Live' : 'Draft'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderForumCard = (forum: any, index: number) => (
    <TouchableOpacity
      key={forum._id}
      onPress={() => router.push(`/forum-detail/${forum._id}` as any)}
      style={{
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        ...shadows.md,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 120,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        backgroundColor: colors.success + '20',
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
      }}>
        <Text style={{ fontSize: 20 }}>💬</Text>
      </View>

      <Text style={{
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
      }} numberOfLines={2}>
        {forum.title}
      </Text>

      <Text style={{
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
      }}>
        {forum.category}
      </Text>

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto',
      }}>
        <Text style={{ fontSize: 12 }}>👥</Text>
        <Text style={{
          fontSize: 11,
          color: colors.textSecondary,
          marginLeft: 4,
        }}>
          {forum.memberCount} members
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ExpoStatusBar style="light" />

      {/* Enhanced Header with Gradient Effect */}
      <Animated.View style={[headerAnimatedStyle, {
        backgroundColor: colors.primary,
        paddingTop: responsive.getPadding(spacing.xxl + 10, width),
        paddingBottom: responsivePadding + 10,
        paddingHorizontal: responsivePadding,
        borderBottomLeftRadius: borderRadius.xxl,
        borderBottomRightRadius: borderRadius.xxl,
        ...shadows.xl,
      }]}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '800',
              color: colors.surface,
              marginBottom: spacing.xs,
              letterSpacing: 0.5,
            }}>
              Teacher Hub
            </Text>
            <Text style={{
              fontSize: 15,
              color: colors.surface,
              opacity: 0.95,
              fontWeight: '500',
            }}>
              Welcome, {(user as any)?.firstName || 'Teacher'}! 👋
            </Text>
          </View>

          <TouchableOpacity
            style={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: borderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards in 2x2 Grid */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}>
          {[
            { icon: '👥', value: teacherStats.totalStudents, label: 'Students', color: colors.success },
            { icon: '📚', value: teacherStats.activeCourses, label: 'Courses', color: colors.warning },
            { icon: '💰', value: `${teacherStats.totalRevenue}`, label: 'Revenue', color: colors.error },
            { icon: '⭐', value: teacherStats.avgRating, label: 'Rating', color: colors.primary },
          ].map((stat, idx) => (
            <View key={idx} style={{
              width: '48.5%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: borderRadius.lg,
              padding: spacing.md,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.xs,
              }}>
                <View style={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}>
                  <Text style={{ fontSize: 16 }}>{stat.icon}</Text>
                </View>
                <View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '800',
                    color: colors.surface,
                  }}>
                    {stat.value}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: colors.surface,
                    opacity: 0.9,
                    fontWeight: '500',
                  }}>
                    {stat.label}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: responsivePadding }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentAnimatedStyle}>

          {/* Quick Create Actions - 2 Cards Side by Side */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}>
              🚀 Quick Create
            </Text>

            <View style={{
              flexDirection: 'row',
              gap: spacing.md,
            }}>
              <TouchableOpacity
                onPress={() => router.push('/teacher/create-course' as any)}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.xl,
                  padding: spacing.lg,
                  alignItems: 'center',
                  ...shadows.lg,
                  minHeight: 140,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>📚</Text>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: 'white',
                  textAlign: 'center',
                }}>
                  New Course
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'white',
                  opacity: 0.9,
                  textAlign: 'center',
                  marginTop: spacing.xs,
                }}>
                  Create & Publish
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/teacher/create-forum' as any)}
                style={{
                  flex: 1,
                  backgroundColor: colors.success,
                  borderRadius: borderRadius.xl,
                  padding: spacing.lg,
                  alignItems: 'center',
                  ...shadows.lg,
                  minHeight: 140,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>💬</Text>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: 'white',
                  textAlign: 'center',
                }}>
                  New Forum
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: 'white',
                  opacity: 0.9,
                  textAlign: 'center',
                  marginTop: spacing.xs,
                }}>
                  Start Discussion
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* My Courses - 2 Cards Per Row */}
          <View style={{ marginBottom: spacing.xl }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.textPrimary,
              }}>
                📚 My Courses ({myCourses.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/teacher/my-courses' as any)}>
                <Text style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontWeight: '700',
                }}>
                  View All →
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>Loading courses...</Text>
              </View>
            ) : error ? (
              <View style={{
                backgroundColor: colors.error + '20',
                borderRadius: borderRadius.lg,
                padding: responsivePadding,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.error,
              }}>
                <Text style={{ color: colors.error, marginBottom: spacing.md, textAlign: 'center' }}>{error}</Text>
                <TouchableOpacity
                  onPress={loadData}
                  style={{ backgroundColor: colors.error, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.md,
              }}>
                {myCourses.slice(0, 4).map((course, index) => renderCourseCard(course, index))}
                {myCourses.length === 0 && (
                  <View style={{
                    width: '100%',
                    backgroundColor: colors.surface,
                    borderRadius: borderRadius.xl,
                    padding: spacing.xl,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📚</Text>
                    <Text style={{
                      color: colors.textPrimary,
                      fontWeight: '600',
                      fontSize: 16,
                      marginBottom: spacing.sm
                    }}>
                      No courses yet
                    </Text>
                    <Text style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      marginBottom: spacing.lg,
                      textAlign: 'center',
                    }}>
                      Start your teaching journey by creating your first course
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/teacher/create-course' as any)}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: spacing.xl,
                        paddingVertical: spacing.md,
                        borderRadius: borderRadius.lg,
                        ...shadows.md,
                      }}
                    >
                      <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                        Create Course
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* My Forums - 2 Cards Per Row */}
          <View style={{ marginBottom: spacing.xl }}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: colors.textPrimary,
                }}
              >
                💬 My Forums ({myForums.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/teacher/my-forums' as any)}>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.primary,
                    fontWeight: '700',
                  }}
                >
                  View All →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Forums Cards Container */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginHorizontal: -6, // 👈 spacing fix
              }}
            >
              {myForums.length > 0 ? (
                myForums.slice(0, 4).map((forum, index) => (
                  <View
                    key={index}
                    style={{
                      width: '50%', // 👈 2 cards per row
                      paddingHorizontal: 6,
                      marginBottom: spacing.md,
                    }}
                  >
                    {renderForumCard(forum, index)}
                  </View>
                ))
              ) : (
                // No forums placeholder (full width)
                <View
                  style={{
                    width: '100%',
                    backgroundColor: colors.surface,
                    borderRadius: borderRadius.xl,
                    padding: spacing.xl,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 48, marginBottom: spacing.md }}>💬</Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontWeight: '600',
                      fontSize: 16,
                      marginBottom: spacing.sm,
                    }}
                  >
                    No forums yet
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      marginBottom: spacing.lg,
                      textAlign: 'center',
                    }}
                  >
                    Create forums to engage with your students
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/teacher/create-forum' as any)}
                    style={{
                      backgroundColor: colors.success,
                      paddingHorizontal: spacing.xl,
                      paddingVertical: spacing.md,
                      borderRadius: borderRadius.lg,
                      ...shadows.md,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                      Create Forum
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>


          {/* Quick Actions - 2x2 Grid */}
          <View style={{ marginBottom: spacing.xl }}>

            {/* Title */}
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}>
              ⚡ Quick Actions
            </Text>

            {/* Cards Container */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: -6, // 👈 spacing fix
            }}>

              {quickActions.map((action) => (
                <View
                  key={action.id}
                  style={{
                    width: '50%', // 👈 2 cards per row
                    paddingHorizontal: 6,
                    marginBottom: spacing.md,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => action.route && router.push(action.route as any)}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: borderRadius.xl,
                      padding: spacing.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...shadows.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 120,
                    }}
                  >

                    {/* Icon */}
                    <View style={{
                      width: 50,
                      height: 50,
                      backgroundColor: action.color + '20',
                      borderRadius: borderRadius.full,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: spacing.sm,
                    }}>
                      <Text style={{ fontSize: 24 }}>
                        {action.icon}
                      </Text>
                    </View>

                    {/* Title */}
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.textPrimary,
                      textAlign: 'center',
                    }}>
                      {action.title}
                    </Text>

                  </TouchableOpacity>
                </View>
              ))}

            </View>
          </View>


          {/* Teacher Challenges - 2 Cards Per Row */}
          <View style={{ marginBottom: spacing.xl }}>

            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.textPrimary,
              }}>
                🎯 Challenges
              </Text>

              <TouchableOpacity onPress={() => router.push('/teacher/challenges' as any)}>
                <Text style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontWeight: '700',
                }}>
                  View All →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cards Container */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: -6, // 👈 equal spacing trick
            }}>

              {teacherChallenges.slice(0, 2).map((challenge) => (
                <View
                  key={challenge.id}
                  style={{
                    width: '50%', // 👈 2 cards per row
                    paddingHorizontal: 6,
                    marginBottom: spacing.md,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: borderRadius.xl,
                      padding: spacing.md,
                      ...shadows.md,
                      borderWidth: 2,
                      borderColor: challenge.completed
                        ? challenge.color
                        : colors.border,
                      minHeight: 170,
                    }}
                  >
                    {/* Icon */}
                    <View style={{
                      width: 50,
                      height: 50,
                      backgroundColor: challenge.color + '20',
                      borderRadius: borderRadius.full,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: spacing.sm,
                    }}>
                      <Text style={{ fontSize: 24 }}>
                        {challenge.icon}
                      </Text>
                    </View>

                    {/* Title */}
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: colors.textPrimary,
                        marginBottom: spacing.xs,
                      }}
                      numberOfLines={1}
                    >
                      {challenge.title}
                    </Text>

                    {/* Description */}
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textSecondary,
                        marginBottom: spacing.sm,
                      }}
                      numberOfLines={2}
                    >
                      {challenge.description}
                    </Text>

                    {/* Progress Bar */}
                    <View style={{
                      height: 6,
                      backgroundColor: colors.border,
                      borderRadius: borderRadius.full,
                      marginBottom: spacing.xs,
                      overflow: 'hidden',
                    }}>
                      <View style={{
                        width: `${(challenge.progress / challenge.target) * 100}%`,
                        height: '100%',
                        backgroundColor: challenge.color,
                      }} />
                    </View>

                    {/* Footer */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <Text style={{
                        fontSize: 10,
                        color: colors.textSecondary,
                        fontWeight: '600',
                      }}>
                        {challenge.progress}/{challenge.target}
                      </Text>

                      <View style={{
                        backgroundColor: challenge.completed
                          ? colors.success
                          : challenge.color,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 3,
                        borderRadius: borderRadius.sm,
                      }}>
                        <Text style={{
                          fontSize: 11,
                          color: 'white',
                          fontWeight: '700',
                        }}>
                          {challenge.reward}
                        </Text>
                      </View>
                    </View>

                  </TouchableOpacity>
                </View>
              ))}

            </View>
          </View>

          {/* Earnings Overview */}
          <View style={{ marginBottom: spacing.xxl }}>

            {/* Title */}
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}>
              💰 Earnings Overview
            </Text>

            {/* Card Container */}
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              ...shadows.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}>

              {/* Grid */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginHorizontal: -6, // 👈 spacing fix
                marginBottom: spacing.lg,
              }}>

                {/* Course Earnings */}
                <View style={{
                  width: '50%',
                  paddingHorizontal: 6,
                  marginBottom: spacing.md,
                }}>
                  <View style={{
                    backgroundColor: colors.primary + '10',
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '800',
                      color: colors.primary,
                      marginBottom: spacing.xs,
                    }}>
                      Rs {teacherStats.totalRevenue}
                    </Text>

                    <Text style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontWeight: '600',
                    }}>
                      Course Earnings
                    </Text>
                  </View>
                </View>

                {/* Challenges Earnings */}
                <View style={{
                  width: '50%',
                  paddingHorizontal: 6,
                  marginBottom: spacing.md,
                }}>
                  <View style={{
                    backgroundColor: colors.success + '10',
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      fontSize: 24,
                      fontWeight: '800',
                      color: colors.success,
                      marginBottom: spacing.xs,
                    }}>
                      Rs 500
                    </Text>

                    <Text style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontWeight: '600',
                    }}>
                      Challenges
                    </Text>
                  </View>
                </View>

                {/* Total Earnings (Full Width) */}
                <View style={{
                  width: '100%',
                  paddingHorizontal: 6,
                }}>
                  <View style={{
                    backgroundColor: colors.warning + '10',
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      fontSize: 32,
                      fontWeight: '800',
                      color: colors.warning,
                      marginBottom: spacing.xs,
                    }}>
                      Rs {teacherStats.totalRevenue + 500}
                    </Text>

                    <Text style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      fontWeight: '600',
                    }}>
                      Total Earnings
                    </Text>
                  </View>
                </View>

              </View>

              {/* Button */}
              <TouchableOpacity
                onPress={() => router.push('/teacher/earnings' as any)}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: borderRadius.lg,
                  alignItems: 'center',
                  ...shadows.md,
                }}
              >
                <Text style={{
                  color: 'white',
                  fontWeight: '700',
                  fontSize: 15,
                }}>
                  View Detailed Earnings
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: responsive.getPadding(spacing.sm, width),
        paddingTop: responsive.getPadding(spacing.sm, width),
        ...shadows.lg,
      }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing.xs }}>
          <BottomNavButton
            icon="🏠"
            label="Home"
            onPress={() => { }}
            isActive={true}
          />
          <BottomNavButton
            icon="📚"
            label="Courses"
            onPress={() => router.push('/teacher/my-courses' as any)}
          />
          <BottomNavButton
            icon="💬"
            label="Forums"
            onPress={() => router.push('/teacher/my-forums' as any)}
          />
          <BottomNavButton
            icon="🎯"
            label="Challenges"
            onPress={() => router.push('/teacher/challenges' as any)}
          />
          <BottomNavButton
            icon="👤"
            label="Profile"
            onPress={() => router.push('/teacher/profile' as any)}
          />
        </View>
      </View>
    </View>
  );
}
