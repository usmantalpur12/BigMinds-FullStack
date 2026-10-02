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
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { backend } from '../services/backend';
import { getFullUrl } from '../services/backendAPI';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: string;
  bio?: string;
  interests?: string[];
  createdAt: string;
}

interface UserStats {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTime: number;
  quizzesTaken: number;
  averageQuizScore: number;
  coursesCompleted: number;
  totalPosts: number;
  totalThreads: number;
  rank: number;
}

interface EnrolledCourse {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    thumbnail: string;
    category: string;
  };
  progress: number;
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: string;
}

interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string;
}

const ProfileScreen = () => {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const userId = searchParams.userId as string;
  const { user, refreshUser, logout } = useAuth();
  const isOwnProfile = !userId || userId === user?._id || userId === (user as any)?.id;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    interests: [] as string[],
  });
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'achievements'>('profile');
  const [interestInput, setInterestInput] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [user, userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const targetId = userId || 'me';
      
      // Fetch user profile
      const profileResponse = await backend.get(`/users/${targetId}`);
      setProfile(profileResponse.data.data);
      
      // Fetch user stats
      const statsResponse = await backend.get(`/users/${targetId}/stats`).catch(() => ({ data: { data: null } }));
      setStats(statsResponse.data.data);
      
      // Fetch enrolled courses
      const coursesResponse = await backend.get(`/users/${targetId}/enrollments`).catch(() => ({ data: { data: [] } }));
      setEnrolledCourses(coursesResponse.data.data || []);
      
      // Initialize edit data
      setEditData({
        firstName: profileResponse.data.data.firstName,
        lastName: profileResponse.data.data.lastName,
        bio: profileResponse.data.data.bio || '',
        interests: profileResponse.data.data.interests || [],
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditing(true);
  };

  const saveProfile = async () => {
    try {
      const response = await backend.put('/users/me', editData);
      setProfile(response.data.data);
      setEditing(false);
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    }
  };

  const cancelEdit = () => {
    setEditData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      bio: profile?.bio || '',
      interests: profile?.interests || [],
    });
    setEditing(false);
  };

  const addInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (!trimmed || editData.interests.includes(trimmed)) {
      return;
    }
      setEditData(prev => ({
        ...prev,
        interests: [...prev.interests, trimmed]
      }));
  };

  const removeInterest = (interest: string) => {
    setEditData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const openCourse = (courseId: string) => {
    router.push(`/course-detail/${courseId}`);
  };

  const openLeaderboard = () => {
    router.push(`/leaderboard`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isOwnProfile ? 'My Profile' : 'User Profile'}</Text>
        {isOwnProfile && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image
              source={{ 
                uri: getFullUrl(profile.avatar) || 'https://via.placeholder.com/100x100?text=' + profile.firstName.charAt(0)
              }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile.firstName} {profile.lastName}
              </Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <Text style={styles.profileRole}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Text>
            </View>
            {isOwnProfile && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Ionicons name="pencil" size={20} color="#4F46E5" />
              </TouchableOpacity>
            )}
          </View>

          {profile.bio && (
            <Text style={styles.profileBio}>{profile.bio}</Text>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              <Text style={styles.interestsTitle}>Interests</Text>
              <View style={styles.interestsList}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Quick Stats</Text>
            <TouchableOpacity onPress={() => setShowStats(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{stats?.level || 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="flash" size={24} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{stats?.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="school" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.statValue}>{stats?.coursesCompleted || 0}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="trending-up" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>#{stats?.rank || 'N/A'}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              Profile
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
            onPress={() => setActiveTab('courses')}
          >
            <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>
              Courses
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
              Achievements
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'profile' && (
            <View style={styles.profileTab}>
              {isOwnProfile ? (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/edit-profile' as never)}
                  >
                    <Ionicons name="settings" size={20} color="#4F46E5" />
                    <Text style={styles.actionButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/change-password' as never)}
                  >
                    <Ionicons name="lock-closed" size={20} color="#4F46E5" />
                    <Text style={styles.actionButtonText}>Change Password</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/notifications' as never)}
                  >
                    <Ionicons name="notifications" size={20} color="#4F46E5" />
                    <Text style={styles.actionButtonText}>Notification Settings</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/privacy' as never)}
                  >
                    <Ionicons name="shield-checkmark" size={20} color="#4F46E5" />
                    <Text style={styles.actionButtonText}>Privacy Settings</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.otherUserSection}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>{new Date(profile.createdAt).toLocaleDateString()}</Text>
                  
                  <View style={styles.infoSpacer} />
                  
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue}>{profile.role.toUpperCase()}</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'courses' && (
            <View style={styles.coursesTab}>
              <Text style={styles.sectionTitle}>Enrolled Courses</Text>
              {enrolledCourses.length > 0 ? (
                enrolledCourses.map((enrollment) => (
                  <TouchableOpacity
                    key={enrollment._id}
                    style={styles.courseItem}
                    onPress={() => openCourse(enrollment.courseId._id)}
                  >
                    <Image
                      source={{ uri: getFullUrl(enrollment.courseId?.thumbnail) || 'https://via.placeholder.com/100x100' }}
                      style={styles.courseThumbnail}
                    />
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{enrollment.courseId?.title}</Text>
                      <Text style={styles.courseCategory}>{enrollment.courseId?.category}</Text>
                      <View style={styles.courseProgress}>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${enrollment.progress}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.progressText}>{enrollment.progress}%</Text>
                      </View>
                    </View>
                    <View style={styles.courseStatus}>
                      <View style={[
                        styles.statusBadge,
                        enrollment.status === 'completed' && styles.completedBadge,
                        enrollment.status === 'dropped' && styles.droppedBadge
                      ]}>
                        <Text style={styles.statusText}>
                          {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyCourses}>
                  <Ionicons name="school-outline" size={64} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No courses enrolled</Text>
                  <Text style={styles.emptyText}>
                    Start your learning journey by enrolling in courses
                  </Text>
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => router.push('/courses')}
                  >
                    <Text style={styles.browseButtonText}>Browse Courses</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'achievements' && (
            <View style={styles.achievementsTab}>
              <Text style={styles.sectionTitle}>Your Achievements</Text>
              {/* Achievements data is no longer fetched from gamification context */}
              {/* For now, we'll show a placeholder or remove this tab if no achievements are managed */}
              {/* Assuming achievements will be managed elsewhere or removed */}
              <View style={styles.emptyAchievements}>
                <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No achievements yet</Text>
                <Text style={styles.emptyText}>
                  Complete courses and activities to earn achievements
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editing}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={cancelEdit}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={saveProfile}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={editData.firstName}
                onChangeText={(text) => setEditData(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter first name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={editData.lastName}
                onChangeText={(text) => setEditData(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter last name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editData.bio}
                onChangeText={(text) => setEditData(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Interests</Text>
              <View style={styles.interestsInput}>
                <TextInput
                  style={styles.interestsTextInput}
                  placeholder="Add an interest"
                  value={interestInput}
                  onChangeText={setInterestInput}
                  onSubmitEditing={() => {
                    addInterest(interestInput);
                    setInterestInput('');
                  }}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.addInterestButton}
                  onPress={() => {
                    addInterest(interestInput);
                    setInterestInput('');
                  }}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.editInterestsList}>
                {editData.interests.map((interest, index) => (
                  <View key={index} style={styles.editInterestTag}>
                    <Text style={styles.editInterestText}>{interest}</Text>
                    <TouchableOpacity onPress={() => removeInterest(interest)}>
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal
        visible={showStats}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStats(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Detailed Stats</Text>
            <TouchableOpacity onPress={openLeaderboard}>
              <Text style={styles.modalSaveText}>Leaderboard</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.statsDetailCard}>
              <Text style={styles.statsDetailTitle}>Learning Progress</Text>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Total XP</Text>
                <Text style={styles.statsDetailValue}>{stats?.totalXp || 0}</Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Current Level</Text>
                <Text style={styles.statsDetailValue}>{stats?.level || 1}</Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Current Streak</Text>
                <Text style={styles.statsDetailValue}>{stats?.currentStreak || 0} days</Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Longest Streak</Text>
                <Text style={styles.statsDetailValue}>{stats?.longestStreak || 0} days</Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Total Study Time</Text>
                <Text style={styles.statsDetailValue}>
                  {Math.round((stats?.totalStudyTime || 0) / 60)} hours
                </Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Quizzes Taken</Text>
                <Text style={styles.statsDetailValue}>{stats?.quizzesTaken || 0}</Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Average Quiz Score</Text>
                <Text style={styles.statsDetailValue}>{stats?.averageQuizScore || 0}%</Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Courses Completed</Text>
                <Text style={styles.statsDetailValue}>{stats?.coursesCompleted || 0}</Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Forum Posts</Text>
                <Text style={styles.statsDetailValue}>{stats?.totalPosts || 0}</Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Discussion Threads</Text>
                <Text style={styles.statsDetailValue}>{stats?.totalThreads || 0}</Text>
              </View>
              
              <View style={styles.statsDetailRow}>
                <Text style={styles.statsDetailLabel}>Global Rank</Text>
                <Text style={styles.statsDetailValue}>#{stats?.rank || 'N/A'}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  profileBio: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  interestsContainer: {
    marginTop: 8,
  },
  interestsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileTab: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  coursesTab: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  courseItem: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  courseThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  courseCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  courseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  courseStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadge: {
    backgroundColor: '#F0FDF4',
  },
  droppedBadge: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  emptyCourses: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsTab: {
    gap: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  achievementDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyAchievements: {
    alignItems: 'center',
    padding: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  interestsInput: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  interestsTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    marginRight: 8,
  },
  addInterestButton: {
    backgroundColor: '#4F46E5',
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInterestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  editInterestTag: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  editInterestText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
  },
  statsDetailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
  },
  statsDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsDetailLabel: {
    fontSize: 16,
    color: '#374151',
  },
  statsDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  otherUserSection: {
    padding: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoSpacer: {
    height: 16,
  },
});

export default ProfileScreen; 