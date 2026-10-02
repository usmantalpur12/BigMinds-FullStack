import React, { useEffect, useState } from 'react';
import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../../theme/teacherTheme';
import { TeacherTextInput } from './TeacherTextInput';
import { TeacherSelect } from './TeacherSelect';
import { TeacherCheckbox } from './TeacherCheckbox';
import { TeacherRadioGroup } from './TeacherRadioGroup';
import { TeacherButton } from './TeacherButton';
import { TeacherSkeleton } from './TeacherSkeleton';
import { TeacherDatePicker } from './TeacherDatePicker';
import { showTeacherToast } from './TeacherToast';
import { TeacherErrorBoundary } from './TeacherErrorBoundary';
import { uploadImage, uploadVideo } from '../../services/fileUpload';
import { getBaseURL } from '../../services/backendAPI';

const categories = [
  { label: 'Pre Engineering', value: 'pre-engineering' },
  { label: 'Pre Medical', value: 'pre-medical' },
  { label: 'Computer Science', value: 'computer-science' },
  { label: 'BBA', value: 'bba' },
  { label: 'O Levels', value: 'o-levels' },
  { label: 'A Levels', value: 'a-levels' },
];

const classLevels = [
  { label: 'Class 9', value: '9' },
  { label: 'Class 10', value: '10' },
  { label: 'Class 11', value: '11' },
  { label: 'Class 12', value: '12' },
  { label: 'O Level', value: 'o-level' },
  { label: 'A Level', value: 'a-level' },
];

const difficultyOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const materialTypes = ['pdf', 'doc', 'video', 'link', 'other'] as const;

const courseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  category: z.enum(['pre-engineering', 'pre-medical', 'computer-science', 'bba', 'o-levels', 'a-levels']),
  classLevel: z.enum(['9', '10', '11', '12', 'o-level', 'a-level']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedDuration: z.number().min(0).optional(),
  totalVideos: z.number().min(0).optional(),
  isPremium: z.boolean(),
  price: z.number().min(0),
  isPublished: z.boolean(),
  hasForum: z.boolean(),
  hasQuizzes: z.boolean(),
  whatYouWillLearn: z.array(z.string().min(1, "Item cannot be empty")).default([]),
  learningOutcomes: z.array(z.string().min(1, "Item cannot be empty")).default([]),
  studyMaterials: z
    .array(
      z.object({
        title: z.string().min(2),
        type: z.enum(materialTypes).default('link'),
        url: z.string().url().optional(),
      })
    )
    .default([]),
  links: z
    .array(
      z.object({
        title: z.string().min(2),
        url: z.string().url(),
        description: z.string().optional(),
      })
    )
    .default([]),
  thumbnail: z.string().nullable().optional(),
  introVideo: z.string().nullable().optional(),
  launchDate: z.date().optional().nullable(),
  lessons: z.array(
    z.object({
      title: z.string().min(1, "Lesson title is required"),
      description: z.string().optional(),
      videoUrl: z.string().optional(),
      duration: z.number().min(0).optional(),
      order: z.number().optional(),
      isFree: z.boolean().default(false),
    })
  ).default([]),
});

export type TeacherCourseFormValues = z.infer<typeof courseSchema>;

type TeacherCourseFormProps = {
  initialValues?: Partial<TeacherCourseFormValues>;
  mode: 'create' | 'edit';
  loading?: boolean;
  onSubmit: (values: TeacherCourseFormValues) => Promise<void>;
};

const defaultValues: TeacherCourseFormValues = {
  title: '',
  description: '',
  category: 'pre-engineering',
  classLevel: '11',
  level: 'beginner',
  estimatedDuration: undefined,
  totalVideos: undefined,
  isPremium: false,
  price: 0,
  isPublished: true,
  hasForum: true,
  hasQuizzes: true,
  whatYouWillLearn: [],
  learningOutcomes: [],
  studyMaterials: [],
  links: [],
  thumbnail: null,
  introVideo: null,
  launchDate: null,
  lessons: [],
};

