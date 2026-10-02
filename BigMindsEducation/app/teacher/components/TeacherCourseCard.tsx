import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../../theme/teacherTheme';

export type TeacherCourseCardProps = {
  course: any;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onViewAssignments?: (id: string) => void;
  pendingDelete?: boolean;
};

export const TeacherCourseCard: React.FC<TeacherCourseCardProps> = ({
  course,
  onView,
  onEdit,
  onDelete,
  onViewAssignments,
  pendingDelete,
}) => {
  const {
    theme: { surface, spacing, radius, text, semantic, typography },
  } = useTeacherTheme();

  const formatPrice = (price: number) => (price === 0 ? 'Free' : `Rs. ${price.toLocaleString()}`);

  return (
    <View
      style={{
        backgroundColor: surface.default,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: surface.border,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onView(course._id)}
        style={{ padding: spacing.lg, gap: spacing.md }}
        accessibilityRole="button"
        accessibilityLabel={`View ${course.title}`}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text
              style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.sizes.lg,
                color: text.primary,
              }}
              numberOfLines={2}
            >
              {course.title}
            </Text>
            <Text
              style={{
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.sizes.sm,
                color: text.secondary,
                lineHeight: 20,
              }}
              numberOfLines={3}
            >
              {course.description || 'No description provided.'}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.micro,
              borderRadius: radius.sm,
              backgroundColor: course.isPublished ? semantic.success.default : semantic.warning.default,
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.sizes.xs,
                color: '#fff',
              }}
            >
              {course.isPublished ? 'Published' : 'Draft'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <Meta icon="folder" label={course.category} />
          <Meta icon="trending-up" label={course.level} />
          <Meta icon="cash" label={formatPrice(course.price)} />
          <Meta icon="people" label={`${course.enrolledCount ?? course.totalStudents ?? 0} enrolled`} />
          <Meta icon="checkmark-circle" label={`${course.completedCount ?? 0} completed`} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: surface.border,
            paddingTop: spacing.md,
          }}
        >
          <Stat label="Lessons" value={course.lessons?.length || 0} />
          <Stat label="Duration" value={`${course.estimatedDuration || 0}h`} />
          <Stat label="Rating" value={course.rating != null ? String(course.rating) : '—'} />
        </View>
      </TouchableOpacity>

      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: surface.border,
        }}
      >
        <ActionButton icon="eye" label="View" onPress={() => onView(course._id)} />
        <ActionButton icon="create" label="Edit" onPress={() => onEdit(course._id)} />
        {onViewAssignments && (
          <ActionButton
            icon="document-text"
            label="Assignments"
            onPress={() => onViewAssignments(course._id)}
          />
        )}
        <ActionButton
          icon="trash"
          label={pendingDelete ? 'Deleting...' : 'Delete'}
          onPress={() => onDelete(course._id, course.title)}
          loading={pendingDelete}
          variant="danger"
          isLast
        />
      </View>
    </View>
  );
};

const Meta = ({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) => {
  const {
    theme: { text, spacing, typography },
  } = useTeacherTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.micro }}>
      <Ionicons name={icon} size={14} color={text.secondary} />
      <Text
        style={{
          fontFamily: typography.fontFamily.medium,
          fontSize: typography.sizes.sm,
          color: text.secondary,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const Stat = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => {
  const {
    theme: { text, typography },
  } = useTeacherTheme();
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text
        style={{
          fontFamily: typography.fontFamily.semibold,
          fontSize: typography.sizes.lg,
          color: text.primary,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: typography.fontFamily.regular,
          fontSize: typography.sizes.xs,
          color: text.secondary,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const ActionButton = ({
  icon,
  label,
  onPress,
  loading,
  variant = 'default',
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'default' | 'danger';
  isLast?: boolean;
}) => {
  const {
    theme: { semantic, text, spacing, typography, surface },
  } = useTeacherTheme();
  const color = variant === 'danger' ? semantic.error.default : semantic.primary.default;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.micro,
        paddingVertical: spacing.md,
        borderRightWidth: isLast ? 0 : 1,
        borderRightColor: surface.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          <Ionicons name={icon} size={16} color={color} />
          <Text
            style={{
              fontFamily: typography.fontFamily.medium,
              fontSize: typography.sizes.sm,
              color,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

