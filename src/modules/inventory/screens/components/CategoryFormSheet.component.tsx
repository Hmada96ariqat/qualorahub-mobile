import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppButton,
  AppInput,
  AppSelect,
  AppTextArea,
  BottomSheet,
  FormField,
  type SelectOption,
  useToast,
} from '../../../../components';
import {
  normalizeStatus,
  ROW_STATUS_OPTIONS,
  type CategoryFormValues,
  type InventoryFormMode,
} from '../../contracts';
import { spacing } from '../../../../theme/tokens';

type CategoryFormSheetProps = {
  visible: boolean;
  mode: InventoryFormMode;
  values: CategoryFormValues;
  categoryOptions: SelectOption[];
  loading: boolean;
  disabled: boolean;
  onDismiss: () => void;
  onSubmit: () => void;
  onChange: (next: CategoryFormValues) => void;
  onQuickCreateParentCategory: (input: { name: string; notes: string | null }) => Promise<{ id: string; name: string }>;
};

function toYesNo(value: boolean): 'yes' | 'no' {
  return value ? 'yes' : 'no';
}

export function CategoryFormSheet({
  visible,
  mode,
  values,
  categoryOptions,
  loading,
  disabled,
  onDismiss,
  onSubmit,
  onChange,
  onQuickCreateParentCategory,
}: CategoryFormSheetProps) {
  const { showToast } = useToast();
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddNotes, setQuickAddNotes] = useState('');
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  const parentOptions = useMemo<SelectOption[]>(
    () => [{ label: 'Top-level category', value: '__none__' }, ...categoryOptions],
    [categoryOptions],
  );

  function setFormValue<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function handleDismissQuickAdd() {
    setQuickAddVisible(false);
    setQuickAddName('');
    setQuickAddNotes('');
  }

  async function handleQuickCreateParentCategory() {
    const name = quickAddName.trim();
    if (!name) {
      showToast({ message: 'Parent category name is required.', variant: 'error' });
      return;
    }

    setQuickAddLoading(true);
    try {
      const created = await onQuickCreateParentCategory({
        name,
        notes: quickAddNotes.trim() || null,
      });
      setFormValue('parentId', created.id);
      showToast({ message: `Parent category ${created.name} created.`, variant: 'success' });
      handleDismissQuickAdd();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create parent category.';
      showToast({ message, variant: 'error' });
    } finally {
      setQuickAddLoading(false);
    }
  }

  return (
    <>
      <BottomSheet
        visible={visible}
        onDismiss={onDismiss}
        title={mode === 'create' ? 'Create Category' : 'Edit Category'}
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
            placeholder="Category name"
          />
        </FormField>
        <FormField label="Parent category" helperText="Optional. Pick Top-level for no parent.">
          <AppSelect
            value={values.parentId || '__none__'}
            onChange={(value) => setFormValue('parentId', value === '__none__' ? '' : value)}
            options={parentOptions}
            searchable
            onCreateOption={() => setQuickAddVisible(true)}
            createOptionLabel="Create parent category"
          />
        </FormField>
        <FormField label="Image URL">
          <AppInput
            value={values.imageUrl}
            onChangeText={(value) => setFormValue('imageUrl', value)}
            placeholder="Optional image URL"
          />
        </FormField>
        <FormField label="Storefront visibility">
          <AppSelect
            value={toYesNo(values.displayOnStorefront)}
            onChange={(value) => setFormValue('displayOnStorefront', value === 'yes')}
            options={[
              { label: 'Visible', value: 'yes' },
              { label: 'Hidden', value: 'no' },
            ]}
          />
        </FormField>
        <FormField label="Status">
          <AppSelect
            value={values.status}
            onChange={(value) => setFormValue('status', normalizeStatus(value))}
            options={ROW_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
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
        visible={quickAddVisible}
        onDismiss={handleDismissQuickAdd}
        title="Create Parent Category"
        footer={
          <SheetFooter
            onCancel={handleDismissQuickAdd}
            onSubmit={() => void handleQuickCreateParentCategory()}
            submitLabel="Create"
            loading={quickAddLoading}
            disabled={!quickAddName.trim() || quickAddLoading}
          />
        }
      >
        <FormField label="Name" required>
          <AppInput
            value={quickAddName}
            onChangeText={setQuickAddName}
            placeholder="Parent category name"
          />
        </FormField>
        <FormField label="Notes">
          <AppTextArea
            value={quickAddNotes}
            onChangeText={setQuickAddNotes}
            placeholder="Optional notes"
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
});