const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = getBaseURL().replace('/api', '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const TeacherCourseForm: React.FC<TeacherCourseFormProps> = ({
  initialValues,
  mode,
  loading,
  onSubmit,
}) => {
  const {
    theme: { spacing },
  } = useTeacherTheme();

  const form = useForm<TeacherCourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues,
  });

  const { control, handleSubmit, reset, watch, setValue } = form;

  useEffect(() => {
    reset({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues, reset]);

  const isPremium = watch('isPremium');
  const learnings = watch('whatYouWillLearn');
  const outcomes = watch('learningOutcomes');
  const materials = watch('studyMaterials');
  const links = watch('links');
  const lessons = watch('lessons');

  const pickThumbnail = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      const uploaded = await uploadImage({
        uri: asset.uri,
        name: asset.fileName || `thumb_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      setValue('thumbnail', uploaded.path);
      showTeacherToast({ type: 'success', title: 'Thumbnail updated' });
    }
  };

  const pickVideo = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['video/*'] });
    if (res.assets && res.assets[0]) {
      const asset: any = res.assets[0];
      const uploaded = await uploadVideo({
        uri: asset.uri,
        name: asset.name || `intro_${Date.now()}.mp4`,
        type: asset.mimeType || 'video/mp4',
      });
      setValue('introVideo', uploaded.path);
      showTeacherToast({ type: 'success', title: 'Intro video updated' });
    }
  };

  const submit = async (values: TeacherCourseFormValues) => {
    await onSubmit(values);
  };

  const onInvalid = (errors: any) => {
    console.log('Form validation failed:', errors);
    showTeacherToast({
      type: 'error',
      title: 'Validation Error',
      message: 'Please check all required fields.',
    });
  };

  if (loading) {
    return (
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <TeacherSkeleton height={28} width="60%" />
        {Array.from({ length: 5 }).map((_, index) => (
          <TeacherSkeleton key={index} height={70} />
        ))}
      </View>
    );
  }

  return (
    <TeacherErrorBoundary>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: spacing.xxxl,
            gap: spacing.lg,
          }}
        >
          <Section title={mode === 'edit' ? 'Update Course' : 'Create Course'}>
            <Controller
              control={control}
              name="title"
              render={({ field, fieldState }) => (
                <TeacherTextInput
                  label="Title"
                  value={field.value}
                  onChangeText={field.onChange}
                  errorText={fieldState.error?.message}
                  placeholder="e.g. Advanced Thermodynamics"
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
                  placeholder="Detailed overview..."
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
                  options={categories}
                />
              )}
            />
            <Controller
              control={control}
              name="classLevel"
              render={({ field }) => (
                <TeacherSelect
                  label="Class Level"
                  value={field.value}
                  onChange={field.onChange}
                  options={classLevels}
                />
              )}
            />
            <Controller
              control={control}
              name="level"
              render={({ field }) => (
                <TeacherRadioGroup label="Difficulty" value={field.value} onChange={field.onChange} options={difficultyOptions} />
              )}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              <Controller
                control={control}
                name="estimatedDuration"
                render={({ field, fieldState }) => (
                  <TeacherTextInput
                    label="Estimated Hours"
                    value={field.value?.toString() ?? ''}
                    onChangeText={(val) => field.onChange(val ? Number(val) : undefined)}
                    keyboardType="numeric"
                    errorText={fieldState.error?.message}
                    style={{ flex: 1, minWidth: '45%' }}  // Ensure it doesn't shrink too much
                  />
                )}
              />
              <Controller
                control={control}
                name="totalVideos"
                render={({ field, fieldState }) => (
                  <TeacherTextInput
                    label="Total Videos"
                    value={field.value?.toString() ?? ''}
                    onChangeText={(val) => field.onChange(val ? Number(val) : undefined)}
                    keyboardType="numeric"
                    errorText={fieldState.error?.message}
                    style={{ flex: 1, minWidth: '45%' }}  // Same here
                  />
                )}
              />
            </View>
            <Controller
              control={control}
              name="launchDate"
              render={({ field }) => (
                <TeacherDatePicker label="Planned Launch Date" value={field.value || null} onChange={field.onChange} />
              )}
            />
          </Section>

          <Section title="Pricing & Access">
            <Controller
              control={control}
              name="isPremium"
              render={({ field }) => (
                <TeacherCheckbox
                  label="Premium Course"
                  helperText="Enable pricing and paid enrollment."
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {isPremium ? (
              <Controller
                control={control}
                name="price"
                render={({ field, fieldState }) => (
                  <TeacherTextInput
                    label="Price (PKR)"
                    value={field.value.toString()}
                    onChangeText={(val) => field.onChange(Number(val || 0))}
                    keyboardType="numeric"
                    errorText={fieldState.error?.message}
                  />
                )}
              />
            ) : null}
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <TeacherCheckbox
                  label="Published"
                  helperText="Unpublish to save as draft."
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Section>

          <Section title="Learning Highlights">
            <ArrayEditor
              label="What students will learn"
              items={learnings}
              onAdd={(value) => setValue('whatYouWillLearn', [...learnings, value])}
              onRemove={(index) => setValue('whatYouWillLearn', learnings.filter((_, i) => i !== index))}
            />
            <ArrayEditor
              label="Learning outcomes"
              items={outcomes}
              onAdd={(value) => setValue('learningOutcomes', [...outcomes, value])}
              onRemove={(index) => setValue('learningOutcomes', outcomes.filter((_, i) => i !== index))}
            />
          </Section>

          <Section title="Resources">
            <MaterialList
              items={materials}
              onAdd={(value) => setValue('studyMaterials', [...materials, value])}
              onRemove={(index) => setValue('studyMaterials', materials.filter((_, i) => i !== index))}
            />
            <LinkList
              items={links}
              onAdd={(value) => setValue('links', [...links, value])}
              onRemove={(index) => setValue('links', links.filter((_, i) => i !== index))}
            />
          </Section>

          <Section title="Features">
            <Controller
              control={control}
              name="hasForum"
              render={({ field }) => (
                <TeacherCheckbox
                  label="Enable discussion forum"
                  helperText="Students can collaborate via community threads."
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="hasQuizzes"
              render={({ field }) => (
                <TeacherCheckbox
                  label="Enable quizzes & MCQs"
                  helperText="Unlock assessments to measure progress."
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Section>

          <Section title="Media">
            <Controller
              control={control}
              name="thumbnail"
              render={({ field }) => (
                <MediaPicker
                  label="Thumbnail"
                  value={field.value}
                  onPick={pickThumbnail}
                  onClear={() => field.onChange(null)}
                />
              )}
            />
            <Controller
              control={control}
              name="introVideo"
              render={({ field }) => (
                <MediaPicker
                  label="Intro Video"
                  value={field.value}
                  onPick={pickVideo}
                  onClear={() => field.onChange(null)}
                  type="video"
                />
              )}
            />
          </Section>

          <Section title="Course Videos (Lessons)">
            <LessonList
              items={lessons}
              onAdd={(lesson) => {
                const newLessons = [...lessons, { ...lesson, order: lessons.length + 1 }];
                setValue('lessons', newLessons);
              }}
              onRemove={(index) => {
                const filteredLessons = lessons.filter((_, i) => i !== index).map((lesson, idx) => ({
                  ...lesson,
                  order: idx + 1
                }));
                setValue('lessons', filteredLessons);
              }}
            />
          </Section>

          <TeacherButton
            title={mode === 'edit' ? 'Update Course' : 'Publish Course'}
            onPress={handleSubmit(submit, onInvalid)}
            icon={mode === 'edit' ? 'checkmark-circle' : 'rocket'}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </TeacherErrorBoundary>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const {
    theme: { spacing, surface, radius, typography, text },
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
        {title}
      </Text>
      {children}
    </View>
  );
};

const ArrayEditor = ({
  label,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}) => {
  const [input, setInput] = useState('');
  const {
    theme: { spacing, text, typography },
  } = useTeacherTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        style={{
          fontFamily: typography.fontFamily.semibold,
          color: text.primary,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TeacherTextInput
          value={input}
          onChangeText={setInput}
          placeholder="Add item"
          containerStyle={{ flex: 1 }}
        />
        <TeacherButton
          title="Add"
          onPress={() => {
            if (input.trim()) {
              onAdd(input.trim());
              setInput('');
            }
          }}
          fullWidth={false}
        />
      </View>
      {items.length === 0 ? (
        <Text style={{ color: text.secondary }}>No entries yet.</Text>
      ) : (
        items.map((item, index) => (
          <View
            key={`${item}-${index}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ flex: 1, color: text.primary }}>{item}</Text>
            <TeacherButton
              title="Remove"
              variant="ghost"
              fullWidth={false}
              onPress={() => onRemove(index)}
            />
          </View>
        ))
      )}
    </View>
  );
};

