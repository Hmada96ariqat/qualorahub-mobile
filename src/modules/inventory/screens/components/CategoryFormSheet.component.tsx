import React, { useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ScrollView } from 'react-native';
import {
  AppButton,
  AppInput,
  AppSelect,
  AppTextArea,
  BottomSheet,
  FormValidationProvider,
  FormField,
  useFormValidation,
  type SelectOption,
  type FormValidationProviderValue,
  useToast,
} from '../../../../components';
import {
  normalizeStatus,
  ROW_STATUS_OPTIONS,
  type CategoryFormValues,
  type InventoryFormMode,
} from '../../contracts';
import { spacing } from '../../../../theme/tokens';
import { InventorySectionCard } from './InventorySectionCard.component';

type CategoryFormSheetProps = {
  visible: boolean;
  mode: InventoryFormMode;
  values: CategoryFormValues;
  categoryOptions: SelectOption[];
  formScrollViewRef: RefObject<ScrollView | null>;
  formValidation: {
    providerValue: FormValidationProviderValue;
    clearFieldError: (field: CategoryFormField) => void;
  };
  loading: boolean;
  disabled: boolean;
  onDismiss: () => void;
  onSubmit: () => void;
  onChange: (next: CategoryFormValues) => void;
  onQuickCreateParentCategory: (input: { name: string; notes: string | null }) => Promise<{ id: string; name: string }>;
};

type CategoryFormField = 'name';
type CategoryQuickAddField = 'name';

function toYesNo(value: boolean): 'yes' | 'no' {
  return value ? 'yes' : 'no';
}

export function CategoryFormSheet({
  visible,
  mode,
  values,
  categoryOptions,
  formScrollViewRef,
  formValidation,
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
  const quickAddScrollRef = useRef<ScrollView | null>(null);
  const quickAddValidation = useFormValidation<CategoryQuickAddField>(quickAddScrollRef);

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
    quickAddValidation.reset();
  }

  async function handleQuickCreateParentCategory() {
    const name = quickAddName.trim();
    const valid = quickAddValidation.validate([
      {
        field: 'name',
        message: 'Parent category name is required.',
        isValid: name.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
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
        scrollViewRef={formScrollViewRef}
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
        <FormValidationProvider value={formValidation.providerValue}>
          <InventorySectionCard
            title="Category Details"
            description="Define the category hierarchy, storefront visibility, and supporting notes."
          >
            <FormField label="Name" name="name" required>
              <AppInput
                value={values.name}
                onChangeText={(value) => {
                  formValidation.clearFieldError('name');
                  setFormValue('name', value);
                }}
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
          </InventorySectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={quickAddVisible}
        onDismiss={handleDismissQuickAdd}
        scrollViewRef={quickAddScrollRef}
        title="Create Parent Category"
        footer={
          <SheetFooter
            onCancel={handleDismissQuickAdd}
            onSubmit={() => void handleQuickCreateParentCategory()}
            submitLabel="Create"
            loading={quickAddLoading}
            disabled={quickAddLoading}
          />
        }
      >
        <FormValidationProvider value={quickAddValidation.providerValue}>
          <InventorySectionCard
            title="Parent Category Quick Add"
            description="Create a parent category and assign it immediately to the draft."
          >
            <FormField label="Name" name="name" required>
              <AppInput
                value={quickAddName}
                onChangeText={(value) => {
                  quickAddValidation.clearFieldError('name');
                  setQuickAddName(value);
                }}
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
          </InventorySectionCard>
        </FormValidationProvider>
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
