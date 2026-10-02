import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { backendAPI, getFullUrl } from '../services/backendAPI';
import { courseDiscussionService } from '../services/courseDiscussionService';
import { quizService } from '../services/quizService';
import { assignmentService } from '../services/assignmentService';
import { colors, spacing, borderRadius } from '../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    position: 'relative',
    height: 200,
  },
  thumbnailContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    fontSize: 80,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  courseInfo: {
    padding: 20,
    backgroundColor: 'white',
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  courseDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  enrollButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  enrollButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  tabContent: {
    backgroundColor: 'white',
    minHeight: 400,
  },
  overviewTab: {
    padding: 20,
  },
  syllabusTab: {
    padding: 20,
  },
  forumTab: {
    padding: 20,
  },
  reviewsTab: {
    padding: 20,
  },
  reviewsSection: {
    marginBottom: 16,
  },
  reviewItem: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  reviewAuthor: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  submitReviewBox: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  submitReviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  reviewCommentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitReviewButton: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  submitReviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewCardRating: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 8,
  },
  reviewCardAuthor: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewCardComment: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  outcomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  outcomeText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    marginTop: 8,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  syllabusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  syllabusNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  syllabusNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  syllabusText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  forumButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  forumButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  forumLocked: {
    alignItems: 'center',
    padding: 40,
  },
  forumLockedText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  manageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  manageButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  analyticsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  analyticsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
  },
  analyticsLoadingText: {
    marginLeft: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  additionalStats: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  additionalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  additionalStatLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  additionalStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 8,
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  threadContent: {
    flex: 1,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  threadPreview: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  threadMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  contentManagementSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  contentEmptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  contentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contentListTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    marginRight: 12,
  },
});


