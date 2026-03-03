import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import type { FieldStatusFilter } from '../../../api/modules/fields';
import type { LotSummary, LotStatusFilter } from '../../../api/modules/lots';
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
import { useAppI18n } from '../../../hooks/useAppI18n';
import { useModuleActionPermissions } from '../../../hooks/useModuleActionPermissions';
import { palette, spacing, typography } from '../../../theme/tokens';
import { fromGeoJsonPolygon, toGeoJsonPolygon, type MapCoordinate } from '../../../utils/geojson';
import { isPointInsideBoundary } from '../../../utils/geometry';
import {
  LOT_PAGE_SIZE,
  LOT_STATUS_FILTER_OPTIONS,
  LOT_TYPE_OPTIONS,
  buildLotSearchText,
  parseCsvValues,
  toLotFormValues,
  type LotFormMode,
  type LotFormStep,
  type LotFormValues,
  type LotStatusFilter as LotStatusFilterContract,
} from '../contracts';
import {
  type LotBoundaryValidationResult,
  resolveBoundaryAfterValidation,
  validateLotBoundaryCandidate,
} from '../geometry-rules';
import { createLotPayloadSchema } from '../validation';
import { useLotsModule } from '../useLotsModule.hook';

type ConfirmAction = 'deactivate' | 'reactivate' | null;
type ModuleSwitcherValue = 'fields' | 'lots';
type ReactivationPath = 'main' | 'deactivated';

const DEFAULT_FIELD_CONTEXT_FILTER: FieldStatusFilter = 'active';

function toLotStatusFilter(value: string): LotStatusFilterContract {
  if (value === 'active' || value === 'inactive') {
    return value;
  }

  return 'all';
}

