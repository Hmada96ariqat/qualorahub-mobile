import React from 'react';
import type { ReactNode, RefObject } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';
import { palette, radius, spacing, typography } from '../../theme/tokens';

type BottomSheetProps = {
  visible: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onDismiss: () => void;
  heightRatio?: number;
  dismissable?: boolean;
  dismissableBackButton?: boolean;
  scrollViewRef?: RefObject<ScrollView | null>;
  testID?: string;
};

export function BottomSheet({
  visible,
  title,
  children,
  footer,
  onDismiss,
  heightRatio = 0.92,
  dismissable = true,
  dismissableBackButton = true,
  scrollViewRef,
  testID,
}: BottomSheetProps) {
  const maxHeightRatio = Number.isFinite(heightRatio)
    ? Math.max(0.25, Math.min(heightRatio, 0.98))
    : 0.92;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
        dismissable={dismissable}
        dismissableBackButton={dismissableBackButton}
        testID={testID}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={16}
        >
          <View style={[styles.sheet, { maxHeight: `${Math.round(maxHeightRatio * 100)}%` }]}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <ScrollView
              ref={scrollViewRef}
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
