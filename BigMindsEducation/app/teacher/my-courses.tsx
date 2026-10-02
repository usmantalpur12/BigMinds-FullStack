import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  I18nManager,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { courseService } from '../services/courseService';
import { useAuth } from '../context/AuthContext';
import { useTeacherTheme } from '../theme/teacherTheme';
import { TeacherButton, TeacherSkeleton, TeacherCourseCard, showTeacherToast } from './components';

const { width } = Dimensions.get('window');

// Responsive helper
const responsive = {
  font: (size: number) => {
    if (width < 375) return size * 0.9;
    if (width > 414) return size * 1.05;
    return size;
  },
};

export default function MyCoursesScreen() {
  const { user } = useAuth();
  const {
    theme: { background, surface, spacing, typography, text, semantic, radius },
  } = useTeacherTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const userId = (user as any)?._id || (user as any)?.id || null;

  const loadCourses = async (showLoader = true) => {
    if (!userId) {
      setLoading(false);
      setCourses([]);
      return;
    }
    try {
      if (showLoader) setLoading(true);
      const data = await courseService.getMyCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading courses:', error);
      showTeacherToast({ type: 'error', title: 'Unable to load courses', message: 'Please try again.' });
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses(false);
    setRefreshing(false);
  };

  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${courseTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setPendingDelete(courseId);
            const snapshot = courses;
            setCourses((prev) => prev.filter((item) => item._id !== courseId));
            try {
              await courseService.deleteCourse(courseId);
              showTeacherToast({ type: 'success', title: 'Course deleted' });
            } catch (error) {
              console.error('Error deleting course:', error);
              setCourses(snapshot);
              showTeacherToast({ type: 'error', title: 'Delete failed', message: 'Please try again.' });
            } finally {
              setPendingDelete(null);
            }
          },
        },
      ]
    );
  };

  const handleEditCourse = (courseId: string) => {
    router.push({ pathname: '/teacher/create-course', params: { courseId } } as any);
  };

  const handleViewCourse = (courseId: string) => {
    router.push({ pathname: '/course-detail/[courseId]', params: { courseId } } as any);
  };

  const handleCreateCourse = () => {
    router.push('/teacher/create-course' as any);
  };

  const handleViewAssignments = (courseId: string) => {
    router.push({ pathname: '/teacher/assignments', params: { courseId } } as any);
  };

  useEffect(() => {
    loadCourses();
  }, [userId]);

  const publishedCourses = useMemo(() => courses.filter((c) => c.isPublished), [courses]);
  const draftCourses = useMemo(() => courses.filter((c) => !c.isPublished), [courses]);

  const renderSkeletons = () =>
    Array.from({ length: 3 }).map((_, index) => (
      <View
        key={`skeleton-${index}`}
        style={{
          backgroundColor: surface.default,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <TeacherSkeleton height={20} width="70%" />
        <TeacherSkeleton height={16} width="100%" />
        <TeacherSkeleton height={16} width="60%" />
        <TeacherSkeleton height={1} width="100%" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TeacherSkeleton height={14} width={80} />
          <TeacherSkeleton height={14} width={60} />
        </View>
      </View>
    ));

  return (
    <View style={{ flex: 1, backgroundColor: background.default }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
          backgroundColor: semantic.primary.default,
          borderBottomLeftRadius: radius.xl,
          borderBottomRightRadius: radius.xl,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          gap: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: responsive.font(28),
              color: '#FFFFFF',
              textAlign: I18nManager.isRTL ? 'right' : 'left',
              letterSpacing: 0.5,
            }}
          >
            My Courses
          </Text>
          <Text
            style={{
              marginTop: spacing.xs,
              fontFamily: typography.fontFamily.medium,
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: responsive.font(14),
              textAlign: I18nManager.isRTL ? 'right' : 'left',
            }}
            accessibilityLiveRegion="polite"
          >
            {courses.length} total • {publishedCourses.length} published • {draftCourses.length} drafts
          </Text>
        </View>
        <View style={{ width: 120 }}>
          <TeacherButton 
            title="Create" 
            icon="add" 
            onPress={handleCreateCourse}
            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} 
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          renderSkeletons()
        ) : courses.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: spacing.xl,
              gap: spacing.md,
            }}
          >
            <Ionicons name="book-outline" size={64} color={text.muted} />
            <Text
              style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: responsive.font(20),
                color: text.primary,
              }}
            >
              No courses yet
            </Text>
            <Text
              style={{
                fontFamily: typography.fontFamily.regular,
                fontSize: responsive.font(14),
                color: text.secondary,
                textAlign: 'center',
              }}
            >
              Create your first course to start sharing knowledge.
            </Text>
            <View style={{ width: '80%' }}>
              <TeacherButton title="Create Course" icon="add-circle" onPress={handleCreateCourse} />
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.xl }}>
            <CourseSection
              title={`Published Courses (${publishedCourses.length})`}
              icon="checkmark-circle"
              iconColor={semantic.success.default}
              courses={publishedCourses}
              onView={handleViewCourse}
              onEdit={handleEditCourse}
              onDelete={handleDeleteCourse}
              onViewAssignments={handleViewAssignments}
              pendingDelete={pendingDelete}
            />
            <CourseSection
              title={`Draft Courses (${draftCourses.length})`}
              icon="create-outline"
              iconColor={semantic.warning.default}
              courses={draftCourses}
              onView={handleViewCourse}
              onEdit={handleEditCourse}
              onDelete={handleDeleteCourse}
              onViewAssignments={handleViewAssignments}
              pendingDelete={pendingDelete}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type CourseSectionProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  courses: any[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onViewAssignments: (id: string) => void;
  pendingDelete: string | null;
};

const CourseSection: React.FC<CourseSectionProps> = ({
  title,
  icon,
  iconColor,
  courses,
  onView,
  onEdit,
  onDelete,
  onViewAssignments,
  pendingDelete,
}) => {
  const {
    theme: { spacing, typography, text },
  } = useTeacherTheme();

  if (courses.length === 0) return null;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
        <Text
          style={{
            fontFamily: typography.fontFamily.semibold,
            fontSize: typography.sizes.lg,
            color: text.primary,
          }}
        >
          {title}
        </Text>
      </View>
      <View style={{ gap: spacing.md }}>
        {courses.map((course) => (
          <View key={course._id} style={{ width: '100%' }}>
            <TeacherCourseCard
              course={course}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewAssignments={onViewAssignments}
              pendingDelete={pendingDelete === course._id}
            />
          </View>
        ))}
      </View>
    </View>
  );
};