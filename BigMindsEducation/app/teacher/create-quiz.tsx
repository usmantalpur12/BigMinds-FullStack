import React from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quizService } from '../services/quizService';
import { TeacherButton, TeacherTextInput, TeacherCheckbox, TeacherErrorBoundary, showTeacherToast } from './components';
import { useTeacherTheme } from '../theme/teacherTheme';
import LottieView from 'lottie-react-native';
import EmptyAnimation from '../../assets/teacher-empty.json';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text required'),
  isCorrect: z.boolean(),
});

const questionSchema = z
  .object({
    stem: z.string().min(3, 'Question text required'),
    options: z.array(optionSchema),
  })
  .superRefine((val, ctx) => {
    if (!val.options.some((opt) => opt.isCorrect)) {
      ctx.addIssue({
        path: ['options'],
        code: z.ZodIssueCode.custom,
        message: 'Select a correct answer',
      });
    }
  });

const quizSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  duration: z.number().min(60, 'Duration must be at least 60 seconds'),
  totalQuestions: z.number().min(1, 'Enter total questions'),
  passingScore: z.coerce.number().min(0).max(100),
  maxAttempts: z.coerce.number().min(1),
  questions: z.array(questionSchema).min(1, 'Add at least one question'),
});

type QuizFormValues = z.infer<typeof quizSchema>;

const defaultQuestion = {
  stem: '',
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
};

const defaultValues: QuizFormValues = {
  courseId: '',
  title: '',
  description: '',
  duration: 600,
  totalQuestions: 1,
  passingScore: 70,
  maxAttempts: 3,
  questions: [defaultQuestion],
};

