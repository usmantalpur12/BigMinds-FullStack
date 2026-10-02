import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	Alert,
	ActivityIndicator,
	Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme/colors';
import { courseService } from '../services/courseService';
import { assignmentService } from '../services/assignmentService';

interface Lesson {
	_id: string;
	title: string;
	duration: number;
	videoUrl?: string;
	type?: 'video' | 'document' | 'quiz';
	isCompleted?: boolean;
}

interface Quiz {
	_id: string;
	title: string;
	totalQuestions: number;
	duration: number;
	maxAttempts: number;
	attemptsUsed?: number;
	isCompleted?: boolean;
}

interface CourseProgress {
	lessonsCompleted: number;
	totalLessons: number;
	quizzesTaken?: number;
	totalQuizzes?: number;
	averageScore?: number;
	totalStudyTime: number;
	progressPercentage: number;
}

export default function CourseLearningRoute() {
	const { courseId } = useLocalSearchParams();
	const router = useRouter();
	const { user } = useAuth();

	const [course, setCourse] = useState<any>(null);
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [quizzes, setQuizzes] = useState<Quiz[]>([]);
	const [assignments, setAssignments] = useState<any[]>([]);
	const [progress, setProgress] = useState<CourseProgress | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'assignments' | 'progress'>('lessons');

	useEffect(() => {
		loadAll();
	}, [courseId]);

	const loadAll = async () => {
		setLoading(true);
		try {
			const [courseData, lessonsData, quizzesData, assignmentsData] = await Promise.all([
				courseService.getCourse(String(courseId)),
				courseService.getLessons(String(courseId)),
				courseService.getQuizzes(String(courseId)),
				assignmentService.getCourseAssignments(String(courseId)).catch(() => [])
			]);
			setCourse(courseData);
			setLessons(lessonsData || []);
			setQuizzes(quizzesData || []);
			setAssignments(assignmentsData || []);
			try {
				const progressData = await courseService.getProgress(String(courseId));
				setProgress(progressData);
			} catch (e) {
				setProgress(null);
			}
		} catch (error) {
			console.error('Error fetching course data:', error);
			Alert.alert('Error', 'Failed to load course data');
		} finally {
			setLoading(false);
		}
	};

	const markLessonComplete = async (lessonId: string) => {
		try {
			await courseService.completeLesson(String(courseId), lessonId);
			setLessons(prev => prev.map(l => l._id === lessonId ? { ...l, isCompleted: true } : l));
			const updated = await courseService.getProgress(String(courseId));
			setProgress(updated);
		} catch (error) {
			console.error('Error marking lesson complete:', error);
			Alert.alert('Error', 'Failed to mark lesson as complete');
		}
	};

	const openLesson = (lesson: Lesson) => {
		if (lesson.videoUrl) {
			router.push({
				pathname: '/lesson-viewer/[lessonId]' as any,
				params: { 
					lessonId: lesson._id, 
					courseId: courseId, 
					videoUrl: lesson.videoUrl, 
					title: lesson.title 
				}
			});
			return;
		}

		Alert.alert('Coming soon', 'This lesson type is not yet implemented.');
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
					style={[styles.tab, activeTab === 'assignments' && styles.activeTab]}
					onPress={() => setActiveTab('assignments')}
				>
					<Ionicons name="document-text" size={20} color={activeTab === 'assignments' ? '#4F46E5' : '#6B7280'} />
					<Text style={[styles.tabText, activeTab === 'assignments' && styles.activeTabText]}>
						Assignments
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
											Attempts: {quiz.attemptsUsed || 0}/{quiz.maxAttempts}
										</Text>
									</View>
								</View>
								<View style={styles.quizActions}>
									<TouchableOpacity
										style={styles.startQuizButton}
										onPress={() =>
											router.push({
												pathname: '/screens/QuizScreen',
												params: { quizId: quiz._id },
											} as any)
										}
									>
										<Text style={styles.startQuizButtonText}>Start Quiz</Text>
									</TouchableOpacity>
								</View>
							</View>
						))}
					</View>
				)}

				{activeTab === 'assignments' && (
					<View style={styles.quizzesTab}>
						<Text style={styles.sectionTitle}>Course Assignments</Text>
						{assignments.map((assignment) => {
							const submission = assignment.submission;
							const isGraded = submission?.status === 'graded';
							const isSubmitted = submission?.status === 'submitted';

							return (
								<View key={assignment._id} style={styles.quizItem}>
									<View style={styles.quizInfo}>
										<Text style={styles.quizTitle}>{assignment.title}</Text>
										<View style={styles.quizMeta}>
											<Text style={styles.quizMetaText}>
												Due: {new Date(assignment.dueDate).toLocaleDateString()}
											</Text>
											<Text style={styles.quizMetaText}>
												Max Score: {assignment.maxScore} pts
											</Text>
										</View>
										<View style={{ flexDirection: 'row', marginTop: 8 }}>
											{isGraded ? (
												<View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
													<Text style={{ color: '#065F46', fontSize: 12, fontWeight: '600' }}>
														Graded ({submission.score}/{assignment.maxScore})
													</Text>
												</View>
											) : isSubmitted ? (
												<View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
													<Text style={{ color: '#1E40AF', fontSize: 12, fontWeight: '600' }}>
														Submitted
													</Text>
												</View>
											) : (
												<View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
													<Text style={{ color: '#374151', fontSize: 12, fontWeight: '600' }}>
														Not Submitted
													</Text>
												</View>
											)}
										</View>
									</View>
									<View style={styles.quizActions}>
										<TouchableOpacity
											style={styles.startQuizButton}
											onPress={() =>
												router.push(`/assignment/${assignment._id}` as any)
											}
										>
											<Text style={styles.startQuizButtonText}>
												{isGraded ? 'View Grade' : isSubmitted ? 'View Submission' : 'Submit Work'}
											</Text>
										</TouchableOpacity>
									</View>
								</View>
							);
						})}
						{assignments.length === 0 && (
							<Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 20 }}>
								No assignments available for this course.
							</Text>
						)}
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
						</View>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

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
}); 