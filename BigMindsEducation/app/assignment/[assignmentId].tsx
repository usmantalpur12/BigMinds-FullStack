import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { backendAPI } from "../services/backendAPI";
import { assignmentService } from "../services/assignmentService";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
  courseId: {
    _id: string;
    title: string;
  };
  submission?: {
    _id: string;
    submissionText: string;
    status: "submitted" | "graded";
    score?: number;
    feedback?: string;
    submittedAt: string;
  } | null;
}

export default function StudentAssignmentScreen() {
  const { assignmentId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId]);

  const fetchAssignmentDetails = async () => {
    setLoading(true);
    try {
      const res = await backendAPI.get(`/assignments/${assignmentId}`);
      const data = res.data.data;
      setAssignment(data);
      if (data?.submission) {
        setSubmissionText(data.submission.submissionText);
      }
    } catch (err: any) {
      console.error("Error fetching assignment details:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to load assignment details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      Alert.alert("Required", "Please write your submission before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      if (assignment?.submission) {
        // Update submission
        const submissionId = assignment.submission._id;
        await assignmentService.updateSubmission(submissionId, {
          submissionText: submissionText.trim(),
        });
        Alert.alert("Success", "Submission updated successfully!");
        setIsEditing(false);
      } else {
        // New submission
        await assignmentService.submitAssignment(String(assignmentId), {
          submissionText: submissionText.trim(),
        });
        Alert.alert("Success", "Assignment submitted successfully!");
      }
      fetchAssignmentDetails();
    } catch (err: any) {
      console.error("Error submitting assignment:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to submit assignment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDueDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading assignment...</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Assignment not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { submission } = assignment;
  const isGraded = submission?.status === "graded";
  const isSubmitted = submission?.status === "submitted";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Assignment Details
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.assignmentTitle}>{assignment.title}</Text>
          <Text style={styles.courseTitle}>Course: {assignment.courseId?.title}</Text>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Max Score</Text>
              <Text style={styles.metaValue}>{assignment.maxScore} Points</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{formatDueDate(assignment.dueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>
            {assignment.description || "No instructions provided."}
          </Text>
          {assignment.instructions ? (
            <Text style={styles.instructionsText}>{assignment.instructions}</Text>
          ) : null}
        </View>

        {/* Status & Submission Block */}
        {submission && !isEditing ? (
          <View>
            {/* Graded Status Card */}
            {isGraded ? (
              <View style={[styles.card, styles.gradedCard]}>
                <View style={styles.statusHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.gradedTitle}>Graded</Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreDisplay}>
                    {submission.score} / {assignment.maxScore}
                  </Text>
                  <Text style={styles.scoreLabel}>Points Earned</Text>
                </View>
                {submission.feedback ? (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackTitle}>Instructor Feedback:</Text>
                    <Text style={styles.feedbackText}>{submission.feedback}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={[styles.card, styles.submittedCard]}>
                <View style={styles.statusHeader}>
                  <Ionicons name="time" size={24} color="#3B82F6" />
                  <Text style={styles.submittedTitle}>Submitted (Pending Grade)</Text>
                </View>
                <Text style={styles.submittedDate}>
                  Submitted on: {formatDueDate(submission.submittedAt)}
                </Text>
              </View>
            )}

            {/* Submitted Content */}
            <View style={styles.card}>
              <View style={styles.submittedContentHeader}>
                <Text style={styles.sectionTitle}>Your Submission</Text>
                {!isGraded ? (
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="create-outline" size={16} color="#4F46E5" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.submittedText}>{submission.submissionText}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {isEditing ? "Edit Your Submission" : "Submit Your Work"}
            </Text>
            <TextInput
              style={styles.textInput}
              value={submissionText}
              onChangeText={setSubmissionText}
              placeholder="Type your submission here..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={8}
            />

            <View style={styles.buttonRow}>
              {isEditing ? (
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => {
                    setSubmissionText(assignment.submission?.submissionText || "");
                    setIsEditing(false);
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.btn, styles.submitBtn]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isEditing ? "Save Changes" : "Submit Assignment"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4B5563",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#4F46E5",
    borderRadius: 8,
  },
  backBtnText: {
    color: "white",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#4F46E5",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginLeft: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 8,
  },
  gradedCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  gradedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#065F46",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  scoreDisplay: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10B981",
  },
  scoreLabel: {
    fontSize: 14,
    color: "#047857",
  },
  feedbackContainer: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  submittedCard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  submittedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E40AF",
  },
  submittedDate: {
    fontSize: 14,
    color: "#1D4ED8",
  },
  submittedContentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#4F46E5",
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },
  submittedText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    color: "#1F2937",
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelBtnText: {
    color: "#4B5563",
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#4F46E5",
    flex: 1,
  },
  submitBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
