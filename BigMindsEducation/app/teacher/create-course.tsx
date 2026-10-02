import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { courseService } from '../services/courseService';
import { TeacherCourseForm, TeacherCourseFormValues } from './components/TeacherCourseForm';
import { showTeacherToast } from './components/TeacherToast';

export default function CreateCourseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string }>();
  const courseId = params.courseId ? String(params.courseId) : null;
  const isEditing = Boolean(courseId);

  const [initialValues, setInitialValues] = useState<Partial<TeacherCourseFormValues>>({});
  const [loading, setLoading] = useState<boolean>(Boolean(courseId));

  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setInitialValues({});
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const course = await courseService.getCourse(courseId);
      setInitialValues({
        title: course?.title || '',
        description: course?.description || '',
        category: course?.category || 'pre-engineering',
        classLevel: course?.class || course?.className || '11',
        level: course?.level || 'beginner',
        estimatedDuration: course?.estimatedDuration,
        totalVideos: course?.totalVideos,
        isPremium: Boolean(course?.isPremium),
        price: Number(course?.price || 0),
        isPublished: course?.isPublished ?? true,
        hasForum: course?.hasForum !== false,
        hasQuizzes: course?.hasQuizzes !== false,
        whatYouWillLearn: course?.whatYouWillLearn || [],
        learningOutcomes: course?.learningOutcomes || [],
        studyMaterials: course?.studyMaterials || [],
        links: course?.links || [],
        thumbnail: course?.thumbnail || null,
        introVideo: course?.introVideo || null,
        launchDate: null,
        lessons: course?.lessons || [],
      });
    } catch (error) {
      console.error('Failed to load course', error);
      showTeacherToast({
        type: 'error',
        title: 'Unable to load course',
        message: 'Please pull to refresh or try again later.',
      });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleSubmit = async (values: TeacherCourseFormValues) => {
    const payload = {
      title: values.title,
      description: values.description,
      category: values.category,
      class: values.classLevel,
      level: values.level,
      price: values.isPremium ? values.price : 0,
      isPremium: values.isPremium,
      estimatedDuration: values.estimatedDuration,
      totalVideos: values.totalVideos,
      isPublished: values.isPublished,
      thumbnail: values.thumbnail || undefined,
      introVideo: values.introVideo || undefined,
      whatYouWillLearn: values.whatYouWillLearn,
      learningOutcomes: values.learningOutcomes,
      studyMaterials: values.studyMaterials,
      links: values.links,
      hasForum: values.hasForum,
      hasQuizzes: values.hasQuizzes,
      lessons: values.lessons || [],
    };

    try {
      if (isEditing && courseId) {
        await courseService.updateCourse(courseId, payload);
        showTeacherToast({ type: 'success', title: 'Course updated' });
        router.push({ pathname: '/course-detail/[courseId]', params: { courseId } } as any);
      } else {
        const created = await courseService.createCourse(payload);
        showTeacherToast({ type: 'success', title: 'Course published' });
        router.replace({
          pathname: '/course-detail/[courseId]',
          params: { courseId: created._id, showAddContent: '1' },
        } as any);
      }
    } catch (error: any) {
      console.error('Failed to save course', error);
      showTeacherToast({
        type: 'error',
        title: 'Save failed',
        message: error?.response?.data?.message || 'Please try again.',
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TeacherCourseForm
        mode={isEditing ? 'edit' : 'create'}
        loading={loading}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

