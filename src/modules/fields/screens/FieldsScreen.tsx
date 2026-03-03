import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import type { FieldSummary, InactiveFieldWithLots } from '../../../api/modules/fields';
import {
  ActionSheet,
  AppBadge,
  AppButton,
  AppCard,
  AppHeader,
  AppInput,
  AppListItem,
  AppPolygonMapEditor,
  AppScreen,
  AppSection,
  AppSelect,
  AppTabs,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  FormField,
  PaginationFooter,
  PullToRefreshContainer,
  Skeleton,
  useToast,
} from '../../../components';
import { palette, spacing, typography } from '../../../theme/tokens';
import { toGeoJsonPolygon } from '../../../utils/geojson';
import {
  FIELD_AREA_UNIT_OPTIONS,
  toFieldFormValues,
  type FieldFormMode,
  type FieldFormValues,
  type FieldListMode,
} from '../contracts';
import { useFieldsModule } from '../useFieldsModule.hook';

type ConfirmAction = 'deactivate' | 'reactivate' | null;

type DisplayField = FieldSummary & {
  lotsCount: number;
};

type ModuleSwitcherValue = 'fields' | 'lots';

function toDisplayField(field: FieldSummary | InactiveFieldWithLots): DisplayField {
  const lotsCount = 'lots' in field ? field.lots.length : 0;

  return {
    ...field,
    lotsCount,
  };
}

