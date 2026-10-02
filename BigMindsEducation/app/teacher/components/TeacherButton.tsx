import React from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  PressableProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../../theme/teacherTheme';

type TeacherButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export type TeacherButtonProps = PressableProps & {
  title: string;
  variant?: TeacherButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  hitSlopSize?: number;
  rightAccessory?: React.ReactNode;
  leftAccessory?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

const MIN_TOUCH_SIZE = 48;

export const TeacherButton: React.FC<TeacherButtonProps> = ({
  title,
  variant = 'primary',
  icon,
  loading,
  disabled,
  fullWidth = true,
  hitSlopSize = 12,
  style,
  rightAccessory,
  leftAccessory,
  ...rest
}) => {
  const {
    theme: { semantic, radius, spacing, typography, text },
  } = useTeacherTheme();

  const variants = {
    primary: {
      backgroundColor: disabled ? semantic.primary.disabled : semantic.primary.default,
      textColor: text.inverse,
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: disabled ? semantic.secondary.disabled : semantic.secondary.default,
      textColor: text.inverse,
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: disabled ? text.disabled : semantic.primary.default,
      borderColor: disabled ? text.disabled : semantic.primary.default,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: disabled ? text.disabled : text.primary,
      borderColor: 'transparent',
    },
  } satisfies Record<TeacherButtonVariant, { backgroundColor: string; textColor: string; borderColor: string }>;

  const variantStyles = variants[variant];

  const pressColorMap: Record<TeacherButtonVariant, string | undefined> = {
    primary: semantic.primary.pressed,
    secondary: semantic.secondary.pressed,
    outline: semantic.primary.pressed,
    ghost: undefined,
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      hitSlop={{ top: hitSlopSize, bottom: hitSlopSize, left: hitSlopSize, right: hitSlopSize }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: MIN_TOUCH_SIZE,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: pressed && !disabled && pressColorMap[variant]
            ? pressColorMap[variant]
            : variantStyles.backgroundColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: variantStyles.borderColor,
          opacity: disabled ? 0.6 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      <>
        {leftAccessory}
        {icon && !loading ? (
          <Ionicons
            name={icon}
            size={20}
            color={variantStyles.textColor}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={variantStyles.textColor} />
        ) : (
          <Text
            style={{
              fontFamily: typography.fontFamily.semibold,
              fontSize: typography.sizes.md,
              color: variantStyles.textColor,
            }}
          >
            {title}
          </Text>
        )}
        {rightAccessory}
      </>
    </Pressable>
  );
};

