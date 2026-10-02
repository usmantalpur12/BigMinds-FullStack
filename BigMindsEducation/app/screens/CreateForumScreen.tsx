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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { forumService } from '../services/forumService';

interface ForumFormData {
  title: string;
  description: string;
  category: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  maxMembers: number;
  tags: string[];
  rules: string[];
}

const CreateForumScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ForumFormData>({
    title: '',
    description: '',
    category: 'general',
    isPrivate: false,
    requiresApproval: false,
    maxMembers: 100,
    tags: [],
    rules: [],
  });

  const [newTag, setNewTag] = useState('');
  const [newRule, setNewRule] = useState('');

  const categories = [
    { value: 'general', label: 'General Discussion', icon: '💬' },
    { value: 'academic', label: 'Academic Help', icon: '📚' },
    { value: 'programming', label: 'Programming', icon: '💻' },
    { value: 'medical', label: 'Medical Studies', icon: '🏥' },
    { value: 'engineering', label: 'Engineering', icon: '⚙️' },
    { value: 'business', label: 'Business Studies', icon: '💼' },
    { value: 'study', label: 'Study Groups', icon: '📖' },
    { value: 'career', label: 'Career Guidance', icon: '🎯' },
    { value: 'technology', label: 'Technology', icon: '🚀' },
    { value: 'science', label: 'Science', icon: '🔬' },
  ];

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await forumService.createForum(formData);
      
      Alert.alert(
        'Success',
        'Forum created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/forum-detail/${response.data._id}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create forum');
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

  const addRule = () => {
    if (newRule.trim() && !formData.rules.includes(newRule.trim())) {
      setFormData({
        ...formData,
        rules: [...formData.rules, newRule.trim()],
      });
      setNewRule('');
    }
  };

  const removeRule = (rule: string) => {
    setFormData({
      ...formData,
      rules: formData.rules.filter(r => r !== rule),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Forum</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Forum Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter forum title"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your forum"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
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

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Private Forum</Text>
                <Text style={styles.switchDescription}>
                  Only invited members can join
                </Text>
              </View>
              <Switch
                value={formData.isPrivate}
                onValueChange={(value) => setFormData({ ...formData, isPrivate: value })}
                trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
                thumbColor={formData.isPrivate ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Require Approval</Text>
                <Text style={styles.switchDescription}>
                  New members need approval to join
                </Text>
              </View>
              <Switch
                value={formData.requiresApproval}
                onValueChange={(value) => setFormData({ ...formData, requiresApproval: value })}
                trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
                thumbColor={formData.requiresApproval ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Members</Text>
            <TextInput
              style={styles.input}
              value={formData.maxMembers.toString()}
              onChangeText={(text) => setFormData({ ...formData, maxMembers: parseInt(text) || 100 })}
              placeholder="100"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          
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

        {/* Rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forum Rules</Text>
          
          <View style={styles.ruleInputContainer}>
            <TextInput
              style={[styles.input, styles.ruleInput]}
              value={newRule}
              onChangeText={setNewRule}
              placeholder="Add a rule"
              onSubmitEditing={addRule}
            />
            <TouchableOpacity style={styles.addButton} onPress={addRule}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.rulesContainer}>
            {formData.rules.map((rule, index) => (
              <View key={index} style={styles.rule}>
                <Text style={styles.ruleNumber}>{index + 1}.</Text>
                <Text style={styles.ruleText}>{rule}</Text>
                <TouchableOpacity onPress={() => removeRule(rule)}>
                  <Ionicons name="close" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating Forum...' : 'Create Forum'}
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
    height: 100,
    textAlignVertical: 'top',
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
  ruleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ruleInput: {
    flex: 1,
    marginRight: 10,
  },
  rulesContainer: {
    gap: 10,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ruleNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginRight: 8,
    marginTop: 2,
  },
  ruleText: {
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

export default CreateForumScreen;
