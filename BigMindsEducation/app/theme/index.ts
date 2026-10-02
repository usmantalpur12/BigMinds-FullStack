// Theme configuration for BigMinds Education App
// Modern, professional design system

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Custom color palette
export const colors = {
  // Primary colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // Secondary colors
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  // Accent colors
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  // Success colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // Warning colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // Error colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  // Glass morphism colors
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.1)',
    blur: 'rgba(255, 255, 255, 0.05)',
  }
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[600],
    primaryContainer: colors.primary[100],
    secondary: colors.secondary[600],
    secondaryContainer: colors.secondary[100],
    tertiary: colors.accent[600],
    tertiaryContainer: colors.accent[100],
    surface: colors.neutral[50],
    surfaceVariant: colors.neutral[100],
    background: colors.neutral[50],
    error: colors.error[600],
    errorContainer: colors.error[100],
    onPrimary: colors.neutral[50],
    onPrimaryContainer: colors.primary[900],
    onSecondary: colors.neutral[50],
    onSecondaryContainer: colors.secondary[900],
    onTertiary: colors.neutral[50],
    onTertiaryContainer: colors.accent[900],
    onSurface: colors.neutral[900],
    onSurfaceVariant: colors.neutral[700],
    onBackground: colors.neutral[900],
    onError: colors.neutral[50],
    onErrorContainer: colors.error[900],
    outline: colors.neutral[300],
    outlineVariant: colors.neutral[200],
    shadow: colors.neutral[900],
    scrim: colors.neutral[900],
    inverseSurface: colors.neutral[900],
    inverseOnSurface: colors.neutral[50],
    inversePrimary: colors.primary[100],
    elevation: {
      level0: 'transparent',
      level1: colors.neutral[50],
      level2: colors.neutral[100],
      level3: colors.neutral[200],
      level4: colors.neutral[300],
      level5: colors.neutral[400],
    },
  },
  roundness: 12,
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary[400],
    primaryContainer: colors.primary[900],
    secondary: colors.secondary[400],
    secondaryContainer: colors.secondary[900],
    tertiary: colors.accent[400],
    tertiaryContainer: colors.accent[900],
    surface: colors.neutral[900],
    surfaceVariant: colors.neutral[800],
    background: colors.neutral[900],
    error: colors.error[400],
    errorContainer: colors.error[900],
    onPrimary: colors.neutral[900],
    onPrimaryContainer: colors.primary[100],
    onSecondary: colors.neutral[900],
    onSecondaryContainer: colors.secondary[100],
    onTertiary: colors.neutral[900],
    onTertiaryContainer: colors.accent[100],
    onSurface: colors.neutral[50],
    onSurfaceVariant: colors.neutral[300],
    onBackground: colors.neutral[50],
    onError: colors.neutral[900],
    onErrorContainer: colors.error[100],
    outline: colors.neutral[600],
    outlineVariant: colors.neutral[700],
    shadow: colors.neutral[900],
    scrim: colors.neutral[900],
    inverseSurface: colors.neutral[50],
    inverseOnSurface: colors.neutral[900],
    inversePrimary: colors.primary[900],
    elevation: {
      level0: 'transparent',
      level1: colors.neutral[900],
      level2: colors.neutral[800],
      level3: colors.neutral[700],
      level4: colors.neutral[600],
      level5: colors.neutral[500],
    },
  },
  roundness: 12,
};

// Typography styles
export const typography = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400',
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400',
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400',
    letterSpacing: 0,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400',
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400',
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400',
    letterSpacing: 0,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Shadows
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
};

// Animation configurations
export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export default {
  colors,
  lightTheme,
  darkTheme,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
}; 