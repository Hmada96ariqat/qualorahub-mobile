import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';
import { AppButton } from '../primitives/AppButton';
import { palette, radius, spacing, typography } from '../../theme/tokens';

export type ActionSheetAction = {
  key: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  testID?: string;
};

type ActionSheetProps = {
  visible: boolean;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  onDismiss: () => void;
  cancelLabel?: string;
  testID?: string;
};

export function ActionSheet({
  visible,
  title,
  message,
  actions,
  onDismiss,
  cancelLabel = 'Cancel',
  testID,
}: ActionSheetProps) {
  function handleActionPress(action: ActionSheetAction) {
    action.onPress();
    onDismiss();
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
        testID={testID}
      >
        <View style={styles.sheet}>
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            testID={testID ? `${testID}.scroll` : 'action-sheet.scroll'}
          >
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View style={styles.actions}>
              {actions.map((action) => (
                <AppButton
                  key={action.key}
                  label={action.label}
                  mode={action.destructive ? 'contained' : 'outlined'}
                  tone={action.destructive ? 'destructive' : 'neutral'}
                  onPress={() => handleActionPress(action)}
                  disabled={Boolean(action.disabled)}
                  testID={action.testID ?? `action-sheet.${action.key}`}
                />
              ))}
            </View>
          </ScrollView>

          <AppButton
            label={cancelLabel}
            mode="text"
            tone="neutral"
            onPress={onDismiss}
            testID="action-sheet.cancel"
          />
        </View>
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
    maxHeight: '82%',
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
  contentScroll: {
    flexGrow: 0,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  message: {
    ...typography.body,
    color: palette.mutedForeground,
  },
  actions: {
    gap: spacing.sm,
  },
});
