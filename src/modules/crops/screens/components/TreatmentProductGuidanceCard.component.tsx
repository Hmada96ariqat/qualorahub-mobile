import React, { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppButton } from '../../../../components';
import type { CropGuidanceRow, InventoryProduct } from '../../../../api/modules/inventory';
import {
  extractActiveIngredients,
  extractReferenceUrl,
  extractTargets,
  getProductFormLabel,
  isPesticideLikeProduct,
} from '../../logbook/productGuidance';
import { palette, radius, spacing, typography } from '../../../../theme/tokens';

type TreatmentProductGuidanceCardProps = {
  product: InventoryProduct | null;
  guidance: CropGuidanceRow | null;
  expanded: boolean;
  onToggleExpanded: () => void;
};

type GuidanceItem = {
  label: string;
  value: string;
  link?: boolean;
};

function buildReferenceUrl(product: InventoryProduct, guidance: CropGuidanceRow | null): string | null {
  const guidanceUrl = extractReferenceUrl({
    reference_urls: guidance?.referenceUrls,
  } as Record<string, unknown>);
  if (guidanceUrl) {
    return guidanceUrl;
  }

  return extractReferenceUrl({
    reference_urls: product.referenceUrls,
  } as Record<string, unknown>);
}

export function TreatmentProductGuidanceCard({
  product,
  guidance,
  expanded,
  onToggleExpanded,
}: TreatmentProductGuidanceCardProps) {
  const items = useMemo<GuidanceItem[]>(() => {
    if (!product || !isPesticideLikeProduct(product)) {
      return [];
    }

    const activeIngredients = extractActiveIngredients({
      active_ingredients: product.activeIngredients,
    } as Record<string, unknown>);
    const recommendedDoseText = guidance?.doseText ?? product.doseText;
    const recommendedDoseUnit = guidance?.doseUnit ?? product.doseUnit;
    const recommendedDoseDisplay =
      recommendedDoseText && recommendedDoseText.trim().length > 0
        ? `${recommendedDoseText}${recommendedDoseUnit ? ` (${recommendedDoseUnit})` : ''}`
        : 'Not provided';
    const labelPhiDays = guidance?.phiDays ?? product.phiMinDays ?? product.phiMaxDays;
    const targetOrganisms =
      guidance?.targetOrganismsText ??
      extractTargets(
        {
          target_organisms_text: product.targetOrganismsText,
        } as Record<string, unknown>,
        activeIngredients,
      );
    const concentration = product.activeIngredientConcentrationPercent?.trim() || null;
    const referenceUrl = buildReferenceUrl(product, guidance);

    return [
      {
        label: 'Guidance source',
        value: guidance ? 'Crop matched' : 'General fallback',
      },
      {
        label: 'Product form',
        value: getProductFormLabel(product.productFormCode) ?? 'Not provided',
      },
      {
        label: 'Active ingredient',
        value: activeIngredients.length > 0 ? activeIngredients.join(', ') : 'Not provided',
      },
      {
        label: 'Active ingredient concentration (%)',
        value: concentration ?? 'Not provided',
      },
      {
        label: 'Recommended dose',
        value: recommendedDoseDisplay,
      },
      {
        label: 'Label PHI',
        value: typeof labelPhiDays === 'number' ? `${labelPhiDays} days` : 'Not provided',
      },
      {
        label: 'General usage',
        value: product.generalUse?.trim() || 'Not provided',
      },
      {
        label: 'Target pests / diseases / weeds',
        value: targetOrganisms?.trim() || 'Not provided',
      },
      ...(referenceUrl
        ? [
            {
              label: 'Reference',
              value: referenceUrl,
              link: true,
            } satisfies GuidanceItem,
          ]
        : []),
    ];
  }, [guidance, product]);

  if (items.length === 0) {
    return null;
  }

  const visibleItems = expanded ? items : items.slice(0, 4);

  return (
    <View style={styles.card}>
      {visibleItems.map((item) => (
        <View key={item.label} style={styles.itemRow}>
          <Text style={styles.itemLabel}>{`${item.label}:`}</Text>
          {item.link ? (
            <Pressable onPress={() => void Linking.openURL(item.value)}>
              <Text style={styles.linkText}>Reference</Text>
            </Pressable>
          ) : (
            <Text style={styles.itemValue}>{item.value}</Text>
          )}
        </View>
      ))}

      {items.length > 4 ? (
        <AppButton
          label={expanded ? 'Collapse' : 'Expand'}
          mode="text"
          tone="neutral"
          onPress={onToggleExpanded}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surfaceVariant,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  itemLabel: {
    ...typography.caption,
    color: palette.foreground,
    fontWeight: '600',
  },
  itemValue: {
    ...typography.caption,
    color: palette.mutedForeground,
    flex: 1,
  },
  linkText: {
    ...typography.caption,
    color: palette.primaryDark,
    fontWeight: '600',
  },
});
