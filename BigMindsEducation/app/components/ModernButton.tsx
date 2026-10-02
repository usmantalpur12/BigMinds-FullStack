import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buttonStyles, colors, spacing, borderRadius } from '../theme/colors';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'glass' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const buttonStyle = variant === 'primary' 
    ? buttonStyles.primary 
    : variant === 'secondary' 
    ? buttonStyles.secondary 
    : variant === 'glass' 
    ? buttonStyles.glass 
    : buttonStyles.outline;

  const textStyleObj = variant === 'primary' 
    ? buttonStyles.primaryText 
    : variant === 'secondary' 
    ? buttonStyles.secondaryText 
    : variant === 'glass' 
    ? buttonStyles.glassText 
    : buttonStyles.outlineText;

  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        fullWidth && { width: '100%' },
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? colors.textWhite : colors.primary} 
          size="small" 
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={variant === 'primary' ? colors.textWhite : colors.primary}
              style={styles.iconLeft}
            />
          )}
          <Text style={[textStyleObj, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={variant === 'primary' ? colors.textWhite : colors.primary}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

