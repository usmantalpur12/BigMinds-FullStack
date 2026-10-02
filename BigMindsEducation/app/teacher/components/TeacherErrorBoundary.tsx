import React from 'react';
import { View, Text } from 'react-native';
import { TeacherButton } from './TeacherButton';
import { useTeacherTheme } from '../../theme/teacherTheme';

type TeacherErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackMessage?: string;
};

type TeacherErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class TeacherErrorBoundary extends React.Component<
  TeacherErrorBoundaryProps,
  TeacherErrorBoundaryState
> {
  state: TeacherErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): TeacherErrorBoundaryState {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return <TeacherErrorFallback message={this.props.fallbackMessage} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

const TeacherErrorFallback = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) => {
  const {
    theme: { spacing, typography, text },
  } = useTeacherTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
      }}
    >
      <Text
        style={{
          fontFamily: typography.fontFamily.semibold,
          fontSize: typography.sizes.lg,
          color: text.primary,
          marginBottom: spacing.sm,
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          fontFamily: typography.fontFamily.regular,
          color: text.secondary,
          textAlign: 'center',
          marginBottom: spacing.lg,
        }}
      >
        {message || 'We hit a snag rendering this screen. Please try again.'}
      </Text>
      <TeacherButton title="Try Again" onPress={onRetry} fullWidth={false} />
    </View>
  );
};

