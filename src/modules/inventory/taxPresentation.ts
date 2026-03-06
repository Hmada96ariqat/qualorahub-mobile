import type { InventoryTax } from '../../api/modules/inventory';
import type { InfoGridCell } from '../../components';
import { formatInventoryStatusLabel } from './productPresentation';

export function buildTaxRowSubtitle(tax: InventoryTax): string {
  return `Rate ${tax.rate}% · ${formatInventoryStatusLabel(tax.status)}`;
}

export function buildTaxOverviewCells(tax: InventoryTax): InfoGridCell[] {
  return [
    { label: 'Rate', value: `${tax.rate}%` },
    { label: 'Status', value: formatInventoryStatusLabel(tax.status) },
    { label: 'Notes', value: tax.notes?.trim() ? 'Available' : 'None' },
  ];
}
