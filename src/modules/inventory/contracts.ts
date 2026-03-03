import type {
  InventoryCategory,
  InventoryTax,
  InventoryWarehouse,
} from '../../api/modules/inventory';

export type InventoryTab = 'products' | 'categories' | 'taxes' | 'warehouses';
export type InventoryFormMode = 'create' | 'edit';
export type InventoryStatusFilter = 'all' | 'active' | 'inactive';
export type InventoryRowStatus = 'active' | 'inactive';
export type WarehouseTypeValue =
  | 'cold_storage'
  | 'seed_storage'
  | 'fertilizer'
  | 'packing_house'
  | 'livestock_shelter'
  | 'greenhouse'
  | 'fuel_storage'
  | 'other';

export const INVENTORY_TAB_OPTIONS = [
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'warehouses', label: 'Warehouses' },
] as const;

export const INVENTORY_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const ROW_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export type CategoryFormValues = {
  name: string;
  parentId: string;
  imageUrl: string;
  displayOnStorefront: boolean;
  notes: string;
  status: InventoryRowStatus;
};

export type TaxFormValues = {
  name: string;
  rate: string;
  notes: string;
  status: InventoryRowStatus;
};

export type WarehouseFormValues = {
  name: string;
  fieldId: string;
  status: InventoryRowStatus;
  capacityValue: string;
  capacityUnit: string;
  temperatureMin: string;
  temperatureMax: string;
  warehouseTypes: WarehouseTypeValue[];
  safetyMeasures: string;
  notes: string;
};

export const WAREHOUSE_TYPE_OPTIONS = [
  { value: 'cold_storage', label: 'Cold Storage' },
  { value: 'seed_storage', label: 'Seed Storage' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'packing_house', label: 'Packing House' },
  { value: 'livestock_shelter', label: 'Livestock Shelter' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'fuel_storage', label: 'Fuel Storage' },
  { value: 'other', label: 'Other' },
] as const;

export const CAPACITY_UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ton', label: 'Tons' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'liter', label: 'Liters (L)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'gallon', label: 'Gallons' },
  { value: 'm3', label: 'Cubic meters (m3)' },
  { value: 'ft3', label: 'Cubic feet (ft3)' },
  { value: 'piece', label: 'Pieces' },
  { value: 'box', label: 'Boxes' },
  { value: 'pallet', label: 'Pallets' },
  { value: 'container', label: 'Containers' },
  { value: 'bag', label: 'Bags' },
  { value: 'barrel', label: 'Barrels' },
  { value: 'bushel', label: 'Bushels' },
  { value: 'crate', label: 'Crates' },
] as const;

export function toCategoryFormValues(row?: InventoryCategory | null): CategoryFormValues {
  if (!row) {
    return {
      name: '',
      parentId: '',
      imageUrl: '',
      displayOnStorefront: false,
      notes: '',
      status: 'active',
    };
  }

  return {
    name: row.name,
    parentId: row.parentId ?? '',
    imageUrl: row.imageUrl ?? '',
    displayOnStorefront: row.displayOnStorefront,
    notes: row.notes ?? '',
    status: row.status === 'inactive' ? 'inactive' : 'active',
  };
}

export function toTaxFormValues(row?: InventoryTax | null): TaxFormValues {
  if (!row) {
    return {
      name: '',
      rate: '0',
      notes: '',
      status: 'active',
    };
  }

  return {
    name: row.name,
    rate: row.rate.toString(),
    notes: row.notes ?? '',
    status: row.status === 'inactive' ? 'inactive' : 'active',
  };
}

export function toWarehouseFormValues(row?: InventoryWarehouse | null): WarehouseFormValues {
  if (!row) {
    return {
      name: '',
      fieldId: '',
      status: 'active',
      capacityValue: '',
      capacityUnit: '',
      temperatureMin: '',
      temperatureMax: '',
      warehouseTypes: [],
      safetyMeasures: '',
      notes: '',
    };
  }

  return {
    name: row.name,
    fieldId: row.fieldId ?? '',
    status: row.status === 'inactive' ? 'inactive' : 'active',
    capacityValue: row.capacityValue === null ? '' : row.capacityValue.toString(),
    capacityUnit: row.capacityUnit ?? '',
    temperatureMin: row.temperatureMin === null ? '' : row.temperatureMin.toString(),
    temperatureMax: row.temperatureMax === null ? '' : row.temperatureMax.toString(),
    warehouseTypes: row.warehouseTypes,
    safetyMeasures: row.safetyMeasures ?? '',
    notes: row.notes ?? '',
  };
}

export function normalizeStatus(value: string): InventoryRowStatus {
  return value === 'inactive' ? 'inactive' : 'active';
}

export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
