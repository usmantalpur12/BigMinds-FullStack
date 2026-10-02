import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { forumService } from '../services/forumService';

interface TopicFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  isAnonymous: boolean;
}

const CreateTopicScreen = () => {
  const router = useRouter();
  const { forumId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TopicFormData>({
    title: '',
    content: '',
    category: 'general',
    tags: [],
    isAnonymous: false,
  });

  const [newTag, setNewTag] = useState('');

  const categories = [
    { value: 'general', label: 'General Discussion', icon: '💬' },
    { value: 'question', label: 'Question', icon: '❓' },
    { value: 'discussion', label: 'Discussion', icon: '🗣️' },
    { value: 'announcement', label: 'Announcement', icon: '📢' },
    { value: 'help', label: 'Help', icon: '🆘' },
    { value: 'tutorial', label: 'Tutorial', icon: '📚' },
    { value: 'showcase', label: 'Showcase', icon: '🎨' },
    { value: 'feedback', label: 'Feedback', icon: '💭' },
  ];

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await forumService.createTopic(forumId as string, formData);
      
      Alert.alert(
        'Success',
        'Topic created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/topic-detail/${response.data._id}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Topic</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Topic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Topic Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter topic title"
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Content *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              placeholder="Write your topic content here..."
              multiline
              numberOfLines={8}
              maxLength={2000}
            />
            <Text style={styles.characterCount}>
              {formData.content.length}/2000 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryOption,
                    formData.category === category.value && styles.categorySelected,
                  ]}
                  onPress={() => setFormData({ ...formData, category: category.value })}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    formData.category === category.value && styles.categoryLabelSelected,
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <Text style={styles.sectionDescription}>
            Add tags to help others find your topic
          </Text>
          
          <View style={styles.tagInputContainer}>
            <TextInput
              style={[styles.input, styles.tagInput]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a tag"
              onSubmitEditing={addTag}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTag}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {formData.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <Ionicons name="close" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Post Anonymously</Text>
                <Text style={styles.switchDescription}>
                  Your name will not be shown on this topic
                </Text>
              </View>
              <Switch
                value={formData.isAnonymous}
                onValueChange={(value) => setFormData({ ...formData, isAnonymous: value })}
                trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
                thumbColor={formData.isAnonymous ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posting Guidelines</Text>
          <View style={styles.guidelinesContainer}>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Be respectful and constructive in your discussions
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Use clear and descriptive titles
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Search for similar topics before posting
              </Text>
            </View>
            <View style={styles.guideline}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.guidelineText}>
                Use appropriate tags to categorize your topic
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating Topic...' : 'Create Topic'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  categorySelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryLabelSelected: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tagInput: {
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tagText: {
    fontSize: 14,
    color: '#4F46E5',
    marginRight: 6,
  },
  switchGroup: {
    gap: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  guidelinesContainer: {
    gap: 12,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  guidelineText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateTopicScreen;
