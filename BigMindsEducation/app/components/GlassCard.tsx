import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { glassmorphism, spacing, borderRadius } from '../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'light' | 'medium' | 'dark';
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  variant = 'light',
  padding = spacing.md 
}) => {
  const glassStyle = variant === 'light' 
    ? glassmorphism.light 
    : variant === 'medium' 
    ? glassmorphism.medium 
    : glassmorphism.dark;

  return (
    <View style={[
      glassStyle,
      { padding },
      style
    ]}>
      {children}
    </View>
  );
};

