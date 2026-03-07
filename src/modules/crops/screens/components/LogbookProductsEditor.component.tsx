import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppButton, AppInput, AppSelect } from '../../../../components';
import {
  listCropGuidanceByCropAndProducts,
  type CropGuidanceRow,
  type InventoryProduct,
  type InventoryWarehouse,
} from '../../../../api/modules/inventory';
import { listInventoryQuantities, listProductInventory } from '../../../../api/modules/orders';
import {
  buildInventoryBatchTotals,
  buildInventoryTotalsByProductWarehouse,
  getBatchAwareAvailableQuantity,
} from '../../logbook/stockValidation';
import type { LogbookProductsEditorMode } from '../../logbook/types';
import { isPesticideLikeProduct } from '../../logbook/productGuidance';
import { TreatmentProductGuidanceCard } from './TreatmentProductGuidanceCard.component';
import { palette, radius, spacing, typography } from '../../../../theme/tokens';

type ProductRow = Record<string, unknown>;

type LogbookProductsEditorProps = {
  token: string;
  mode: LogbookProductsEditorMode;
  cropId?: string | null;
  value: unknown;
  products: InventoryProduct[];
  warehouses: InventoryWarehouse[];
  onChange: (rows: ProductRow[]) => void;
  onTotalCostChange?: (totalCost: number) => void;
  stockErrors?: string[];
  lockPesticideDoseUnit?: boolean;
  title?: string;
  addButtonLabel?: string;
};

const PRODUCT_UNIT_OPTIONS = ['kg', 'g', 'L', 'ml', 'ha', 'm2', 'unit'] as const;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildDefaultRow(mode: LogbookProductsEditorMode): ProductRow {
  if (mode === 'treatment') {
    return {
      productId: '',
      qty: '',
      unit: '',
      warehouseId: '',
      batchNumber: '',
      unitCost: '',
      estimatedCost: '',
      doseUsedText: '',
      recommendedDoseText: '',
      recommendedDoseUnit: '',
      phiDays: null,
    };
  }

  return {
    productId: '',
    quantity: '',
    unit: '',
    warehouseId: '',
    batchNumber: '',
    unitCost: '',
    estimatedCost: '',
  };
}

function readQuantity(entry: Record<string, unknown>): number | '' {
  const nestedQty =
    entry.qty && typeof entry.qty === 'object'
      ? toNumber((entry.qty as Record<string, unknown>).value)
      : null;
  const direct = toNumber(entry.quantity ?? entry.qty ?? nestedQty ?? 0);
  return direct > 0 ? direct : '';
}

function coerceRows(
  value: unknown,
  mode: LogbookProductsEditorMode,
): ProductRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry),
    )
    .map((entry) => {
      const normalizedProductId = String(
        entry.productId ?? entry.product_id ?? '',
      ).trim();
      const normalizedWarehouseId = String(
        entry.warehouseId ?? entry.warehouse_id ?? '',
      ).trim();
      const normalizedBatchNumber = String(
        entry.batchNumber ??
          entry.batch_number ??
          entry.batchId ??
          entry.batch_id ??
          '',
      ).trim();
      const base = buildDefaultRow(mode);

      if (mode === 'treatment') {
        return {
          ...base,
          ...entry,
          productId: normalizedProductId,
          qty: readQuantity(entry),
          warehouseId: normalizedWarehouseId,
          batchNumber: normalizedBatchNumber,
          unitCost: toNumber(entry.unitCost ?? entry.unit_cost ?? 0),
          estimatedCost:
            toNumber(entry.estimatedCost ?? entry.estimated_cost) ||
            toNumber(entry.qty ?? entry.quantity) * toNumber(entry.unitCost ?? entry.unit_cost),
          doseUsedText: String(entry.doseUsedText ?? entry.dose_used_text ?? '').trim(),
          recommendedDoseText: String(
            entry.recommendedDoseText ?? entry.recommended_dose_text ?? '',
          ).trim(),
          recommendedDoseUnit: String(
            entry.recommendedDoseUnit ?? entry.recommended_dose_unit ?? '',
          ).trim(),
          phiDays:
            entry.phiDays === 0
              ? 0
              : toNullableNumber(entry.phiDays ?? entry.phi_days),
        };
      }

      return {
        ...base,
        ...entry,
        productId: normalizedProductId,
        quantity: readQuantity(entry),
        warehouseId: normalizedWarehouseId,
        batchNumber: normalizedBatchNumber,
        unitCost: toNumber(entry.unitCost ?? entry.unit_cost ?? 0),
        estimatedCost:
          toNumber(entry.estimatedCost ?? entry.estimated_cost) ||
          toNumber(entry.quantity ?? entry.qty) * toNumber(entry.unitCost ?? entry.unit_cost),
        unit:
          String(
            entry.unit ??
              (entry.qty && typeof entry.qty === 'object'
                ? (entry.qty as Record<string, unknown>).unit
                : '') ??
              '',
          ).trim() || '',
      };
    });
}

