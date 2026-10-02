import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { useTeacherTheme } from '../../theme/teacherTheme';

type TeacherMicroChartProps = {
  data: number[];
  label: string;
  value: string | number;
  color?: string;
  height?: number;
  width?: number;
};

export const TeacherMicroChart: React.FC<TeacherMicroChartProps> = ({
  data,
  label,
  value,
  color,
  height = 40,
  width = 100,
}) => {
  const {
    theme: { spacing, text, typography, semantic },
  } = useTeacherTheme();

  const chartColor = color || semantic.primary.default;
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1 || 1)) * width;
    const y = height - ((val - minValue) / range) * height;
    return { x, y };
  });

  const pathData = points
    .map((point, idx) => `${idx === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: typography.fontFamily.medium,
            fontSize: typography.sizes.sm,
            color: text.secondary,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily.semibold,
            fontSize: typography.sizes.md,
            color: text.primary,
          }}
        >
          {value}
        </Text>
      </View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={pathData}
          stroke={chartColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, idx) => (
          <Circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r={2}
            fill={chartColor}
          />
        ))}
      </Svg>
    </View>
  );
};

