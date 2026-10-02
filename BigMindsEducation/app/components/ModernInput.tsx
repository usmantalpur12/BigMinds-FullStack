import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { inputStyles, colors, spacing, borderRadius } from '../theme/colors';

interface ModernInputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: 'default' | 'glass';
  containerStyle?: ViewStyle;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  variant = 'default',
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputStyle = variant === 'glass' 
    ? inputStyles.glass 
    : isFocused 
    ? inputStyles.focused 
    : inputStyles.default;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={[inputStyle, style]}
        placeholderTextColor={colors.textLight}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

