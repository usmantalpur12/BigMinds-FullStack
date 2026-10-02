import React, { useState } from 'react';
import { Platform, Pressable, Modal, View, Text } from 'react-native';
import DateTimePicker, {
  AndroidNativeProps,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../../theme/teacherTheme';

type TeacherDatePickerProps = {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: AndroidNativeProps['mode'];
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
};

export const TeacherDatePicker: React.FC<TeacherDatePickerProps> = ({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  placeholder = 'Select date',
}) => {
  const [visible, setVisible] = useState(false);
  const {
    theme: { spacing, radius, typography, text, surface },
  } = useTeacherTheme();

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setVisible(false);
    }
    if (selected) {
      onChange(selected);
    }
  };

  const formatted = value
    ? value.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : placeholder;

  return (
    <View style={{ marginBottom: spacing.md }}>
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
      <Pressable
        onPress={() => setVisible(true)}
        style={{
          minHeight: 56,
          borderWidth: 1,
          borderColor: surface.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: surface.default,
        }}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
      >
        <Text
          style={{
            fontFamily: typography.fontFamily.medium,
            color: value ? text.primary : text.muted,
          }}
        >
          {formatted}
        </Text>
        <Ionicons name="calendar" size={20} color={text.secondary} />
      </Pressable>

      {visible && Platform.OS === 'ios' ? (
        <Modal animationType="slide" transparent>
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          >
            <View
              style={{
                backgroundColor: surface.default,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                paddingBottom: spacing.xl,
              }}
            >
              <View
                style={{
                  alignSelf: 'flex-end',
                  padding: spacing.md,
                }}
              >
                <Pressable onPress={() => setVisible(false)}>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.semibold,
                      color: text.primary,
                    }}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                mode={mode}
                value={value ?? new Date()}
                onChange={handleChange}
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={{ alignSelf: 'center' }}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      {visible && Platform.OS === 'android' ? (
        <DateTimePicker
          mode={mode}
          value={value ?? new Date()}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}
    </View>
  );
};

