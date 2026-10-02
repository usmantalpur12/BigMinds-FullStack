import React from 'react';
import { View, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { cardStyles, spacing } from '../theme/colors';

interface ModernCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined';
  onPress?: () => void;
  padding?: number;
}

export const ModernCard: React.FC<ModernCardProps> = ({ 
  children, 
  style, 
  variant = 'default',
  onPress,
  padding = spacing.md,
  ...props
}) => {
  const cardStyle = variant === 'default' 
    ? cardStyles.default 
    : variant === 'glass' 
    ? cardStyles.glass 
    : variant === 'elevated' 
    ? cardStyles.elevated 
    : cardStyles.outlined;

  const content = (
    <View style={[
      cardStyle,
      { padding },
      style
    ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={onPress}
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

