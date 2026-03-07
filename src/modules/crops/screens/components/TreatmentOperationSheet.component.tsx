import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  AppButton,
  AppDatePicker,
  AppInput,
  AppSelect,
  AppTextArea,
  BottomSheet,
  DetailSectionCard,
  FormField,
} from '../../../../components';
import type {
  CreateTreatmentOperationRequest,
  CropPracticeMapping,
  ProductionCycleSummary,
} from '../../../../api/modules/crops';
import type { InventoryProduct, InventoryWarehouse } from '../../../../api/modules/inventory';
import { isPesticideLikeProduct } from '../../logbook/productGuidance';
import { findLogbookProductStockIssues } from '../../logbook/stockValidation';
import { LOGBOOK_TREATMENT_APPLICATION_METHOD_OPTIONS, LOGBOOK_TREATMENT_TYPE_OPTIONS } from '../../logbook/selectOptions';
import { localDateToYmd } from '../../logbook/helpers';
import { LogbookProductsEditor } from './LogbookProductsEditor.component';
import { palette, spacing, typography } from '../../../../theme/tokens';

type TreatmentOperationSheetProps = {
  visible: boolean;
  cycle: ProductionCycleSummary | null;
  token: string;
  products: InventoryProduct[];
  warehouses: InventoryWarehouse[];
  practices: CropPracticeMapping[];
  isSubmitting: boolean;
  onDismiss: () => void;
  onSubmit: (input: CreateTreatmentOperationRequest) => Promise<void>;
};

type FieldErrors = {
  treatmentDate?: string;
  treatmentType?: string;
  practiceId?: string;
  products?: string;
};

function buildDefaultProductRow() {
  return {
    productId: '',
    qty: 1,
    unit: '',
    warehouseId: '',
    batchNumber: '',
    unitCost: 0,
    estimatedCost: 0,
    doseUsedText: '',
    phiDays: null,
  };
}

function SheetFooter({
  onCancel,
  onSubmit,
  loading,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.footerRow}>
      <AppButton label="Cancel" mode="text" tone="neutral" onPress={onCancel} />
      <AppButton label="Save treatment" onPress={onSubmit} loading={loading} disabled={loading} />
    </View>
  );
}

