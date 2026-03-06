import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { InventoryProduct } from '../../../../api/modules/inventory';
import { BottomSheet, EmptyState, ProfileCard, QuickActionGrid } from '../../../../components';
import type { QuickAction } from '../../../../components';
import { palette, spacing, typography } from '../../../../theme/tokens';
import {
  buildProductAgronomyFacts,
  buildProductDetailSubtitle,
  buildProductOverviewCells,
  buildProductSecondaryFacts,
  formatProductTypeLabel,
  toProductIcon,
} from '../../productPresentation';
import { InventorySectionCard } from './InventorySectionCard.component';

type InventoryProductDetailSheetProps = {
  product: InventoryProduct | null;
  categoryLabel?: string;
  supplierLabel?: string;
  manufacturerLabel?: string;
  taxLabel?: string;
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

export function InventoryProductDetailSheet({
  product,
  categoryLabel,
  supplierLabel,
  manufacturerLabel,
  taxLabel,
  quickActions,
  onDismiss,
}: InventoryProductDetailSheetProps) {
  return (
    <BottomSheet
      visible={Boolean(product)}
      onDismiss={onDismiss}
      title={product?.name ?? 'Product detail'}
      testID="inventory-product-detail"
    >
      {!product ? (
        <EmptyState title="No details" message="Product details could not be loaded." />
      ) : (
        <>
          <ProfileCard
            icon={toProductIcon(product)}
            name={product.name}
            subtitle={buildProductDetailSubtitle(product)}
            cells={buildProductOverviewCells(product)}
            testID="inventory-product-detail.profile"
          />

          {quickActions.length > 0 ? (
            <QuickActionGrid
              actions={quickActions}
              testID="inventory-product-detail.actions"
            />
          ) : null}

          <InventorySectionCard title="Commercial">
            <DetailFactRow label="Category" value={categoryLabel || 'n/a'} />
            <DetailFactRow label="Supplier" value={supplierLabel || 'n/a'} />
            <DetailFactRow label="Manufacturer" value={manufacturerLabel || 'n/a'} />
            <DetailFactRow label="Tax" value={taxLabel || 'n/a'} />
            {buildProductSecondaryFacts(product).map((fact) => (
              <DetailFactRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </InventorySectionCard>

          <InventorySectionCard
            title="Product Guidance"
            description={
              formatProductTypeLabel(product.productType) === 'Product'
                ? undefined
                : `Configuration for ${formatProductTypeLabel(product.productType)} records.`
            }
          >
            {product.description?.trim() ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.factLabel}>Description</Text>
                <Text style={styles.descriptionText}>{product.description.trim()}</Text>
              </View>
            ) : null}
            {buildProductAgronomyFacts(product).map((fact) => (
              <DetailFactRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
            {product.targetOrganismsText?.trim() ? (
              <View style={styles.descriptionBlock}>
                <Text style={styles.factLabel}>Target Organisms</Text>
                <Text style={styles.descriptionText}>{product.targetOrganismsText.trim()}</Text>
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
