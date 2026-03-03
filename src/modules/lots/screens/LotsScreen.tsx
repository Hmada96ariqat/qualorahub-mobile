import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import type { LotSummary } from '../../../api/modules/lots';
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
  CROP_ROTATION_OPTIONS,
  LIGHT_PROFILE_OPTIONS,
  LOT_TYPE_OPTIONS,
  toLotFormValues,
  type LotFormMode,
  type LotFormValues,
  type LotListMode,
} from '../contracts';
import { useLotsModule } from '../useLotsModule.hook';

type ConfirmAction = 'deactivate' | 'reactivate' | null;
type ModuleSwitcherValue = 'fields' | 'lots';

export function LotsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    lots,
    inactiveLots,
    fieldOptions,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    createLot,
    updateLot,
    deactivateLot,
    reactivateLot,
  } = useLotsModule();

  const [listMode, setListMode] = useState<LotListMode>('active');
  const [searchValue, setSearchValue] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<LotFormMode>('create');
  const [editingLot, setEditingLot] = useState<LotSummary | null>(null);
  const [formValues, setFormValues] = useState<LotFormValues>(toLotFormValues());
  const [actionLot, setActionLot] = useState<LotSummary | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const activeLots = useMemo(
    () => lots.filter((lot) => lot.status !== 'inactive'),
    [lots],
  );
  const inactiveRows = useMemo(
    () => (inactiveLots.length > 0 ? inactiveLots : lots.filter((lot) => lot.status === 'inactive')),
    [inactiveLots, lots],
  );
  const sourceRows = listMode === 'active' ? activeLots : inactiveRows;
  const filteredRows = useMemo(
    () =>
      sourceRows.filter((lot) =>
        lot.name.toLowerCase().includes(searchValue.trim().toLowerCase()),
      ),
    [sourceRows, searchValue],
  );
  function openCreateSheet() {
    setFormMode('create');
    setEditingLot(null);
    setFormValues(toLotFormValues());
    setFormVisible(true);
  }

  function openEditSheet(lot: LotSummary) {
    setFormMode('edit');
    setEditingLot(lot);
    setFormValues(toLotFormValues(lot));
    setFormVisible(true);
  }

  function closeSheet() {
    setFormVisible(false);
    setEditingLot(null);
    setFormValues(toLotFormValues());
  }

  async function submitForm() {
    if (!formValues.fieldId) {
      showToast({ message: 'Select a field first.', variant: 'error' });
      return;
    }

    const payload = {
      field_id: formValues.fieldId,
      name: formValues.name.trim(),
      lot_type: formValues.lotType,
      crop_rotation_plan: formValues.cropRotationPlan,
      light_profile: formValues.lightProfile,
      shape_polygon: toGeoJsonPolygon(formValues.boundaryPoints),
      notes: formValues.notes.trim() || null,
    };

    try {
      if (formMode === 'create') {
        await createLot(payload);
        showToast({ message: 'Lot created.', variant: 'success' });
      } else if (editingLot) {
        await updateLot(editingLot.id, payload);
        showToast({ message: 'Lot updated.', variant: 'success' });
      }

      closeSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lot mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitConfirmAction() {
    if (!actionLot || !confirmAction) return;

    try {
      if (confirmAction === 'deactivate') {
        await deactivateLot(actionLot.id);
        showToast({ message: 'Lot deactivated.', variant: 'success' });
      } else {
        await reactivateLot(actionLot.id);
        showToast({ message: 'Lot reactivated.', variant: 'success' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lot status update failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmAction(null);
      setActionLot(null);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="Lots"
        subtitle="Manage lot inventory and lifecycle status."
      />

      <AppTabs
        value="lots"
        onValueChange={(nextValue) => {
          if ((nextValue as ModuleSwitcherValue) === 'fields') {
            router.push('/(protected)/fields');
          }
        }}
        tabs={[
          { value: 'fields', label: 'Fields' },
          { value: 'lots', label: 'Lots' },
        ]}
      />

      <View style={styles.topActions}>
        <View style={styles.primaryAction}>
          <AppButton
            label="Create Lot"
            onPress={openCreateSheet}
          />
        </View>
        <View style={styles.secondaryAction}>
          <AppButton
            label="Refresh"
            mode="outlined"
            tone="neutral"
            onPress={() => void refresh()}
            loading={isRefreshing || isMutating}
          />
        </View>
      </View>

      <AppCard>
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search lots"
        >
          <AppTabs
            value={listMode}
            onValueChange={(nextValue) => setListMode(nextValue as LotListMode)}
            tabs={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </FilterBar>
      </AppCard>

      <AppCard>
        <AppSection
          title="Lot records"
          description="List state and actions use shared components and reuse patterns."
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
              title="No lots found"
              message="Try a different search or create a new lot."
              actionLabel="Create lot"
              onAction={openCreateSheet}
            />
          ) : (
            <PullToRefreshContainer
              refreshing={isRefreshing}
              onRefresh={() => void refresh()}
            >
              <View style={styles.rows}>
                {filteredRows.map((lot) => (
                  <AppCard key={lot.id}>
                    <AppListItem
                      title={lot.name}
                      description={`${lot.fieldName ?? 'Unknown field'} • ${lot.lotType}`}
                      leftIcon="layers"
                      onPress={() => setActionLot(lot)}
                    />
                    <View style={styles.rowMeta}>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaText}>Status</Text>
                        <AppBadge
                          value={toStatusLabel(lot.status)}
                          variant={lot.status === 'inactive' ? 'warning' : 'success'}
                        />
                      </View>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaText}>Alerts</Text>
                        <AppBadge
                          value={lot.weatherAlertsEnabled ? 'On' : 'Off'}
                          variant={lot.weatherAlertsEnabled ? 'success' : 'neutral'}
                        />
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
        title={formMode === 'create' ? 'Create Lot' : 'Edit Lot'}
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
              disabled={isMutating || !formValues.name.trim() || !formValues.fieldId}
              loading={isMutating}
            />
          </View>
        }
      >
        <FormField
          label="Field"
          required
          helperText={fieldOptions.length === 0 ? 'No active fields available.' : undefined}
        >
          <AppSelect
            value={formValues.fieldId}
            onChange={(nextValue) => setFormValues((current) => ({ ...current, fieldId: nextValue }))}
            options={fieldOptions}
            placeholder="Select field"
          />
        </FormField>

        <FormField
          label="Lot name"
          required
        >
          <AppInput
            value={formValues.name}
            onChangeText={(nextValue) => setFormValues((current) => ({ ...current, name: nextValue }))}
            placeholder="Lot name"
          />
        </FormField>

        <FormField
          label="Lot type"
          required
        >
          <AppSelect
            value={formValues.lotType}
            onChange={(nextValue) =>
              setFormValues((current) => ({
                ...current,
                lotType: nextValue as LotFormValues['lotType'],
              }))
            }
            options={LOT_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>

        <FormField
          label="Crop rotation"
          required
        >
          <AppSelect
            value={formValues.cropRotationPlan}
            onChange={(nextValue) =>
              setFormValues((current) => ({
                ...current,
                cropRotationPlan: nextValue as LotFormValues['cropRotationPlan'],
              }))
            }
            options={CROP_ROTATION_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>

        <FormField
          label="Light profile"
          required
        >
          <AppSelect
            value={formValues.lightProfile}
            onChange={(nextValue) =>
              setFormValues((current) => ({
                ...current,
                lightProfile: nextValue as LotFormValues['lightProfile'],
              }))
            }
            options={LIGHT_PROFILE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>

        <FormField label="Boundary Map">
          <AppPolygonMapEditor
            points={formValues.boundaryPoints}
            onChangePoints={(nextPoints) =>
              setFormValues((current) => ({ ...current, boundaryPoints: nextPoints }))
            }
            testID="lots-boundary-map"
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
        visible={Boolean(actionLot) && !confirmAction}
        onDismiss={() => setActionLot(null)}
        title={actionLot?.name}
        message="Choose an action for this lot."
        actions={
          actionLot
            ? [
                {
                  key: 'edit',
                  label: 'Edit lot',
                  onPress: () => openEditSheet(actionLot),
                },
                actionLot.status === 'inactive'
                  ? {
                      key: 'reactivate',
                      label: 'Reactivate lot',
                      onPress: () => setConfirmAction('reactivate'),
                    }
                  : {
                      key: 'deactivate',
                      label: 'Deactivate lot',
                      destructive: true,
                      onPress: () => setConfirmAction('deactivate'),
                    },
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(actionLot) && Boolean(confirmAction)}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void submitConfirmAction()}
        title={confirmAction === 'deactivate' ? 'Deactivate lot?' : 'Reactivate lot?'}
        message={
          confirmAction === 'deactivate'
            ? 'This lot will move to the inactive list.'
            : 'This lot will move back to the active list.'
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        confirmTone={confirmAction === 'deactivate' ? 'destructive' : 'primary'}
        confirmLoading={isMutating}
      />
    </AppScreen>
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