export function TreatmentOperationSheet({
  visible,
  cycle,
  token,
  products,
  warehouses,
  practices,
  isSubmitting,
  onDismiss,
  onSubmit,
}: TreatmentOperationSheetProps) {
  const [treatmentDate, setTreatmentDate] = useState(localDateToYmd(new Date()));
  const [treatmentType, setTreatmentType] = useState('');
  const [applicationMethod, setApplicationMethod] = useState('');
  const [treatmentLocation, setTreatmentLocation] = useState('');
  const [practiceId, setPracticeId] = useState('');
  const [notes, setNotes] = useState('');
  const [productRows, setProductRows] = useState<Array<Record<string, unknown>>>([
    buildDefaultProductRow(),
  ]);
  const [stockErrors, setStockErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTreatmentDate(localDateToYmd(new Date()));
    setTreatmentType('');
    setApplicationMethod('');
    setTreatmentLocation('');
    setPracticeId('');
    setNotes('');
    setProductRows([buildDefaultProductRow()]);
    setStockErrors([]);
    setFieldErrors({});
  }, [visible, cycle?.id]);

  const practiceOptions = useMemo(
    () =>
      practices
        .filter((practice) => practice.enabled)
        .map((practice) => ({
          label: practice.label,
          value: practice.id,
        })),
    [practices],
  );

  async function submitTreatment() {
    if (!cycle) {
      return;
    }

    const nextErrors: FieldErrors = {};
    if (!treatmentDate) {
      nextErrors.treatmentDate = 'Date is required.';
    }
    if (!treatmentType) {
      nextErrors.treatmentType = 'Treatment type is required.';
    }
    if (practiceOptions.length > 0 && !practiceId) {
      nextErrors.practiceId = 'Practice is required.';
    }

    const normalizedRows = productRows.filter(
      (row) => String(row.productId ?? '').trim().length > 0 || Number(row.qty ?? 0) > 0,
    );

    if (normalizedRows.length === 0) {
      nextErrors.products = 'Add at least one treatment product.';
    } else {
      for (const row of normalizedRows) {
        const productId = String(row.productId ?? '').trim();
        const qty = Number(row.qty ?? 0);
        const warehouseId = String(row.warehouseId ?? '').trim();
        const product = products.find((entry) => entry.id === productId) ?? null;
        const phiDays = row.phiDays;

        if (!productId || qty <= 0 || !warehouseId) {
          nextErrors.products = 'Select product, quantity, and warehouse for each row.';
          break;
        }

        if (
          product &&
          isPesticideLikeProduct(product) &&
          (phiDays === null || phiDays === undefined || Number(phiDays) < 0)
        ) {
          nextErrors.products = 'PHI days is required for pesticide-like products.';
          break;
        }
      }
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      const stockIssues = await findLogbookProductStockIssues({
        token,
        mode: 'treatment',
        rows: productRows,
      });

      if (stockIssues.length > 0) {
        const nextStockErrors = Array.from({ length: productRows.length }, () => '');
        stockIssues.forEach((issue) => {
          nextStockErrors[issue.rowIndex] =
            `Required ${issue.required}, but only ${issue.available} is available.`;
        });
        setStockErrors(nextStockErrors);
        return;
      }
    } catch (error) {
      setFieldErrors((current) => ({
        ...current,
        products:
          error instanceof Error ? error.message : 'Unable to validate product inventory.',
      }));
      return;
    }

    setStockErrors([]);

    const enhancedProducts = normalizedRows.map((row) => {
      const productMeta = products.find((entry) => entry.id === row.productId) ?? null;
      const qty = Number(row.qty ?? 0);
      const unitCost = Number(row.unitCost ?? 0);

      if (!productMeta || !isPesticideLikeProduct(productMeta)) {
        return {
          productId: String(row.productId ?? '').trim(),
          qty,
          unit: String(row.unit ?? '').trim(),
          warehouseId: String(row.warehouseId ?? '').trim(),
          batchNumber: String(row.batchNumber ?? '').trim() || null,
          unitCost,
          estimatedCost: Number((qty * unitCost).toFixed(2)),
        };
      }

      const recommendedDoseText =
        String(row.recommendedDoseText ?? '').trim() || productMeta.doseText || null;
      const recommendedDoseUnit =
        String(row.recommendedDoseUnit ?? '').trim() || productMeta.doseUnit || null;
      const usedText =
        String(row.doseUsedText ?? '').trim() || recommendedDoseText || null;
      const doseOverridden = Boolean(
        recommendedDoseText && usedText && usedText !== recommendedDoseText,
      );
      const phiDays = Number(row.phiDays ?? 0);
      let restrictedUntilDate: string | null = null;

      if (Number.isFinite(phiDays) && phiDays >= 0) {
        const restrictedDate = new Date(`${treatmentDate}T00:00:00`);
        restrictedDate.setDate(restrictedDate.getDate() + phiDays);
        restrictedUntilDate = localDateToYmd(restrictedDate);
      }

      return {
        productId: String(row.productId ?? '').trim(),
        qty,
        unit: String(row.unit ?? '').trim(),
        warehouseId: String(row.warehouseId ?? '').trim(),
        batchNumber: String(row.batchNumber ?? '').trim() || null,
        unitCost,
        estimatedCost: Number((qty * unitCost).toFixed(2)),
        recommendedDoseText,
        recommendedDoseUnit,
        doseUsedText: usedText,
        doseOverridden,
        activeIngredientConcentrationPercent:
          productMeta.activeIngredientConcentrationPercent ?? null,
        phiDays,
        restrictedUntilDate,
      };
    });

    await onSubmit({
      treatment_date: treatmentDate,
      treatment_type: treatmentType,
      application_method: applicationMethod || null,
      treatment_location: treatmentLocation.trim() || null,
      notes: notes.trim() || null,
      products: enhancedProducts,
      attachments: [],
      practiceId: practiceId || undefined,
    });

    onDismiss();
  }

  return (
    <BottomSheet
      visible={visible}
      onDismiss={onDismiss}
      title={cycle ? `Treatment: ${cycle.cropName ?? cycle.id}` : 'Treatment'}
      footer={
        <SheetFooter
          onCancel={onDismiss}
          onSubmit={() => void submitTreatment()}
          loading={isSubmitting}
        />
      }
    >
      {!cycle ? (
        <DetailSectionCard title="No cycle selected">
          <Text style={styles.helperText}>Choose a production cycle to log treatment.</Text>
        </DetailSectionCard>
      ) : (
        <>
          <DetailSectionCard
            title="Treatment operation"
            description="Capture the applied products and treatment details."
          >
            <FormField
              label="Date"
              required
              errorText={fieldErrors.treatmentDate}
            >
              <AppDatePicker
                value={treatmentDate}
                onChange={(nextValue) => {
                  setTreatmentDate(nextValue ?? '');
                  setFieldErrors((current) => ({ ...current, treatmentDate: undefined }));
                }}
                label="Treatment date"
              />
            </FormField>

            <FormField
              label="Treatment type"
              required
              errorText={fieldErrors.treatmentType}
            >
              <AppSelect
                value={treatmentType || null}
                options={LOGBOOK_TREATMENT_TYPE_OPTIONS}
                onChange={(nextValue) => {
                  setTreatmentType(nextValue);
                  setFieldErrors((current) => ({ ...current, treatmentType: undefined }));
                }}
                placeholder="Select treatment type"
                label="Treatment type"
              />
            </FormField>

            {practiceOptions.length > 0 ? (
              <FormField label="Practice" required errorText={fieldErrors.practiceId}>
                <AppSelect
                  value={practiceId || null}
                  options={practiceOptions}
                  onChange={(nextValue) => {
                    setPracticeId(nextValue);
                    setFieldErrors((current) => ({ ...current, practiceId: undefined }));
                  }}
                  placeholder="Select practice"
                  label="Practice"
                  searchable={practiceOptions.length > 6}
                  searchPlaceholder="Search practices"
                />
              </FormField>
            ) : null}

            <FormField label="Application method">
              <AppSelect
                value={applicationMethod || null}
                options={LOGBOOK_TREATMENT_APPLICATION_METHOD_OPTIONS}
                onChange={setApplicationMethod}
                placeholder="Select application method"
                label="Application method"
              />
            </FormField>

            <FormField label="Location">
              <AppInput
                value={treatmentLocation}
                onChangeText={setTreatmentLocation}
                placeholder="North block"
              />
            </FormField>
          </DetailSectionCard>

          <DetailSectionCard title="Products used">
            <LogbookProductsEditor
              token={token}
              mode="treatment"
              cropId={cycle.cropId}
              value={productRows}
              products={products}
              warehouses={warehouses}
              onChange={(nextRows) => {
                setProductRows(nextRows);
                setStockErrors([]);
                setFieldErrors((current) => ({ ...current, products: undefined }));
              }}
              stockErrors={stockErrors}
              lockPesticideDoseUnit
              addButtonLabel="Add product"
            />
            {fieldErrors.products ? (
              <Text style={styles.errorText}>{fieldErrors.products}</Text>
            ) : null}
          </DetailSectionCard>

          <DetailSectionCard title="Notes">
            <AppTextArea
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
            />
          </DetailSectionCard>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  helperText: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  errorText: {
    ...typography.caption,
    color: palette.destructive,
  },
});
