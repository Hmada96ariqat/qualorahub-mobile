import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppButton,
  AppChip,
  AppInput,
  AppSelect,
  AppTextArea,
  BottomSheet,
  FormField,
  type SelectOption,
  useToast,
} from '../../../../components';
import {
  CAPACITY_UNIT_OPTIONS,
  normalizeStatus,
  ROW_STATUS_OPTIONS,
  WAREHOUSE_TYPE_OPTIONS,
  type InventoryFormMode,
  type WarehouseTypeValue,
  type WarehouseFormValues,
} from '../../contracts';
import { spacing } from '../../../../theme/tokens';

type WarehouseFormSheetProps = {
  visible: boolean;
  mode: InventoryFormMode;
  values: WarehouseFormValues;
  fieldOptions: SelectOption[];
  loading: boolean;
  disabled: boolean;
  onDismiss: () => void;
  onSubmit: () => void;
  onChange: (next: WarehouseFormValues) => void;
  onQuickCreateField: (input: { name: string; areaHectares: number }) => Promise<SelectOption>;
};

export function WarehouseFormSheet({
  visible,
  mode,
  values,
  fieldOptions,
  loading,
  disabled,
  onDismiss,
  onSubmit,
  onChange,
  onQuickCreateField,
}: WarehouseFormSheetProps) {
  const { showToast } = useToast();
  const [quickAddFieldVisible, setQuickAddFieldVisible] = useState(false);
  const [quickAddFieldName, setQuickAddFieldName] = useState('');
  const [quickAddFieldArea, setQuickAddFieldArea] = useState('1');
  const [quickAddFieldLoading, setQuickAddFieldLoading] = useState(false);

  const selectFieldOptions = useMemo<SelectOption[]>(
    () => [{ label: 'Select field', value: '__none__' }, ...fieldOptions],
    [fieldOptions],
  );

  const capacityOptions = useMemo<SelectOption[]>(
    () => [{ label: 'Select unit', value: '__none__' }, ...CAPACITY_UNIT_OPTIONS],
    [],
  );

  function setFormValue<K extends keyof WarehouseFormValues>(key: K, value: WarehouseFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function toggleWarehouseType(value: WarehouseTypeValue) {
    const exists = values.warehouseTypes.includes(value);
    const nextTypes = exists
      ? values.warehouseTypes.filter((item) => item !== value)
      : [...values.warehouseTypes, value];

    setFormValue('warehouseTypes', nextTypes);
  }

  function dismissQuickAddField() {
    setQuickAddFieldVisible(false);
    setQuickAddFieldName('');
    setQuickAddFieldArea('1');
  }

  async function handleQuickCreateField() {
    const name = quickAddFieldName.trim();
    const area = Number.parseFloat(quickAddFieldArea.trim());

    if (!name) {
      showToast({ message: 'Field name is required.', variant: 'error' });
      return;
    }

    if (!Number.isFinite(area) || area <= 0) {
      showToast({ message: 'Field area must be a positive number.', variant: 'error' });
      return;
    }

    setQuickAddFieldLoading(true);
    try {
      const created = await onQuickCreateField({ name, areaHectares: area });
      setFormValue('fieldId', created.value);
      showToast({ message: `Field ${created.label} created.`, variant: 'success' });
      dismissQuickAddField();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create field.';
      showToast({ message, variant: 'error' });
    } finally {
      setQuickAddFieldLoading(false);
    }
  }

  return (
    <>
      <BottomSheet
        visible={visible}
        onDismiss={onDismiss}
        title={mode === 'create' ? 'Create Warehouse' : 'Edit Warehouse'}
        footer={
          <SheetFooter
            onCancel={onDismiss}
            onSubmit={onSubmit}
            submitLabel={mode === 'create' ? 'Create' : 'Save'}
            loading={loading}
            disabled={disabled}
          />
        }
      >
        <FormField label="Name" required>
          <AppInput
            value={values.name}
            onChangeText={(value) => setFormValue('name', value)}
            placeholder="Warehouse name"
          />
        </FormField>

        <FormField label="Field" required helperText="Required. Use quick add if no field exists yet.">
          <AppSelect
            value={values.fieldId || '__none__'}
            onChange={(value) => setFormValue('fieldId', value === '__none__' ? '' : value)}
            options={selectFieldOptions}
            searchable
            onCreateOption={() => setQuickAddFieldVisible(true)}
            createOptionLabel="Create field"
          />
        </FormField>

        <FormField label="Status">
          <AppSelect
            value={values.status}
            onChange={(value) => setFormValue('status', normalizeStatus(value))}
            options={ROW_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>

        <View style={styles.twoColumnRow}>
          <View style={styles.column}>
            <FormField label="Capacity value">
              <AppInput
                value={values.capacityValue}
                onChangeText={(value) => setFormValue('capacityValue', value)}
                placeholder="Optional"
                keyboardType="numeric"
              />
            </FormField>
          </View>
          <View style={styles.column}>
            <FormField label="Capacity unit">
              <AppSelect
                value={values.capacityUnit || '__none__'}
                onChange={(value) => setFormValue('capacityUnit', value === '__none__' ? '' : value)}
                options={capacityOptions}
                searchable
              />
            </FormField>
          </View>
        </View>

        <View style={styles.twoColumnRow}>
          <View style={styles.column}>
            <FormField label="Min temperature">
              <AppInput
                value={values.temperatureMin}
                onChangeText={(value) => setFormValue('temperatureMin', value)}
                placeholder="Optional"
                keyboardType="numeric"
              />
            </FormField>
          </View>
          <View style={styles.column}>
            <FormField label="Max temperature">
              <AppInput
                value={values.temperatureMax}
                onChangeText={(value) => setFormValue('temperatureMax', value)}
                placeholder="Optional"
                keyboardType="numeric"
              />
            </FormField>
          </View>
        </View>

        <FormField label="Warehouse types" helperText="Select one or multiple storage types.">
          <View style={styles.chipsWrap}>
            {WAREHOUSE_TYPE_OPTIONS.map((option) => {
              const selected = values.warehouseTypes.includes(option.value);
              return (
                <AppChip
                  key={option.value}
                  label={option.label}
                  selected={selected}
                  onPress={() => toggleWarehouseType(option.value)}
                />
              );
            })}
          </View>
        </FormField>

        <FormField label="Safety measures">
          <AppTextArea
            value={values.safetyMeasures}
            onChangeText={(value) => setFormValue('safetyMeasures', value)}
            placeholder="Optional safety details"
          />
        </FormField>

        <FormField label="Notes">
          <AppTextArea
            value={values.notes}
            onChangeText={(value) => setFormValue('notes', value)}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={quickAddFieldVisible}
        onDismiss={dismissQuickAddField}
        title="Create Field"
        footer={
          <SheetFooter
            onCancel={dismissQuickAddField}
            onSubmit={() => void handleQuickCreateField()}
            submitLabel="Create"
            loading={quickAddFieldLoading}
            disabled={!quickAddFieldName.trim() || quickAddFieldLoading}
          />
        }
      >
        <FormField label="Field name" required>
          <AppInput
            value={quickAddFieldName}
            onChangeText={setQuickAddFieldName}
            placeholder="Field name"
          />
        </FormField>
        <FormField label="Area (hectares)" required>
          <AppInput
            value={quickAddFieldArea}
            onChangeText={setQuickAddFieldArea}
            placeholder="1"
            keyboardType="numeric"
          />
        </FormField>
      </BottomSheet>
    </>
  );
}

function SheetFooter({
  onCancel,
  onSubmit,
  submitLabel,
  loading,
  disabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <View style={styles.sheetFooter}>
      <AppButton
        label="Cancel"
        mode="text"
        tone="neutral"
        onPress={onCancel}
        disabled={loading}
      />
      <AppButton
        label={submitLabel}
        onPress={onSubmit}
        loading={loading}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  column: {
    flex: 1,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
