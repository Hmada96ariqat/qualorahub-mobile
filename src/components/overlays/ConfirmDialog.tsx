import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';
import { AppButton } from '../primitives/AppButton';
import { palette, radius, spacing, typography } from '../../theme/tokens';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: 'primary' | 'neutral' | 'destructive';
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'primary',
  confirmLoading = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  testID,
}: ConfirmDialogProps) {
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        style={styles.dialog}
        testID={testID}
      >
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            testID={testID ? `${testID}.scroll` : 'confirm-dialog.scroll'}
          >
            <Text style={styles.message}>{message}</Text>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.actions}>
          <AppButton
            label={cancelLabel}
            mode="text"
            onPress={onCancel}
            testID="confirm-dialog.cancel"
          />
          <AppButton
            label={confirmLabel}
            onPress={onConfirm}
            tone={confirmTone}
            loading={confirmLoading}
            disabled={confirmDisabled || confirmLoading}
            testID="confirm-dialog.confirm"
          />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: radius.xl,
    backgroundColor: palette.surface,
  },
  title: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  message: {
    ...typography.body,
    color: palette.mutedForeground,
  },
  scrollArea: {
    maxHeight: 220,
    paddingHorizontal: spacing.md,
  },
  content: {
    paddingVertical: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
