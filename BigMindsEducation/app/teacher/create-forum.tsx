import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forumService, CreateForumData } from '../services/forumService';
import { courseService } from '../services/courseService';
import {
  TeacherButton,
  TeacherCheckbox,
  TeacherSelect,
  TeacherSkeleton,
  TeacherTextInput,
  TeacherErrorBoundary,
  showTeacherToast,
} from './components';
import { useTeacherTheme } from '../theme/teacherTheme';
import EmptyAnimation from '../../assets/teacher-empty.json';

const categoryOptions = [
  { label: 'Academic', value: 'academic' },
  { label: 'General', value: 'general' },
  { label: 'Support', value: 'support' },
  { label: 'Announcements', value: 'announcements' },
  { label: 'Social', value: 'social' },
];

const forumSchema = z
  .object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().min(10, 'Description is required'),
    category: z.string().min(1, 'Select a category'),
    isPublic: z.boolean(),
    joinKey: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.isPublic && !values.joinKey?.trim()) {
      ctx.addIssue({
        path: ['joinKey'],
        code: z.ZodIssueCode.custom,
        message: 'Join key is required for private forums',
      });
    }
  });

type ForumFormValues = z.infer<typeof forumSchema>;

const defaultValues: ForumFormValues = {
  title: '',
  description: '',
  category: 'academic',
  isPublic: true,
  joinKey: '',
};

export default function CreateForumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ forumId?: string; courseId?: string }>();
  const forumId = params.forumId ? String(params.forumId) : null;
  const courseId = params.courseId ? String(params.courseId) : null;
  const isEditing = Boolean(forumId);
  const {
    theme: { spacing, surface, radius, text, typography, background },
  } = useTeacherTheme();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(forumId));
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, watch, setValue, reset } = useForm<ForumFormValues>({
    resolver: zodResolver(forumSchema),
    defaultValues,
  });

  const isPublic = watch('isPublic');

  const loadCourseDetails = useCallback(
    async (id: string) => {
      try {
        const courseData = await courseService.getCourse(id);
        setCourse(courseData);
        reset((prev) => ({
          ...prev,
          title: prev.title || `${courseData.title} - Discussion Forum`,
          description:
            prev.description ||
            `Discussion forum for ${courseData.title}. Ask questions, share insights, and collaborate with fellow students.`,
          category: 'academic',
        }));
      } catch (error) {
        console.error('Failed to load course', error);
      }
    },
    [reset]
  );

  const loadForumDetails = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const response = await forumService.getForum(id);
        const forum = response?.data || response;
        reset({
          title: forum?.title || '',
          description: forum?.description || '',
          category: forum?.category || 'general',
          isPublic: forum?.isPublic ?? true,
          joinKey: forum?.joinKey || '',
        });
      } catch (error) {
        console.error('Failed to load forum', error);
        showTeacherToast({ type: 'error', title: 'Unable to load forum' });
      } finally {
        setLoading(false);
      }
    },
    [reset]
  );

  useEffect(() => {
    if (forumId) {
      loadForumDetails(forumId);
    } else {
      setLoading(false);
    }
    if (courseId) {
      loadCourseDetails(courseId);
    }
  }, [forumId, courseId, loadForumDetails, loadCourseDetails]);


  const submit = async (values: ForumFormValues) => {
    setSaving(true);
    try {
      const payload: CreateForumData = {
        title: values.title,
        description: values.description,
        category: values.category as any,
        isPublic: values.isPublic,
        isPrivate: !values.isPublic,
        requiresApproval: false,
        maxMembers: 100,
        tags: [],
        rules: [],
        joinKey: values.isPublic ? null : values.joinKey || null,
      };
      if (isEditing && forumId) {
        await forumService.updateForum(forumId, payload);
        showTeacherToast({ type: 'success', title: 'Forum updated successfully' });
      } else {
        const created = await forumService.createForum(payload);
        const response = created as any;
        const joinKey = !values.isPublic ? response?.data?.joinKey || response?.joinKey : null;
        showTeacherToast({
          type: 'success',
          title: 'Forum created!',
          message: joinKey ? `Share join key with students: ${joinKey}` : undefined,
        });
      }
      // Navigate back to the forums list (replaces current screen so back button doesn't loop)
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/teacher/my-forums' as any);
      }
    } catch (error: any) {
      console.error('Failed to save forum', error);
      showTeacherToast({
        type: 'error',
        title: 'Save failed',
        message: error?.message || error?.response?.data?.message || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };


  return (
    <TeacherErrorBoundary>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, backgroundColor: background.default }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.sizes['2xl'],
              color: text.primary,
              marginBottom: spacing.md,
            }}
          >
            {isEditing ? 'Update Forum' : courseId ? 'Create Course Forum' : 'Create Forum'}
          </Text>

          {courseId && course ? (
            <View
              style={{
                backgroundColor: surface.default,
                borderRadius: radius.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: surface.border,
                marginBottom: spacing.lg,
              }}
            >
              <Text
                style={{
                  color: text.secondary,
                  fontSize: typography.sizes.xs,
                  marginBottom: spacing.micro,
                }}
              >
                For Course
              </Text>
              <Text
                style={{
                  fontFamily: typography.fontFamily.semibold,
                  color: text.primary,
                }}
              >
                {course.title}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
              <LottieView
                source={EmptyAnimation}
                autoPlay
                loop
                style={{ width: 140, height: 140 }}
              />
              <Text
                style={{
                  marginTop: spacing.sm,
                  fontFamily: typography.fontFamily.medium,
                  color: text.secondary,
                }}
              >
                Craft a welcoming space for your learners.
              </Text>
            </View>
          )}

          {loading ? (
            <View style={{ gap: spacing.md }}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <TeacherSkeleton key={idx} height={60} />
              ))}
            </View>
          ) : (
            <>
              <Controller
                control={control}
                name="title"
                render={({ field, fieldState }) => (
                  <TeacherTextInput
                    label="Forum Title"
                    value={field.value}
                    onChangeText={field.onChange}
                    errorText={fieldState.error?.message}
                    placeholder="e.g. Physics Q&A"
                  />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field, fieldState }) => (
                  <TeacherTextInput
                    label="Description"
                    value={field.value}
                    onChangeText={field.onChange}
                    errorText={fieldState.error?.message}
                    placeholder="What should students discuss here?"
                    multiline
                    style={{ minHeight: 120 }}
                  />
                )}
              />

              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <TeacherSelect
                    label="Category"
                    value={field.value}
                    onChange={field.onChange}
                    options={categoryOptions}
                  />
                )}
              />

              <Controller
                control={control}
                name="isPublic"
                render={({ field }) => (
                  <TeacherCheckbox
                    label="Make forum public"
                    helperText="Public forums are discoverable by all enrolled students."
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              {!isPublic ? (
                <Controller
                  control={control}
                  name="joinKey"
                  render={({ field, fieldState }) => (
                    <TeacherTextInput
                      label="Join Key"
                      value={field.value}
                      onChangeText={field.onChange}
                      errorText={fieldState.error?.message}
                      placeholder="Unique code required to join"
                    />
                  )}
                />
              ) : null}


              <TeacherButton
                title={isEditing ? (saving ? 'Saving...' : 'Update Forum') : saving ? 'Creating...' : 'Create Forum'}
                onPress={handleSubmit(submit)}
                loading={saving}
                icon="chatbubbles"
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TeacherErrorBoundary>
  );
}