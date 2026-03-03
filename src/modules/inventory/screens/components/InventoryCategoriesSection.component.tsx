import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { InventoryCategory } from '../../../../api/modules/inventory';
import { AppBadge, AppButton, AppCard, AppListItem } from '../../../../components';
import { palette, spacing, typography } from '../../../../theme/tokens';

type InventoryCategoriesSectionProps = {
  categories: InventoryCategory[];
  onOpenActions: (item: InventoryCategory) => void;
  canEdit: boolean;
  canDelete: boolean;
  onEnableStorefrontForActive: () => void;
  bulkEnableLoading: boolean;
};

function isInactiveStatus(status: string): boolean {
  return status.toLowerCase() === 'inactive';
}

function toStatusBadgeVariant(status: string): 'success' | 'warning' {
  return isInactiveStatus(status) ? 'warning' : 'success';
}

function toStorefrontVariant(visible: boolean): 'accent' | 'warning' {
  return visible ? 'accent' : 'warning';
}

export function InventoryCategoriesSection({
  categories,
  onOpenActions,
  canEdit,
  canDelete,
  onEnableStorefrontForActive,
  bulkEnableLoading,
}: InventoryCategoriesSectionProps) {
  const canMutate = canEdit || canDelete;

  return (
    <View style={styles.container}>
      <View style={styles.controlsAction}>
        <AppButton
          label="Enable storefront (active)"
          mode="outlined"
          tone="neutral"
          onPress={onEnableStorefrontForActive}
          loading={bulkEnableLoading}
          disabled={!canEdit || bulkEnableLoading}
        />
      </View>

      <View style={styles.rows}>
        {categories.map((item) => (
          <AppCard key={item.id}>
            <AppListItem
              title={item.name}
              description={item.notes ?? 'No notes'}
              leftIcon="shape"
              onPress={canMutate ? () => onOpenActions(item) : undefined}
            />
            <View style={styles.rowMeta}>
              <MetaBadge
                label="Status"
                value={item.status}
                variant={toStatusBadgeVariant(item.status)}
              />
              <MetaBadge
                label="Storefront"
                value={item.displayOnStorefront ? 'Visible' : 'Hidden'}
                variant={toStorefrontVariant(item.displayOnStorefront)}
              />
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
  controlsAction: {
    alignItems: 'flex-start',
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