export function FieldsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    fields,
    inactiveFields,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    createField,
    updateField,
    deactivateField,
    reactivateField,
  } = useFieldsModule();

  const [listMode, setListMode] = useState<FieldListMode>('active');
  const [searchValue, setSearchValue] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<FieldFormMode>('create');
  const [editingField, setEditingField] = useState<FieldSummary | null>(null);
  const [formValues, setFormValues] = useState<FieldFormValues>(toFieldFormValues());
  const [actionField, setActionField] = useState<DisplayField | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const activeFields = useMemo(
    () => fields.filter((field) => field.status !== 'inactive').map((field) => toDisplayField(field)),
    [fields],
  );
  const inactiveRows = useMemo(
    () =>
      inactiveFields.length > 0
        ? inactiveFields.map((field) => toDisplayField(field))
        : fields.filter((field) => field.status === 'inactive').map((field) => toDisplayField(field)),
    [inactiveFields, fields],
  );
  const sourceRows = listMode === 'active' ? activeFields : inactiveRows;
  const filteredRows = useMemo(
    () =>
      sourceRows.filter((field) =>
        field.name.toLowerCase().includes(searchValue.trim().toLowerCase()),
      ),
    [sourceRows, searchValue],
  );
  function openCreateSheet() {
    setFormMode('create');
    setEditingField(null);
    setFormValues(toFieldFormValues());
    setFormVisible(true);
  }

  function openEditSheet(field: DisplayField) {
    setFormMode('edit');
    setEditingField(field);
    setFormValues(toFieldFormValues(field));
    setFormVisible(true);
  }

  function closeSheet() {
    setFormVisible(false);
    setEditingField(null);
    setFormValues(toFieldFormValues());
  }

  async function submitForm() {
    const payload = {
      name: formValues.name.trim(),
      area_hectares: formValues.areaHectares.trim(),
      area_unit: formValues.areaUnit,
      shape_polygon: toGeoJsonPolygon(formValues.boundaryPoints),
      location: formValues.location.trim() || null,
      soil_type: formValues.soilType.trim() || null,
      notes: formValues.notes.trim() || null,
    };

    try {
      if (formMode === 'create') {
        await createField(payload);
        showToast({ message: 'Field created.', variant: 'success' });
      } else if (editingField) {
        await updateField(editingField.id, payload);
        showToast({ message: 'Field updated.', variant: 'success' });
      }

      closeSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Field mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitConfirmAction() {
    if (!actionField || !confirmAction) {
      return;
    }

    try {
      if (confirmAction === 'deactivate') {
        await deactivateField(actionField.id);
        showToast({ message: 'Field deactivated.', variant: 'success' });
      } else {
        await reactivateField(actionField.id);
        showToast({ message: 'Field reactivated.', variant: 'success' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Field status update failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmAction(null);
      setActionField(null);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="Fields"
        subtitle="Manage farm fields and lifecycle status."
      />

      <AppTabs
        value="fields"
        onValueChange={(nextValue) => {
          if ((nextValue as ModuleSwitcherValue) === 'lots') {
            router.push('/(protected)/lots');
          }
        }}
        tabs={[
          { value: 'fields', label: 'Fields' },
          { value: 'lots', label: 'Lots' },
        ]}
      />

      <SectionTopActions
        onCreate={openCreateSheet}
        onRefresh={() => void refresh()}
        loading={isRefreshing || isMutating}
      />

      <AppCard>
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search fields"
        >
          <AppTabs
            value={listMode}
            onValueChange={(nextValue) => setListMode(nextValue as FieldListMode)}
            tabs={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </FilterBar>
      </AppCard>

      <AppCard>
        <AppSection
          title="Field records"
          description="Uses shared list/filter/skeleton/error patterns from the UI kit."
        >
          {isLoading ? (
            <>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </>
          ) : errorMessage ? (
            <ErrorState
              message={errorMessage}
              onRetry={() => void refresh()}
            />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title="No fields found"
              message="Try a different search or create a new field."
              actionLabel="Create field"
              onAction={openCreateSheet}
            />
          ) : (
            <PullToRefreshContainer
              refreshing={isRefreshing}
              onRefresh={() => void refresh()}
            >
              <View style={styles.rows}>
                {filteredRows.map((field) => (
                  <AppCard key={field.id}>
                    <AppListItem
                      title={field.name}
                      description={`Area ${field.areaHectares} ${field.areaUnit}`}
                      leftIcon="map"
                      onPress={() => setActionField(field)}
                    />
                    <View style={styles.rowMeta}>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaText}>Status</Text>
                        <AppBadge
                          value={toStatusLabel(field.status)}
                          variant={field.status === 'inactive' ? 'warning' : 'success'}
                        />
                      </View>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaText}>Lots</Text>
                        <AppBadge value={field.lotsCount} variant="accent" />
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            </PullToRefreshContainer>
          )}
        </AppSection>
      </AppCard>

      <PaginationFooter
        page={1}
        pageSize={Math.max(filteredRows.length, 1)}
        totalItems={filteredRows.length}
        onPageChange={() => undefined}
      />

      <BottomSheet
        visible={formVisible}
        onDismiss={closeSheet}
        title={formMode === 'create' ? 'Create Field' : 'Edit Field'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton
              label="Cancel"
              mode="text"
              tone="neutral"
              onPress={closeSheet}
            />
            <AppButton
              label={formMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitForm()}
              disabled={isMutating || !formValues.name.trim() || !formValues.areaHectares.trim()}
              loading={isMutating}
            />
          </View>
        }
      >
        <FormField label="Field name" required>
          <AppInput
            value={formValues.name}
            onChangeText={(nextValue) => setFormValues((current) => ({ ...current, name: nextValue }))}
            placeholder="Field name"
          />
        </FormField>
        <FormField label="Area" required>
          <AppInput
            value={formValues.areaHectares}
            onChangeText={(nextValue) =>
              setFormValues((current) => ({ ...current, areaHectares: nextValue }))
            }
            placeholder="1.00"
          />
        </FormField>
        <FormField label="Area unit">
          <AppSelect
            value={formValues.areaUnit}
            onChange={(nextValue) =>
              setFormValues((current) => ({
                ...current,
                areaUnit: nextValue as FieldFormValues['areaUnit'],
              }))
            }
            options={FIELD_AREA_UNIT_OPTIONS.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
          />
        </FormField>
        <FormField label="Boundary Map">
          <AppPolygonMapEditor
            points={formValues.boundaryPoints}
            onChangePoints={(nextPoints) =>
              setFormValues((current) => ({ ...current, boundaryPoints: nextPoints }))
            }
            testID="fields-boundary-map"
          />
        </FormField>
        <FormField label="Location">
          <AppInput
            value={formValues.location}
            onChangeText={(nextValue) => setFormValues((current) => ({ ...current, location: nextValue }))}
            placeholder="Optional location"
          />
        </FormField>
        <FormField label="Soil type">
          <AppInput
            value={formValues.soilType}
            onChangeText={(nextValue) => setFormValues((current) => ({ ...current, soilType: nextValue }))}
            placeholder="Optional soil type"
          />
        </FormField>
        <FormField label="Notes">
          <AppTextArea
            value={formValues.notes}
            onChangeText={(nextValue) => setFormValues((current) => ({ ...current, notes: nextValue }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <ActionSheet
        visible={Boolean(actionField) && !confirmAction}
        onDismiss={() => setActionField(null)}
        title={actionField?.name}
        message="Choose an action for this field."
        actions={
          actionField
            ? [
                {
                  key: 'edit',
                  label: 'Edit field',
                  onPress: () => openEditSheet(actionField),
                },
                actionField.status === 'inactive'
                  ? {
                      key: 'reactivate',
                      label: 'Reactivate field',
                      onPress: () => setConfirmAction('reactivate'),
                    }
                  : {
                      key: 'deactivate',
                      label: 'Deactivate field',
                      destructive: true,
                      onPress: () => setConfirmAction('deactivate'),
                    },
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(actionField) && Boolean(confirmAction)}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void submitConfirmAction()}
        title={confirmAction === 'deactivate' ? 'Deactivate field?' : 'Reactivate field?'}
        message={
          confirmAction === 'deactivate'
            ? 'This field will move to the inactive list.'
            : 'This field will move back to the active list.'
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        confirmTone={confirmAction === 'deactivate' ? 'destructive' : 'primary'}
        confirmLoading={isMutating}
      />
    </AppScreen>
  );
}

function SectionTopActions({
  onCreate,
  onRefresh,
  loading,
}: {
  onCreate: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.topActions}>
      <View style={styles.primaryAction}>
        <AppButton
          label="Create Field"
          onPress={onCreate}
        />
      </View>
      <View style={styles.secondaryAction}>
        <AppButton
          label="Refresh"
          mode="outlined"
          tone="neutral"
          onPress={onRefresh}
          loading={loading}
        />
      </View>
    </View>
  );
}

function toStatusLabel(status: string): string {
  if (!status) return 'Unknown';
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    minWidth: 120,
  },
  rows: {
    gap: spacing.sm,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: palette.mutedForeground,
    fontWeight: '600',
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
