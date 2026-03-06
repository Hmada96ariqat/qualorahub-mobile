import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { InventoryTax } from '../../../../api/modules/inventory';
import { BottomSheet, EmptyState, ProfileCard, QuickActionGrid } from '../../../../components';
import type { QuickAction } from '../../../../components';
import { palette, spacing, typography } from '../../../../theme/tokens';
import { formatInventoryStatusLabel } from '../../productPresentation';
import { buildTaxOverviewCells } from '../../taxPresentation';
import { InventorySectionCard } from './InventorySectionCard.component';

type InventoryTaxDetailSheetProps = {
  tax: InventoryTax | null;
  quickActions: QuickAction[];
  onDismiss: () => void;
};

function DetailFactRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

export function InventoryTaxDetailSheet({
  tax,
  quickActions,
  onDismiss,
}: InventoryTaxDetailSheetProps) {
  return (
    <BottomSheet
      visible={Boolean(tax)}
      onDismiss={onDismiss}
      title={tax?.name ?? 'Tax detail'}
      testID="inventory-tax-detail"
    >
      {!tax ? (
        <EmptyState title="No details" message="Tax details could not be loaded." />
      ) : (
        <>
          <ProfileCard
            icon="percent"
            name={tax.name}
            subtitle={`Rate ${tax.rate}% · ${formatInventoryStatusLabel(tax.status)}`}
            cells={buildTaxOverviewCells(tax)}
            testID="inventory-tax-detail.profile"
          />

          {quickActions.length > 0 ? (
            <QuickActionGrid actions={quickActions} testID="inventory-tax-detail.actions" />
          ) : null}

          <InventorySectionCard
            title="Tax Details"
            description="Canonical tax configuration used across inventory products."
          >
            <DetailFactRow label="Rate" value={`${tax.rate}%`} />
            <DetailFactRow label="Status" value={formatInventoryStatusLabel(tax.status)} />
            {tax.notes?.trim() ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.factLabel}>Notes</Text>
                <Text style={styles.descriptionText}>{tax.notes.trim()}</Text>
              </View>
            ) : null}
          </InventorySectionCard>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  factLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  factValue: {
    ...typography.body,
    color: palette.foreground,
    flex: 1,
    textAlign: 'right',
  },
  descriptionBlock: {
    gap: spacing.xs,
  },
  descriptionText: {
    ...typography.body,
    color: palette.foreground,
  },
});
