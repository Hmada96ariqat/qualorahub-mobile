import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { InventoryWarehouse } from '../../../../api/modules/inventory';
import { BottomSheet, EmptyState, ProfileCard, QuickActionGrid } from '../../../../components';
import type { QuickAction } from '../../../../components';
import { palette, spacing, typography } from '../../../../theme/tokens';
import { formatInventoryStatusLabel } from '../../productPresentation';
import {
  buildWarehouseOverviewCells,
  formatWarehouseCapacity,
  formatWarehouseTemperature,
} from '../../warehousePresentation';
import { InventorySectionCard } from './InventorySectionCard.component';

type InventoryWarehouseDetailSheetProps = {
  warehouse: InventoryWarehouse | null;
  fieldLabel?: string;
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

export function InventoryWarehouseDetailSheet({
  warehouse,
  fieldLabel,
  quickActions,
  onDismiss,
}: InventoryWarehouseDetailSheetProps) {
  return (
    <BottomSheet
      visible={Boolean(warehouse)}
      onDismiss={onDismiss}
      title={warehouse?.name ?? 'Warehouse detail'}
      testID="inventory-warehouse-detail"
    >
      {!warehouse ? (
        <EmptyState title="No details" message="Warehouse details could not be loaded." />
      ) : (
        <>
          <ProfileCard
            icon="warehouse"
            name={warehouse.name}
            subtitle={`${fieldLabel || 'No field assigned'} · ${formatInventoryStatusLabel(
              warehouse.status,
            )}`}
            cells={buildWarehouseOverviewCells({ warehouse, fieldLabel })}
            testID="inventory-warehouse-detail.profile"
          />

          {quickActions.length > 0 ? (
            <QuickActionGrid
              actions={quickActions}
              testID="inventory-warehouse-detail.actions"
            />
          ) : null}

          <InventorySectionCard
            title="Warehouse Details"
            description="Field assignment, storage capacity, safety, and temperature settings."
          >
            <DetailFactRow label="Field" value={fieldLabel || 'No field assigned'} />
            <DetailFactRow label="Capacity" value={formatWarehouseCapacity(warehouse)} />
            <DetailFactRow label="Temperature" value={formatWarehouseTemperature(warehouse)} />
            <DetailFactRow
              label="Types"
              value={warehouse.warehouseTypes.length > 0 ? warehouse.warehouseTypes.join(', ') : 'n/a'}
            />
            {warehouse.safetyMeasures?.trim() ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.factLabel}>Safety Measures</Text>
                <Text style={styles.descriptionText}>{warehouse.safetyMeasures.trim()}</Text>
              </View>
            ) : null}
            {warehouse.notes?.trim() ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.factLabel}>Notes</Text>
                <Text style={styles.descriptionText}>{warehouse.notes.trim()}</Text>
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
