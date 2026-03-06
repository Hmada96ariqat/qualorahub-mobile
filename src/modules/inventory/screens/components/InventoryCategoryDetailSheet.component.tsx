import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { InventoryCategory } from '../../../../api/modules/inventory';
import { BottomSheet, EmptyState, ProfileCard, QuickActionGrid } from '../../../../components';
import type { QuickAction } from '../../../../components';
import { palette, spacing, typography } from '../../../../theme/tokens';
import { buildCategoryOverviewCells } from '../../categoryPresentation';
import { formatInventoryStatusLabel } from '../../productPresentation';
import { InventorySectionCard } from './InventorySectionCard.component';

type InventoryCategoryDetailSheetProps = {
  category: InventoryCategory | null;
  parentLabel?: string;
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

export function InventoryCategoryDetailSheet({
  category,
  parentLabel,
  quickActions,
  onDismiss,
}: InventoryCategoryDetailSheetProps) {
  return (
    <BottomSheet
      visible={Boolean(category)}
      onDismiss={onDismiss}
      title={category?.name ?? 'Category detail'}
      testID="inventory-category-detail"
    >
      {!category ? (
        <EmptyState title="No details" message="Category details could not be loaded." />
      ) : (
        <>
          <ProfileCard
            icon="shape"
            name={category.name}
            subtitle={`${parentLabel || 'Top-level'} · ${formatInventoryStatusLabel(category.status)}`}
            cells={buildCategoryOverviewCells({ category, parentLabel })}
            testID="inventory-category-detail.profile"
          />

          {quickActions.length > 0 ? (
            <QuickActionGrid
              actions={quickActions}
              testID="inventory-category-detail.actions"
            />
          ) : null}

          <InventorySectionCard
            title="Category Details"
            description="Hierarchy, storefront visibility, and optional notes for this category."
          >
            <DetailFactRow label="Parent" value={parentLabel || 'Top-level'} />
            <DetailFactRow
              label="Storefront"
              value={category.displayOnStorefront ? 'Visible' : 'Hidden'}
            />
            <DetailFactRow
              label="Image URL"
              value={category.imageUrl?.trim() || 'n/a'}
            />
            {category.notes?.trim() ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.factLabel}>Notes</Text>
                <Text style={styles.descriptionText}>{category.notes.trim()}</Text>
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
