import type { InventoryProduct } from '../../api/modules/inventory';
import type { DotBadgeVariant, ListRowIconVariant } from '../../components';
import type { InfoGridCell } from '../../components';
import { PRODUCT_TYPE_OPTIONS, PRODUCT_USAGE_TYPE_OPTIONS } from './product-form';

function humanizeToken(value: string): string {
  return value
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function countArrayEntries(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export function isInventoryInactiveStatus(status: string): boolean {
  return status.trim().toLowerCase() === 'inactive';
}

export function formatInventoryStatusLabel(status: string): string {
  return isInventoryInactiveStatus(status) ? 'Inactive' : 'Active';
}

export function toInventoryStatusBadgeVariant(status: string): DotBadgeVariant {
  return isInventoryInactiveStatus(status) ? 'neutral' : 'success';
}

export function toInventoryRowIconVariant(status: string): ListRowIconVariant {
  return isInventoryInactiveStatus(status) ? 'neutral' : 'green';
}

export function formatProductTypeLabel(productType: string | null | undefined): string {
  const normalized = (productType ?? '').trim();
  if (!normalized) return 'Product';

  const match = PRODUCT_TYPE_OPTIONS.find((option) => option.value === normalized);
  return match?.label ?? humanizeToken(normalized);
}

export function formatProductUsageLabel(
  usageType: InventoryProduct['usageType'],
): string {
  const normalized = (usageType ?? '').trim();
  if (!normalized) return 'General';

  const match = PRODUCT_USAGE_TYPE_OPTIONS.find((option) => option.value === normalized);
  return match?.label ?? normalized;
}

export function formatProductPrice(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a';
  return `$${value.toFixed(2)}`;
}

export function toProductIcon(product: Pick<InventoryProduct, 'productType' | 'usageType'>): string {
  const normalizedType = (product.productType ?? '').trim().toLowerCase();

  if (
    normalizedType.includes('seed') ||
    normalizedType.includes('bulb') ||
    normalizedType.includes('sapling')
  ) {
    return 'seed-outline';
  }

  if (
    normalizedType.includes('pesticide') ||
    normalizedType.includes('herbicide') ||
    normalizedType.includes('fungicide') ||
    normalizedType.includes('insecticide') ||
    normalizedType.includes('nematicide')
  ) {
    return 'spray';
  }

  if (
    normalizedType.includes('fertilizer') ||
    normalizedType.includes('compost') ||
    normalizedType.includes('manure') ||
    normalizedType.includes('soil')
  ) {
    return 'sprout-outline';
  }

  if (normalizedType.includes('fuel') || normalizedType.includes('lubricant')) {
    return 'oil';
  }

  if (
    normalizedType.includes('feed') ||
    normalizedType.includes('vaccine') ||
    normalizedType.includes('veterinary')
  ) {
    return 'paw-outline';
  }

  if ((product.usageType ?? '').trim() === 'Selling') {
    return 'storefront-outline';
  }

  return 'package-variant';
}

export function buildProductRowSubtitle(product: InventoryProduct): string {
  const sku = product.sku?.trim() ? `SKU ${product.sku.trim()}` : 'No SKU';
  return `${formatProductTypeLabel(product.productType)} · ${sku}`;
}

export function buildProductDetailSubtitle(product: InventoryProduct): string {
  return `${formatProductTypeLabel(product.productType)} · ${formatInventoryStatusLabel(product.status)}`;
}

export function buildProductOverviewCells(product: InventoryProduct): InfoGridCell[] {
  return [
    { label: 'Usage', value: formatProductUsageLabel(product.usageType) },
    { label: 'Sale Price', value: formatProductPrice(product.pricePerUnit) },
    { label: 'Expiry', value: product.hasExpiry ? 'Yes' : 'No' },
    {
      label: 'Storefront',
      value: product.displayOnStorefront ? 'Visible' : 'Hidden',
    },
    { label: 'Inventory', value: String(countArrayEntries(product.inventoryRecords)) },
    { label: 'Guidance', value: String(countArrayEntries(product.cropGuidanceRows)) },
  ];
}

export function buildProductSecondaryFacts(product: InventoryProduct): Array<{
  label: string;
  value: string;
}> {
  return [
    { label: 'SKU', value: product.sku?.trim() || 'n/a' },
    { label: 'Barcode', value: product.barcode?.trim() || 'n/a' },
    { label: 'Unit', value: product.unit?.trim() || 'n/a' },
    { label: 'Wholesale', value: formatProductPrice(product.wholesalePrice) },
    {
      label: 'Threshold',
      value:
        typeof product.threshold === 'number' && Number.isFinite(product.threshold)
          ? String(product.threshold)
          : 'n/a',
    },
    { label: 'Origin', value: product.originCountry?.trim() || 'n/a' },
  ];
}

export function buildProductAgronomyFacts(product: InventoryProduct): Array<{
  label: string;
  value: string;
}> {
  return [
    {
      label: 'Form Code',
      value: product.productFormCode?.trim() || 'n/a',
    },
    {
      label: 'Ingredients',
      value: String(countArrayEntries(product.activeIngredients)),
    },
    {
      label: 'References',
      value: String(countArrayEntries(product.referenceUrls)),
    },
    {
      label: 'PHI',
      value:
        typeof product.phiMinDays === 'number' || typeof product.phiMaxDays === 'number'
          ? `${product.phiMinDays ?? 'n/a'}-${product.phiMaxDays ?? 'n/a'} days`
          : 'n/a',
    },
  ];
}
