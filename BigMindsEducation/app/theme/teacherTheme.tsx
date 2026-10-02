import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { TeacherToast } from '../teacher/components/TeacherToast';

type TeacherThemeMode = 'light' | 'dark';

type SemanticColorSet = {
  default: string;
  hover: string;
  pressed: string;
  disabled: string;
  contrastText: string;
};

type SurfaceColorSet = {
  default: string;
  elevated: string;
  border: string;
  muted: string;
};

type TextColorSet = {
  primary: string;
  secondary: string;
  muted: string;
  inverse: string;
  disabled: string;
};

export type TeacherTypography = {
  fontFamily: {
    bold: string;
    semibold: string;
    medium: string;
    regular: string;
  };
  sizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
  };
  lineHeights: {
    tight: number;
    compact: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
};

export type TeacherSpacingScale = {
  nano: number;
  micro: number;
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
};

export type TeacherRadiusScale = {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
};

export type TeacherTheme = {
  mode: TeacherThemeMode;
  semantic: {
    primary: SemanticColorSet;
    secondary: SemanticColorSet;
    error: SemanticColorSet;
    success: SemanticColorSet;
    warning: SemanticColorSet;
  };
  surface: SurfaceColorSet;
  background: SurfaceColorSet;
  text: TextColorSet;
  focus: string;
  outline: string;
  typography: TeacherTypography;
  spacing: TeacherSpacingScale;
  radius: TeacherRadiusScale;
  elevation: {
    level1: number;
    level2: number;
    level3: number;
  };
};

const basePalette = {
  primary: '#2563EB',
  primaryHover: '#3B82F6',
  primaryPressed: '#1D4ED8',
  primaryDisabled: '#94A3B8',
  secondary: '#10B981',
  secondaryHover: '#34D399',
  secondaryPressed: '#047857',
  secondaryDisabled: '#A7F3D0',
  error: '#EF4444',
  errorHover: '#F87171',
  errorPressed: '#B91C1C',
  errorDisabled: '#FECACA',
  success: '#10B981',
  warning: '#F59E0B',
  background: '#F0F4F8',
  surface: '#FFFFFF',
  surfaceMuted: '#FAFBFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  darkBackground: '#0F172A',
  darkSurface: '#1E1B4B',
  darkSurfaceElevated: '#312E81',
};

const typography: TeacherTypography = {
  fontFamily: {
    bold: 'Inter-Bold',
    semibold: 'Inter-SemiBold',
    medium: 'Inter-Medium',
    regular: 'Inter-Regular',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeights: {
    tight: 1.1,
    compact: 1.25,
    normal: 1.4,
    relaxed: 1.6,
  },
  letterSpacing: {
    tight: -0.2,
    normal: 0,
    wide: 0.8,
  },
};

const spacing: TeacherSpacingScale = {
  nano: 2,
  micro: 4,
  xxs: 6,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

const radius: TeacherRadiusScale = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

const createSemanticSet = (
  defaultColor: string,
  hover: string,
  pressed: string,
  disabled: string,
  contrastText = '#FFFFFF'
): SemanticColorSet => ({
  default: defaultColor,
  hover,
  pressed,
  disabled,
  contrastText,
});

const lightTheme: TeacherTheme = {
  mode: 'light',
  semantic: {
    primary: createSemanticSet(
      basePalette.primary,
      basePalette.primaryHover,
      basePalette.primaryPressed,
      basePalette.primaryDisabled
    ),
    secondary: createSemanticSet(
      basePalette.secondary,
      basePalette.secondaryHover,
      basePalette.secondaryPressed,
      basePalette.secondaryDisabled
    ),
    error: createSemanticSet(
      basePalette.error,
      basePalette.errorHover,
      basePalette.errorPressed,
      basePalette.errorDisabled
    ),
    success: createSemanticSet(
      basePalette.success,
      '#16A34A',
      '#15803D',
      '#DCFCE7'
    ),
    warning: createSemanticSet(
      basePalette.warning,
      '#D97706',
      '#B45309',
      '#FDE68A',
      '#111827'
    ),
  },
  surface: {
    default: basePalette.surface,
    elevated: '#F8FAFC',
    border: basePalette.border,
    muted: basePalette.surfaceMuted,
  },
  background: {
    default: basePalette.background,
    elevated: '#FFFFFF',
    border: basePalette.border,
    muted: '#E5E7EB',
  },
  text: {
    primary: basePalette.textPrimary,
    secondary: basePalette.textSecondary,
    muted: basePalette.textMuted,
    inverse: '#F8FAFC',
    disabled: '#D1D5DB',
  },
  focus: '#A5B4FC',
  outline: '#D1D5DB',
  typography,
  spacing,
  radius,
  elevation: {
    level1: 2,
    level2: 4,
    level3: 8,
  },
};

const darkTheme: TeacherTheme = {
  mode: 'dark',
  semantic: {
    primary: createSemanticSet(
      '#818CF8',
      '#A5B4FC',
      '#6366F1',
      '#312E81'
    ),
    secondary: createSemanticSet(
      '#34D399',
      '#6EE7B7',
      '#10B981',
      '#064E3B'
    ),
    error: createSemanticSet('#FCA5A5', '#F87171', '#EF4444', '#7F1D1D'),
    success: createSemanticSet('#86EFAC', '#4ADE80', '#22C55E', '#064E3B'),
    warning: createSemanticSet('#FDBA74', '#FB923C', '#F97316', '#78350F', '#0F172A'),
  },
  surface: {
    default: basePalette.darkSurface,
    elevated: basePalette.darkSurfaceElevated,
    border: '#4338CA',
    muted: '#1E1B4B',
  },
  background: {
    default: basePalette.darkBackground,
    elevated: basePalette.darkSurface,
    border: '#312E81',
    muted: '#1E1B4B',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5F5',
    muted: '#94A3B8',
    inverse: basePalette.textPrimary,
    disabled: '#475569',
  },
  focus: '#C4B5FD',
  outline: '#4C1D95',
  typography,
  spacing,
  radius,
  elevation: {
    level1: 2,
    level2: 4,
    level3: 8,
  },
};

type TeacherThemeContextValue = {
  theme: TeacherTheme;
};

const TeacherThemeContext = createContext<TeacherThemeContextValue>({
  theme: lightTheme,
});

export const useTeacherTheme = () => useContext(TeacherThemeContext);

type TeacherThemeProviderProps = {
  children: React.ReactNode;
};

export const TeacherThemeProvider: React.FC<TeacherThemeProviderProps> = ({
  children,
}) => {
  const colorScheme = useColorScheme();
  const theme = useMemo(
    () => (colorScheme === 'dark' ? darkTheme : lightTheme),
    [colorScheme]
  );

  return (
    <TeacherThemeContext.Provider value={{ theme }}>
      <>
        <TeacherToast theme={theme} />
        <Stack
          screenOptions={{
            headerLargeTitle: true,
            headerShadowVisible: false,
            gestureEnabled: true,
            contentStyle: { backgroundColor: theme.background.default },
            headerStyle: { backgroundColor: theme.surface.default },
            headerTintColor: theme.text.primary,
            headerTitleStyle: {
              fontFamily: theme.typography.fontFamily.semibold,
              fontSize: theme.typography.sizes.xl,
              color: theme.text.primary,
            },
            animation: 'fade_from_bottom',
          }}
        >
          {children}
        </Stack>
      </>
    </TeacherThemeContext.Provider>
  );
};

export const teacherLightTheme = lightTheme;
export const teacherDarkTheme = darkTheme;

