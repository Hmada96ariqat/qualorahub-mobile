import { listProductInventory, listInventoryQuantities } from '../../../api/modules/orders';
import type { ProductInventoryRecord } from '../../../api/modules/orders';
import type { LogbookProductsEditorMode } from './types';

export interface LogbookProductStockIssue {
  rowIndex: number;
  productId: string;
  warehouseId: string;
  batchNumber: string | null;
  available: number;
  required: number;
}

const toObjectArray = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry),
  );
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readQuantity = (
  mode: LogbookProductsEditorMode,
  row: Record<string, unknown>,
): number => {
  if (mode === 'treatment') {
    return Math.max(0, toNumber(row.qty ?? row.quantity));
  }

  return Math.max(0, toNumber(row.quantity ?? row.qty));
};

export function buildInventoryBatchTotals(
  records: ProductInventoryRecord[],
): Record<string, Record<string, number>> {
  const totals: Record<string, Record<string, number>> = {};

  for (const record of records) {
    if (!(record.quantity > 0) || !record.batchNumber) {
      continue;
    }

    const pairKey = `${record.productId}_${record.warehouseId}`;
    totals[pairKey] ??= {};
    totals[pairKey][record.batchNumber] =
      (totals[pairKey][record.batchNumber] ?? 0) + record.quantity;
  }

  return totals;
}

export function buildInventoryTotalsByProductWarehouse(
  rows: Array<{ productId: string; warehouseId: string; quantity: number }>,
): Record<string, number> {
  return rows.reduce<Record<string, number>>((accumulator, row) => {
    const key = `${row.productId}_${row.warehouseId}`;
    accumulator[key] = (accumulator[key] ?? 0) + row.quantity;
    return accumulator;
  }, {});
}

export function getBatchAwareAvailableQuantity(args: {
  productId: string;
  warehouseId: string;
  batchNumber: string | null | undefined;
  inventoryByProductWarehouse: Record<string, number>;
  batchesByProductWarehouse: Record<string, Record<string, number>>;
}): number {
  const productId = String(args.productId ?? '').trim();
  const warehouseId = String(args.warehouseId ?? '').trim();
  const batchNumber = String(args.batchNumber ?? '').trim();

  if (!productId || !warehouseId) {
    return 0;
  }

  const pairKey = `${productId}_${warehouseId}`;
  if (batchNumber && batchNumber !== 'no-batch') {
    return Math.max(0, args.batchesByProductWarehouse[pairKey]?.[batchNumber] ?? 0);
  }

  return Math.max(0, args.inventoryByProductWarehouse[pairKey] ?? 0);
}

export async function findLogbookProductStockIssues(args: {
  token: string;
  mode: LogbookProductsEditorMode;
  rows: unknown;
}): Promise<LogbookProductStockIssue[]> {
  const productRows = toObjectArray(args.rows)
    .map((row, rowIndex) => ({
      rowIndex,
      productId: String(row.productId ?? row.product_id ?? '').trim(),
      warehouseId: String(row.warehouseId ?? row.warehouse_id ?? '').trim(),
      batchNumber: String(
        row.batchNumber ?? row.batch_number ?? row.batchId ?? row.batch_id ?? '',
      ).trim(),
      required: readQuantity(args.mode, row),
    }))
    .filter(
      (row) =>
        row.productId.length > 0 &&
        row.warehouseId.length > 0 &&
        Number.isFinite(row.required) &&
        row.required > 0,
    );

  if (productRows.length === 0) {
    return [];
  }

  const productIds = Array.from(new Set(productRows.map((row) => row.productId)));
  const warehouseIds = Array.from(new Set(productRows.map((row) => row.warehouseId)));
  const quantities = await listInventoryQuantities(args.token, {
    productIds,
    warehouseIds,
  });
  const inventoryByKey = buildInventoryTotalsByProductWarehouse(quantities);

  const inventoryRecords = await listProductInventory(args.token);
  const filteredInventory = inventoryRecords.filter(
    (record) =>
      productIds.includes(record.productId) && warehouseIds.includes(record.warehouseId),
  );
  const batchesByProductWarehouse = buildInventoryBatchTotals(filteredInventory);

  return productRows.flatMap((row) => {
    const available = getBatchAwareAvailableQuantity({
      productId: row.productId,
      warehouseId: row.warehouseId,
      batchNumber: row.batchNumber,
      inventoryByProductWarehouse: inventoryByKey,
      batchesByProductWarehouse,
    });

    if (row.required <= available) {
      return [];
    }

    return [
      {
        rowIndex: row.rowIndex,
        productId: row.productId,
        warehouseId: row.warehouseId,
        batchNumber: row.batchNumber || null,
        available,
        required: row.required,
      },
    ];
  });
}
