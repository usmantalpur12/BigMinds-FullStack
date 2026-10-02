import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../../theme/teacherTheme';

type TeacherCheckboxProps = {
  label: string;
  helperText?: string;
  value: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export const TeacherCheckbox: React.FC<TeacherCheckboxProps> = ({
  label,
  helperText,
  value,
  onChange,
  disabled,
}) => {
  const {
    theme: { semantic, spacing, radius, typography, text },
  } = useTeacherTheme();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        opacity: disabled ? 0.6 : 1,
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: radius.sm,
          borderWidth: 2,
          borderColor: value ? semantic.primary.default : text.muted,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
          backgroundColor: value ? semantic.primary.default : 'transparent',
        }}
      >
        {value ? <Ionicons name="checkmark" size={14} color={semantic.primary.contrastText} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.medium,
            color: text.primary,
            fontSize: typography.sizes.md,
          }}
        >
          {label}
        </Text>
        {helperText ? (
          <Text
            style={{
              fontFamily: typography.fontFamily.regular,
              color: text.secondary,
              fontSize: typography.sizes.sm,
              marginTop: spacing.micro,
            }}
          >
            {helperText}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