export default function CreateQuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string; quizId?: string }>();
  const preselectedCourseId = params.courseId ? String(params.courseId) : '';
  const quizId = params.quizId ? String(params.quizId) : '';
  const isEditing = !!quizId;
  const {
    theme: { spacing, text, typography, background },
  } = useTeacherTheme();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      ...defaultValues,
      courseId: preselectedCourseId || defaultValues.courseId,
    },
  });

  React.useEffect(() => {
    if (preselectedCourseId) setValue('courseId', preselectedCourseId);
    if (quizId) loadQuizData();
  }, [preselectedCourseId, quizId, setValue]);

  const loadQuizData = async () => {
    try {
      const quiz = await quizService.getQuiz(quizId);
      const questions = await quizService.getQuizQuestions(quizId);
      
      setValue('title', quiz.title);
      setValue('description', quiz.description || '');
      setValue('duration', quiz.duration);
      setValue('passingScore', quiz.passingScore || 70);
      setValue('maxAttempts', quiz.maxAttempts || 3);
      setValue('courseId', quiz.courseId?._id || quiz.courseId);
      
      if (questions && questions.length > 0) {
        setValue('questions', questions);
        setValue('totalQuestions', questions.length);
      }
    } catch (error) {
      console.error('Failed to load quiz data', error);
      showTeacherToast({ type: 'error', title: 'Load failed', message: 'Could not load quiz details' });
    }
  };

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: 'questions',
  });

  const handleAddQuestion = () => {
    appendQuestion(defaultQuestion);
    // Auto-update totalQuestions count
    const count = watch('questions').length + 1;
    setValue('totalQuestions', count);
  };

  const handleRemoveQuestion = (index: number) => {
    removeQuestion(index);
    // Auto-update totalQuestions count
    const count = Math.max(1, watch('questions').length - 1);
    setValue('totalQuestions', count);
  };

  const handleToggleCorrect = (questionIndex: number, optionIndex: number) => {
    const currentQuestions = watch('questions');
    const updated = currentQuestions.map((question, qIdx) => {
      if (qIdx !== questionIndex) return question;
      return {
        ...question,
        options: question.options.map((opt, oIdx) => ({
          ...opt,
          isCorrect: oIdx === optionIndex,
        })),
      };
    });
    setValue('questions', updated, { shouldDirty: true });
  };

  const onSubmit = async (values: QuizFormValues) => {
    try {
      let quiz;
      if (isEditing) {
        quiz = await quizService.updateQuiz(quizId, {
          title: values.title,
          description: values.description || undefined,
          duration: values.duration,
          totalQuestions: values.totalQuestions,
          passingScore: values.passingScore,
          maxAttempts: values.maxAttempts,
        });
        showTeacherToast({ type: 'success', title: 'Quiz updated' });
      } else {
        quiz = await quizService.createQuiz({
          courseId: values.courseId,
          title: values.title,
          description: values.description || undefined,
          duration: values.duration,
          totalQuestions: values.totalQuestions,
          passingScore: values.passingScore,
          maxAttempts: values.maxAttempts,
        });
        for (const q of values.questions) {
          await quizService.addQuestion(quiz._id, q);
        }
        showTeacherToast({ type: 'success', title: 'Quiz created' });
      }
      router.back();
    } catch (error: any) {
      console.error('Failed to save quiz', error);
      showTeacherToast({
        type: 'error',
        title: 'Save failed',
        message: error?.message || 'Please try again.',
      });
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
            {isEditing ? 'Edit Quiz' : 'Create Quiz'}
          </Text>

          <Controller
            control={control}
            name="courseId"
            render={({ field, fieldState }) => (
              <TeacherTextInput
                label="Course ID"
                value={field.value}
                onChangeText={field.onChange}
                errorText={fieldState.error?.message}
                placeholder="e.g. 65f1c9..."
                editable={!preselectedCourseId}
                style={preselectedCourseId ? { opacity: 0.7, backgroundColor: '#f3f4f6' } : {}}
              />
            )}
          />

          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <TeacherTextInput
                label="Quiz Title"
                value={field.value}
                onChangeText={field.onChange}
                errorText={fieldState.error?.message}
                placeholder="Midterm Practice Quiz"
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TeacherTextInput
                label="Description"
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Optional description"
                multiline
                style={{ minHeight: 100 }}
              />
            )}
          />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Controller
                control={control}
                name="duration"
                render={({ field, fieldState }) => (
                  <TeacherTextInput
                    label="Duration (sec)"
                    value={field.value.toString()}
                    onChangeText={(val) => field.onChange(Number(val || 0))}
                    keyboardType="numeric"
                    errorText={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Controller
                control={control}
                name="passingScore"
                render={({ field, fieldState }) => (
                  <TeacherTextInput
                    label="Pass Score (%)"
                    value={field.value.toString()}
                    onChangeText={(val) => field.onChange(Number(val || 0))}
                    keyboardType="numeric"
                    errorText={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Controller
                control={control}
                name="maxAttempts"
                render={({ field, fieldState }) => (
                  <TeacherTextInput
                    label="Max Attempts"
                    value={field.value.toString()}
                    onChangeText={(val) => field.onChange(Number(val || 0))}
                    keyboardType="numeric"
                    errorText={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Controller
                control={control}
                name="totalQuestions"
                render={({ field, fieldState }) => (
                  <TeacherTextInput
                    label="Total Questions"
                    value={field.value.toString()}
                    onChangeText={(val) => field.onChange(Number(val || 0))}
                    keyboardType="numeric"
                    errorText={fieldState.error?.message}
                    editable={false}
                    style={{ opacity: 0.8, backgroundColor: '#f3f4f6' }}
                  />
                )}
              />
            </View>
          </View>

          <View
            style={{
              marginTop: spacing.lg,
              marginBottom: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.sizes.lg,
                color: text.primary,
              }}
            >
              Questions ({questionFields.length})
            </Text>
            <TeacherButton
              title="Add Question"
              variant="secondary"
              fullWidth={false}
              icon="add-circle"
              onPress={handleAddQuestion}
            />
          </View>

          {questionFields.length === 0 ? (
            <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
              <LottieView source={EmptyAnimation} autoPlay loop style={{ width: 160, height: 160 }} />
              <Text style={{ color: text.secondary, marginTop: spacing.sm }}>No questions yet</Text>
            </View>
          ) : (
            questionFields.map((question, qIdx) => (
              <View
                key={question.id}
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(79,70,229,0.16)',
                  borderRadius: 24,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.semibold,
                      color: text.primary,
                    }}
                  >
                    Question {qIdx + 1}
                  </Text>
                  {questionFields.length > 1 ? (
                    <TeacherButton
                      title="Remove"
                      variant="ghost"
                      fullWidth={false}
                      onPress={() => handleRemoveQuestion(qIdx)}
                    />
                  ) : null}
                </View>

                <Controller
                  control={control}
                  name={`questions.${qIdx}.stem`}
                  render={({ field, fieldState }) => (
                    <TeacherTextInput
                      label="Question Prompt"
                      value={field.value}
                      onChangeText={field.onChange}
                      errorText={fieldState.error?.message}
                      placeholder="What is the value of g?"
                      multiline
                    />
                  )}
                />

                <Text
                  style={{
                    fontFamily: typography.fontFamily.medium,
                    color: text.secondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  Options (tap to mark correct answer)
                </Text>

                {question.options?.map((_, oIdx) => {
                  const optionCorrect = watch(`questions.${qIdx}.options.${oIdx}.isCorrect`);
                  return (
                  <Controller
                    key={oIdx}
                    control={control}
                    name={`questions.${qIdx}.options.${oIdx}.text`}
                    render={({ field, fieldState }) => (
                      <View style={{ marginBottom: spacing.sm }}>
                        <TeacherTextInput
                          label={`Option ${oIdx + 1}`}
                          value={field.value}
                          onChangeText={(val) => {
                            field.onChange(val);
                          }}
                          errorText={fieldState.error?.message}
                          placeholder="Enter option text"
                        />
                        <TeacherCheckbox
                          label={optionCorrect ? 'Correct answer' : 'Mark as correct'}
                          value={optionCorrect}
                          onChange={() => handleToggleCorrect(qIdx, oIdx)}
                        />
                      </View>
                    )}
                  />
                );})}
              </View>
            ))
          )}

          <TeacherButton
            title={isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Quiz' : 'Create Quiz')}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            icon="construct"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </TeacherErrorBoundary>
  );
}