import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { assignmentService } from '../services/assignmentService';
import { useTeacherTheme } from '../theme/teacherTheme';
import { showTeacherToast } from './components/TeacherToast';

export default function TeacherAssignmentsScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const {
    theme: { spacing, text, typography, background, surface },
  } = useTeacherTheme();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssignments = useCallback(async () => {
    if (!courseId) return;
    try {
      const data = await assignmentService.getCourseAssignments(String(courseId));
      setAssignments(data ?? []);
    } catch (err: any) {
      showTeacherToast({ type: 'error', title: err?.message ?? 'Failed to load assignments' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAssignments();
    }, [loadAssignments])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadAssignments();
  };

  const handleViewSubmissions = (assignmentId: string) => {
    router.push({
      pathname: '/teacher/submissions',
      params: { assignmentId },
    } as any);
  };

  const handleCreateAssignment = () => {
    router.push({
      pathname: '/teacher/create-assignment',
      params: { courseId },
    } as any);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isPastDue = (dateStr: string) => new Date(dateStr) < new Date();

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
          Course Assignments
        </Text>
        <TouchableOpacity onPress={handleCreateAssignment} style={styles.addBtn}>
          <Ionicons name="add-circle" size={26} color="#6C63FF" />
        </TouchableOpacity>
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
          {assignments.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={64} color={text.muted} />
              <Text
                style={{
                  fontFamily: typography.fontFamily.medium,
                  color: text.muted,
                  marginTop: spacing.md,
                  textAlign: 'center',
                }}
              >
                No assignments yet.{'\n'}Tap + to create one.
              </Text>
            </View>
          ) : (
            assignments.map((assignment) => {
              const past = isPastDue(assignment.dueDate);
              return (
                <View
                  key={assignment._id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: surface.card,
                      borderColor: surface.border,
                    },
                  ]}
                >
                  {/* Title row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons name="document-text" size={18} color="#6C63FF" />
                      <Text
                        style={[
                          styles.cardTitle,
                          { fontFamily: typography.fontFamily.semibold, color: text.primary },
                        ]}
                        numberOfLines={2}
                      >
                        {assignment.title}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: past ? '#FF6B6B22' : '#4BB54322' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            fontFamily: typography.fontFamily.semibold,
                            color: past ? '#FF6B6B' : '#4BB543',
                          },
                        ]}
                      >
                        {past ? 'Past Due' : 'Active'}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  {!!assignment.description && (
                    <Text
                      style={[
                        styles.desc,
                        { fontFamily: typography.fontFamily.regular, color: text.secondary },
                      ]}
                      numberOfLines={2}
                    >
                      {assignment.description}
                    </Text>
                  )}

                  {/* Meta row */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color={text.muted} />
                      <Text
                        style={[
                          styles.metaText,
                          { fontFamily: typography.fontFamily.regular, color: text.muted },
                        ]}
                      >
                        Due: {formatDate(assignment.dueDate)}
                      </Text>
                    </View>
                    {assignment.maxScore != null && (
                      <View style={styles.metaItem}>
                        <Ionicons name="star-outline" size={14} color={text.muted} />
                        <Text
                          style={[
                            styles.metaText,
                            { fontFamily: typography.fontFamily.regular, color: text.muted },
                          ]}
                        >
                          Max: {assignment.maxScore} pts
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <TouchableOpacity
                    onPress={() => handleViewSubmissions(assignment._id)}
                    style={styles.submissionsBtn}
                  >
                    <Ionicons name="people-outline" size={16} color="#fff" />
                    <Text style={[styles.submissionsBtnText, { fontFamily: typography.fontFamily.semibold }]}>
                      View Submissions
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
  addBtn: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11 },
  desc: { fontSize: 13, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  submissionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  submissionsBtnText: { color: '#fff', fontSize: 14 },
});
