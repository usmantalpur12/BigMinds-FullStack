import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTeacherTheme } from '../../theme/teacherTheme';

type TeacherSkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export const TeacherSkeleton: React.FC<TeacherSkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 12,
  style,
}) => {
  const {
    theme: { surface },
  } = useTeacherTheme();
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animated, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(animated, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated]);

  const translateX = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });

  return (
    <Animated.View
      style={[
        {
          overflow: 'hidden',
          width,
          height,
          borderRadius,
          backgroundColor: surface.muted,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );
};

