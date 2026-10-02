import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from './theme/colors';
import { profileService } from './services/profileService';

const UploadDocumentScreen = () => {
  const router = useRouter();
  const [type, setType] = useState<'certification' | 'degree' | 'diploma' | 'license' | 'identity' | 'other'>('certification');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setFile(result);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a document title');
      return;
    }

    if (!file || file.canceled || !file.assets[0]) {
      Alert.alert('Validation', 'Please select a document');
      return;
    }

    try {
      setUploading(true);
      await profileService.uploadTeacherDocument(
        file.assets[0].uri,
        type,
        title
      );
      Alert.alert('Success', 'Document uploaded successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const documentTypes = [
    { value: 'certification', label: 'Certification' },
    { value: 'degree', label: 'Degree' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'license', label: 'License' },
    { value: 'identity', label: 'Identity Document' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Document</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Document Type</Text>
          <View style={styles.chipContainer}>
            {documentTypes.map((docType) => (
              <TouchableOpacity
                key={docType.value}
                style={[
                  styles.chip,
                  type === docType.value && styles.chipActive,
                ]}
                onPress={() => setType(docType.value as any)}
              >
                <Text
                  style={[
                    styles.chipText,
                    type === docType.value && styles.chipTextActive,
                  ]}
                >
                  {docType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Document Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Bachelor's Degree in Computer Science"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Document File</Text>
          <TouchableOpacity style={styles.fileButton} onPress={pickDocument}>
            <Ionicons name="document-attach" size={24} color={colors.primary} />
            <Text style={styles.fileButtonText}>
              {file && !file.canceled && file.assets[0]
                ? file.assets[0].name
                : 'Select Document (PDF or Image)'}
            </Text>
          </TouchableOpacity>
          {file && !file.canceled && file.assets[0] && (
            <View style={styles.fileInfo}>
              <Text style={styles.fileInfoText}>
                Size: {(file.assets[0].size! / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, uploading && styles.buttonDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Upload Document</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  fileButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  fileInfo: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  fileInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UploadDocumentScreen;

