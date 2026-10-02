import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { userService } from '../services/userService';
import { courseService } from '../services/courseService';
import { useAuth } from '../context/AuthContext';
import { getFullUrl } from '../services/backendAPI';
import {
  TeacherButton,
  TeacherTextInput,
  TeacherSkeleton,
  TeacherErrorBoundary,
  TeacherSheet,
  TeacherQRCode,
  TeacherMicroChart,
  showTeacherToast,
} from './components';
import { useTeacherTheme } from '../theme/teacherTheme';
import EmptyAnimation from '../../assets/teacher-empty.json';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  bio: z.string().max(200).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Enter current password'),
  newPassword: z.string().min(6, 'New password must be 6+ chars'),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function TeacherProfileScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const {
    theme: { spacing, text, typography, background, surface, radius, semantic },
  } = useTeacherTheme();

  const [profile, setProfile] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showBiometricSheet, setShowBiometricSheet] = useState(false);
  const [showQRSheet, setShowQRSheet] = useState(false);
  const [switchToStudent, setSwitchToStudent] = useState(false);
  const [avatarPending, setAvatarPending] = useState(false);
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', bio: '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const me = await userService.getMe();
      setProfile(me);
      setAvatar(me?.avatar || null);
      profileForm.reset({
        firstName: me?.firstName || '',
        lastName: me?.lastName || '',
        bio: me?.bio || '',
      });
      
      // Load analytics if user has courses
      if (me?.role === 'teacher') {
        try {
          const courses = await courseService.getMyCourses();
          if (courses && courses.length > 0) {
            const totalEnrollments = courses.reduce((sum: number, c: any) => sum + (c.enrolledCount || 0), 0);
            const totalRevenue = courses.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0);
            
            setAnalytics({
              totalCourses: courses.length,
              totalEnrollments,
              totalRevenue,
              // Use real course data for micro-charts if possible, otherwise keep placeholders for now but with real totals
              monthlyEnrollments: courses.slice(0, 6).map((c: any) => c.enrolledCount || 0),
              monthlyRevenue: courses.slice(0, 6).map((c: any) => c.revenue || 0),
            });
          }
        } catch (e) {
          console.error('Failed to load analytics:', e);
        }
      }
    } catch (error) {
      showTeacherToast({ type: 'error', title: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]) {
        const newAvatarUri = res.assets[0].uri;
        setSelectedAvatarUri(newAvatarUri);
        setAvatar(newAvatarUri);
        // Upload button will now appear in UI
      }
    } catch (error) {
      showTeacherToast({ type: 'error', title: 'Failed to select image' });
    }
  };

  const uploadAvatar = async () => {
    if (!selectedAvatarUri) return;
    try {
      setAvatarPending(true);
      await userService.updateAvatar(selectedAvatarUri);
      setAvatarPending(false);
      setSelectedAvatarUri(null);
      showTeacherToast({ type: 'success', title: 'Avatar uploaded successfully' });
      loadProfile();
    } catch (error: any) {
      setAvatarPending(false);
      showTeacherToast({
        type: 'error',
        title: 'Upload failed',
        message: error?.response?.data?.message || 'Please try again.',
      });
    }
  };

  const saveProfile = async (values: ProfileFormValues) => {
    try {
      await userService.updateMe({ ...values, avatar });
      showTeacherToast({ type: 'success', title: 'Profile saved' });
      loadProfile();
    } catch (error: any) {
      showTeacherToast({
        type: 'error',
        title: 'Save failed',
        message: error?.response?.data?.message || 'Please try again.',
      });
    }
  };

  const savePassword = async (values: PasswordFormValues) => {
    try {
      await userService.updatePassword(values.currentPassword, values.newPassword);
      showTeacherToast({ type: 'success', title: 'Password updated' });
      passwordForm.reset();
    } catch (error: any) {
      showTeacherToast({
        type: 'error',
        title: 'Update failed',
        message: error?.response?.data?.message || 'Please try again.',
      });
    }
  };

  const handleBiometricLogout = async () => {
    try {
      // In a real app, you would use expo-local-authentication here
      // For now, we'll simulate biometric authentication
      showTeacherToast({ type: 'info', title: 'Biometric authentication', message: 'Please authenticate to logout' });
      
      // Simulate authentication delay
      setTimeout(async () => {
        await logout();
        setShowBiometricSheet(false);
      }, 1000);
    } catch (error) {
      showTeacherToast({ type: 'error', title: 'Authentication failed' });
    }
  };

  const handleQRShare = async () => {
    try {
      const profileUrl = `bigminds://profile/${user?._id || user?.id}`;
      const shareText = `Check out my teacher profile on BigMinds!\n${profileUrl}`;
      
      await Share.share({
        message: shareText,
        title: 'My Teacher Profile',
      });
    } catch (error) {
      showTeacherToast({ type: 'error', title: 'Failed to share' });
    }
  };

  const handleSwitchToStudent = async (value: boolean) => {
    setSwitchToStudent(value);
    if (value) {
      showTeacherToast({ type: 'info', title: 'Switching to student mode', message: 'Redirecting...' });
      setTimeout(() => {
        router.replace('/(tabs)' as any);
      }, 500);
    }
  };

  const qrCodeValue = useMemo(() => {
    if (!user) return '';
    return JSON.stringify({
      type: 'teacher_profile',
      userId: user._id || user.id,
      name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(),
    });
  }, [user, profile]);

  return (
    <TeacherErrorBoundary>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: background.default }}>
        <View
          style={{
            backgroundColor: semantic.primary.default,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xl,
            paddingBottom: spacing.lg,
            borderBottomLeftRadius: radius.xl,
            borderBottomRightRadius: radius.xl,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            zIndex: 10,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: 28,
              color: '#FFFFFF',
              letterSpacing: 0.5,
            }}
          >
            Teacher Profile
          </Text>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg, paddingTop: spacing.md }}
        >

          <View
            style={{
              alignItems: 'center',
              backgroundColor: surface.default,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: surface.border,
            }}
          >
            {avatar ? (
              <Image
                source={{ uri: getFullUrl(avatar) || '' }}
                style={{ width: 120, height: 120, borderRadius: 60, marginBottom: spacing.md }}
              />
            ) : (
              <LottieView source={EmptyAnimation} autoPlay loop style={{ width: 120, height: 120 }} />
            )}
            <View style={{ flexDirection: 'row', gap: spacing.sm, width: '100%' }}>
              <TeacherButton
                title={avatar ? 'Change Photo' : 'Select Photo'}
                fullWidth={false}
                onPress={pickAvatar}
                icon="camera"
                variant="outline"
                style={{ flex: 1 }}
              />
              {selectedAvatarUri && (
                <TeacherButton
                  title={avatarPending ? 'Uploading...' : 'Upload'}
                  fullWidth={false}
                  onPress={uploadAvatar}
                  icon="cloud-upload"
                  loading={avatarPending}
                  disabled={avatarPending}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </View>

          {loading ? (
            <View style={{ gap: spacing.md }}>
              <TeacherSkeleton height={60} />
              <TeacherSkeleton height={60} />
              <TeacherSkeleton height={120} />
            </View>
          ) : (
            <>
              <View
                style={{
                  backgroundColor: surface.default,
                  borderRadius: radius.xl,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: surface.border,
                  gap: spacing.md,
                }}
              >
                <Controller
                  control={profileForm.control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <TeacherTextInput
                      label="First Name"
                      value={field.value}
                      onChangeText={field.onChange}
                      errorText={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  control={profileForm.control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <TeacherTextInput
                      label="Last Name"
                      value={field.value}
                      onChangeText={field.onChange}
                      errorText={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  control={profileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <TeacherTextInput
                      label="Bio"
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Short introduction"
                      multiline
                      style={{ minHeight: 100 }}
                    />
                  )}
                />

                <TeacherButton
                  title={profileForm.formState.isSubmitting ? 'Saving...' : 'Save Profile'}
                  onPress={profileForm.handleSubmit(saveProfile)}
                  loading={profileForm.formState.isSubmitting}
                  icon="save"
                />
              </View>

              <PasswordForm form={passwordForm} onSubmit={savePassword} />

              {/* Analytics Section */}
              {analytics && (
                <View
                  style={{
                    backgroundColor: surface.default,
                    borderRadius: radius.xl,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: surface.border,
                    gap: spacing.md,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.semibold,
                      fontSize: typography.sizes.lg,
                      color: text.primary,
                    }}
                  >
                    Analytics Overview
                  </Text>
                  <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                    <View style={{ flex: 1, minWidth: '48%' }}>
                      <TeacherMicroChart
                        data={analytics.monthlyEnrollments}
                        label="Enrollments"
                        value={analytics.totalEnrollments}
                        color={semantic.primary.default}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: '48%' }}>
                      <TeacherMicroChart
                        data={analytics.monthlyRevenue}
                        label="Revenue"
                        value={`Rs. ${analytics.totalRevenue.toLocaleString()}`}
                        color={semantic.success.default}
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                    <View style={{ flex: 1, alignItems: 'center', padding: spacing.sm, backgroundColor: surface.muted, borderRadius: radius.md }}>
                      <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.xl, color: text.primary }}>
                        {analytics.totalCourses}
                      </Text>
                      <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.sm, color: text.secondary }}>
                        Courses
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center', padding: spacing.sm, backgroundColor: surface.muted, borderRadius: radius.md }}>
                      <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.xl, color: text.primary }}>
                        {analytics.totalEnrollments}
                      </Text>
                      <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.sm, color: text.secondary }}>
                        Students
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Switch to Student Toggle */}
              <View
                style={{
                  backgroundColor: surface.default,
                  borderRadius: radius.xl,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: surface.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.semibold,
                      fontSize: typography.sizes.md,
                      color: text.primary,
                      marginBottom: spacing.xs,
                    }}
                  >
                    Switch to Student Mode
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.regular,
                      fontSize: typography.sizes.sm,
                      color: text.secondary,
                    }}
                  >
                    View the app as a student
                  </Text>
                </View>
                <Switch
                  value={switchToStudent}
                  onValueChange={handleSwitchToStudent}
                  trackColor={{ false: surface.border, true: semantic.primary.default }}
                  thumbColor={switchToStudent ? '#FFFFFF' : '#F4F3F4'}
                  ios_backgroundColor={surface.border}
                />
              </View>

              {/* Action Buttons */}
              <View style={{ gap: spacing.sm }}>
                {/* <TeacherButton
                  title="Share Profile (QR)"
                  variant="outline"
                  icon="qr-code"
                  onPress={() => setShowQRSheet(true)}
                />
                <TeacherButton
                  title="Logout with Biometric"
                  variant="outline"
                  icon="finger-print"
                  onPress={() => setShowBiometricSheet(true)}
                /> */}
                <TeacherButton
                  title="Logout"
                  variant="ghost"
                  icon="log-out"
                  onPress={logout}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Biometric Logout Sheet */}
      <TeacherSheet
        visible={showBiometricSheet}
        onClose={() => setShowBiometricSheet(false)}
        title="Biometric Logout"
      >
        <View style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: semantic.primary.default,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="finger-print" size={60} color="#FFFFFF" />
          </View>
          <Text
            style={{
              fontFamily: typography.fontFamily.semibold,
              fontSize: typography.sizes.lg,
              color: text.primary,
              textAlign: 'center',
            }}
          >
            Authenticate to Logout
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.sizes.sm,
              color: text.secondary,
              textAlign: 'center',
            }}
          >
            Use your fingerprint or face ID to securely logout
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <TeacherButton
              title="Cancel"
              variant="outline"
              onPress={() => setShowBiometricSheet(false)}
              style={{ flex: 1 }}
            />
            <TeacherButton
              title="Authenticate"
              onPress={handleBiometricLogout}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </TeacherSheet>

      {/* QR Share Sheet */}
      <TeacherSheet
        visible={showQRSheet}
        onClose={() => setShowQRSheet(false)}
        title="Share Profile"
      >
        <View style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl }}>
          <TeacherQRCode value={qrCodeValue} size={200} />
          <Text
            style={{
              fontFamily: typography.fontFamily.medium,
              fontSize: typography.sizes.md,
              color: text.primary,
              textAlign: 'center',
            }}
          >
            Scan to view my teacher profile
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <TeacherButton
              title="Share Link"
              variant="outline"
              icon="share"
              onPress={handleQRShare}
              style={{ flex: 1 }}
            />
            <TeacherButton
              title="Close"
              variant="ghost"
              onPress={() => setShowQRSheet(false)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </TeacherSheet>
    </TeacherErrorBoundary>
  );
}

