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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { backend } from '../services/backend';
import { getFullUrl } from '../services/backendAPI';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  thumbnail: string;
  lessons: Array<{
    _id: string;
    title: string;
    duration: number;
    type: string;
  }>;
  enrolledStudents: number;
  totalStudents: number;
  rating: number;
  tags: string[];
  syllabus: string[];
  learningOutcomes: string[];
  duration: string;
  difficulty: string;
  isEnrolled?: boolean;
  enrollmentProgress?: number;
  enrollmentStatus?: string;
}

interface Enrollment {
  _id: string;
  courseId: string;
  studentId: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  totalStudyTime: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  averageQuizScore: number;
  enrolledAt: string;
}

const CourseDetailScreen = () => {
  const { courseId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'forum'>('overview');

  useEffect(() => {
    fetchCourseDetails();
    if (user) {
      checkEnrollmentStatus();
    }
  }, [courseId, user]);

  const fetchCourseDetails = async () => {
    try {
      const response = await backend.get(`/courses/${courseId}`);
      const courseData = response.data.data;
      setCourse(courseData);
      
      // Check enrollment status from course data
      if (courseData.isEnrolled) {
        setEnrollment({
          _id: courseData.enrollmentId || '',
          courseId: courseId as string,
          studentId: user?.id || '',
          status: courseData.enrollmentStatus || 'active',
          progress: courseData.enrollmentProgress || 0,
          totalStudyTime: 0,
          lessonsCompleted: 0,
          quizzesTaken: 0,
          averageQuizScore: 0,
          enrolledAt: new Date().toISOString(),
        });
      } else {
        setEnrollment(null);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const response = await backend.get(`/users/${user?.id}/enrollments`);
      const userEnrollment = response.data.data.find(
        (enrollment: Enrollment) => enrollment.courseId === courseId
      );
      setEnrollment(userEnrollment || null);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to enroll in this course');
      return;
    }

    setEnrolling(true);
    try {
      const response = await backend.post(`/courses/${courseId}/enroll`);
      const enrollmentData = response.data.data.enrollment || response.data.data;
      const courseData = response.data.data.course || course;
      
      setEnrollment({
        _id: enrollmentData._id || '',
        courseId: courseId as string,
        studentId: user?.id || user?._id || '',
        status: enrollmentData.status || 'active',
        progress: enrollmentData.progress || 0,
        totalStudyTime: enrollmentData.totalStudyTime || 0,
        lessonsCompleted: enrollmentData.lessonsCompleted || 0,
        quizzesTaken: enrollmentData.quizzesTaken || 0,
        averageQuizScore: enrollmentData.averageQuizScore || 0,
        enrolledAt: enrollmentData.enrolledAt || new Date().toISOString(),
      });
      
      // Update course with enrollment status
      if (courseData && course) {
        setCourse({
          ...course,
          isEnrolled: true,
          enrollmentProgress: 0,
          enrollmentStatus: 'active',
        });
      }
      
      Alert.alert('Success', 'Successfully enrolled in the course!');
    } catch (error: any) {
      console.error('Enrollment error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const continueLearning = () => {
    router.push(`/course-learning/${courseId}`);
  };

  const openCourseForum = () => {
    router.push(`/course-discussion/${courseId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading course details...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Course not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Course Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: getFullUrl(course.thumbnail) || 'https://via.placeholder.com/400x200' }}
          style={styles.thumbnail}
        />
        <View style={styles.headerOverlay}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Course Info */}
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseDescription}>{course.description}</Text>
        
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.metaText}>
              {course.instructor.firstName} {course.instructor.lastName}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.metaText}>{course.duration}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="trending-up" size={16} color="#666" />
            <Text style={styles.metaText}>{course.difficulty}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.metaText}>{course.enrolledStudents} students</Text>
          </View>
        </View>

        {/* Enrollment Button */}
        {!enrollment ? (
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
                <Text style={styles.enrollButtonText}>Enroll Now</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View>
            {/* Progress Bar */}
            {enrollment.progress > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Your Progress</Text>
                  <Text style={styles.progressPercentage}>{enrollment.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${enrollment.progress}%` }]} />
                </View>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={continueLearning}
            >
              <Ionicons name="play" size={20} color="white" />
              <Text style={styles.continueButtonText}>Continue Learning</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* AI Chat Button - Only for enrolled students */}
        {enrollment && (
          <TouchableOpacity
            style={styles.aiChatButton}
            onPress={() => router.push(`/course-ai-chat/${courseId}`)}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
            <Text style={styles.aiChatButtonText}>Chat with AI</Text>
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
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'overview' && (
          <View style={styles.overviewTab}>
            <Text style={styles.sectionTitle}>Learning Outcomes</Text>
            {course.learningOutcomes.map((outcome, index) => (
              <View key={index} style={styles.outcomeItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.outcomeText}>{outcome}</Text>
              </View>
            ))}
            
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
            {course.syllabus.map((item, index) => (
              <View key={index} style={styles.syllabusItem}>
                <View style={styles.syllabusNumber}>
                  <Text style={styles.syllabusNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.syllabusText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'forum' && (
          <View style={styles.forumTab}>
            <Text style={styles.sectionTitle}>Course Discussion</Text>
            {enrollment ? (
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    position: 'relative',
    height: 200,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
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
  progressContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  aiChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
    marginTop: 12,
  },
  aiChatButtonText: {
    color: '#4F46E5',
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
});

export default CourseDetailScreen; 