const MaterialList = ({
  items,
  onAdd,
  onRemove,
}: {
  items: Array<{ title: string; type: typeof materialTypes[number]; url?: string }>;
  onAdd: (value: { title: string; type: typeof materialTypes[number]; url?: string }) => void;
  onRemove: (index: number) => void;
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<typeof materialTypes[number]>('link');
  const {
    theme: { spacing, text },
  } = useTeacherTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <TeacherTextInput label="Resource Title" value={title} onChangeText={setTitle} />
      <TeacherSelect
        label="Type"
        value={type}
        onChange={(val) => setType(val as typeof materialTypes[number])}
        options={materialTypes.map((item) => ({ label: item.toUpperCase(), value: item }))}
      />
      <TeacherTextInput label="URL (optional)" value={url} onChangeText={setUrl} />
      <TeacherButton
        title="Add Material"
        onPress={() => {
          if (title.trim()) {
            onAdd({ title: title.trim(), type, url: url || undefined });
            setTitle('');
            setUrl('');
          }
        }}
      />
      {items.length === 0 ? (
        <Text style={{ color: text.secondary }}>No materials added.</Text>
      ) : (
        items.map((material, index) => (
          <View key={`${material.title}-${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ flex: 1, color: text.primary }}>
              {material.title} • {material.type.toUpperCase()}
            </Text>
            <TeacherButton title="Remove" variant="ghost" fullWidth={false} onPress={() => onRemove(index)} />
          </View>
        ))
      )}
    </View>
  );
};

const LinkList = ({
  items,
  onAdd,
  onRemove,
}: {
  items: Array<{ title: string; url: string; description?: string }>;
  onAdd: (value: { title: string; url: string; description?: string }) => void;
  onRemove: (index: number) => void;
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const {
    theme: { spacing, text },
  } = useTeacherTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <TeacherTextInput label="Link Title" value={title} onChangeText={setTitle} />
      <TeacherTextInput label="URL" value={url} onChangeText={setUrl} />
      <TeacherTextInput label="Description" value={description} onChangeText={setDescription} />
      <TeacherButton
        title="Add Link"
        onPress={() => {
          if (title.trim() && url.trim()) {
            onAdd({ title: title.trim(), url: url.trim(), description: description || undefined });
            setTitle('');
            setUrl('');
            setDescription('');
          }
        }}
      />
      {items.length === 0 ? (
        <Text style={{ color: text.secondary }}>No links added.</Text>
      ) : (
        items.map((link, index) => (
          <View key={`${link.title}-${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ flex: 1, color: text.primary }}>{link.title}</Text>
            <TeacherButton title="Remove" variant="ghost" fullWidth={false} onPress={() => onRemove(index)} />
          </View>
        ))
      )}
    </View>
  );
};