type PasswordFormProps = {
  form: ReturnType<typeof useForm<PasswordFormValues>>;
  onSubmit: (values: PasswordFormValues) => Promise<void>;
};

const PasswordForm: React.FC<PasswordFormProps> = ({ form, onSubmit }) => {
  const {
    theme: { spacing, text, typography, surface, radius },
  } = useTeacherTheme();

  return (
    <View
      style={{
        backgroundColor: surface.default,
        borderRadius: radius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: surface.border,
        gap: spacing.md,
      }}
    >
      <Text
        style={{
          fontFamily: typography.fontFamily.semibold,
          fontSize: typography.sizes.lg,
          color: text.primary,
        }}
      >
        Change Password
      </Text>
      <Controller
        control={form.control}
        name="currentPassword"
        render={({ field, fieldState }) => (
          <TeacherTextInput
            label="Current Password"
            value={field.value}
            onChangeText={field.onChange}
            errorText={fieldState.error?.message}
            secureTextEntry
          />
        )}
      />
      <Controller
        control={form.control}
        name="newPassword"
        render={({ field, fieldState }) => (
          <TeacherTextInput
            label="New Password"
            value={field.value}
            onChangeText={field.onChange}
            errorText={fieldState.error?.message}
            secureTextEntry
          />
        )}
      />
      <TeacherButton
        title={form.formState.isSubmitting ? 'Updating...' : 'Update Password'}
        onPress={form.handleSubmit(onSubmit)}
        loading={form.formState.isSubmitting}
        icon="key"
      />
    </View>
  );
};
