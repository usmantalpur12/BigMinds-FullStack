import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { forumService } from '../services/forumService';
import { useAuth } from '../context/AuthContext';
import {
  TeacherButton,
  TeacherSkeleton,
  showTeacherToast,
} from './components';
import { useTeacherTheme } from '../theme/teacherTheme';

const { width } = Dimensions.get('window');

export default function MyForumsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = (user as any)?._id || (user as any)?.id || null;
  const {
    theme: { spacing, background, text, typography, surface, radius, semantic },
  } = useTeacherTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forums, setForums] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadForums = useCallback(
    async (withLoader = true) => {
      if (!userId) {
        setForums([]);
        setLoading(false);
        return;
      }
      try {
        if (withLoader) setLoading(true);
        const myForums = await forumService.getMyForums();
        setForums(Array.isArray(myForums) ? myForums : []);
      } catch (error) {
        console.error('Error loading forums:', error);
        showTeacherToast({ type: 'error', title: 'Unable to load forums' });
      } finally {
        if (withLoader) setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  // Reload whenever this screen comes into focus (e.g. after create/edit)
  useFocusEffect(
    useCallback(() => {
      loadForums();
    }, [loadForums])
  );

  const handleCreate = () => {
    router.push('/teacher/create-forum' as any);
  };

  const handleView = (forumId: string) => {
    if (!forumId) return;
    router.push(`/forum-detail/${forumId}` as any);
  };

  const handleEdit = (forumId: string) => {
    router.push({ pathname: '/teacher/create-forum', params: { forumId } } as any);
  };

  const handleDelete = (forumId: string, title: string) => {
    Alert.alert(
      'Delete Forum',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistic update
            const snapshot = forums;
            setForums((prev) => prev.filter((f) => f._id !== forumId));
            setDeletingId(forumId);
            try {
              await forumService.deleteForum(forumId);
              showTeacherToast({ type: 'success', title: 'Forum deleted' });
            } catch (error: any) {
              // Rollback on failure
              setForums(snapshot);
              showTeacherToast({
                type: 'error',
                title: 'Delete failed',
                message: error?.message || 'Please try again.',
              });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderSkeletons = () =>
    Array.from({ length: 3 }).map((_, i) => (
      <View
        key={i}
        style={{
          backgroundColor: surface.default,
          borderRadius: radius.xl,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: surface.border,
          marginBottom: spacing.md,
          gap: spacing.xs,
        }}
      >
        <TeacherSkeleton height={20} width="70%" />
        <TeacherSkeleton height={14} width="50%" />
        <TeacherSkeleton height={14} width="40%" />
        <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
          <TeacherSkeleton height={36} width={80} />
          <TeacherSkeleton height={36} width={60} />
          <TeacherSkeleton height={36} width={50} />
        </View>
      </View>
    ));

  return (
    <View style={{ flex: 1, backgroundColor: background.default }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
          backgroundColor: semantic.primary.default,
          borderBottomLeftRadius: radius.xl,
          borderBottomRightRadius: radius.xl,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: 28,
              color: '#FFFFFF',
              letterSpacing: 0.5,
            }}
          >
            My Forums
          </Text>
          <Text
            style={{
              marginTop: spacing.xs,
              fontFamily: typography.fontFamily.medium,
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 14,
            }}
          >
            {forums.length} total forum{forums.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ width: 130 }}>
          <TeacherButton 
            title="Create" 
            icon="add" 
            onPress={handleCreate} 
            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadForums(false);
            }}
          />
        }
      >
        {loading ? (
          renderSkeletons()
        ) : forums.length === 0 ? (
          <View
            style={{
              backgroundColor: surface.default,
              borderRadius: radius.xl,
              padding: spacing.xl,
              borderWidth: 1,
              borderColor: surface.border,
              alignItems: 'center',
              gap: spacing.md,
              marginTop: spacing.xl,
            }}
          >
            <Ionicons name="chatbubbles-outline" size={64} color={text.muted} />
            <Text
              style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: 20,
                color: text.primary,
              }}
            >
              No forums yet
            </Text>
            <Text
              style={{
                fontFamily: typography.fontFamily.regular,
                fontSize: 14,
                color: text.secondary,
                textAlign: 'center',
              }}
            >
              Create your first forum to start engaging with your students.
            </Text>
            <View style={{ width: '80%' }}>
              <TeacherButton title="Create Forum" icon="chatbubbles" onPress={handleCreate} />
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {forums.map((forum) => (
              <View key={forum._id} style={{ width: '100%', marginBottom: spacing.xs }}>
                <ForumCard
                  forum={forum}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  deleting={deletingId === forum._id}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Forum Card Component
// ─────────────────────────────────────────────

type ForumCardProps = {
  forum: any;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  deleting: boolean;
};

const ForumCard: React.FC<ForumCardProps> = ({ forum, onView, onEdit, onDelete, deleting }) => {
  const {
    theme: { spacing, surface, radius, text, typography, semantic },
  } = useTeacherTheme();

  const memberCount = forum.memberCount || forum.members || 0;
  const postCount = forum.messageCount || forum.postCount || forum.topicCount || 0;
  const isPublic = forum.isPublic ?? !forum.isPrivate;

  return (
    <View
      style={{
        backgroundColor: surface.default,
        borderRadius: radius.xl,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: surface.border,
        gap: spacing.xs,
        opacity: deleting ? 0.5 : 1,
      }}
    >
      {/* Title */}
      <Text
        style={{
          fontFamily: typography.fontFamily.semibold,
          fontSize: typography.sizes.md,
          color: text.primary,
        }}
        numberOfLines={2}
      >
        {forum.title || forum.name || 'Untitled Forum'}
      </Text>

      {/* Category */}
      {(forum.category) && (
        <Text
          style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.sizes.xs,
            color: text.secondary,
          }}
          numberOfLines={1}
        >
          {forum.category}
        </Text>
      )}

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="people-outline" size={13} color={text.muted} />
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: 12, color: text.secondary }}>
            {memberCount} members
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="chatbubble-outline" size={13} color={text.muted} />
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: 12, color: text.secondary }}>
            {postCount} posts
          </Text>
        </View>
      </View>

      {/* Public/Private badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: isPublic ? '#F0FDF4' : '#FFFBEB',
          alignSelf: 'flex-start',
          borderRadius: radius.sm,
          paddingHorizontal: spacing.xs,
          paddingVertical: 2,
          marginTop: spacing.xs,
        }}
      >
        <Ionicons
          name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
          size={11}
          color={isPublic ? semantic.success.default : semantic.warning.default}
        />
        <Text
          style={{
            fontFamily: typography.fontFamily.medium,
            fontSize: 11,
            color: isPublic ? semantic.success.default : semantic.warning.default,
          }}
        >
          {isPublic ? 'Public' : 'Private'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
        <TouchableOpacity
          onPress={() => onView(forum._id)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: spacing.xs + 2,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: surface.border,
            backgroundColor: surface.muted,
          }}
        >
          <Ionicons name="eye-outline" size={15} color={text.secondary} />
          <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: 13, color: text.secondary }}>
            View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onEdit(forum._id)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: spacing.xs + 2,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: '#2563EB22',
            backgroundColor: '#EFF6FF',
          }}
        >
          <Ionicons name="create-outline" size={15} color="#2563EB" />
          <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: 13, color: '#2563EB' }}>
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !deleting && onDelete(forum._id, forum.title || forum.name)}
          disabled={deleting}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: spacing.xs + 2,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: '#EF444422',
            backgroundColor: '#FEF2F2',
          }}
        >
          <Ionicons name={deleting ? 'hourglass-outline' : 'trash-outline'} size={15} color="#EF4444" />
          <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: 13, color: '#EF4444' }}>
            {deleting ? '...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
