import type { InventoryWarehouse } from '../../api/modules/inventory';
import type { InfoGridCell } from '../../components';
import { formatInventoryStatusLabel } from './productPresentation';

export function formatWarehouseCapacity(warehouse: InventoryWarehouse): string {
  if (warehouse.capacityValue === null) return 'n/a';
  return `${warehouse.capacityValue}${warehouse.capacityUnit ? ` ${warehouse.capacityUnit}` : ''}`;
}

export function formatWarehouseTemperature(warehouse: InventoryWarehouse): string {
  const min = warehouse.temperatureMin;
  const max = warehouse.temperatureMax;
  if (min === null && max === null) return 'n/a';
  if (min !== null && max !== null) return `${min} to ${max}`;
  if (min !== null) return `min ${min}`;
  return `max ${max}`;
}

export function buildWarehouseRowSubtitle(input: {
  warehouse: InventoryWarehouse;
  fieldLabel?: string | null;
}): string {
  return `${input.fieldLabel || 'No field assigned'} · Capacity ${formatWarehouseCapacity(
    input.warehouse,
  )}`;
}

export function buildWarehouseOverviewCells(input: {
  warehouse: InventoryWarehouse;
  fieldLabel?: string | null;
}): InfoGridCell[] {
  return [
    { label: 'Field', value: input.fieldLabel || 'No field assigned' },
    { label: 'Status', value: formatInventoryStatusLabel(input.warehouse.status) },
    { label: 'Capacity', value: formatWarehouseCapacity(input.warehouse) },
    { label: 'Temp', value: formatWarehouseTemperature(input.warehouse) },
  ];
}
