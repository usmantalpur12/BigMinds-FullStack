import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { assignmentService } from '../services/assignmentService';
import { useTeacherTheme } from '../theme/teacherTheme';
import { showTeacherToast } from './components/TeacherToast';

export default function SubmissionsScreen() {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();
  const {
    theme: { spacing, text, typography, background, surface },
  } = useTeacherTheme();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Grading modal state
  const [grading, setGrading] = useState<{ submissionId: string; studentName: string } | null>(null);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  const loadSubmissions = useCallback(async () => {
    if (!assignmentId) return;
    try {
      const data = await assignmentService.getAssignmentSubmissions(String(assignmentId));
      setSubmissions(data ?? []);
    } catch (err: any) {
      showTeacherToast({ type: 'error', title: err?.message ?? 'Failed to load submissions' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assignmentId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadSubmissions();
    }, [loadSubmissions])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadSubmissions();
  };

  const openGradeModal = (submission: any) => {
    setGrading({ submissionId: submission._id, studentName: submission.studentId?.name ?? 'Student' });
    setScoreInput(submission.score != null ? String(submission.score) : '');
    setFeedbackInput(submission.feedback ?? '');
  };

  const handleSubmitGrade = async () => {
    if (!grading) return;
    const score = parseFloat(scoreInput);
    if (isNaN(score) || score < 0) {
      showTeacherToast({ type: 'error', title: 'Enter a valid score' });
      return;
    }
    setSubmittingGrade(true);
    try {
      await assignmentService.gradeSubmission(grading.submissionId, {
        score,
        feedback: feedbackInput.trim() || undefined,
      });
      showTeacherToast({ type: 'success', title: 'Grade submitted!' });
      setGrading(null);
      loadSubmissions();
    } catch (err: any) {
      showTeacherToast({ type: 'error', title: err?.message ?? 'Failed to submit grade' });
    } finally {
      setSubmittingGrade(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const statusColor = (status: string) => {
    if (status === 'graded') return { bg: '#4BB54322', fg: '#4BB543' };
    if (status === 'submitted') return { bg: '#6C63FF22', fg: '#6C63FF' };
    return { bg: '#FF6B6B22', fg: '#FF6B6B' };
  };

  return (
    <View style={[styles.container, { backgroundColor: background.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: surface.card, borderBottomColor: surface.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={text.primary} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: typography.fontFamily.bold, color: text.primary },
          ]}
        >
          Submissions
        </Text>
        <View style={styles.countBadge}>
          <Text style={[styles.countText, { fontFamily: typography.fontFamily.semibold }]}>
            {submissions.length}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {submissions.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="people-outline" size={64} color={text.muted} />
              <Text
                style={{
                  fontFamily: typography.fontFamily.medium,
                  color: text.muted,
                  marginTop: spacing.md,
                  textAlign: 'center',
                }}
              >
                No submissions yet.
              </Text>
            </View>
          ) : (
            submissions.map((sub) => {
              const sc = statusColor(sub.status);
              return (
                <View
                  key={sub._id}
                  style={[
                    styles.card,
                    { backgroundColor: surface.card, borderColor: surface.border },
                  ]}
                >
                  {/* Student info */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(sub.studentId?.name ?? 'S').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.studentName,
                          { fontFamily: typography.fontFamily.semibold, color: text.primary },
                        ]}
                      >
                        {sub.studentId?.name ?? 'Unknown Student'}
                      </Text>
                      <Text
                        style={[
                          styles.submittedAt,
                          { fontFamily: typography.fontFamily.regular, color: text.muted },
                        ]}
                      >
                        {sub.submittedAt ? `Submitted: ${formatDate(sub.submittedAt)}` : 'Not yet submitted'}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeText, { fontFamily: typography.fontFamily.semibold, color: sc.fg }]}>
                        {sub.status === 'graded' ? 'Graded' : sub.status === 'submitted' ? 'Submitted' : sub.status}
                      </Text>
                    </View>
                  </View>

                  {/* Submission text */}
                  {!!sub.submissionText && (
                    <View
                      style={[
                        styles.submissionBox,
                        { backgroundColor: background.secondary ?? background.primary, borderColor: surface.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.submissionText,
                          { fontFamily: typography.fontFamily.regular, color: text.secondary },
                        ]}
                        numberOfLines={4}
                      >
                        {sub.submissionText}
                      </Text>
                    </View>
                  )}

                  {/* Grade info if already graded */}
                  {sub.status === 'graded' && (
                    <View style={styles.gradeRow}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text
                        style={[
                          styles.gradeText,
                          { fontFamily: typography.fontFamily.semibold, color: text.primary },
                        ]}
                      >
                        Score: {sub.score ?? '—'}
                      </Text>
                      {!!sub.feedback && (
                        <Text
                          style={[
                            styles.feedbackText,
                            { fontFamily: typography.fontFamily.regular, color: text.secondary },
                          ]}
                          numberOfLines={1}
                        >
                          · {sub.feedback}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Grade / Re-grade button */}
                  {(sub.status === 'submitted' || sub.status === 'graded') && (
                    <TouchableOpacity
                      onPress={() => openGradeModal(sub)}
                      style={[
                        styles.gradeBtn,
                        { backgroundColor: sub.status === 'graded' ? '#6C63FF33' : '#6C63FF' },
                      ]}
                    >
                      <Ionicons
                        name="pencil"
                        size={15}
                        color={sub.status === 'graded' ? '#6C63FF' : '#fff'}
                      />
                      <Text
                        style={[
                          styles.gradeBtnText,
                          {
                            fontFamily: typography.fontFamily.semibold,
                            color: sub.status === 'graded' ? '#6C63FF' : '#fff',
                          },
                        ]}
                      >
                        {sub.status === 'graded' ? 'Re-grade' : 'Grade'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Grade Modal */}
      <Modal
        visible={!!grading}
        transparent
        animationType="slide"
        onRequestClose={() => setGrading(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: surface.card }]}>
            <Text
              style={[
                styles.modalTitle,
                { fontFamily: typography.fontFamily.bold, color: text.primary },
              ]}
            >
              Grade: {grading?.studentName}
            </Text>

            <Text
              style={[styles.label, { fontFamily: typography.fontFamily.medium, color: text.secondary }]}
            >
              Score
            </Text>
            <TextInput
              value={scoreInput}
              onChangeText={setScoreInput}
              keyboardType="numeric"
              placeholder="e.g. 85"
              placeholderTextColor={text.muted}
              style={[
                styles.input,
                {
                  fontFamily: typography.fontFamily.regular,
                  color: text.primary,
                  borderColor: surface.border,
                  backgroundColor: background.primary,
                },
              ]}
            />

            <Text
              style={[styles.label, { fontFamily: typography.fontFamily.medium, color: text.secondary }]}
            >
              Feedback (optional)
            </Text>
            <TextInput
              value={feedbackInput}
              onChangeText={setFeedbackInput}
              placeholder="Write feedback for the student..."
              placeholderTextColor={text.muted}
              multiline
              numberOfLines={4}
              style={[
                styles.input,
                styles.textArea,
                {
                  fontFamily: typography.fontFamily.regular,
                  color: text.primary,
                  borderColor: surface.border,
                  backgroundColor: background.primary,
                },
              ]}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setGrading(null)}
                style={[styles.cancelBtn, { borderColor: surface.border }]}
              >
                <Text style={[styles.cancelBtnText, { fontFamily: typography.fontFamily.semibold, color: text.secondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitGrade}
                style={styles.submitGradeBtn}
                disabled={submittingGrade}
              >
                {submittingGrade ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.submitGradeBtnText, { fontFamily: typography.fontFamily.semibold }]}>
                    Submit Grade
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, marginLeft: 12 },
  countBadge: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: { color: '#fff', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C63FF33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#6C63FF', fontSize: 18, fontWeight: '700' },
  studentName: { fontSize: 15 },
  submittedAt: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11 },
  submissionBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  submissionText: { fontSize: 13, lineHeight: 20 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gradeText: { fontSize: 13 },
  feedbackText: { fontSize: 12, flex: 1 },
  gradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 10,
  },
  gradeBtnText: { fontSize: 14 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, marginBottom: 4 },
  label: { fontSize: 13, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15 },
  submitGradeBtn: {
    flex: 2,
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitGradeBtnText: { color: '#fff', fontSize: 15 },
});
