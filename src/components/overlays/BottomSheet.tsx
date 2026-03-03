import React from 'react';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';
import { palette, radius, spacing, typography } from '../../theme/tokens';

type BottomSheetProps = {
  visible: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onDismiss: () => void;
  testID?: string;
};

export function BottomSheet({
  visible,
  title,
  children,
  footer,
  onDismiss,
  testID,
}: BottomSheetProps) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
        testID={testID}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={16}
        >
          <View style={styles.sheet}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              testID={testID ? `${testID}.scroll` : 'bottom-sheet.scroll'}
            >
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    flex: 1,
    margin: 0,
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  contentScroll: {
    flexGrow: 0,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  footer: {
    marginTop: spacing.xs,
  },
});
