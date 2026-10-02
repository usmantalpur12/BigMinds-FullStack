import React from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../../theme/teacherTheme';

type TeacherSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  snapPoints?: number[];
};

export const TeacherSheet: React.FC<TeacherSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
}) => {
  const {
    theme: { spacing, radius, typography, text, surface, background },
  } = useTeacherTheme();

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
          onPress={onClose}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              marginTop: 'auto',
              backgroundColor: surface.default,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingBottom: Platform.OS === 'ios' ? spacing.xxxl : spacing.xl,
              paddingTop: spacing.lg,
              maxHeight: '90%',
            }}
          >
            {(title || showCloseButton) && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: spacing.lg,
                  paddingBottom: spacing.md,
                  borderBottomColor: surface.border,
                  borderBottomWidth: 1,
                  marginBottom: spacing.md,
                }}
              >
                {title ? (
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.semibold,
                      fontSize: typography.sizes.lg,
                      color: text.primary,
                    }}
                  >
                    {title}
                  </Text>
                ) : (
                  <View />
                )}
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onClose}
                    style={{
                      padding: spacing.xs,
                      borderRadius: radius.md,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={24} color={text.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.lg,
              }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

