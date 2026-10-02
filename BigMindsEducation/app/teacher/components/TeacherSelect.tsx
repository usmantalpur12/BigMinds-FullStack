import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../../theme/teacherTheme';

export type TeacherSelectOption<TValue = string> = {
  label: string;
  value: TValue;
  description?: string;
};

type TeacherSelectProps<TValue> = {
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  value?: TValue;
  options: Array<TeacherSelectOption<TValue>>;
  onChange: (value: TValue) => void;
  disabled?: boolean;
  modalTitle?: string;
};

export function TeacherSelect<TValue = string>({
  label,
  placeholder = 'Select',
  helperText,
  errorText,
  value,
  options,
  onChange,
  disabled,
  modalTitle = 'Choose an option',
}: TeacherSelectProps<TValue>) {
  const [open, setOpen] = useState(false);
  const {
    theme: { spacing, radius, typography, text, surface, semantic },
  } = useTeacherTheme();

  const selected = useMemo(
    () => options.find((item) => item.value === value),
    [options, value]
  );

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
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{
          minHeight: 56,
          borderWidth: 1,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: surface.default,
          borderColor: errorText ? semantic.error.default : surface.border,
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? placeholder} select`}
      >
        <View style={{ flex: 1 }}>
          {selected ? (
            <>
              <Text
                style={{
                  fontFamily: typography.fontFamily.medium,
                  color: text.primary,
                }}
              >
                {selected.label}
              </Text>
              {selected.description ? (
                <Text
                  style={{
                    fontFamily: typography.fontFamily.regular,
                    color: text.secondary,
                    fontSize: typography.sizes.sm,
                  }}
                >
                  {selected.description}
                </Text>
              ) : null}
            </>
          ) : (
            <Text
              style={{
                fontFamily: typography.fontFamily.regular,
                color: text.muted,
              }}
            >
              {placeholder}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={text.secondary} />
      </Pressable>
      {errorText ? (
        <Text
          style={{
            marginTop: spacing.xs,
            color: semantic.error.default,
            fontFamily: typography.fontFamily.medium,
            fontSize: typography.sizes.sm,
          }}
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text
          style={{
            marginTop: spacing.xs,
            color: text.secondary,
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.sizes.sm,
          }}
        >
          {helperText}
        </Text>
      ) : null}

      <Modal visible={open} onRequestClose={() => setOpen(false)} animationType="slide" transparent>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              marginTop: 'auto',
              backgroundColor: surface.default,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingBottom: spacing.xl,
              paddingTop: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View
              style={{
                alignItems: 'center',
                paddingBottom: spacing.sm,
                borderBottomColor: surface.border,
                borderBottomWidth: 1,
                marginHorizontal: spacing.lg,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamily.semibold,
                  fontSize: typography.sizes.lg,
                  color: text.primary,
                }}
              >
                {modalTitle}
              </Text>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? surface.muted : 'transparent',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: spacing.md }}>
                      <Text
                        style={{
                          fontFamily: typography.fontFamily.medium,
                          color: text.primary,
                        }}
                      >
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text
                          style={{
                            fontFamily: typography.fontFamily.regular,
                            color: text.secondary,
                            fontSize: typography.sizes.sm,
                            marginTop: spacing.micro,
                          }}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={semantic.primary.default} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

