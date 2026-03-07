import type {
  LogbookCategoryKey,
  LogbookFormField,
  LogbookOperationFamily,
  ProductBindingTarget,
} from './types';

const NUMBER_KEY_PATTERNS = ['cost', 'quantity', 'hours', 'expense', 'volume_value'];

const shouldParseAsNumber = (key: string): boolean => {
  const normalized = key.toLowerCase();
  return NUMBER_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
};

const normalizePayloadValue = (key: string, rawValue: unknown): unknown => {
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      return null;
    }

    if (key.endsWith('_json')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }

    if (shouldParseAsNumber(key)) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return parsed < 0 ? 0 : parsed;
      }
    }

    return trimmed;
  }

  return rawValue;
};

const toText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return null;
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const readRows = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry),
  );
};

const readQuantity = (row: Record<string, unknown>): number => {
  const direct =
    row.quantity ??
    row.qty ??
    (row.qty && typeof row.qty === 'object'
      ? (row.qty as Record<string, unknown>).value
      : null);

  return Math.max(0, toNumber(direct));
};

const readUnit = (row: Record<string, unknown>): string | null => {
  const qtyUnit =
    row.qty && typeof row.qty === 'object'
      ? toText((row.qty as Record<string, unknown>).unit)
      : null;

  return qtyUnit ?? toText(row.unit);
};

type CanonicalProductRow = {
  productId: string;
  quantity: number;
  unit: string | null;
  warehouseId: string | null;
  batchNumber: string | null;
  unitCost: number;
  estimatedCost: number;
  doseUsedText: string | null;
  phiDays: number | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  notes: string | null;
};

const toCanonicalRows = (value: unknown): CanonicalProductRow[] => {
  return readRows(value)
    .map((row) => {
      const productId = toText(row.productId ?? row.product_id) ?? '';
      const quantity = readQuantity(row);
      const batchRaw = row.batchNumber ?? row.batch_number ?? row.batchId ?? row.batch_id;
      const batchNumber = toText(batchRaw);
      const unitCost = Math.max(0, toNumber(row.unitCost ?? row.unit_cost));
      const estimatedCost = Math.max(
        0,
        toNumber(row.estimatedCost ?? row.estimated_cost) || quantity * unitCost,
      );

      return {
        productId,
        quantity,
        unit: readUnit(row),
        warehouseId: toText(row.warehouseId ?? row.warehouse_id),
        batchNumber:
          batchNumber && batchNumber.toLowerCase() === 'no-batch'
            ? null
            : batchNumber,
        unitCost,
        estimatedCost,
        doseUsedText: toText(row.doseUsedText ?? row.dose_used_text),
        phiDays: (() => {
          const parsed = toNumber(row.phiDays ?? row.phi_days);
          return parsed >= 0 ? parsed : null;
        })(),
        manufacturingDate: toText(row.manufacturingDate ?? row.manufacturing_date),
        expiryDate: toText(row.expiryDate ?? row.expiry_date),
        notes: toText(row.notes),
      };
    })
    .filter((row) => row.productId.length > 0 && row.quantity > 0);
};

const toProductsRows = (
  rows: CanonicalProductRow[],
  mode: LogbookFormField['editorMode'],
): Record<string, unknown>[] => {
  if (mode === 'treatment') {
    return rows.map((row) => ({
      productId: row.productId,
      qty: row.quantity,
      unit: row.unit ?? '',
      warehouseId: row.warehouseId ?? '',
      batchNumber: row.batchNumber,
      unitCost: row.unitCost,
      estimatedCost: row.estimatedCost,
      doseUsedText: row.doseUsedText ?? '',
      phiDays: row.phiDays,
    }));
  }

  return rows.map((row) => ({
    productId: row.productId,
    quantity: row.quantity,
    unit: row.unit ?? '',
    warehouseId: row.warehouseId ?? '',
    batchNumber: row.batchNumber,
    unitCost: row.unitCost,
    estimatedCost: row.estimatedCost,
  }));
};

const toInputsRows = (
  rows: CanonicalProductRow[],
  mode: LogbookFormField['editorMode'],
): Record<string, unknown>[] => {
  if (mode === 'planting_inputs') {
    return rows.map((row) => ({
      productId: row.productId,
      warehouseId: row.warehouseId ?? '',
      batchId: row.batchNumber,
      qty: {
        value: row.quantity,
        unit: row.unit ?? 'kg',
      },
      unitCost: row.unitCost,
      lineCost: row.quantity * row.unitCost,
    }));
  }

  return rows.map((row) => ({
    productId: row.productId,
    qty: row.quantity,
    unit: row.unit ?? '',
    warehouseId: row.warehouseId ?? '',
    unitCost: row.unitCost,
    batchNumber: row.batchNumber,
    lineCost: row.quantity * row.unitCost,
  }));
};

const toReusableProductsRows = (rows: CanonicalProductRow[]): Record<string, unknown>[] =>
  rows.map((row) => ({
    productId: row.productId,
    quantity: row.quantity,
    unit: row.unit ?? '',
    warehouseId: row.warehouseId ?? '',
    unitCost: row.unitCost,
    batchNumber: row.batchNumber,
    manufacturingDate: row.manufacturingDate,
    expiryDate: row.expiryDate,
  }));

