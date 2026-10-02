import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { assignmentService } from '../services/assignmentService';
import { useTeacherTheme } from '../theme/teacherTheme';
import { showTeacherToast } from './components/TeacherToast';

const defaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 16);
};

export default function CreateAssignmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string }>();
  const courseId = params.courseId ? String(params.courseId) : '';
  const { theme: { spacing, text, typography, background } } = useTeacherTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [maxScore, setMaxScore] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (courseId) setDueDate(defaultDueDate());
  }, [courseId]);

  const handleSubmit = async () => {
    if (!courseId) {
      showTeacherToast({ type: 'error', title: 'Course ID is required' });
      return;
    }
    if (!title.trim()) {
      showTeacherToast({ type: 'error', title: 'Title is required' });
      return;
    }
    if (!description.trim()) {
      showTeacherToast({ type: 'error', title: 'Description is required' });
      return;
    }
    const score = parseInt(maxScore, 10);
    if (isNaN(score) || score < 1) {
      showTeacherToast({ type: 'error', title: 'Max score must be at least 1' });
      return;
    }
    setSubmitting(true);
    try {
      await assignmentService.createAssignment(courseId, {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim() || undefined,
        dueDate: new Date(dueDate).toISOString(),
        maxScore: score,
        isPublished: true,
      });
      showTeacherToast({ type: 'success', title: 'Assignment created' });
      router.back();
    } catch (error: any) {
      showTeacherToast({
        type: 'error',
        title: 'Failed to create assignment',
        message: error?.response?.data?.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!courseId) {
    return (
      <View style={[styles.center, { backgroundColor: background.default }]}>
        <Text style={styles.errorText}>Course ID is required. Open this screen from a course.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: background.default }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { fontFamily: typography.fontFamily.bold, color: text.primary }]}>
        Create Assignment
      </Text>
      <Text style={[styles.label, { color: text.secondary }]}>Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Assignment title"
        placeholderTextColor="#9CA3AF"
      />
      <Text style={[styles.label, { color: text.secondary }]}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the assignment"
        placeholderTextColor="#9CA3AF"
        multiline
      />
      <Text style={[styles.label, { color: text.secondary }]}>Instructions (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Instructions for students"
        placeholderTextColor="#9CA3AF"
        multiline
      />
      <Text style={[styles.label, { color: text.secondary }]}>Due date *</Text>
      <TextInput
        style={styles.input}
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="YYYY-MM-DDTHH:mm"
        placeholderTextColor="#9CA3AF"
      />
      <Text style={[styles.label, { color: text.secondary }]}>Max score *</Text>
      <TextInput
        style={styles.input}
        value={maxScore}
        onChangeText={setMaxScore}
        keyboardType="number-pad"
        placeholder="100"
        placeholderTextColor="#9CA3AF"
      />
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.submitBtnText}>Create Assignment</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#1F2937',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' as const },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  errorText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  backBtn: { padding: 12 },
  backBtnText: { color: '#4F46E5', fontSize: 16 },
});
