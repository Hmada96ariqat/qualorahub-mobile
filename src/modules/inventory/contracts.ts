import type {
  InventoryCategory,
  InventoryProduct,
  InventoryTax,
  InventoryWarehouse,
} from '../../api/modules/inventory';

export type InventoryTab = 'products' | 'categories' | 'taxes' | 'warehouses';
export type InventoryFormMode = 'create' | 'edit';
export type InventoryStatusFilter = 'all' | 'active' | 'inactive';
export type InventoryRowStatus = 'active' | 'inactive';

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
  notes: string;
};

export type ProductFormValues = {
  name: string;
  description: string;
  categoryId: string;
  taxId: string;
  unit: string;
  sku: string;
  status: InventoryRowStatus;
  hasExpiry: boolean;
  displayOnStorefront: boolean;
  threshold: string;
  pricePerUnit: string;
  purchasePrice: string;
  wholesalePrice: string;
};

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
      notes: '',
    };
  }

  return {
    name: row.name,
    fieldId: row.fieldId ?? '',
    status: row.status === 'inactive' ? 'inactive' : 'active',
    notes: row.notes ?? '',
  };
}

export function toProductFormValues(row?: InventoryProduct | null): ProductFormValues {
  if (!row) {
    return {
      name: '',
      description: '',
      categoryId: '',
      taxId: '',
      unit: '',
      sku: '',
      status: 'active',
      hasExpiry: false,
      displayOnStorefront: false,
      threshold: '',
      pricePerUnit: '',
      purchasePrice: '',
      wholesalePrice: '',
    };
  }

  return {
    name: row.name,
    description: row.description ?? '',
    categoryId: row.categoryId ?? '',
    taxId: row.taxId ?? '',
    unit: row.unit ?? '',
    sku: row.sku ?? '',
    status: row.status === 'inactive' ? 'inactive' : 'active',
    hasExpiry: row.hasExpiry,
    displayOnStorefront: row.displayOnStorefront,
    threshold: row.threshold === null ? '' : row.threshold.toString(),
    pricePerUnit: row.pricePerUnit === null ? '' : row.pricePerUnit.toString(),
    purchasePrice: row.purchasePrice === null ? '' : row.purchasePrice.toString(),
    wholesalePrice: row.wholesalePrice === null ? '' : row.wholesalePrice.toString(),
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
