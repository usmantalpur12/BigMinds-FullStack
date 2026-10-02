import React from 'react';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TeacherTheme } from '../../theme/teacherTheme';

type TeacherToastContainerProps = BaseToastProps & {
  type: 'success' | 'error' | 'info';
  text1?: string;
  text2?: string;
  theme: TeacherTheme;
};

const ToastCard: React.FC<TeacherToastContainerProps> = ({
  type,
  text1,
  text2,
  theme,
}) => {
  const { semantic, spacing, radius, typography, text } = theme;

  const palette = {
    success: {
      icon: 'checkmark-circle',
      color: semantic.success.default,
    },
    error: {
      icon: 'alert-circle',
      color: semantic.error.default,
    },
    info: {
      icon: 'information-circle',
      color: semantic.primary.default,
    },
  }[type];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: '#111827',
        borderRadius: radius.lg,
        gap: spacing.sm,
        minWidth: '80%',
      }}
    >
      <Ionicons name={palette.icon as any} size={22} color={palette.color} />
      <View style={{ flex: 1 }}>
        {text1 ? (
          <Text
            style={{
              color: '#F9FAFB',
              fontFamily: typography.fontFamily.semibold,
              fontSize: typography.sizes.md,
            }}
          >
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text
            style={{
              color: text.secondary,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.sizes.sm,
              marginTop: spacing.micro,
            }}
          >
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export const TeacherToast = ({ theme }: { theme: TeacherTheme }) => (
  <Toast
    config={{
      success: (props: BaseToastProps) => <ToastCard type="success" theme={theme} {...props} />,
      error: (props: BaseToastProps) => <ToastCard type="error" theme={theme} {...props} />,
      info: (props: BaseToastProps) => <ToastCard type="info" theme={theme} {...props} />,
    }}
  />
);

export const showTeacherToast = (params: {
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}) => {
  Toast.show({
    type: params.type ?? 'info',
    text1: params.title,
    text2: params.message,
    position: 'top',
    topOffset: 60,
  });
};

