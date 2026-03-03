import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { InventoryWarehouse } from '../../../../api/modules/inventory';
import { AppBadge, AppCard, AppListItem, AppSelect, type SelectOption } from '../../../../components';
import { palette, spacing, typography } from '../../../../theme/tokens';

type InventoryWarehousesSectionProps = {
  warehouses: InventoryWarehouse[];
  fieldFilter: string;
  onFieldFilterChange: (value: string) => void;
  fieldOptions: SelectOption[];
  onOpenActions: (item: InventoryWarehouse) => void;
  canEdit: boolean;
  canDelete: boolean;
};

function isInactiveStatus(status: string): boolean {
  return status.toLowerCase() === 'inactive';
}

function toStatusBadgeVariant(status: string): 'success' | 'warning' {
  return isInactiveStatus(status) ? 'warning' : 'success';
}

function formatCapacity(item: InventoryWarehouse): string {
  if (item.capacityValue === null) return 'n/a';
  return `${item.capacityValue}${item.capacityUnit ? ` ${item.capacityUnit}` : ''}`;
}

function formatTemperature(item: InventoryWarehouse): string {
  const min = item.temperatureMin;
  const max = item.temperatureMax;
  if (min === null && max === null) return 'n/a';
  if (min !== null && max !== null) return `${min} to ${max}`;
  if (min !== null) return `min ${min}`;
  return `max ${max}`;
}

export function InventoryWarehousesSection({
  warehouses,
  fieldFilter,
  onFieldFilterChange,
  fieldOptions,
  onOpenActions,
  canEdit,
  canDelete,
}: InventoryWarehousesSectionProps) {
  const canMutate = canEdit || canDelete;

  const fieldNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of fieldOptions) {
      map.set(option.value, option.label);
    }
    return map;
  }, [fieldOptions]);

  const fieldFilterOptions = useMemo<SelectOption[]>(
    () => [{ label: 'All fields', value: 'all' }, ...fieldOptions],
    [fieldOptions],
  );

  return (
    <View style={styles.container}>
      <AppSelect
        label="Field filter"
        value={fieldFilter}
        onChange={onFieldFilterChange}
        options={fieldFilterOptions}
        searchable
      />

      <View style={styles.rows}>
        {warehouses.map((item) => (
          <AppCard key={item.id}>
            <AppListItem
              title={item.name}
              description={item.fieldId ? fieldNameById.get(item.fieldId) ?? item.fieldId : 'No field assigned'}
              leftIcon="warehouse"
              onPress={canMutate ? () => onOpenActions(item) : undefined}
            />
            <View style={styles.rowMeta}>
              <MetaBadge label="Status" value={item.status} variant={toStatusBadgeVariant(item.status)} />
              <MetaBadge label="Capacity" value={formatCapacity(item)} variant="neutral" />
              <MetaBadge label="Temp" value={formatTemperature(item)} variant="neutral" />
            </View>
          </AppCard>
        ))}
      </View>
    </View>
  );
}

function MetaBadge({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant: 'success' | 'warning' | 'accent' | 'neutral';
}) {
  return (
    <View style={styles.metaGroup}>
      <Text style={styles.metaText}>{label}</Text>
      <AppBadge value={value} variant={variant} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  rows: {
    gap: spacing.sm,
  },
  rowMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingLeft: spacing.sm,
    alignItems: 'center',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
});