function getQuantity(mode: LogbookProductsEditorMode, row: ProductRow): number {
  return mode === 'treatment' ? toNumber(row.qty) : toNumber(row.quantity);
}

function setQuantity(
  mode: LogbookProductsEditorMode,
  row: ProductRow,
  quantity: number | '',
): ProductRow {
  if (mode === 'treatment') {
    return {
      ...row,
      qty: quantity,
      estimatedCost:
        quantity === '' ? 0 : Number((Number(quantity) * toNumber(row.unitCost)).toFixed(2)),
    };
  }

  return {
    ...row,
    quantity,
    estimatedCost:
      quantity === '' ? 0 : Number((Number(quantity) * toNumber(row.unitCost)).toFixed(2)),
  };
}

function setUnitCost(
  mode: LogbookProductsEditorMode,
  row: ProductRow,
  unitCost: number | '',
): ProductRow {
  const quantity = getQuantity(mode, row);
  return {
    ...row,
    unitCost,
    estimatedCost:
      unitCost === ''
        ? 0
        : Number((quantity * Number(unitCost || 0)).toFixed(2)),
  };
}

export function LogbookProductsEditor({
  token,
  mode,
  cropId = null,
  value,
  products,
  warehouses,
  onChange,
  onTotalCostChange,
  stockErrors = [],
  lockPesticideDoseUnit = false,
  title = 'Products',
  addButtonLabel = 'Add product',
}: LogbookProductsEditorProps) {
  const rows = useMemo(() => coerceRows(value, mode), [mode, value]);
  const productsById = useMemo(
    () =>
      products.reduce<Record<string, InventoryProduct>>((accumulator, product) => {
        accumulator[product.id] = product;
        return accumulator;
      }, {}),
    [products],
  );
  const [guidanceByProductId, setGuidanceByProductId] = useState<Record<string, CropGuidanceRow>>(
    {},
  );
  const [inventoryByKey, setInventoryByKey] = useState<Record<string, number>>({});
  const [batchesByProductWarehouse, setBatchesByProductWarehouse] = useState<
    Record<string, Record<string, number>>
  >({});
  const [expandedInfo, setExpandedInfo] = useState<Record<number, boolean>>({});
  const [resourceError, setResourceError] = useState<string | null>(null);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        label: product.name,
        value: product.id,
      })),
    [products],
  );

  const selectedProductIds = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => String(row.productId ?? '').trim())
            .filter((productId) => productId.length > 0),
        ),
      ),
    [rows],
  );

  const activeWarehouses = useMemo(
    () =>
      warehouses.filter((warehouse) => (warehouse.status || '').toLowerCase() === 'active'),
    [warehouses],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadResources() {
      if (!token || selectedProductIds.length === 0 || activeWarehouses.length === 0) {
        if (!cancelled) {
          setInventoryByKey({});
          setBatchesByProductWarehouse({});
          setGuidanceByProductId({});
          setResourceError(null);
        }
        return;
      }

      try {
        const [quantities, inventoryRecords, guidanceRows] = await Promise.all([
          listInventoryQuantities(token, {
            productIds: selectedProductIds,
            warehouseIds: activeWarehouses.map((warehouse) => warehouse.id),
          }),
          listProductInventory(token),
          cropId
            ? listCropGuidanceByCropAndProducts(token, cropId, selectedProductIds)
            : Promise.resolve([] as CropGuidanceRow[]),
        ]);

        if (cancelled) {
          return;
        }

        setInventoryByKey(buildInventoryTotalsByProductWarehouse(quantities));
        setBatchesByProductWarehouse(
          buildInventoryBatchTotals(
            inventoryRecords.filter(
              (record) =>
                selectedProductIds.includes(record.productId) &&
                activeWarehouses.some((warehouse) => warehouse.id === record.warehouseId),
            ),
          ),
        );
        setGuidanceByProductId(
          guidanceRows.reduce<Record<string, CropGuidanceRow>>((accumulator, row) => {
            accumulator[row.productId] = row;
            return accumulator;
          }, {}),
        );
        setResourceError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setResourceError(
          error instanceof Error ? error.message : 'Unable to load product guidance.',
        );
      }
    }

    void loadResources();

    return () => {
      cancelled = true;
    };
  }, [activeWarehouses, cropId, selectedProductIds, token]);

  useEffect(() => {
    if (!onTotalCostChange) {
      return;
    }

    const totalCost = rows.reduce((sum, row) => {
      const quantity = getQuantity(mode, row);
      const unitCost = toNumber(row.unitCost);
      return sum + quantity * unitCost;
    }, 0);

    onTotalCostChange(Number(totalCost.toFixed(2)));
  }, [mode, onTotalCostChange, rows]);

  useEffect(() => {
    if (mode !== 'treatment' || rows.length === 0) {
      return;
    }

    let changed = false;
    const nextRows = rows.map((row) => {
      const productId = String(row.productId ?? '').trim();
      const product = productId ? productsById[productId] ?? null : null;
      const guidance = productId ? guidanceByProductId[productId] ?? null : null;

      if (!product || !guidance || !isPesticideLikeProduct(product)) {
        return row;
      }

      const productDoseText = String(product.doseText ?? '').trim();
      const productDoseUnit = String(product.doseUnit ?? '').trim();
      const productPhi = product.phiMinDays ?? product.phiMaxDays ?? null;
      const guidanceDoseText = String(guidance.doseText ?? '').trim();
      const guidanceDoseUnit = String(guidance.doseUnit ?? '').trim();
      const guidancePhi = typeof guidance.phiDays === 'number' ? guidance.phiDays : null;

      const nextRow = { ...row };

      if (guidanceDoseText && String(row.recommendedDoseText ?? '').trim() !== guidanceDoseText) {
        nextRow.recommendedDoseText = guidanceDoseText;
        if (!String(row.doseUsedText ?? '').trim() || String(row.doseUsedText ?? '').trim() === productDoseText) {
          nextRow.doseUsedText = guidanceDoseText;
        }
      }

      if (guidanceDoseUnit && String(row.recommendedDoseUnit ?? '').trim() !== guidanceDoseUnit) {
        nextRow.recommendedDoseUnit = guidanceDoseUnit;
      }

      if (
        guidanceDoseUnit &&
        (!String(row.unit ?? '').trim() || String(row.unit ?? '').trim() === productDoseUnit)
      ) {
        nextRow.unit = guidanceDoseUnit;
      }

      if (
        guidancePhi !== null &&
        (row.phiDays === null || row.phiDays === undefined || row.phiDays === productPhi)
      ) {
        nextRow.phiDays = guidancePhi;
      }

      if (nextRow !== row && JSON.stringify(nextRow) !== JSON.stringify(row)) {
        changed = true;
      }

      return nextRow;
    });

    if (changed) {
      patchRows(nextRows);
    }
  }, [guidanceByProductId, mode, productsById, rows]);

  function patchRows(nextRows: ProductRow[]) {
    onChange(nextRows);
  }

  function updateRow(index: number, updater: (row: ProductRow) => ProductRow) {
    patchRows(
      rows.map((row, rowIndex) => (rowIndex === index ? updater(row) : row)),
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <AppButton
          label={addButtonLabel}
          mode="outlined"
          tone="neutral"
          onPress={() => patchRows([...rows, buildDefaultRow(mode)])}
        />
      </View>

      {resourceError ? <Text style={styles.resourceError}>{resourceError}</Text> : null}

      {rows.map((row, index) => {
        const selectedProductId = String(row.productId ?? '').trim();
        const selectedProduct = selectedProductId ? productsById[selectedProductId] ?? null : null;
        const selectedWarehouseId = String(row.warehouseId ?? '').trim();
        const selectedBatchNumber = String(row.batchNumber ?? '').trim();
        const guidance = selectedProductId ? guidanceByProductId[selectedProductId] ?? null : null;
        const isPesticide = Boolean(selectedProduct && isPesticideLikeProduct(selectedProduct));
        const recommendedDose = guidance?.doseText ?? selectedProduct?.doseText ?? '';
        const recommendedDoseUnit = guidance?.doseUnit ?? selectedProduct?.doseUnit ?? '';
        const warehouseOptions = selectedProductId
          ? activeWarehouses
              .filter((warehouse) => {
                const available =
                  inventoryByKey[`${selectedProductId}_${warehouse.id}`] ?? 0;
                return available > 0;
              })
              .map((warehouse) => {
                const available =
                  inventoryByKey[`${selectedProductId}_${warehouse.id}`] ?? 0;
                return {
                  label: `${warehouse.name} (${available})`,
                  value: warehouse.id,
                };
              })
          : activeWarehouses.map((warehouse) => ({
              label: warehouse.name,
              value: warehouse.id,
            }));
        const available =
          selectedProductId && selectedWarehouseId
            ? getBatchAwareAvailableQuantity({
                productId: selectedProductId,
                warehouseId: selectedWarehouseId,
                batchNumber: selectedBatchNumber,
                inventoryByProductWarehouse: inventoryByKey,
                batchesByProductWarehouse,
              })
            : 0;
        const batchOptions = selectedProductId && selectedWarehouseId
          ? [
              {
                label: 'No batch',
                value: 'no-batch',
              },
              ...Object.entries(
                batchesByProductWarehouse[`${selectedProductId}_${selectedWarehouseId}`] ?? {},
              )
                .sort((left, right) => left[0].localeCompare(right[0]))
                .map(([batchNumber, quantity]) => ({
                  label: `${batchNumber} (${quantity})`,
                  value: batchNumber,
                })),
            ]
          : [];

        return (
          <View key={`${selectedProductId || 'row'}-${index}`} style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{`Input #${index + 1}`}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove product row ${index + 1}`}
                onPress={() =>
                  patchRows(rows.filter((_, rowIndex) => rowIndex !== index))
                }
                style={({ pressed }) => [
                  styles.removeChip,
                  pressed ? styles.removeChipPressed : null,
                ]}
              >
                <Text style={styles.removeChipLabel}>Remove</Text>
              </Pressable>
            </View>

            <View style={styles.fieldStack}>
              <Text style={styles.fieldLabel}>Product</Text>
              <AppSelect
                value={selectedProductId || null}
                options={productOptions}
                onChange={(productId) => {
                  const selected = productsById[productId];
                  const cropGuidance = guidanceByProductId[productId] ?? null;
                  const defaultDose = String(
                    cropGuidance?.doseText ?? selected?.doseText ?? '',
                  ).trim();
                  const defaultDoseUnit = String(
                    cropGuidance?.doseUnit ?? selected?.doseUnit ?? '',
                  ).trim();
                  const defaultPhi =
                    cropGuidance?.phiDays ??
                    selected?.phiMinDays ??
                    selected?.phiMaxDays ??
                    null;
                  const resolvedUnit =
                    selected && isPesticideLikeProduct(selected) && defaultDoseUnit
                      ? defaultDoseUnit
                      : selected?.unit ?? '';

                  setExpandedInfo((current) => ({ ...current, [index]: false }));

                  updateRow(index, (current) => {
                    const nextRow = {
                      ...current,
                      productId,
                      unit: resolvedUnit,
                      unitCost: selected?.pricePerUnit ?? 0,
                      warehouseId: '',
                      batchNumber: '',
                    };

                    if (mode === 'treatment') {
                      return {
                        ...nextRow,
                        qty: '',
                        estimatedCost: 0,
                        recommendedDoseText: defaultDose,
                        recommendedDoseUnit: defaultDoseUnit,
                        doseUsedText: defaultDose || String(current.doseUsedText ?? ''),
                        phiDays:
                          typeof defaultPhi === 'number'
                            ? defaultPhi
                            : current.phiDays ?? null,
                      };
                    }

                    return {
                      ...nextRow,
                      quantity: '',
                      estimatedCost: 0,
                    };
                  });
                }}
                placeholder="Select product"
                label="Select product"
                searchable
                searchPlaceholder="Search products"
              />
            </View>

            {mode === 'treatment' ? (
              <TreatmentProductGuidanceCard
                product={selectedProduct}
                guidance={guidance}
                expanded={expandedInfo[index] ?? false}
                onToggleExpanded={() =>
                  setExpandedInfo((current) => ({
                    ...current,
                    [index]: !(current[index] ?? false),
                  }))
                }
              />
            ) : null}

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.fieldLabel}>Warehouse</Text>
                <AppSelect
                  value={selectedWarehouseId || null}
                  options={warehouseOptions}
                  onChange={(warehouseId) =>
                    updateRow(index, (current) => ({
                      ...current,
                      warehouseId,
                      batchNumber:
                        warehouseId === String(current.warehouseId ?? '')
                          ? current.batchNumber
                          : '',
                    }))
                  }
                  placeholder="Select warehouse"
                  label="Select warehouse"
                  searchable
                  searchPlaceholder="Search warehouses"
                />
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.fieldLabel}>Quantity</Text>
                <AppInput
                  value={(() => {
                    const quantity = getQuantity(mode, row);
                    return quantity > 0 ? String(quantity) : '';
                  })()}
                  onChangeText={(nextValue) => {
                    const trimmed = nextValue.trim();
                    updateRow(index, (current) =>
                      setQuantity(
                        mode,
                        current,
                        trimmed.length === 0 ? '' : Math.max(0, toNumber(trimmed)),
                      ),
                    );
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <Text style={styles.helperText}>{`Available: ${available}`}</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <AppSelect
                  value={String(row.unit ?? '') || null}
                  options={PRODUCT_UNIT_OPTIONS.map((unit) => ({
                    label: unit,
                    value: unit,
                  }))}
                  onChange={(unit) =>
                    updateRow(index, (current) => ({
                      ...current,
                      unit,
                    }))
                  }
                  placeholder="Select unit"
                  label="Select unit"
                  disabled={
                    Boolean(
                      lockPesticideDoseUnit &&
                        selectedProduct &&
                        isPesticideLikeProduct(selectedProduct) &&
                        (guidance?.doseUnit ?? selectedProduct.doseUnit),
                    )
                  }
                />
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.fieldLabel}>Unit cost (Optional)</Text>
                <AppInput
                  value={toNumber(row.unitCost) > 0 ? String(row.unitCost) : ''}
                  onChangeText={(nextValue) =>
                    updateRow(index, (current) =>
                      setUnitCost(
                        mode,
                        current,
                        nextValue.trim().length === 0 ? '' : Math.max(0, toNumber(nextValue)),
                      ),
                    )
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
            </View>

            {batchOptions.length > 1 ? (
              <View style={styles.fieldStack}>
                <Text style={styles.fieldLabel}>Batch</Text>
                <AppSelect
                  value={selectedBatchNumber || null}
                  options={batchOptions}
                  onChange={(batchNumber) =>
                    updateRow(index, (current) => ({
                      ...current,
                      batchNumber: batchNumber === 'no-batch' ? '' : batchNumber,
                    }))
                  }
                  placeholder="Optional batch"
                  label="Select batch"
                  searchable={batchOptions.length > 8}
                  searchPlaceholder="Search batches"
                />
              </View>
            ) : (
              <View style={styles.fieldStack}>
                <Text style={styles.fieldLabel}>Batch</Text>
                <AppInput
                  value={selectedBatchNumber}
                  onChangeText={(nextValue) =>
                    updateRow(index, (current) => ({
                      ...current,
                      batchNumber: nextValue,
                    }))
                  }
                  placeholder="Optional batch"
                />
              </View>
            )}

            {stockErrors[index] ? <Text style={styles.stockError}>{stockErrors[index]}</Text> : null}

            {mode === 'treatment' ? (
              <View style={styles.treatmentCard}>
                <Text style={styles.treatmentCardTitle}>IPM / treatment details</Text>
                {isPesticide ? (
                  <>
                    <View style={styles.grid}>
                      <View style={styles.gridItem}>
                        <Text style={styles.fieldLabel}>Dose used</Text>
                        <AppInput
                          value={String(row.doseUsedText ?? '')}
                          onChangeText={(nextValue) =>
                            updateRow(index, (current) => ({
                              ...current,
                              doseUsedText: nextValue,
                            }))
                          }
                          placeholder={
                            recommendedDose
                              ? `Recommended: ${recommendedDose}${recommendedDoseUnit ? ` (${recommendedDoseUnit})` : ''}`
                              : 'Enter dose used'
                          }
                        />
                      </View>

                      <View style={styles.gridItem}>
                        <Text style={styles.fieldLabel}>PHI days</Text>
                        <AppInput
                          value={
                            row.phiDays === null || row.phiDays === undefined
                              ? ''
                              : String(row.phiDays)
                          }
                          onChangeText={(nextValue) =>
                            updateRow(index, (current) => ({
                              ...current,
                              phiDays:
                                nextValue.trim().length === 0
                                  ? null
                                  : Math.max(0, toNumber(nextValue)),
                            }))
                          }
                          keyboardType="number-pad"
                          placeholder="0"
                        />
                      </View>
                    </View>

                    <Text style={styles.helperText}>
                      {recommendedDose
                        ? `Recommended dose: ${recommendedDose}${recommendedDoseUnit ? ` (${recommendedDoseUnit})` : ''}`
                        : 'No crop guidance available for this product.'}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.helperText}>
                    Select a pesticide-like product to show IPM-specific fields.
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    color: palette.foreground,
    fontWeight: '600',
  },
  resourceError: {
    ...typography.caption,
    color: palette.destructive,
  },
  rowCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    ...typography.body,
    color: palette.foreground,
    fontWeight: '600',
  },
  removeChip: {
    backgroundColor: palette.surfaceVariant,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removeChipPressed: {
    opacity: 0.7,
  },
  removeChipLabel: {
    ...typography.caption,
    color: palette.destructive,
    fontWeight: '600',
  },
  fieldStack: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
    gap: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  stockError: {
    ...typography.caption,
    color: palette.destructive,
  },
  treatmentCard: {
    backgroundColor: palette.surfaceVariant,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  treatmentCardTitle: {
    ...typography.caption,
    color: palette.foreground,
    fontWeight: '600',
  },
});
