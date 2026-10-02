import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from './theme/colors';
import { forumService } from './services/forumService';
import { useAuth } from './context/AuthContext';

const StudentCreateForumScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>Please log in to create a forum.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation', 'Please provide both title and description.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'general',
        isPublic: true,
        requiresApproval: false,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      await forumService.createForum(payload as any);

      Alert.alert('Success', 'Your public forum has been created!', [
        {
          text: 'View Forum',
          onPress: () => router.replace('/(tabs)/forums'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create forum');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Public Forum</Text>
        <View style={styles.headerIcon} />
      </View>

      <Text style={styles.helperText}>
        Start a new public space for collaborative discussion. Everyone can join instantly.
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Forum Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Physics MCQs Practice"
          maxLength={100}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the purpose of your forum..."
          multiline
          numberOfLines={4}
          maxLength={400}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="general, academic, social..."
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="math, physics, entrance"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, saving && styles.disabledBtn]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Create Forum</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center' as const,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  centeredText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
};

export default StudentCreateForumScreen;

