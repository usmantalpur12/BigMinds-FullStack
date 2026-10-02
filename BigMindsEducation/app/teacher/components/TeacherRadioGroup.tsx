import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../../theme/teacherTheme';

export type TeacherRadioOption<TValue = string> = {
  label: string;
  value: TValue;
  description?: string;
};

type TeacherRadioGroupProps<TValue> = {
  label?: string;
  value: TValue;
  onChange: (value: TValue) => void;
  options: Array<TeacherRadioOption<TValue>>;
  stacked?: boolean;
};

export function TeacherRadioGroup<TValue>({
  label,
  value,
  onChange,
  options,
  stacked = true,
}: TeacherRadioGroupProps<TValue>) {
  const {
    theme: { spacing, typography, text, semantic },
  } = useTeacherTheme();

  return (
    <View style={{ width: '100%', marginBottom: spacing.md }}>
      {label ? (
        <Text
          style={{
            marginBottom: spacing.xs,
            fontFamily: typography.fontFamily.semibold,
            color: text.primary,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: stacked ? 'column' : 'row',
          gap: stacked ? spacing.xs : spacing.sm,
          flexWrap: stacked ? 'nowrap' : 'wrap',
        }}
      >
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: spacing.sm,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: checked ? semantic.primary.default : 'transparent',
                backgroundColor: checked ? 'rgba(79,70,229,0.08)' : 'transparent',
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
            >
              <Ionicons
                name={checked ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={checked ? semantic.primary.default : text.muted}
                style={{ marginRight: spacing.xs }}
              />
              <View>
                <Text
                  style={{
                    fontFamily: typography.fontFamily.medium,
                    color: text.primary,
                    fontSize: typography.sizes.md,
                  }}
                >
                  {option.label}
                </Text>
                {option.description ? (
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.regular,
                      color: text.secondary,
                      fontSize: typography.sizes.sm,
                    }}
                  >
                    {option.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

