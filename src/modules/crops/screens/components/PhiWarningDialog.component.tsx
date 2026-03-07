import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text } from 'react-native-paper';
import { AppButton } from '../../../../components';
import type { PhiRestrictionSummary } from '../../logbook/phiRestrictions';
import { palette, radius, spacing, typography } from '../../../../theme/tokens';

type PhiWarningDialogProps = {
  visible: boolean;
  restrictions: PhiRestrictionSummary[];
  mostRestrictiveDate: Date | null;
  onCancel: () => void;
  onProceed: () => void;
};

function formatDisplayDate(value: Date | null): string {
  if (!value) {
    return 'Unknown date';
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PhiWarningDialog({
  visible,
  restrictions,
  mostRestrictiveDate,
  onCancel,
  onProceed,
}: PhiWarningDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
        <Dialog.Title style={styles.title}>PHI restriction warning</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text style={styles.description}>
            {mostRestrictiveDate
              ? `One or more treatments are still under PHI until ${formatDisplayDate(mostRestrictiveDate)}.`
              : 'One or more treatments are still under PHI for this harvest date.'}
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {restrictions.map((entry) => (
              <View key={entry.productId} style={styles.item}>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemTitle}>{entry.productName}</Text>
                  <Text style={styles.itemMeta}>
                    {`PHI ${entry.phiDays} days · restricted until ${formatDisplayDate(entry.restrictedUntilDate)}`}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusChip,
                    entry.isActive ? styles.statusChipActive : styles.statusChipDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      entry.isActive ? styles.statusChipTextActive : styles.statusChipTextDone,
                    ]}
                  >
                    {entry.isActive ? 'Active' : 'Done'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <AppButton label="Cancel" mode="text" tone="neutral" onPress={onCancel} />
          <AppButton label="Proceed anyway" tone="destructive" onPress={onProceed} />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
  },
  title: {
    ...typography.subtitle,
    color: palette.foreground,
  },
  content: {
    gap: spacing.sm,
  },
  description: {
    ...typography.body,
    color: palette.mutedForeground,
  },
  list: {
    maxHeight: 240,
    marginTop: spacing.sm,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  item: {
    alignItems: 'flex-start',
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  itemTitle: {
    ...typography.body,
    color: palette.foreground,
    fontWeight: '600',
  },
  itemMeta: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusChipActive: {
    backgroundColor: '#FEE2E2',
  },
  statusChipDone: {
    backgroundColor: '#ECFDF3',
  },
  statusChipText: {
    ...typography.caption,
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: '#B42318',
  },
  statusChipTextDone: {
    color: '#027A48',
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