const LessonList = ({
  items,
  onAdd,
  onRemove,
}: {
  items: Array<{ title: string; description?: string; videoUrl?: string; duration?: number; order?: number; isFree?: boolean }>;
  onAdd: (lesson: { title: string; description?: string; videoUrl?: string; duration?: number; order?: number; isFree?: boolean }) => void;
  onRemove: (index: number) => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const {
    theme: { spacing, text, typography, radius },
  } = useTeacherTheme();

  const pickLessonVideo = async () => {
    try {
      setUploading(true);
      const res = await DocumentPicker.getDocumentAsync({ type: ['video/*'] });
      if (res.assets && res.assets[0]) {
        const asset: any = res.assets[0];
        const uploaded = await uploadVideo({
          uri: asset.uri,
          name: asset.name || `lesson_${Date.now()}.mp4`,
          type: asset.mimeType || 'video/mp4',
        });
        setVideoUrl(uploaded.path);
        showTeacherToast({ type: 'success', title: 'Video uploaded' });
      }
    } catch (error: any) {
      console.error('Error uploading video:', error);
      showTeacherToast({ type: 'error', title: 'Upload failed', message: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = () => {
    if (title.trim()) {
      onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: videoUrl || undefined,
        duration: duration ? Number(duration) : undefined,
        isFree,
      });
      setTitle('');
      setDescription('');
      setDuration('');
      setVideoUrl(null);
      setIsFree(false);
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Text
        style={{
          fontFamily: typography.fontFamily.semibold,
          color: text.primary,
          marginBottom: spacing.xs,
        }}
      >
        Add Course Lesson Videos
      </Text>

      <TeacherTextInput
        label="Lesson Title *"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Introduction to Thermodynamics"
      />

      <TeacherTextInput
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Brief description of this lesson"
        multiline
        style={{ minHeight: 80 }}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TeacherTextInput
          label="Duration (minutes)"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          placeholder="e.g. 15"
          containerStyle={{ flex: 1 }}
        />
        <View style={{ justifyContent: 'flex-end', paddingBottom: spacing.xs }}>
          <TeacherCheckbox
            label="Free Lesson"
            value={isFree}
            onChange={setIsFree}
          />
        </View>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.semibold,
            color: text.primary,
            fontSize: 14,
          }}
        >
          Lesson Video
        </Text>
        {videoUrl ? (
          <View style={{ gap: spacing.xs }}>
            <View
              style={{
                height: 120,
                borderRadius: radius.lg,
                backgroundColor: 'rgba(79,70,229,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
              }}
            >
              <Ionicons name="videocam" size={24} color="#4F46E5" />
              <Text style={{ color: text.primary, fontSize: 12 }}>Video uploaded</Text>
            </View>
            <TeacherButton
              title="Remove Video"
              variant="ghost"
              fullWidth={false}
              onPress={() => setVideoUrl(null)}
            />
          </View>
        ) : (
          <TeacherButton
            title={uploading ? "Uploading..." : "Upload Video"}
            onPress={pickLessonVideo}
            disabled={uploading}
            fullWidth={false}
          />
        )}
      </View>

      <TeacherButton title="Add Lesson" onPress={handleAdd} disabled={!title.trim() || uploading} />

      {items.length === 0 ? (
        <Text style={{ color: text.secondary, textAlign: 'center', paddingVertical: spacing.md }}>
          No lessons added yet. Add your first lesson video above.
        </Text>
      ) : (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Text
            style={{
              fontFamily: typography.fontFamily.semibold,
              color: text.primary,
            }}
          >
            Lessons ({items.length})
          </Text>
          {items.map((lesson, index) => (
            <View
              key={`lesson-${index}`}
              style={{
                padding: spacing.md,
                backgroundColor: 'rgba(79,70,229,0.05)',
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: 'rgba(79,70,229,0.1)',
                gap: spacing.xs,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.semibold,
                      color: text.primary,
                      fontSize: 16,
                    }}
                  >
                    {index + 1}. {lesson.title}
                  </Text>
                  {lesson.description && (
                    <Text style={{ color: text.secondary, fontSize: 12, marginTop: spacing.xs }}>
                      {lesson.description}
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs }}>
                    {lesson.videoUrl && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="videocam" size={14} color="#4F46E5" />
                        <Text style={{ color: text.secondary, fontSize: 12 }}>Video</Text>
                      </View>
                    )}
                    {lesson.duration && (
                      <Text style={{ color: text.secondary, fontSize: 12 }}>
                        {lesson.duration} min
                      </Text>
                    )}
                    {lesson.isFree && (
                      <View style={{ backgroundColor: '#10B981', paddingHorizontal: spacing.xs, borderRadius: radius.sm }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>FREE</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TeacherButton
                  title="Remove"
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => onRemove(index)}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const MediaPicker = ({
  label,
  value,
  onPick,
  onClear,
  type = 'image',
}: {
  label: string;
  value?: string | null;
  onPick: () => Promise<void>;
  onClear: () => void;
  type?: 'image' | 'video';
}) => {
  const {
    theme: { spacing, typography, text, radius },
  } = useTeacherTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        style={{
          fontFamily: typography.fontFamily.semibold,
          color: text.primary,
        }}
      >
        {label}
      </Text>
      {value ? (
        <View style={{ gap: spacing.xs }}>
          {type === 'image' ? (
            <Image source={{ uri: getFullUrl(value) || '' }} style={{ width: '100%', height: 160, borderRadius: radius.lg }} resizeMode="cover" />
          ) : (
            <View
              style={{
                height: 160,
                borderRadius: radius.lg,
                backgroundColor: 'rgba(79,70,229,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
              }}
            >
              <Ionicons name="videocam" size={28} color="#4F46E5" />
              <Text style={{ color: text.primary }}>Video attached</Text>
            </View>
          )}
          <TeacherButton title="Remove" variant="ghost" fullWidth={false} onPress={onClear} />
        </View>
      ) : null}
      <TeacherButton title={value ? 'Change' : 'Upload'} onPress={onPick} fullWidth={false} />
    </View>
  );
};

