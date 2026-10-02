// Modern Design System with Glassmorphism for BigMinds Education App
// Clean, professional, and consistent design with modern effects

export const colors = {
  // Primary brand color - Used for buttons, links, and important actions
  primary: '#2563EB', // Beautiful blue
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  
  // Accent colors
  accent: '#8B5CF6', // Purple accent
  accentLight: '#A78BFA',
  
  // Background colors
  background: '#F0F4F8', // Light gray-blue background
  backgroundDark: '#E2E8F0',
  surface: '#FFFFFF', // White for cards and content areas
  surfaceLight: '#FAFBFC',
  
  // Text colors
  textPrimary: '#0F172A', // Dark slate for main text
  textSecondary: '#64748B', // Medium gray for secondary text
  textLight: '#94A3B8', // Light gray for captions
  textWhite: '#FFFFFF',
  
  // Status colors
  success: '#10B981', // Green for success states
  successLight: '#34D399',
  warning: '#F59E0B', // Orange for warnings
  warningLight: '#FBBF24',
  error: '#EF4444', // Red for errors
  errorLight: '#F87171',
  info: '#3B82F6', // Blue for info
  infoLight: '#60A5FA',
  
  // Border and divider colors
  border: '#E2E8F0', // Light gray for borders
  borderLight: '#F1F5F9', // Very light gray for dividers
  divider: '#F1F5F9', // Very light gray for dividers
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Disabled state
  disabled: '#CBD5E1',
  disabledText: '#94A3B8',
  
  // Glassmorphism colors
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  glassBackgroundDark: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
};

// Typography styles
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textLight,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textWhite,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 20,
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Modern Shadows with depth
export const shadows = {
  xs: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Glassmorphism styles
export const glassmorphism = {
  light: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    // Backdrop blur effect (works on iOS, Android uses elevation)
    overflow: 'hidden' as const,
  },
  medium: {
    backgroundColor: colors.glassBackgroundDark,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden' as const,
  },
  dark: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden' as const,
  },
};

// Gradient colors for modern effects
export const gradients = {
  primary: ['#2563EB', '#3B82F6', '#60A5FA'],
  success: ['#10B981', '#34D399'],
  warning: ['#F59E0B', '#FBBF24'],
  error: ['#EF4444', '#F87171'],
  accent: ['#8B5CF6', '#A78BFA'],
  purple: ['#6366F1', '#8B5CF6'],
  blue: ['#3B82F6', '#60A5FA'],
  teal: ['#14B8A6', '#2DD4BF'],
};

// Card styles
export const cardStyles = {
  default: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  glass: {
    ...glassmorphism.light,
    padding: spacing.md,
  },
  elevated: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.lg,
    borderWidth: 0,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.sm,
  },
};

// Button styles
export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  primaryText: {
    ...typography.button,
    color: colors.textWhite,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  secondaryText: {
    ...typography.button,
    color: colors.primary,
  },
  glass: {
    ...glassmorphism.medium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  glassText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  outlineText: {
    ...typography.button,
    color: colors.textPrimary,
  },
};

// Input styles
export const inputStyles = {
  default: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...typography.body,
    color: colors.textPrimary,
    ...shadows.xs,
  },
  focused: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    ...typography.body,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  glass: {
    ...glassmorphism.light,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
};

// Responsive design utilities
export const responsive = {
  // Screen breakpoints
  isSmallDevice: (width: number) => width < 375,
  isMediumDevice: (width: number) => width >= 375 && width < 414,
  isLargeDevice: (width: number) => width >= 414,
  
  // Responsive spacing
  getSpacing: (baseSpacing: number, width: number) => {
    if (width < 375) return baseSpacing * 0.8; // Small devices
    if (width >= 414) return baseSpacing * 1.2; // Large devices
    return baseSpacing; // Medium devices
  },
  
  // Responsive font sizes
  getFontSize: (baseSize: number, width: number) => {
    if (width < 375) return baseSize * 0.9; // Small devices
    if (width >= 414) return baseSize * 1.1; // Large devices
    return baseSize; // Medium devices
  },
  
  // Responsive padding
  getPadding: (basePadding: number, width: number) => {
    if (width < 375) return basePadding * 0.7; // Small devices
    if (width >= 414) return basePadding * 1.3; // Large devices
    return basePadding; // Medium devices
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  glassmorphism,
  gradients,
  cardStyles,
  buttonStyles,
  inputStyles,
  responsive,
};
