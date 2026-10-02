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

interface Lesson {
  _id: string;
  title: string;
  duration: number;
  type: 'video' | 'document' | 'quiz';
  isCompleted: boolean;
  content?: string;
  videoUrl?: string;
}

interface Quiz {
  _id: string;
  title: string;
  totalQuestions: number;
  duration: number;
  isCompleted: boolean;
  score?: number;
  maxAttempts: number;
  attemptsUsed: number;
}

interface CourseProgress {
  lessonsCompleted: number;
  totalLessons: number;
  quizzesTaken: number;
  totalQuizzes: number;
  averageScore: number;
  totalStudyTime: number;
  progressPercentage: number;
}

const CourseLearningScreen = () => {
  const { courseId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'progress'>('lessons');

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const courseResponse = await backend.get(`/courses/${courseId}`);
      setCourse(courseResponse.data.data);

      // Fetch lessons
      const lessonsResponse = await backend.get(`/courses/${courseId}/lessons`);
      setLessons(lessonsResponse.data.data);

      // Fetch quizzes
      const quizzesResponse = await backend.get(`/courses/${courseId}/quizzes`);
      setQuizzes(quizzesResponse.data.data);

      // Fetch user progress
      const progressResponse = await backend.get(`/users/${user?.id}/enrollments/${courseId}/progress`);
      setProgress(progressResponse.data.data);
    } catch (error) {
      console.error('Error fetching course data:', error);
      Alert.alert('Error', 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      await backend.put(`/enrollments/${courseId}/lessons/${lessonId}/complete`);
      
      // Update local state
      setLessons(prev => prev.map(lesson => 
        lesson._id === lessonId ? { ...lesson, isCompleted: true } : lesson
      ));
      
      // Refresh progress
      fetchCourseData();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      Alert.alert('Error', 'Failed to mark lesson as complete');
    }
  };

  const startQuiz = (quiz: Quiz) => {
    if (quiz.attemptsUsed >= quiz.maxAttempts) {
      Alert.alert('No Attempts Left', 'You have used all attempts for this quiz');
      return;
    }
    
    router.push(`/quiz/${quiz._id}` as any);
  };

  const viewQuizResults = (quiz: Quiz) => {
    router.push(`/quiz-results/${quiz._id}` as any);
  };

  const openLesson = (lesson: Lesson) => {
    if (lesson.type === 'video') {
      router.push({
        pathname: `/lesson-viewer/${lesson._id}`,
        params: {
          courseId: courseId as string,
          videoUrl: lesson.videoUrl || '',
          title: lesson.title
        }
      } as any);
    } else if (lesson.type === 'document') {
      Alert.alert('Coming Soon', 'Document viewing feature is under construction');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading course content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{course?.title}</Text>
        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            {progress?.progressPercentage || 0}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress?.progressPercentage || 0}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressBarLabel}>
          {progress?.lessonsCompleted || 0} of {progress?.totalLessons || 0} lessons completed
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
          onPress={() => setActiveTab('lessons')}
        >
          <Ionicons name="book" size={20} color={activeTab === 'lessons' ? '#4F46E5' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>
            Lessons
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quizzes' && styles.activeTab]}
          onPress={() => setActiveTab('quizzes')}
        >
          <Ionicons name="help-circle" size={20} color={activeTab === 'quizzes' ? '#4F46E5' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'quizzes' && styles.activeTabText]}>
            Quizzes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
          onPress={() => setActiveTab('progress')}
        >
          <Ionicons name="stats-chart" size={20} color={activeTab === 'progress' ? '#4F46E5' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>
            Progress
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.tabContent}>
        {activeTab === 'lessons' && (
          <View style={styles.lessonsTab}>
            <Text style={styles.sectionTitle}>Course Lessons</Text>
            {lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson._id}
                style={styles.lessonItem}
                onPress={() => openLesson(lesson)}
              >
                <View style={styles.lessonHeader}>
                  <View style={styles.lessonNumber}>
                    <Text style={styles.lessonNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <View style={styles.lessonMeta}>
                      <Ionicons 
                        name={lesson.type === 'video' ? 'videocam' : 'document'} 
                        size={16} 
                        color="#6B7280" 
                      />
                      <Text style={styles.lessonMetaText}>
                        {lesson.duration} min • {lesson.type}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.lessonActions}>
                    {lesson.isCompleted ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => markLessonComplete(lesson._id)}
                      >
                        <Text style={styles.completeButtonText}>Mark Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'quizzes' && (
          <View style={styles.quizzesTab}>
            <Text style={styles.sectionTitle}>Course Quizzes</Text>
            {quizzes.map((quiz) => (
              <View key={quiz._id} style={styles.quizItem}>
                <View style={styles.quizInfo}>
                  <Text style={styles.quizTitle}>{quiz.title}</Text>
                  <View style={styles.quizMeta}>
                    <Text style={styles.quizMetaText}>
                      {quiz.totalQuestions} questions • {quiz.duration} min
                    </Text>
                    <Text style={styles.quizMetaText}>
                      Attempts: {quiz.attemptsUsed}/{quiz.maxAttempts}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.quizActions}>
                  {quiz.isCompleted ? (
                    <TouchableOpacity
                      style={styles.resultsButton}
                      onPress={() => viewQuizResults(quiz)}
                    >
                      <Text style={styles.resultsButtonText}>View Results</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.startQuizButton,
                        quiz.attemptsUsed >= quiz.maxAttempts && styles.disabledButton
                      ]}
                      onPress={() => startQuiz(quiz)}
                      disabled={quiz.attemptsUsed >= quiz.maxAttempts}
                    >
                      <Text style={styles.startQuizButtonText}>
                        {quiz.attemptsUsed >= quiz.maxAttempts ? 'No Attempts Left' : 'Start Quiz'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'progress' && (
          <View style={styles.progressTab}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressValue}>
                  {progress?.progressPercentage || 0}%
                </Text>
              </View>
              
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Lessons Completed</Text>
                <Text style={styles.progressValue}>
                  {progress?.lessonsCompleted || 0} / {progress?.totalLessons || 0}
                </Text>
              </View>
              
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Quizzes Taken</Text>
                <Text style={styles.progressValue}>
                  {progress?.quizzesTaken || 0} / {progress?.totalQuizzes || 0}
                </Text>
              </View>
              
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Average Score</Text>
                <Text style={styles.progressValue}>
                  {progress?.averageScore || 0}%
                </Text>
              </View>
              
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Study Time</Text>
                <Text style={styles.progressValue}>
                  {Math.round((progress?.totalStudyTime || 0) / 60)} hours
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.certificateButton}
              onPress={() => router.push(`/certificate/${courseId}` as any)}
            >
              <Ionicons name="ribbon" size={20} color="white" />
              <Text style={styles.certificateButtonText}>View Certificate</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
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
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 16,
  },
  progressIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressBarLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  lessonsTab: {
    padding: 20,
  },
  quizzesTab: {
    padding: 20,
  },
  progressTab: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  lessonItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  lessonNumberText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonMetaText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  lessonActions: {
    marginLeft: 16,
  },
  completedBadge: {
    padding: 4,
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  quizItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizInfo: {
    marginBottom: 12,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  quizMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quizMetaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  quizActions: {
    alignItems: 'center',
  },
  startQuizButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startQuizButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resultsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  progressLabel: {
    fontSize: 16,
    color: '#374151',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  certificateButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  certificateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CourseLearningScreen; 