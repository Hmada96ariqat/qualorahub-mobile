import type { InventoryCategory } from '../../api/modules/inventory';
import type { InfoGridCell } from '../../components';
import { formatInventoryStatusLabel } from './productPresentation';

export function buildCategoryRowSubtitle(input: {
  category: InventoryCategory;
  parentLabel?: string | null;
}): string {
  return `${input.parentLabel || 'Top-level'} · ${
    input.category.displayOnStorefront ? 'Visible on storefront' : 'Hidden from storefront'
  }`;
}

export function buildCategoryOverviewCells(input: {
  category: InventoryCategory;
  parentLabel?: string | null;
}): InfoGridCell[] {
  return [
    { label: 'Parent', value: input.parentLabel || 'Top-level' },
    { label: 'Status', value: formatInventoryStatusLabel(input.category.status) },
    {
      label: 'Storefront',
      value: input.category.displayOnStorefront ? 'Visible' : 'Hidden',
    },
    { label: 'Image', value: input.category.imageUrl?.trim() ? 'Configured' : 'None' },
  ];
}