const toMaintenancePartsRows = (rows: CanonicalProductRow[]): Record<string, unknown>[] =>
  rows.map((row) => ({
    product_id: row.productId,
    quantity: row.quantity,
    unit_cost: row.unitCost,
    total_cost: row.quantity * row.unitCost,
  }));

const toProductsUsedRows = (rows: CanonicalProductRow[]): Record<string, unknown>[] =>
  rows.map((row) => ({
    product_id: row.productId,
    quantity: row.quantity,
    unit: row.unit ?? '',
    warehouse_id: row.warehouseId,
    batch_number: row.batchNumber,
    unit_cost: row.unitCost,
    total_cost: row.quantity * row.unitCost,
  }));

const toLineItemsRows = (rows: CanonicalProductRow[]): Record<string, unknown>[] =>
  rows.map((row) => ({
    product_id: row.productId,
    quantity: row.quantity,
    warehouse_id: row.warehouseId,
    batch_number: row.batchNumber,
    manufacturing_date: row.manufacturingDate,
    expiry_date: row.expiryDate,
    notes: row.notes,
  }));

const resolveFieldTarget = (args: {
  category: LogbookCategoryKey;
  family: LogbookOperationFamily | null;
  field: LogbookFormField;
}): ProductBindingTarget | null => {
  if (args.field.bindingTarget) {
    return args.field.bindingTarget;
  }

  if (args.field.key === 'products') return 'products';
  if (args.field.key === 'inputs') return 'inputs';
  if (args.field.key === 'reusable_products') return 'reusable_products';
  if (args.field.key === 'parts') return 'parts';
  if (args.field.key === 'products_used') return 'products_used';
  if (args.field.key === 'line_items') return 'line_items';

  if (args.category === 'CROP_OPERATION') {
    if (args.family === 'NUTRIENT' || args.family === 'TREATMENT') return 'products';
    if (args.family === 'WEED_MGMT') return 'reusable_products';
    if (
      args.family === 'LAND_PREP' ||
      args.family === 'PLANTING' ||
      args.family === 'IRRIGATION' ||
      args.family === 'CULTURAL'
    ) {
      return 'inputs';
    }
  }

  if (args.category === 'LOT_MAINTENANCE') return 'inputs';
  if (args.category === 'EQUIPMENT_MAINTENANCE') return 'parts';
  if (args.category === 'ANIMAL_HOUSE_MAINTENANCE') return 'products_used';
  if (args.category === 'ANIMAL_YIELD') return 'line_items';

  return null;
};

const mapRowsForTarget = (args: {
  rows: CanonicalProductRow[];
  target: ProductBindingTarget;
  mode: LogbookFormField['editorMode'];
}): Record<string, unknown>[] => {
  if (args.target === 'products') return toProductsRows(args.rows, args.mode);
  if (args.target === 'inputs') return toInputsRows(args.rows, args.mode);
  if (args.target === 'reusable_products') return toReusableProductsRows(args.rows);
  if (args.target === 'parts') return toMaintenancePartsRows(args.rows);
  if (args.target === 'products_used') return toProductsUsedRows(args.rows);
  return toLineItemsRows(args.rows);
};

export const toSubmitPayload = (rawPayload: Record<string, unknown>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  Object.entries(rawPayload).forEach(([key, value]) => {
    const normalized = normalizePayloadValue(key, value);

    if (normalized === null || normalized === undefined || normalized === '') {
      return;
    }

    if (key.endsWith('_json')) {
      payload[key.replace(/_json$/, '')] = normalized;
      return;
    }

    payload[key] = normalized;
  });

  if (Object.prototype.hasOwnProperty.call(payload, 'reusable_products')) {
    payload.reusableProducts = payload.reusable_products;
  }

  return payload;
};

export const bindProductsEditorPayload = (args: {
  category: LogbookCategoryKey;
  family: LogbookOperationFamily | null;
  fields: LogbookFormField[];
  payload: Record<string, unknown>;
}): Record<string, unknown> => {
  const next = { ...args.payload };

  for (const field of args.fields) {
    if (field.type !== 'products_editor') {
      continue;
    }

    const target = resolveFieldTarget({
      category: args.category,
      family: args.family,
      field,
    });

    if (!target) {
      continue;
    }

    const sourceValue = (() => {
      if (Object.prototype.hasOwnProperty.call(next, field.key)) {
        return next[field.key];
      }

      if (
        target === 'reusable_products' &&
        Object.prototype.hasOwnProperty.call(next, 'reusableProducts')
      ) {
        return next.reusableProducts;
      }

      return undefined;
    })();

    const rows = toCanonicalRows(sourceValue);
    const mappedRows = mapRowsForTarget({
      rows,
      target,
      mode: field.editorMode,
    });

    next[target] = mappedRows;
    if (target === 'reusable_products') {
      next.reusableProducts = mappedRows;
    }

    if (field.key !== target) {
      delete next[field.key];
    }
  }

  return next;
};
