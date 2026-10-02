import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  Dimensions,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { profileService, UserProfile, UserDocument, ActivityLog } from '../services/profileService';
import { uploadImage } from '../services/fileUpload';
import { getFullUrl } from '../services/backendAPI';

const { width } = Dimensions.get('window');

const ModernProfileScreen = () => {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'security'>('profile');
  
  // Edit form state
  const [editData, setEditData] = useState({
    displayName: '',
    bio: '',
    phoneNumber: '',
    location: '',
    dateOfBirth: '',
    gender: 'prefer-not-to-say' as 'male' | 'female' | 'other' | 'prefer-not-to-say',
    socialLinks: {
      linkedin: '',
      github: '',
      website: '',
    },
  });

  // Student-specific fields
  const [studentData, setStudentData] = useState({
    classLevel: '',
    category: '',
    learningGoals: '',
  });

  // Teacher-specific fields
  const [teacherData, setTeacherData] = useState({
    qualification: '',
    experienceYears: '',
    subjects: [] as string[],
    expertiseTags: [] as string[],
    portfolioLinks: [] as string[],
  });

  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      setDocuments(profileData.documents || []);
      
      // Set edit data
      setEditData({
        displayName: profileData.displayName || '',
        bio: profileData.bio || '',
        phoneNumber: profileData.phoneNumber || '',
        location: profileData.location || '',
        dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
        gender: profileData.gender || 'prefer-not-to-say',
        socialLinks: {
          linkedin: profileData.socialLinks?.linkedin || '',
          github: profileData.socialLinks?.github || '',
          website: profileData.socialLinks?.website || '',
        },
      });

      // Set role-specific data
      if (profileData.role === 'student' && profileData.studentProfile) {
        setStudentData({
          classLevel: profileData.studentProfile.classLevel || '',
          category: profileData.studentProfile.category || '',
          learningGoals: profileData.studentProfile.learningGoals || '',
        });
      }

      if (profileData.role === 'teacher' && profileData.teacherProfile) {
        setTeacherData({
          qualification: profileData.teacherProfile.qualification || '',
          experienceYears: String(profileData.teacherProfile.experienceYears || ''),
          subjects: profileData.teacherProfile.subjects || [],
          expertiseTags: profileData.teacherProfile.expertiseTags || [],
          portfolioLinks: profileData.teacherProfile.portfolioLinks || [],
        });
      }

      setTwoFactorEnabled(profileData.twoFactorEnabled || false);

      // Load activity logs
      const logs = await profileService.getActivityLogs(20);
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);
        const uploadResult = await profileService.uploadAvatar(result.assets[0].uri);
        
        // Update profile
        const updatedProfile = { ...profile!, ...uploadResult };
        setProfile(updatedProfile);
        
        await refreshUser();
        
        Alert.alert('Success', 'Avatar updated successfully');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    // Basic client-side validation to avoid backend validation failures
    const phoneRegex = /^(\+92|0)?3[0-9]{2}[0-9]{7}$/;

    if (editData.phoneNumber && !phoneRegex.test(editData.phoneNumber.trim())) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid Pakistani phone number (e.g. 03XXXXXXXXX or +923XXXXXXXXX).'
      );
      return;
    }

    const normalizeUrl = (url: string | undefined) => {
      if (!url) return undefined;
      const trimmed = url.trim();
      if (!trimmed) return undefined;
      if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
      }
      return trimmed;
    };

    const sanitizedSocialLinks = {
      linkedin: normalizeUrl(editData.socialLinks.linkedin) || '',
      github: normalizeUrl(editData.socialLinks.github) || '',
      website: normalizeUrl(editData.socialLinks.website) || '',
    };

    const payload: typeof editData = {
      ...editData,
      phoneNumber: editData.phoneNumber?.trim() || '',
      location: editData.location?.trim() || '',
      dateOfBirth: editData.dateOfBirth?.trim() || '',
      socialLinks: sanitizedSocialLinks,
    };

    // Remove empty optional fields so backend validators treat them as missing
    if (!payload.phoneNumber) delete (payload as any).phoneNumber;
    if (!payload.location) delete (payload as any).location;
    if (!payload.dateOfBirth) delete (payload as any).dateOfBirth;

    if (
      !payload.socialLinks.linkedin &&
      !payload.socialLinks.github &&
      !payload.socialLinks.website
    ) {
      delete (payload as any).socialLinks;
    }

    try {
      await profileService.updateProfile(payload);
      
      // Update role-specific fields
      if (profile?.role === 'student') {
        await profileService.updateStudentProfile(studentData);
      } else if (profile?.role === 'teacher') {
        await profileService.updateTeacherProfile({
          ...teacherData,
          experienceYears: teacherData.experienceYears
            ? Number(teacherData.experienceYears)
            : undefined,
        });
      }
      
      await loadProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = () => {
    router.push('/change-password' as any);
  };

  const handleDeleteAccount = () => {
    Alert.prompt(
      'Delete Account',
      'Enter your password to confirm account deletion. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async (password) => {
            try {
              await profileService.deleteAccount(password || '');
              Alert.alert('Account Deleted', 'Your account has been deleted successfully');
              logout();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete account');
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      profile_updated: 'Profile Updated',
      avatar_uploaded: 'Avatar Uploaded',
      password_changed: 'Password Changed',
      course_enrolled: 'Course Enrolled',
      document_uploaded: 'Document Uploaded',
      login: 'Logged In',
    };
    return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editButton}>
            <Ionicons name={editing ? "close" : "pencil"} size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => logout(),
                  },
                ]
              );
            }} 
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProfile} />}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handleAvatarUpload}
            disabled={uploadingAvatar}
            style={styles.avatarContainer}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                {profile.avatarMedium || profile.avatar ? (
                  <Image
                    source={{ uri: getFullUrl(profile.avatarMedium || profile.avatar) || undefined }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={60} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={24} color={colors.surface} />
                </View>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.displayName}>
            {profile.displayName || `${profile.firstName} ${profile.lastName}`}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </Text>
          </View>

          {/* Profile Completion Meter */}
          <View style={styles.completionContainer}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionLabel}>Profile Completion</Text>
              <Text style={styles.completionPercentage}>{profile.profileCompleted || 0}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${profile.profileCompleted || 0}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Tabs */}
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
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
              Activity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'security' && styles.activeTab]}
            onPress={() => setActiveTab('security')}
          >
            <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
              Security
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            {/* Common Fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.field}>
                <Text style={styles.label}>Display Name</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editData.displayName}
                    onChangeText={(text) => setEditData({ ...editData, displayName: text })}
                    placeholder="Enter display name"
                  />
                ) : (
                  <Text style={styles.value}>{editData.displayName || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Bio</Text>
                {editing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editData.bio}
                    onChangeText={(text) => setEditData({ ...editData, bio: text })}
                    placeholder="Tell us about yourself"
                    multiline
                    numberOfLines={4}
                  />
                ) : (
                  <Text style={styles.value}>{editData.bio || 'No bio added'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editData.phoneNumber}
                    onChangeText={(text) => setEditData({ ...editData, phoneNumber: text })}
                    placeholder="+92 300 1234567"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.value}>{editData.phoneNumber || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editData.location}
                    onChangeText={(text) => setEditData({ ...editData, location: text })}
                    placeholder="City, Country"
                  />
                ) : (
                  <Text style={styles.value}>{editData.location || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Date of Birth</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editData.dateOfBirth}
                    onChangeText={(text) => setEditData({ ...editData, dateOfBirth: text })}
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
                  <Text style={styles.value}>
                    {editData.dateOfBirth ? formatDate(editData.dateOfBirth) : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Gender</Text>
                {editing ? (
                  <View style={styles.genderOptions}>
                    {['male', 'female', 'other', 'prefer-not-to-say'].map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderOption,
                          editData.gender === gender && styles.genderOptionActive,
                        ]}
                        onPress={() => setEditData({ ...editData, gender: gender as any })}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            editData.gender === gender && styles.genderOptionTextActive,
                          ]}
                        >
                          {gender.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.value}>
                    {editData.gender.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                )}
              </View>

              {/* Social Links */}
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Social Links</Text>
              
              <View style={styles.field}>
                <Text style={styles.label}>LinkedIn</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editData.socialLinks.linkedin}
                    onChangeText={(text) =>
                      setEditData({
                        ...editData,
                        socialLinks: { ...editData.socialLinks, linkedin: text },
                      })
                    }
                    placeholder="https://linkedin.com/in/username"
                    keyboardType="url"
                  />
                ) : (
                  <Text style={styles.value}>
                    {editData.socialLinks.linkedin || 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>GitHub</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editData.socialLinks.github}
                    onChangeText={(text) =>
                      setEditData({
                        ...editData,
                        socialLinks: { ...editData.socialLinks, github: text },
                      })
                    }
                    placeholder="https://github.com/username"
                    keyboardType="url"
                  />
                ) : (
                  <Text style={styles.value}>
                    {editData.socialLinks.github || 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Website</Text>
                {editing ? (
                  <TextInput
                    style={styles.input}
                    value={editData.socialLinks.website}
                    onChangeText={(text) =>
                      setEditData({
                        ...editData,
                        socialLinks: { ...editData.socialLinks, website: text },
                      })
                    }
                    placeholder="https://yourwebsite.com"
                    keyboardType="url"
                  />
                ) : (
                  <Text style={styles.value}>
                    {editData.socialLinks.website || 'Not set'}
                  </Text>
                )}
              </View>
            </View>

            {/* Student-Specific Fields */}
            {profile.role === 'student' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Student Information</Text>
                
                <View style={styles.field}>
                  <Text style={styles.label}>Class Level</Text>
                  {editing ? (
                    <View style={styles.chipContainer}>
                      {['9', '10', '11', '12', 'o-level', 'a-level'].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.chip,
                            studentData.classLevel === level && styles.chipActive,
                          ]}
                          onPress={() => setStudentData({ ...studentData, classLevel: level })}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              studentData.classLevel === level && styles.chipTextActive,
                            ]}
                          >
                            {level === 'o-level' ? 'O Level' : level === 'a-level' ? 'A Level' : `Class ${level}`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.value}>
                      {studentData.classLevel
                        ? studentData.classLevel === 'o-level'
                          ? 'O Level'
                          : studentData.classLevel === 'a-level'
                          ? 'A Level'
                          : `Class ${studentData.classLevel}`
                        : 'Not set'}
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Category</Text>
                  {editing ? (
                    <View style={styles.chipContainer}>
                      {['pre-engineering', 'pre-medical', 'computer-science', 'bba', 'o-levels', 'a-levels'].map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.chip,
                            studentData.category === cat && styles.chipActive,
                          ]}
                          onPress={() => setStudentData({ ...studentData, category: cat })}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              studentData.category === cat && styles.chipTextActive,
                            ]}
                          >
                            {cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.value}>
                      {studentData.category
                        ? studentData.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        : 'Not set'}
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Learning Goals</Text>
                  {editing ? (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={studentData.learningGoals}
                      onChangeText={(text) => setStudentData({ ...studentData, learningGoals: text })}
                      placeholder="What are your learning goals?"
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    <Text style={styles.value}>
                      {studentData.learningGoals || 'Not set'}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Teacher-Specific Fields */}
            {profile.role === 'teacher' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Teacher Information</Text>
                
                <View style={styles.field}>
                  <Text style={styles.label}>Qualification</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={teacherData.qualification}
                      onChangeText={(text) => setTeacherData({ ...teacherData, qualification: text })}
                      placeholder="e.g., M.Sc. Computer Science"
                    />
                  ) : (
                    <Text style={styles.value}>
                      {teacherData.qualification || 'Not set'}
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Years of Experience</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={teacherData.experienceYears}
                      onChangeText={(text) => setTeacherData({ ...teacherData, experienceYears: text })}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.value}>
                      {teacherData.experienceYears ? `${teacherData.experienceYears} years` : 'Not set'}
                    </Text>
                  )}
                </View>

                {/* Documents Section */}
                <View style={styles.field}>
                  <View style={styles.fieldHeader}>
                    <Text style={styles.label}>Certifications & Documents</Text>
                    {editing && (
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => router.push('/upload-document' as any)}
                      >
                        <Ionicons name="add-circle" size={20} color={colors.primary} />
                        <Text style={styles.uploadButtonText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {documents.length === 0 ? (
                    <Text style={styles.value}>No documents uploaded</Text>
                  ) : (
                    documents.map((doc) => (
                      <View key={doc._id} style={styles.documentItem}>
                        <Ionicons name="document-text" size={24} color={colors.primary} />
                        <View style={styles.documentInfo}>
                          <Text style={styles.documentTitle}>{doc.title}</Text>
                          <Text style={styles.documentMeta}>
                            {doc.type} • {doc.verified ? 'Verified' : 'Pending'}
                          </Text>
                        </View>
                        {doc.verified && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        )}
                        {editing && (
                          <TouchableOpacity
                            onPress={async () => {
                              Alert.alert(
                                'Delete Document',
                                'Are you sure you want to delete this document?',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                      try {
                                        await profileService.deleteTeacherDocument(doc._id);
                                        await loadProfile();
                                      } catch (error) {
                                        Alert.alert('Error', 'Failed to delete document');
                                      }
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <Ionicons name="trash" size={20} color={colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {editing && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              
              {activityLogs.length === 0 ? (
                <Text style={styles.emptyText}>No activity logs available</Text>
              ) : (
                activityLogs.map((log) => (
                  <View key={log._id} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Ionicons name="time-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityAction}>{getActionLabel(log.action)}</Text>
                      <Text style={styles.activityTime}>
                        {formatDate(log.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Security Settings</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
                  <Text style={styles.settingDescription}>
                    Add an extra layer of security to your account
                  </Text>
                </View>
                <Switch
                  value={twoFactorEnabled}
                  onValueChange={async (value) => {
                    try {
                      await profileService.updateSecurity(value);
                      setTwoFactorEnabled(value);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to update security settings');
                    }
                  }}
                />
              </View>

              <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
                <Ionicons name="lock-closed" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Change Password</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Management</Text>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={() => {
                  Alert.alert(
                    'Logout',
                    'Are you sure you want to logout?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: () => logout(),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={[styles.actionButtonText, styles.dangerText]}>Logout</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.error} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleDeleteAccount}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
                <Text style={[styles.actionButtonText, styles.dangerText]}>Delete Account</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  errorText: {
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  editButton: {
    padding: spacing.xs,
  },
  logoutButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center' as const,
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    position: 'relative' as const,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  roleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  completionContainer: {
    alignSelf: 'stretch' as const,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
  },
  completionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: spacing.sm,
  },
  completionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  completionPercentage: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden' as const,
  },
  progressFill: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  tabContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  genderOptions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  genderOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderOptionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  genderOptionTextActive: {
    color: colors.surface,
    fontWeight: '600' as const,
  },
  chipContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.surface,
    fontWeight: '600' as const,
  },
  uploadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.md,
  },
  uploadButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  documentItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  documentMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  activityItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  settingItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  dangerButton: {
    backgroundColor: colors.error + '10',
  },
  dangerText: {
    color: colors.error,
  },
  emptyText: {
    textAlign: 'center' as const,
    color: colors.textSecondary,
    padding: spacing.xl,
  },
});

export default ModernProfileScreen;