const CourseDetailScreen = () => {
  const { courseId, showAddContent } = useLocalSearchParams<{ courseId: string; showAddContent?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'forum' | 'reviews'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [reviewsData, setReviewsData] = useState<{ reviews: any[]; total: number; courseRating: number; totalRatings: number } | null>(null);
  const [myReview, setMyReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [addContentAlertShown, setAddContentAlertShown] = useState(false);

  const [managementQuizzes, setManagementQuizzes] = useState<any[]>([]);
  const [managementAssignments, setManagementAssignments] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  const loadCourseContent = async () => {
    setLoadingContent(true);
    try {
      const [quizzesData, assignmentsData] = await Promise.all([
        courseService.getQuizzes(String(courseId)),
        assignmentService.getCourseAssignments(String(courseId))
      ]);
      setManagementQuizzes(quizzesData || []);
      setManagementAssignments(assignmentsData || []);
    } catch (e) {
      console.error('Failed to load course content', e);
    } finally {
      setLoadingContent(false);
    }
  };
  const handleDeleteQuiz = (id: string, title: string) => {
    Alert.alert('Delete Quiz', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await quizService.deleteQuiz(id);
            loadCourseContent();
            Alert.alert('Success', 'Quiz deleted');
          } catch (e) {
            Alert.alert('Error', 'Failed to delete quiz');
          }
        }
      }
    ]);
  };

  const handleEditQuiz = (id: string) => {
    router.push({ 
      pathname: '/teacher/create-quiz', 
      params: { 
        courseId: String(courseId),
        quizId: id
      } 
    } as any);
  };

  const handleDeleteAssignment = (id: string, title: string) => {
    Alert.alert('Delete Assignment', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await assignmentService.deleteAssignment(id);
            loadCourseContent();
            Alert.alert('Success', 'Assignment deleted');
          } catch (e) {
            Alert.alert('Error', 'Failed to delete assignment');
          }
        }
      }
    ]);
  };

  const loadCourse = async () => {
    setLoading(true);
    try {
      const data = await courseService.getCourse(String(courseId));
      console.log('📱 DEBUG: Frontend fetched course:', data?._id, 'Lessons:', data?.lessons?.length);
      setCourse(data);
      
      // Load analytics if user is the course owner
      const isOwner = user?.role === 'teacher' && (data.instructor?._id === user?.id || data.instructor === user?.id);
      if (isOwner) {
        loadAnalytics();
        loadCourseContent();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await courseService.getCourseAnalytics(String(courseId));
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (course && user?.role === 'teacher' && (course.instructor?._id === user?.id || course.instructor === user?.id) && showAddContent === '1' && !addContentAlertShown) {
      setAddContentAlertShown(true);
      Alert.alert(
        'Course created!',
        'Would you like to add a Quiz or Assignment for this course?',
        [
          { text: 'Later' },
          {
            text: 'Add Quiz',
            onPress: () => router.push({ pathname: '/teacher/create-quiz', params: { courseId: String(courseId) } } as any),
          },
          {
            text: 'Add Assignment',
            onPress: () => router.push({ pathname: '/teacher/create-assignment', params: { courseId: String(courseId) } } as any),
          },
        ]
      );
    }
  }, [course, user, showAddContent, addContentAlertShown, courseId, router]);

  const loadReviews = async () => {
    try {
      const data = await courseService.getCourseReviews(String(courseId));
      setReviewsData(data);
    } catch (e) {
      console.error('Failed to load reviews', e);
    }
  };

  const loadMyReview = async () => {
    if (!user) return;
    try {
      const r = await courseService.getMyReview(String(courseId));
      setMyReview(r);
      if (r) {
        setReviewRating(r.rating);
        setReviewComment(r.comment || '');
      }
    } catch (e) {
      console.error('Failed to load my review', e);
    }
  };

  useEffect(() => {
    const isOwnerCheck = course && user?.role === 'teacher' && (course.instructor?._id === user?.id || course.instructor === user?.id);
    const canSeeReviews = courseId && course && user && (!!course.isEnrolled || isOwnerCheck);
    if (canSeeReviews) {
      loadReviews();
      loadMyReview();
    }
  }, [courseId, course, user]);

  const handleSubmitReview = async () => {
    if (reviewRating < 1 || reviewRating > 5) {
      Alert.alert('Invalid', 'Please select a rating from 1 to 5');
      return;
    }
    setSubmittingReview(true);
    try {
      await courseService.submitReview(String(courseId), reviewRating, reviewComment);
      await loadMyReview();
      await loadReviews();
      await loadCourse();
      Alert.alert('Success', 'Review submitted');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };
  
  const handleEnroll = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to enroll in this course');
      return;
    }

    setEnrolling(true);
    try {
      await courseService.enroll(String(courseId));
      await loadCourse();
      Alert.alert('Success', 'Successfully enrolled in the course!');
    } catch (error) {
      Alert.alert('Error', 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const continueLearning = () => {
    router.push({ pathname: '/course-learning/[courseId]', params: { courseId: String(courseId) } });
  };

  const openCourseForum = () => {
    // Navigate to the dedicated course discussion screen
    router.push({ pathname: '/course-discussion/[courseId]', params: { courseId: String(courseId) } } as any);
  };

  if (loading || !course) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const enrolled = !!course.isEnrolled;
  const isOwner = user?.role === 'teacher' && course.instructor?._id === user?.id;
  const thumbnailEmoji = '📘';
  const syllabusItems: string[] = (course.lessons || []).map((l: any) => l.title);
  const learningOutcomes: string[] = course.learningOutcomes || [];

  return (
    <ScrollView style={styles.container}>
      {/* Course Header */}
      <View style={styles.header}>
        {course.thumbnail && (course.thumbnail.includes('/') || course.thumbnail.includes('\\')) ? (
          <Image 
            source={{ uri: getFullUrl(course.thumbnail) || '' }} 
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailContainer}>
            <Text style={styles.thumbnail}>{course.thumbnail || thumbnailEmoji}</Text>
          </View>
        )}
        <View style={styles.headerOverlay}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          {course.introVideo && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => {
                // Open video player
                Alert.alert('Intro Video', 'Video player will open here');
              }}
            >
              <Ionicons name="play-circle" size={48} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Course Info */}
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseDescription}>{course.description}</Text>
        
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.metaText}>by {course.instructor?.firstName} {course.instructor?.lastName}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.metaText}>{course.estimatedDuration ? `${course.estimatedDuration} hours` : '—'}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="trending-up" size={16} color="#666" />
            <Text style={styles.metaText}>{course.level || '—'}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.metaText}>{course.totalStudents ?? course.enrolledStudents ?? 0} students</Text>
          </View>
          {course.rating != null && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#666" />
              <Text style={styles.metaText}>{course.rating} ({course.totalRatings ?? 0} reviews)</Text>
            </View>
          )}
        </View>

        {/* Action Buttons / Analytics */}
        {isOwner ? (
          <>
            {/* Analytics Section */}
            {loadingAnalytics ? (
              <View style={styles.analyticsLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.analyticsLoadingText}>Loading analytics...</Text>
              </View>
            ) : analytics ? (
              <View style={styles.analyticsContainer}>
                <Text style={styles.analyticsTitle}>Course Analytics</Text>
                
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Ionicons name="people" size={24} color="#4F46E5" />
                    <Text style={styles.statValue}>{analytics.enrollments?.total || 0}</Text>
                    <Text style={styles.statLabel}>Total Enrollments</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <Text style={styles.statValue}>{analytics.enrollments?.completed || 0}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="trending-up" size={24} color="#F59E0B" />
                    <Text style={styles.statValue}>{analytics.enrollments?.averageProgress || 0}%</Text>
                    <Text style={styles.statLabel}>Avg Progress</Text>
                  </View>
                  
                  {analytics.revenue && analytics.revenue.total > 0 && (
                    <View style={styles.statCard}>
                      <Ionicons name="cash" size={24} color="#10B981" />
                      <Text style={styles.statValue}>Rs. {analytics.revenue.total.toLocaleString()}</Text>
                      <Text style={styles.statLabel}>Total Revenue</Text>
                    </View>
                  )}
                </View>

                {analytics.reviews && analytics.reviews.length > 0 && (
                  <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>Student Reviews</Text>
                    {analytics.reviews.slice(0, 5).map((r: any) => (
                      <View key={r._id} style={styles.reviewItem}>
                        <Text style={styles.reviewRating}>{r.rating}/5</Text>
                        <Text style={styles.reviewComment}>{r.comment || '—'}</Text>
                        <Text style={styles.reviewAuthor}>— {r.studentName}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {/* Additional Stats */}
                <View style={styles.additionalStats}>
                  <View style={styles.additionalStatItem}>
                    <Text style={styles.additionalStatLabel}>Active Students:</Text>
                    <Text style={styles.additionalStatValue}>{analytics.enrollments?.active || 0}</Text>
                  </View>
                  <View style={styles.additionalStatItem}>
                    <Text style={styles.additionalStatLabel}>Completion Rate:</Text>
                    <Text style={styles.additionalStatValue}>{analytics.enrollments?.completionRate || 0}%</Text>
                  </View>
                  <View style={styles.additionalStatItem}>
                    <Text style={styles.additionalStatLabel}>Recent (7 days):</Text>
                    <Text style={styles.additionalStatValue}>{analytics.enrollments?.recent || 0}</Text>
                  </View>
                  {analytics.engagement && (
                    <>
                      <View style={styles.additionalStatItem}>
                        <Text style={styles.additionalStatLabel}>Quizzes:</Text>
                        <Text style={styles.additionalStatValue}>{analytics.engagement.totalQuizzes || 0}</Text>
                      </View>
                      <View style={styles.additionalStatItem}>
                        <Text style={styles.additionalStatLabel}>Forum Threads:</Text>
                        <Text style={styles.additionalStatValue}>{analytics.engagement.totalThreads || 0}</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.ownerActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push({ pathname: '/teacher/create-course', params: { courseId: String(courseId) } } as any)}
                  >
                    <Ionicons name="create" size={20} color="white" />
                    <Text style={styles.editButtonText}>Edit Course</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => router.push({ pathname: '/teacher/my-courses' } as any)}
                  >
                    <Ionicons name="settings" size={20} color={colors.primary} />
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                </View>

                {/* Course Content Management Block */}
                <View style={styles.contentManagementSection}>
                  <Text style={styles.sectionTitle}>Course Content</Text>
                  
                  {/* Quizzes */}
                  <View style={styles.contentHeaderRow}>
                    <Text style={styles.contentSubtitle}>Quizzes</Text>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/teacher/create-quiz', params: { courseId: String(courseId) } } as any)}>
                      <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  {loadingContent ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : managementQuizzes.length === 0 ? (
                    <Text style={styles.contentEmptyText}>No quizzes available.</Text>
                  ) : (
                    managementQuizzes.map((q) => (
                      <View key={q._id} style={styles.contentListItem}>
                        <Ionicons name="help-circle" size={20} color="#6B7280" />
                        <Text style={styles.contentListTitle}>{q.title}</Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <TouchableOpacity onPress={() => handleEditQuiz(q._id)}>
                            <Ionicons name="create-outline" size={20} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteQuiz(q._id, q.title)}>
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}

                  {/* Assignments */}
                  <View style={[styles.contentHeaderRow, { marginTop: 16 }]}>
                    <Text style={styles.contentSubtitle}>Assignments</Text>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/teacher/create-assignment', params: { courseId: String(courseId) } } as any)}>
                      <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  {loadingContent ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : managementAssignments.length === 0 ? (
                    <Text style={styles.contentEmptyText}>No assignments available.</Text>
                  ) : (
                    managementAssignments.map((a) => (
                      <View key={a._id} style={styles.contentListItem}>
                        <Ionicons name="document-text" size={20} color="#6B7280" />
                        <Text style={styles.contentListTitle}>{a.title}</Text>
                        <TouchableOpacity onPress={() => handleDeleteAssignment(a._id, a.title)}>
                          <Ionicons name="trash" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </View>
            ) : null}
          </>
        ) : !enrolled ? (
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="school" size={20} color="white" />
                <Text style={styles.enrollButtonText}>Enroll Course</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={continueLearning}
          >
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.continueButtonText}>Continue Learning</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'syllabus' && styles.activeTab]}
          onPress={() => setActiveTab('syllabus')}
        >
          <Text style={[styles.tabText, activeTab === 'syllabus' && styles.activeTabText]}>
            Syllabus
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'forum' && styles.activeTab]}
          onPress={() => setActiveTab('forum')}
        >
          <Text style={[styles.tabText, activeTab === 'forum' && styles.activeTabText]}>
            Discussion
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'overview' && (
          <View style={styles.overviewTab}>
            <Text style={styles.sectionTitle}>Learning Outcomes</Text>
            {learningOutcomes.length > 0 ? learningOutcomes.map((outcome, index) => (
              <View key={index} style={styles.outcomeItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.outcomeText}>{outcome}</Text>
              </View>
            )) : (
              <Text style={styles.outcomeText}>Course outcomes will be available after enrollment.</Text>
            )}
            
            <Text style={styles.sectionTitle}>Course Features</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Ionicons name="videocam" size={24} color="#4F46E5" />
                <Text style={styles.featureText}>Video Lectures</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="document-text" size={24} color="#4F46E5" />
                <Text style={styles.featureText}>Study Materials</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="help-circle" size={24} color="#4F46E5" />
                <Text style={styles.featureText}>Quizzes & MCQs</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="chatbubbles" size={24} color="#4F46E5" />
                <Text style={styles.featureText}>Discussion Forum</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'syllabus' && (
          <View style={styles.syllabusTab}>
            <Text style={styles.sectionTitle}>Course Syllabus</Text>
            {syllabusItems.length > 0 ? syllabusItems.map((item, index) => (
              <View key={index} style={styles.syllabusItem}>
                <View style={styles.syllabusNumber}>
                  <Text style={styles.syllabusNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.syllabusText}>{item}</Text>
              </View>
            )) : (
              <Text style={styles.syllabusText}>
                {course.isEnrolled 
                  ? "No lessons have been uploaded for this course yet." 
                  : "Syllabus will be available after enrollment."}
              </Text>
            )}
          </View>
        )}

        {activeTab === 'forum' && (
          <View style={styles.forumTab}>
            <Text style={styles.sectionTitle}>Course Discussion</Text>
            {isOwner ? (
              <CourseDiscussionForTeacher courseId={String(courseId)} />
            ) : enrolled ? (
              <TouchableOpacity
                style={styles.forumButton}
                onPress={openCourseForum}
              >
                <Ionicons name="chatbubbles" size={20} color="white" />
                <Text style={styles.forumButtonText}>Open Course Forum</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.forumLocked}>
                <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
                <Text style={styles.forumLockedText}>
                  Enroll in the course to access the discussion forum
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.reviewsTab}>
            <Text style={styles.sectionTitle}>
              Reviews {reviewsData ? `(${reviewsData.courseRating?.toFixed(1)} · ${reviewsData.total} reviews)` : ''}
            </Text>
            {enrolled && user?.role === 'student' && (
              <View style={styles.submitReviewBox}>
                <Text style={styles.submitReviewLabel}>Your rating</Text>
                <View style={{ flexDirection: 'row', marginVertical: 8 }}>
                  {[1,2,3,4,5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={{ marginRight: 8 }}>
                      <Ionicons name={reviewRating >= star ? 'star' : 'star-outline'} size={32} color="#F59E0B" />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.submitReviewLabel}>Comment (optional)</Text>
                <TextInput
                  style={styles.reviewCommentInput}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Share your experience..."
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.submitReviewButton}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.submitReviewButtonText}>{myReview ? 'Update Review' : 'Submit Review'}</Text>}
                </TouchableOpacity>
              </View>
            )}
            {reviewsData?.reviews?.length ? reviewsData.reviews.map((r: any) => (
              <View key={r._id} style={styles.reviewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.reviewCardRating}>{r.rating}/5</Text>
                  <Text style={styles.reviewCardAuthor}>{r.studentId?.firstName} {r.studentId?.lastName}</Text>
                </View>
                {r.comment ? <Text style={styles.reviewCardComment}>{r.comment}</Text> : null}
              </View>
            )) : <Text style={styles.outcomeText}>No reviews yet.</Text>}
          </View>
        )}
      </View>
    </ScrollView>
  );
};


// Component for Teacher Course Discussion View
const CourseDiscussionForTeacher = ({ courseId }: { courseId: string }) => {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreads();
  }, [courseId]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const data = await courseDiscussionService.getCourseThreads(courseId);
      setThreads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForum = () => {
    router.push({ 
      pathname: '/teacher/create-forum', 
      params: { courseId } 
    } as any);
  };

  const handleThreadPress = (thread: any) => {
    // Navigate to course discussion page
    router.push({ 
      pathname: '/course-discussion/[courseId]', 
      params: { courseId } 
    } as any);
  };

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ marginTop: 8, color: colors.textSecondary }}>Loading discussions...</Text>
      </View>
    );
  }

  if (threads.length === 0) {
    return (
      <View style={styles.forumLocked}>
        <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
        <Text style={styles.forumLockedText}>
          No discussion threads yet
        </Text>
        <TouchableOpacity
          style={[styles.forumButton, { marginTop: 16 }]}
          onPress={handleCreateForum}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.forumButtonText}>Create Discussion Forum</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.forumButton, { marginBottom: 16 }]}
        onPress={handleCreateForum}
      >
        <Ionicons name="add-circle" size={20} color="white" />
        <Text style={styles.forumButtonText}>Create New Thread</Text>
      </TouchableOpacity>

      {threads.map((thread) => (
        <TouchableOpacity
          key={thread._id}
          style={styles.threadItem}
          onPress={() => handleThreadPress(thread._id)}
        >
          <View style={styles.threadContent}>
            {thread.isPinned && (
              <Ionicons name="pin" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.threadTitle}>{thread.title}</Text>
            <Text style={styles.threadPreview} numberOfLines={2}>
              {thread.content}
            </Text>
            <View style={styles.threadMeta}>
              <Text style={styles.threadMetaText}>
                {thread.authorId?.firstName} {thread.authorId?.lastName}
              </Text>
              <Text style={styles.threadMetaText}>•</Text>
              <Text style={styles.threadMetaText}>
                {thread.replyCount || 0} replies
              </Text>
              <Text style={styles.threadMetaText}>•</Text>
              <Text style={styles.threadMetaText}>
                {new Date(thread.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default CourseDetailScreen; 