function formatStatusLabel(status: string): string {
  if (!status) return 'Unknown';
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export function LotsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useAppI18n();
  const permissions = useModuleActionPermissions('lots');

  const [statusFilter, setStatusFilter] = useState<LotStatusFilter>('active');
  const [fieldContextFilter, setFieldContextFilter] = useState<FieldStatusFilter>(DEFAULT_FIELD_CONTEXT_FILTER);
  const [reactivationPath, setReactivationPath] = useState<ReactivationPath>('main');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [formVisible, setFormVisible] = useState(false);
  const [formStep, setFormStep] = useState<LotFormStep>(1);
  const [formMode, setFormMode] = useState<LotFormMode>('create');
  const [editingLot, setEditingLot] = useState<LotSummary | null>(null);
  const [formValues, setFormValues] = useState<LotFormValues>(toLotFormValues());
  const [lastValidBoundaryPoints, setLastValidBoundaryPoints] = useState<MapCoordinate[]>([]);
  const [occupiedLotBoundaries, setOccupiedLotBoundaries] = useState<MapCoordinate[][]>([]);
  const [occupiedBoundaryLoading, setOccupiedBoundaryLoading] = useState(false);
  const [occupiedBoundaryError, setOccupiedBoundaryError] = useState<string | null>(null);
  const [actionLot, setActionLot] = useState<LotSummary | null>(null);
  const [confirmLot, setConfirmLot] = useState<LotSummary | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const {
    lots,
    inactiveLots,
    fieldContextFields,
    fieldOptions,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    listLotsByField,
    createLot,
    updateLot,
    deactivateLot,
    reactivateLotMain,
    reactivateLotFromDeactivated,
  } = useLotsModule({
    statusFilter,
    fieldContextStatusFilter: fieldContextFilter,
    fieldSearchText: searchValue,
  });

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchValue]);

  useEffect(() => {
    if (statusFilter !== 'inactive') {
      setReactivationPath('main');
    }
  }, [statusFilter]);

  const sourceRows = useMemo(() => {
    if (statusFilter === 'inactive') {
      return inactiveLots;
    }
    return lots;
  }, [inactiveLots, lots, statusFilter]);

  const filteredRows = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) {
      return sourceRows;
    }

    return sourceRows.filter((lot) => buildLotSearchText(lot).includes(normalized));
  }, [searchValue, sourceRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / LOT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * LOT_PAGE_SIZE;
    return filteredRows.slice(start, start + LOT_PAGE_SIZE);
  }, [currentPage, filteredRows]);

  const selectedField = useMemo(() => {
    if (!formValues.fieldId) {
      return null;
    }

    return fieldContextFields.find((field) => field.id === formValues.fieldId) ?? null;
  }, [fieldContextFields, formValues.fieldId]);

  const selectedFieldBoundary = useMemo(() => {
    if (!selectedField) {
      return [];
    }

    return fromGeoJsonPolygon(selectedField.shapePolygon);
  }, [selectedField]);

  useEffect(() => {
    let isActive = true;

    if (!formVisible || !formValues.fieldId) {
      setOccupiedLotBoundaries([]);
      setOccupiedBoundaryLoading(false);
      setOccupiedBoundaryError(null);
      return () => {
        isActive = false;
      };
    }

    setOccupiedBoundaryLoading(true);
    setOccupiedBoundaryError(null);
    void listLotsByField(formValues.fieldId)
      .then((rows) => {
        if (!isActive) {
          return;
        }

        const occupied = rows
          .filter((lot) => lot.id !== editingLot?.id)
          .map((lot) => fromGeoJsonPolygon(lot.shapePolygon))
          .filter((points) => points.length >= 3);

        setOccupiedLotBoundaries(occupied);
        setOccupiedBoundaryError(null);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setOccupiedLotBoundaries([]);
        setOccupiedBoundaryError('unable_to_load');
        showToast({
          message: 'Failed to load lot context for boundary validation.',
          variant: 'error',
        });
      })
      .finally(() => {
        if (isActive) {
          setOccupiedBoundaryLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [editingLot?.id, formValues.fieldId, formVisible, listLotsByField, showToast]);

  async function openCreateSheet() {
    setFormMode('create');
    setEditingLot(null);
    setFormStep(1);
    const next = toLotFormValues();
    setFormValues(next);
    setLastValidBoundaryPoints(next.boundaryPoints);
    setOccupiedLotBoundaries([]);
    setOccupiedBoundaryLoading(false);
    setOccupiedBoundaryError(null);
    setFormVisible(true);
  }

  function openEditSheet(lot: LotSummary) {
    setFormMode('edit');
    setEditingLot(lot);
    setFormStep(1);
    const next = toLotFormValues(lot);
    setFormValues(next);
    setLastValidBoundaryPoints(next.boundaryPoints);
    setOccupiedLotBoundaries([]);
    setOccupiedBoundaryLoading(false);
    setOccupiedBoundaryError(null);
    setFormVisible(true);
  }

  function closeSheet() {
    setFormVisible(false);
    setEditingLot(null);
    setFormStep(1);
    const next = toLotFormValues();
    setFormValues(next);
    setLastValidBoundaryPoints(next.boundaryPoints);
    setOccupiedLotBoundaries([]);
    setOccupiedBoundaryLoading(false);
    setOccupiedBoundaryError(null);
  }

  function setFieldId(nextFieldId: string) {
    setFormValues((current) => ({
      ...current,
      fieldId: nextFieldId || null,
      boundaryPoints: [],
    }));
    setLastValidBoundaryPoints([]);
    setOccupiedLotBoundaries([]);
    setOccupiedBoundaryLoading(Boolean(nextFieldId));
    setOccupiedBoundaryError(null);
  }

  function showBoundaryValidationToast(reason: LotBoundaryValidationResult['reason']) {
    if (reason === 'outside_field') {
      showToast({ message: t('map', 'insideFieldError'), variant: 'error' });
      return;
    }

    if (reason === 'overlap') {
      showToast({ message: t('map', 'overlapError'), variant: 'error' });
    }
  }

  function validateLotBoundary(nextPoints: MapCoordinate[]): LotBoundaryValidationResult {
    if (!formValues.fieldId) {
      showToast({ message: 'Select a field first.', variant: 'error' });
      return { valid: false, reason: 'missing_field' };
    }

    if (nextPoints.length === 0) {
      setLastValidBoundaryPoints([]);
      return { valid: true, reason: 'ok' };
    }

    if (selectedFieldBoundary.length < 3) {
      showToast({ message: 'Selected field has no boundary polygon.', variant: 'error' });
      return { valid: false, reason: 'missing_field' };
    }

    if (occupiedBoundaryLoading || occupiedBoundaryError) {
      showToast({ message: 'Lot context is not ready for overlap validation yet.', variant: 'error' });
      return { valid: false, reason: 'missing_field' };
    }

    const validation = validateLotBoundaryCandidate({
      candidate: nextPoints,
      fieldBoundary: selectedFieldBoundary,
      occupiedLots: occupiedLotBoundaries,
    });
    if (!validation.valid) {
      showBoundaryValidationToast(validation.reason);
      return validation;
    }

    setLastValidBoundaryPoints(nextPoints);
    return validation;
  }

  function handleBoundaryPointsChange(nextPoints: MapCoordinate[]) {
    const currentPoints = formValues.boundaryPoints;
    if (nextPoints.length <= currentPoints.length) {
      setFormValues((current) => ({ ...current, boundaryPoints: nextPoints }));
      if (nextPoints.length === 0) {
        setLastValidBoundaryPoints([]);
      }
      return;
    }

    if (!formValues.fieldId) {
      showToast({ message: t('validation', 'lotFieldRequired'), variant: 'error' });
      return;
    }

    if (selectedFieldBoundary.length < 3) {
      showToast({ message: 'Selected field has no boundary polygon.', variant: 'error' });
      return;
    }

    if (occupiedBoundaryLoading) {
      showToast({ message: 'Loading lot context. Try again in a second.', variant: 'error' });
      return;
    }

    if (occupiedBoundaryError) {
      showToast({ message: 'Lot context failed to load. Re-select the field and try again.', variant: 'error' });
      return;
    }

    const appendedPoint = nextPoints[nextPoints.length - 1];
    if (appendedPoint && !isPointInsideBoundary(appendedPoint, selectedFieldBoundary)) {
      showToast({ message: t('map', 'insideFieldError'), variant: 'error' });
      return;
    }

    if (nextPoints.length >= 3) {
      const validation = validateLotBoundaryCandidate({
        candidate: nextPoints,
        fieldBoundary: selectedFieldBoundary,
        occupiedLots: occupiedLotBoundaries,
      });

      if (!validation.valid) {
        showBoundaryValidationToast(validation.reason);
        return;
      }

      setLastValidBoundaryPoints(nextPoints);
    }

    setFormValues((current) => ({ ...current, boundaryPoints: nextPoints }));
  }

  async function submitForm() {
    if (!formValues.fieldId) {
      showToast({ message: t('validation', 'lotFieldRequired'), variant: 'error' });
      return;
    }
    if (!formValues.name.trim()) {
      showToast({ message: t('validation', 'lotNameRequired'), variant: 'error' });
      return;
    }

    if (formValues.boundaryPoints.length > 0) {
      const validation = validateLotBoundary(formValues.boundaryPoints);
      if (!validation.valid) {
        setFormValues((current) => ({
          ...current,
          boundaryPoints: resolveBoundaryAfterValidation({
            candidate: formValues.boundaryPoints,
            lastValid: lastValidBoundaryPoints,
            validation,
          }),
        }));
        showToast({ message: t('map', 'invalidRevert'), variant: 'error' });
        return;
      }
    }

    const payload = {
      field_id: formValues.fieldId,
      name: formValues.name.trim(),
      lot_type: formValues.lotType,
      lot_type_other: formValues.lotTypeOther.trim() || null,
      crop_rotation_plan: 'monoculture' as const,
      crop_rotation_plan_other: formValues.cropRotationPlanOther.trim() || null,
      light_profile: 'full_sun' as const,
      shape_polygon: toGeoJsonPolygon(formValues.boundaryPoints),
      past_seasons_crops: parseCsvValues(formValues.pastSeasonsCropsCsv),
      weather_alerts_enabled: false,
      notes: formValues.notes.trim() || null,
      status: 'active' as const,
    };
    const payloadValidation = createLotPayloadSchema.safeParse(payload);
    if (!payloadValidation.success) {
      showToast({ message: 'Lot payload failed enum/required validation.', variant: 'error' });
      return;
    }

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

  async function handleSubmitOrNext() {
    if (formStep < 3) {
      if (formStep === 1) {
        if (!formValues.fieldId) {
          showToast({ message: t('validation', 'lotFieldRequired'), variant: 'error' });
          return;
        }
        if (!formValues.name.trim()) {
          showToast({ message: t('validation', 'lotNameRequired'), variant: 'error' });
          return;
        }
      }

      setFormStep((current) => (current + 1) as LotFormStep);
      return;
    }

    await submitForm();
  }

  async function submitConfirmAction() {
    if (!confirmLot || !confirmAction) return;

    try {
      if (confirmAction === 'deactivate') {
        await deactivateLot(confirmLot.id);
        showToast({ message: 'Lot deactivated.', variant: 'success' });
      } else if (reactivationPath === 'deactivated') {
        if (confirmLot.fieldStatus !== 'active') {
          showToast({ message: 'Activate the parent field before reactivating this lot.', variant: 'error' });
          return;
        }

        await reactivateLotFromDeactivated(confirmLot.id);
        showToast({ message: 'Lot reactivated.', variant: 'success' });
      } else {
        await reactivateLotMain(confirmLot.id);
        showToast({ message: 'Lot reactivated.', variant: 'success' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lot status update failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmAction(null);
      setConfirmLot(null);
      setActionLot(null);
    }
  }

  const lotOverlays = useMemo(() => {
    const overlays = [] as Array<{
      id: string;
      points: MapCoordinate[];
      strokeColor?: string;
      fillColor?: string;
    }>;

    if (selectedFieldBoundary.length >= 3) {
      overlays.push({
        id: 'selected-field',
        points: selectedFieldBoundary,
        strokeColor: '#2C6BED',
        fillColor: 'rgba(44, 107, 237, 0.12)',
      });
    }

    for (let index = 0; index < occupiedLotBoundaries.length; index += 1) {
      const points = occupiedLotBoundaries[index];
      if (!points || points.length < 3) {
        continue;
      }
      overlays.push({
        id: `occupied-${index}`,
        points,
        strokeColor: '#D14343',
        fillColor: 'rgba(209, 67, 67, 0.12)',
      });
    }

    return overlays;
  }, [occupiedLotBoundaries, selectedFieldBoundary]);

  const boundaryEditorDisabled =
    !formValues.fieldId || selectedFieldBoundary.length < 3 || occupiedBoundaryLoading || Boolean(occupiedBoundaryError);

  const boundaryHelperText = !formValues.fieldId
    ? 'Select a field to enable boundary drawing.'
    : selectedFieldBoundary.length < 3
      ? 'Selected field has no boundary polygon. Draw field boundary first.'
      : occupiedBoundaryLoading
        ? 'Loading existing lots for overlap checks...'
        : occupiedBoundaryError
          ? 'Unable to validate lot overlap right now. Re-select the field to retry.'
        : t('map', 'drawingOptional');

  return (
    <AppScreen scroll>
      <AppHeader title={t('lots', 'title')} subtitle={t('lots', 'subtitle')} />

      <AppTabs
        value="lots"
        onValueChange={(nextValue) => {
          if ((nextValue as ModuleSwitcherValue) === 'fields') {
            router.push('/(protected)/fields');
          }
        }}
        tabs={[
          { value: 'fields', label: t('fields', 'title') },
          { value: 'lots', label: t('lots', 'title') },
        ]}
      />

      <View style={styles.topActions}>
        <View style={styles.primaryAction}>
          <AppButton label={t('lots', 'create')} onPress={() => void openCreateSheet()} disabled={!permissions.permissions.add} />
        </View>
        <View style={styles.secondaryAction}>
          <AppButton
            label={t('common', 'refresh')}
            mode="outlined"
            tone="neutral"
            onPress={() => void refresh()}
            loading={isRefreshing || isMutating}
          />
        </View>
      </View>

      {permissions.permissions.view ? null : (
        <AppCard>
          <EmptyState title="Lots view blocked" message={t('common', 'permissionDenied')} />
        </AppCard>
      )}

      {permissions.permissions.view ? (
        <>
          <AppCard>
            <FilterBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder={t('lots', 'searchPlaceholder')}
            >
              <AppSelect
                testID="lots-status-filter"
                value={statusFilter}
                onChange={(nextValue) => setStatusFilter(toLotStatusFilter(nextValue) as LotStatusFilter)}
                options={LOT_STATUS_FILTER_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                label="Lot status"
              />

              <AppSelect
                testID="lots-field-context-filter"
                value={fieldContextFilter}
                onChange={(nextValue) => {
                  const value = nextValue as FieldStatusFilter;
                  setFieldContextFilter(value);
                }}
                options={[
                  { label: 'Field context: Active', value: 'active' },
                  { label: 'Field context: Inactive', value: 'inactive' },
                  { label: 'Field context: Fallow', value: 'fallow' },
                  { label: 'Field context: Maintenance', value: 'maintenance' },
                  { label: 'Field context: All', value: 'all' },
                ]}
                label="Field context"
              />

              {statusFilter === 'inactive' ? (
                <AppTabs
                  value={reactivationPath}
                  onValueChange={(nextValue) => setReactivationPath(nextValue as ReactivationPath)}
                  tabs={[
                    { value: 'main', label: 'Main flow' },
                    { value: 'deactivated', label: 'Deactivated flow' },
                  ]}
                />
              ) : null}
            </FilterBar>
          </AppCard>

          <AppCard>
            <AppSection title={t('lots', 'records')}>
              {isLoading ? (
                <>
                  <Skeleton height={56} />
                  <Skeleton height={56} />
                  <Skeleton height={56} />
                </>
              ) : errorMessage ? (
                <ErrorState message={errorMessage} onRetry={() => void refresh()} />
              ) : paginatedRows.length === 0 ? (
                <EmptyState
                  title={t('lots', 'noRowsTitle')}
                  message={t('lots', 'noRowsMessage')}
                  actionLabel={permissions.permissions.add ? t('lots', 'create') : undefined}
                  onAction={permissions.permissions.add ? () => void openCreateSheet() : undefined}
                />
              ) : (
                <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
                  <View style={styles.rows}>
                    {paginatedRows.map((lot) => (
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
                            <AppBadge value={formatStatusLabel(lot.status)} variant={lot.status === 'inactive' ? 'warning' : 'success'} />
                          </View>
                          <View style={styles.metaGroup}>
                            <Text style={styles.metaText}>Field</Text>
                            <AppBadge value={lot.fieldStatus ? formatStatusLabel(lot.fieldStatus) : 'N/A'} variant={lot.fieldStatus === 'active' ? 'success' : 'warning'} />
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
            page={currentPage}
            pageSize={LOT_PAGE_SIZE}
            totalItems={filteredRows.length}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <BottomSheet
        visible={formVisible}
        onDismiss={closeSheet}
        title={formMode === 'create' ? t('lots', 'create') : t('lots', 'edit')}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton
              label={formStep === 1 ? t('common', 'cancel') : 'Back'}
              mode="text"
              tone="neutral"
              onPress={() => {
                if (formStep === 1) {
                  closeSheet();
                  return;
                }

                setFormStep((current) => (current - 1) as LotFormStep);
              }}
            />
            <AppButton
              label={formStep === 3 ? (formMode === 'create' ? t('common', 'create') : t('common', 'save')) : t('common', 'next')}
              onPress={() => void handleSubmitOrNext()}
              loading={isMutating}
              disabled={isMutating}
              testID="lots-form-submit-next"
            />
          </View>
        }
      >
        <AppTabs
          value={`${formStep}`}
          onValueChange={(next) => {
            const nextStep = Number(next) as LotFormStep;
            if (nextStep === 2 && !formValues.fieldId) {
              showToast({ message: t('validation', 'lotFieldRequired'), variant: 'error' });
              setFormStep(1);
              return;
            }

            setFormStep(nextStep);
          }}
          tabs={[
            { value: '1', label: 'Basic' },
            { value: '2', label: 'Boundary', disabled: !formValues.fieldId },
            { value: '3', label: 'Notes' },
          ]}
        />

        {formStep === 1 ? (
          <>
            <FormField
              label="Field"
              required
              helperText={fieldOptions.length === 0 ? 'No fields available in current field context.' : undefined}
            >
              <AppSelect
                testID="lots-form-field-select"
                value={formValues.fieldId}
                onChange={setFieldId}
                options={fieldOptions}
                placeholder="Select field"
              />
            </FormField>

            <FormField label="Lot name" required>
              <AppInput
                value={formValues.name}
                onChangeText={(nextValue) => setFormValues((current) => ({ ...current, name: nextValue }))}
                placeholder="Lot name"
              />
            </FormField>

            <FormField label="Lot type" required>
              <AppSelect
                value={formValues.lotType}
                onChange={(nextValue) =>
                  setFormValues((current) => ({
                    ...current,
                    lotType: nextValue as LotFormValues['lotType'],
                    lotTypeOther: nextValue === 'other' ? current.lotTypeOther : '',
                  }))
                }
                options={LOT_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
              />
            </FormField>

            {formValues.lotType === 'other' ? (
              <FormField label="Lot type (other)">
                <AppInput
                  value={formValues.lotTypeOther}
                  onChangeText={(nextValue) =>
                    setFormValues((current) => ({ ...current, lotTypeOther: nextValue }))
                  }
                  placeholder="Specify lot type"
                />
              </FormField>
            ) : null}
          </>
        ) : null}

        {formStep === 2 ? (
          <>
            <FormField label={t('map', 'boundary')} helperText={boundaryHelperText}>
              <AppPolygonMapEditor
                points={formValues.boundaryPoints}
                onChangePoints={handleBoundaryPointsChange}
                overlays={lotOverlays}
                instructionText={t('map', 'snapHint')}
                disabled={boundaryEditorDisabled}
                onComplete={(points) => {
                  const validation = validateLotBoundary(points);
                  if (validation.valid) {
                    setFormValues((current) => ({ ...current, boundaryPoints: points }));
                    return;
                  }

                  setFormValues((current) => ({
                    ...current,
                    boundaryPoints: resolveBoundaryAfterValidation({
                      candidate: points,
                      lastValid: lastValidBoundaryPoints,
                      validation,
                    }),
                  }));
                  showToast({ message: t('map', 'invalidRevert'), variant: 'error' });
                }}
                onInvalidAction={(reason) => {
                  if (reason === 'min_points') {
                    showToast({ message: t('validation', 'polygonMinPoints'), variant: 'error' });
                  }
                  if (reason === 'self_intersection') {
                    showToast({ message: t('validation', 'polygonSelfIntersect'), variant: 'error' });
                  }
                }}
                testID="lots-boundary-map"
              />
            </FormField>

            <Text style={styles.helperText}>
              Field polygon is highlighted in blue. Occupied lots are highlighted in red.
            </Text>
          </>
        ) : null}

        {formStep === 3 ? (
          <>
            <FormField label="Notes">
              <AppTextArea
                value={formValues.notes}
                onChangeText={(nextValue) => setFormValues((current) => ({ ...current, notes: nextValue }))}
                placeholder="Optional notes"
              />
            </FormField>
          </>
        ) : null}
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
                  disabled: !permissions.permissions.edit,
                },
                actionLot.status === 'inactive'
                  ? {
                      key: 'reactivate',
                      label: reactivationPath === 'deactivated' ? 'Reactivate (Deactivated flow)' : 'Reactivate (Main flow)',
                      onPress: () => {
                        setConfirmLot(actionLot);
                        setConfirmAction('reactivate');
                      },
                      disabled:
                        !permissions.permissions.delete ||
                        (reactivationPath === 'deactivated' && actionLot.fieldStatus !== 'active'),
                    }
                  : {
                      key: 'deactivate',
                      label: 'Deactivate lot',
                      destructive: true,
                      onPress: () => {
                        setConfirmLot(actionLot);
                        setConfirmAction('deactivate');
                      },
                      disabled: !permissions.permissions.delete,
                    },
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(confirmLot) && Boolean(confirmAction)}
        onCancel={() => {
          setConfirmAction(null);
          setConfirmLot(null);
        }}
        onConfirm={() => void submitConfirmAction()}
        title={confirmAction === 'deactivate' ? t('lots', 'deactivateConfirm') : t('lots', 'reactivateConfirm')}
        message={
          confirmAction === 'deactivate'
            ? 'This lot will move to the inactive list.'
            : reactivationPath === 'deactivated'
              ? 'Deactivated flow requires parent field status active.'
              : 'Main flow reactivates via status update payload.'
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        confirmTone={confirmAction === 'deactivate' ? 'destructive' : 'primary'}
        confirmLoading={isMutating}
      />
    </AppScreen>
  );
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
  helperText: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
});
