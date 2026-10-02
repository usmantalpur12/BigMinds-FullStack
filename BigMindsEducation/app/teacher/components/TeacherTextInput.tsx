import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  TouchableOpacity,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../../theme/teacherTheme';

export type TeacherTextInputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  isRequired?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
};

export const TeacherTextInput: React.FC<TeacherTextInputProps> = ({
  label,
  helperText,
  errorText,
  isRequired,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  multiline,
  style,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const {
    theme: { spacing, radius, typography, text, semantic, outline },
  } = useTeacherTheme();

  const borderColor = errorText
    ? semantic.error.default
    : focused
      ? semantic.primary.default
      : outline;

  return (
    <View style={[{ width: '100%', marginBottom: spacing.md }, containerStyle]}>
      {label ? (
        <Text
          style={{
            marginBottom: spacing.xs,
            fontFamily: typography.fontFamily.semibold,
            color: text.primary,
          }}
        >
          {label} {isRequired ? '*' : ''}
        </Text>
      ) : null}
      <View
        style={{
          minHeight: multiline ? 96 : 56,
          borderWidth: 1,
          borderColor,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: spacing.sm,
          backgroundColor: 'rgba(255,255,255,0.95)',
        }}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={20}
            color={errorText ? semantic.error.default : text.secondary}
            style={{ marginTop: multiline ? spacing.xs : 0 }}
          />
        ) : null}
        <TextInput
          {...rest}
          multiline={multiline}
          style={[
            {
              flex: 1,
              fontFamily: typography.fontFamily.medium,
              fontSize: typography.sizes.md,
              color: '#111827', // Always use dark text for inputs
              minHeight: multiline ? 80 : undefined,
              paddingTop: multiline ? spacing.xs : 0,
            },
            style as TextStyle,
          ]}
          placeholderTextColor={text.muted || '#9CA3AF'}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
        />
        {rightIcon ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={{ marginTop: multiline ? spacing.xs : 0 }}
            accessibilityRole="button"
            accessibilityLabel={`${label || rest.placeholder || 'input'} right action`}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={errorText ? semantic.error.default : text.secondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {errorText ? (
        <Text
          style={{
            marginTop: spacing.xs,
            color: semantic.error.default,
            fontFamily: typography.fontFamily.medium,
            fontSize: typography.sizes.sm,
          }}
          accessibilityLiveRegion="polite"
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text
          style={{
            marginTop: spacing.xs,
            color: text.secondary,
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.sizes.sm,
          }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

