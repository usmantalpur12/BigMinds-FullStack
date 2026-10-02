import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, responsive, glassmorphism } from '../../theme/colors';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../context/AuthContext';
import { getFullUrl } from '../../services/backendAPI';

const { width } = Dimensions.get('window');

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  class: string;
  level: string;
  price: number;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  thumbnail?: string;
  totalStudents: number;
  rating: number;
  tags: string[];
  isEnrolled?: boolean;
  enrollmentProgress?: number;
}

const FilteredCoursesScreen = () => {
  const router = useRouter();
  const { categoryId, classId } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);

  const responsivePadding = responsive.getPadding(spacing.lg, width);

  useEffect(() => {
    loadCourses();
    
    // Start animations
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 800 });
      contentTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 200);
  }, [categoryId, classId]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.getCourses({
        category: categoryId as string,
        class: classId as string,
        sort: 'newest',
      });
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
  };

  const getCategoryName = (id: string) => {
    const categories: { [key: string]: string } = {
      'pre-engineering': 'Pre-Engineering',
      'pre-medical': 'Pre-Medical',
      'computer-science': 'Computer Science',
      'bba': 'BBA',
      'o-levels': 'O Levels',
      'a-levels': 'A Levels',
    };
    return categories[id] || id;
  };

  const getClassName = (id: string) => {
    if (id === 'o-level') return 'O Level';
    if (id === 'a-level') return 'A Level';
    return `Class ${id}`;
  };

  const handleCoursePress = (course: Course) => {
    router.push(`/course-detail/${course._id}`);
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading courses...</Text>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: responsive.getFontSize(24, width),
              fontWeight: 'bold', 
              color: colors.surface,
            }}>
              {getCategoryName(categoryId as string)} - {getClassName(classId as string)}
            </Text>
            <Text style={{ 
              fontSize: responsive.getFontSize(14, width),
              color: colors.surface + 'CC',
              marginTop: 4,
            }}>
              {courses.length} course{courses.length !== 1 ? 's' : ''} available
            </Text>
          </View>
        </View>
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
          {courses.length === 0 ? (
            <View style={{ 
              alignItems: 'center', 
              paddingVertical: 60,
            }}>
              <Text style={{ fontSize: 64, marginBottom: 16 }}>📚</Text>
              <Text style={{ 
                fontSize: responsive.getFontSize(18, width),
                fontWeight: '600', 
                color: colors.textPrimary,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                No courses found
              </Text>
              <Text style={{ 
                fontSize: responsive.getFontSize(14, width),
                color: colors.textSecondary,
                textAlign: 'center',
              }}>
                No courses available for {getCategoryName(categoryId as string)} - {getClassName(classId as string)}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {courses.map((course) => (
                <TouchableOpacity
                  key={course._id}
                  style={{ 
                    ...glassmorphism.medium,
                    padding: responsivePadding,
                  }}
                  onPress={() => handleCoursePress(course)}
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
                      {course.thumbnail && (course.thumbnail.includes('/') || course.thumbnail.includes('\\')) ? (
                        <Image 
                          source={{ uri: getFullUrl(course.thumbnail) || '' }} 
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 32 }}>{course.thumbnail || '📚'}</Text>
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
                          {course.title}
                        </Text>
                        
                        {course.isEnrolled && (
                          <View style={{ 
                            backgroundColor: colors.success + '20',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}>
                            <Text style={{ 
                              fontSize: 10, 
                              color: colors.success,
                              fontWeight: '600',
                            }}>
                              Enrolled
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
                        {course.description}
                      </Text>
                      
                      {course.isEnrolled && course.enrollmentProgress !== undefined && (
                        <View style={{ marginBottom: 12 }}>
                          <View style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between',
                            marginBottom: 4,
                          }}>
                            <Text style={{ 
                              fontSize: 12, 
                              color: colors.textSecondary,
                            }}>
                              Progress
                            </Text>
                            <Text style={{ 
                              fontSize: 12, 
                              color: colors.primary,
                              fontWeight: '600',
                            }}>
                              {course.enrollmentProgress}%
                            </Text>
                          </View>
                          <View style={{ 
                            height: 6,
                            backgroundColor: colors.border,
                            borderRadius: borderRadius.full,
                            overflow: 'hidden',
                          }}>
                            <View style={{ 
                              height: '100%',
                              width: `${course.enrollmentProgress}%`,
                              backgroundColor: colors.primary,
                              borderRadius: borderRadius.full,
                            }} />
                          </View>
                        </View>
                      )}
                      
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}>
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          gap: 16,
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="person" size={16} color={colors.textSecondary} />
                            <Text style={{ 
                              fontSize: 12, 
                              color: colors.textSecondary,
                              marginLeft: 4,
                            }}>
                              {course.instructor?.firstName} {course.instructor?.lastName}
                            </Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="people" size={16} color={colors.textSecondary} />
                            <Text style={{ 
                              fontSize: 12, 
                              color: colors.textSecondary,
                              marginLeft: 4,
                            }}>
                              {course.totalStudents}
                            </Text>
                          </View>
                          
                          {course.rating > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="star" size={16} color={colors.warning} />
                              <Text style={{ 
                                fontSize: 12, 
                                color: colors.textSecondary,
                                marginLeft: 4,
                              }}>
                                {course.rating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <TouchableOpacity
                          style={{ 
                            backgroundColor: course.isEnrolled ? colors.success : colors.primary,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: borderRadius.md,
                          }}
                          onPress={() => handleCoursePress(course)}
                        >
                          <Text style={{ 
                            fontSize: 12, 
                            fontWeight: '600',
                            color: colors.surface,
                          }}>
                            {course.isEnrolled ? 'Continue' : 'View'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default FilteredCoursesScreen;
