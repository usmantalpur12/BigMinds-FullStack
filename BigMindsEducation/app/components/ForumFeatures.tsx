import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, responsive } from '../theme/colors';
import { forumEnhancementService, StudyGroup, StudySession, ResourceShare, ExpertQnA } from '../services/forumEnhancementService';
import { useAuth } from '../context/AuthContext';

interface ForumFeaturesProps {
  forumId: string;
  visible: boolean;
  onClose: () => void;
}

const ForumFeatures: React.FC<ForumFeaturesProps> = ({ forumId, visible, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'study-groups' | 'sessions' | 'resources' | 'qa' | 'reminders'>('study-groups');
  const [loading, setLoading] = useState(false);
  
  // Study Groups
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    subject: '',
    maxMembers: 10,
    meetingTime: '18:00',
    meetingDay: 'Monday',
  });

  // Study Sessions
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: 60,
    maxParticipants: 20,
    topics: '',
  });

  // Resources
  const [resources, setResources] = useState<ResourceShare[]>([]);
  const [showShareResource, setShowShareResource] = useState(false);
  const [newResourceData, setNewResourceData] = useState({
    title: '',
    description: '',
    type: 'document' as const,
    url: '',
    tags: '',
  });

  // Q&A
  const [qaList, setQaList] = useState<ExpertQnA[]>([]);
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [newQuestionData, setNewQuestionData] = useState({
    question: '',
    subject: '',
    difficulty: 'beginner' as const,
  });

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'study-groups':
          const groups = await forumEnhancementService.getStudyGroups(forumId);
          setStudyGroups(groups);
          break;
        case 'sessions':
          const sessions = await forumEnhancementService.getStudySessions(forumId);
          setStudySessions(sessions);
          break;
        case 'resources':
          const res = await forumEnhancementService.getResources(forumId);
          setResources(res);
          break;
        case 'qa':
          const qa = await forumEnhancementService.getExpertQnA(forumId);
          setQaList(qa);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudyGroup = async () => {
    if (!newGroupData.name || !newGroupData.subject) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await forumEnhancementService.createStudyGroup({
        ...newGroupData,
        forumId,
        createdBy: user?._id || '',
        members: [user?._id || ''],
        topics: [],
      });
      
      Alert.alert('Success', 'Study group created successfully!');
      setShowCreateGroup(false);
      setNewGroupData({
        name: '',
        subject: '',
        maxMembers: 10,
        meetingTime: '18:00',
        meetingDay: 'Monday',
      });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create study group');
    }
  };

  const handleCreateStudySession = async () => {
    if (!newSessionData.title || !newSessionData.description || !newSessionData.startTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await forumEnhancementService.createStudySession({
        ...newSessionData,
        forumId,
        topics: newSessionData.topics.split(',').map(t => t.trim()),
        currentParticipants: 0,
        isLive: false,
      });
      
      Alert.alert('Success', 'Study session created successfully!');
      setShowCreateSession(false);
      setNewSessionData({
        title: '',
        description: '',
        startTime: '',
        duration: 60,
        maxParticipants: 20,
        topics: '',
      });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create study session');
    }
  };

  const handleShareResource = async () => {
    if (!newResourceData.title || !newResourceData.description || !newResourceData.url) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await forumEnhancementService.shareResource({
        ...newResourceData,
        forumId,
        uploadedBy: user?._id || '',
        tags: newResourceData.tags.split(',').map(t => t.trim()),
        downloads: 0,
        rating: 0,
      });
      
      Alert.alert('Success', 'Resource shared successfully!');
      setShowShareResource(false);
      setNewResourceData({
        title: '',
        description: '',
        type: 'document',
        url: '',
        tags: '',
      });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to share resource');
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestionData.question || !newQuestionData.subject) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await forumEnhancementService.askQuestion({
        ...newQuestionData,
        forumId,
        askedBy: user?._id || '',
        status: 'open',
        upvotes: 0,
      });
      
      Alert.alert('Success', 'Question posted successfully!');
      setShowAskQuestion(false);
      setNewQuestionData({
        question: '',
        subject: '',
        difficulty: 'beginner',
      });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to post question');
    }
  };

  const renderStudyGroups = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Study Groups</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateGroup(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      {studyGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>👥</Text>
          <Text style={styles.emptyStateTitle}>No study groups yet</Text>
          <Text style={styles.emptyStateText}>Create the first study group!</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {studyGroups.map((group) => (
            <View key={group._id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{group.name}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {group.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.itemSubtitle}>Subject: {group.subject}</Text>
              <Text style={styles.itemDescription}>
                {group.currentMembers}/{group.maxMembers} members
              </Text>
              
              <View style={styles.itemMeta}>
                <Text style={styles.metaText}>
                  📅 {group.meetingDay} at {group.meetingTime}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => forumEnhancementService.joinStudyGroup(group._id)}
              >
                <Text style={styles.actionButtonText}>Join Group</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderStudySessions = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Study Sessions</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateSession(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Session</Text>
        </TouchableOpacity>
      </View>

      {studySessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📚</Text>
          <Text style={styles.emptyStateTitle}>No study sessions yet</Text>
          <Text style={styles.emptyStateText}>Schedule your first study session!</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {studySessions.map((session) => (
            <View key={session._id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{session.title}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {session.isLive ? '🔴 Live' : '⏰ Scheduled'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.itemDescription}>{session.description}</Text>
              <Text style={styles.itemSubtitle}>
                📅 {new Date(session.startTime).toLocaleString()}
              </Text>
              <Text style={styles.itemSubtitle}>
                ⏱️ {session.duration} minutes • 👥 {session.currentParticipants}/{session.maxParticipants}
              </Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => forumEnhancementService.joinStudySession(session._id)}
              >
                <Text style={styles.actionButtonText}>Join Session</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderResources = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Shared Resources</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowShareResource(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Share Resource</Text>
        </TouchableOpacity>
      </View>

      {resources.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📁</Text>
          <Text style={styles.emptyStateTitle}>No resources shared yet</Text>
          <Text style={styles.emptyStateText}>Be the first to share a resource!</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {resources.map((resource) => (
            <View key={resource._id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{resource.title}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{resource.type}</Text>
                </View>
              </View>
              
              <Text style={styles.itemDescription}>{resource.description}</Text>
              
              <View style={styles.itemMeta}>
                <Text style={styles.metaText}>⭐ {resource.rating}/5</Text>
                <Text style={styles.metaText}>📥 {resource.downloads} downloads</Text>
              </View>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => forumEnhancementService.downloadResource(resource._id)}
              >
                <Text style={styles.actionButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderQnA = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Expert Q&A</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowAskQuestion(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Ask Question</Text>
        </TouchableOpacity>
      </View>

      {qaList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>❓</Text>
          <Text style={styles.emptyStateTitle}>No questions yet</Text>
          <Text style={styles.emptyStateText}>Ask your first question!</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {qaList.map((qa) => (
            <View key={qa._id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{qa.question}</Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{qa.difficulty}</Text>
                </View>
              </View>
              
              <Text style={styles.itemSubtitle}>Subject: {qa.subject}</Text>
              <Text style={styles.itemSubtitle}>Status: {qa.status}</Text>
              
              {qa.answer && (
                <Text style={styles.itemDescription}>Answer: {qa.answer}</Text>
              )}
              
              <View style={styles.itemMeta}>
                <Text style={styles.metaText}>👍 {qa.upvotes} upvotes</Text>
                <Text style={styles.metaText}>
                  📅 {new Date(qa.createdAt).toLocaleDateString()}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => forumEnhancementService.upvoteQuestion(qa._id)}
              >
                <Text style={styles.actionButtonText}>Upvote</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderReminders = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Study Reminders</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {/* TODO: Implement reminder creation */}}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Set Reminder</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>⏰</Text>
        <Text style={styles.emptyStateTitle}>No reminders set</Text>
        <Text style={styles.emptyStateText}>Set study reminders to stay on track!</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forum Features</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'study-groups', label: 'Study Groups', icon: '👥' },
            { key: 'sessions', label: 'Sessions', icon: '📚' },
            { key: 'resources', label: 'Resources', icon: '📁' },
            { key: 'qa', label: 'Q&A', icon: '❓' },
            { key: 'reminders', label: 'Reminders', icon: '⏰' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'study-groups' && renderStudyGroups()}
            {activeTab === 'sessions' && renderStudySessions()}
            {activeTab === 'resources' && renderResources()}
            {activeTab === 'qa' && renderQnA()}
            {activeTab === 'reminders' && renderReminders()}
          </>
        )}

        {/* Create Study Group Modal */}
        <Modal visible={showCreateGroup} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Study Group</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Group Name"
                value={newGroupData.name}
                onChangeText={(text) => setNewGroupData({...newGroupData, name: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Subject"
                value={newGroupData.subject}
                onChangeText={(text) => setNewGroupData({...newGroupData, subject: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Max Members"
                value={newGroupData.maxMembers.toString()}
                onChangeText={(text) => setNewGroupData({...newGroupData, maxMembers: parseInt(text) || 10})}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Meeting Time (HH:MM)"
                value={newGroupData.meetingTime}
                onChangeText={(text) => setNewGroupData({...newGroupData, meetingTime: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Meeting Day"
                value={newGroupData.meetingDay}
                onChangeText={(text) => setNewGroupData({...newGroupData, meetingDay: text})}
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateGroup(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleCreateStudyGroup}
                >
                  <Text style={styles.createButtonText}>Create Group</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Create Study Session Modal */}
        <Modal visible={showCreateSession} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Study Session</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Session Title"
                value={newSessionData.title}
                onChangeText={(text) => setNewSessionData({...newSessionData, title: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={newSessionData.description}
                onChangeText={(text) => setNewSessionData({...newSessionData, description: text})}
                multiline
              />
              
              <TextInput
                style={styles.input}
                placeholder="Start Time (ISO string)"
                value={newSessionData.startTime}
                onChangeText={(text) => setNewSessionData({...newSessionData, startTime: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Duration (minutes)"
                value={newSessionData.duration.toString()}
                onChangeText={(text) => setNewSessionData({...newSessionData, duration: parseInt(text) || 60})}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Max Participants"
                value={newSessionData.maxParticipants.toString()}
                onChangeText={(text) => setNewSessionData({...newSessionData, maxParticipants: parseInt(text) || 20})}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Topics (comma-separated)"
                value={newSessionData.topics}
                onChangeText={(text) => setNewSessionData({...newSessionData, topics: text})}
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateSession(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleCreateStudySession}
                >
                  <Text style={styles.createButtonText}>Create Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Share Resource Modal */}
        <Modal visible={showShareResource} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Share Resource</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Resource Title"
                value={newResourceData.title}
                onChangeText={(text) => setNewResourceData({...newResourceData, title: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={newResourceData.description}
                onChangeText={(text) => setNewResourceData({...newResourceData, description: text})}
                multiline
              />
              
              <TextInput
                style={styles.input}
                placeholder="Resource URL"
                value={newResourceData.url}
                onChangeText={(text) => setNewResourceData({...newResourceData, url: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Tags (comma-separated)"
                value={newResourceData.tags}
                onChangeText={(text) => setNewResourceData({...newResourceData, tags: text})}
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowShareResource(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleShareResource}
                >
                  <Text style={styles.createButtonText}>Share Resource</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Ask Question Modal */}
        <Modal visible={showAskQuestion} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ask Question</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Your Question"
                value={newQuestionData.question}
                onChangeText={(text) => setNewQuestionData({...newQuestionData, question: text})}
                multiline
              />
              
              <TextInput
                style={styles.input}
                placeholder="Subject"
                value={newQuestionData.subject}
                onChangeText={(text) => setNewQuestionData({...newQuestionData, subject: text})}
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAskQuestion(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleAskQuestion}
                >
                  <Text style={styles.createButtonText}>Ask Question</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.primary + '20',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  createButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: borderRadius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  difficultyBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default ForumFeatures; 