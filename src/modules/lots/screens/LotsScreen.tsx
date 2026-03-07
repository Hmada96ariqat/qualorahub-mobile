import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { FieldStatusFilter } from '../../../api/modules/fields';
import type { LotSummary, LotStatusFilter } from '../../../api/modules/lots';
import {
  AppButton,
  AppInput,
  AppPolygonMapEditor,
  AppScreen,
  AppSelect,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  DotBadge,
  EmptyState,
  ErrorState,
  FormValidationProvider,
  FormField,
  HeaderIconButton,
  HeaderMenuButton,
  ListRow,
  PaginationFooter,
  PillTabs,
  ProfileCard,
  PullToRefreshContainer,
  QuickActionGrid,
  SearchBar,
  SectionHeader,
  Skeleton,
  StatStrip,
  SystemHeaderActions,
  UnderlineTabs,
  useFormValidation,
  useToast,
} from '../../../components';
import type { DotBadgeVariant, ListRowIconVariant, QuickAction } from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { useModuleActionPermissions } from '../../../hooks/useModuleActionPermissions';
import { palette } from '../../../theme/tokens';
import { fromGeoJsonPolygon, toGeoJsonPolygon, type MapCoordinate } from '../../../utils/geojson';
import { isPointInsideBoundary } from '../../../utils/geometry';
import { formatApiErrorMessage, isActiveLifecycleStatus } from '../../../utils/lifecycle';
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

// ─── local types ─────────────────────────────────────────────────────────────

type ConfirmAction = 'deactivate' | 'reactivate' | null;
type ModuleSwitcherValue = 'fields' | 'lots';
type ReactivationPath = 'main' | 'deactivated';

const DEFAULT_FIELD_CONTEXT_FILTER: FieldStatusFilter = 'active';

const FIELD_CONTEXT_OPTIONS = [
  { label: 'Active fields', value: 'active' as FieldStatusFilter },
  { label: 'Inactive fields', value: 'inactive' as FieldStatusFilter },
  { label: 'Fallow fields', value: 'fallow' as FieldStatusFilter },
  { label: 'Maintenance fields', value: 'maintenance' as FieldStatusFilter },
  { label: 'All fields', value: 'all' as FieldStatusFilter },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function toLotStatusFilter(value: string): LotStatusFilterContract {
  if (value === 'active' || value === 'inactive') return value;
  return 'all';
}

function formatStatusLabel(status: string): string {
  if (!status) return 'Unknown';
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function toLotDotBadgeVariant(status: string): DotBadgeVariant {
  return status === 'active' ? 'success' : 'warning';
}

function toLotIconVariant(status: string): ListRowIconVariant {
  return status === 'active' ? 'green' : 'amber';
}

// ─── screen ──────────────────────────────────────────────────────────────────

export function LotsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const formScrollViewRef = useRef<ScrollView | null>(null);
  const formValidation = useFormValidation<'fieldId' | 'name'>(formScrollViewRef);
  const { t } = useAppI18n();
  const permissions = useModuleActionPermissions('lots');

  const [statusFilter, setStatusFilter] = useState<LotStatusFilter>('active');
  const [fieldContextFilter, setFieldContextFilter] = useState<FieldStatusFilter>(
    DEFAULT_FIELD_CONTEXT_FILTER,
  );
  const [reactivationPath, setReactivationPath] = useState<ReactivationPath>('main');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

  // — form state
  const [formVisible, setFormVisible] = useState(false);
  const [formStep, setFormStep] = useState<LotFormStep>(1);
  const [formMode, setFormMode] = useState<LotFormMode>('create');
  const [editingLot, setEditingLot] = useState<LotSummary | null>(null);
  const [formValues, setFormValues] = useState<LotFormValues>(toLotFormValues());
  const [lastValidBoundaryPoints, setLastValidBoundaryPoints] = useState<MapCoordinate[]>([]);
  const [occupiedLotBoundaries, setOccupiedLotBoundaries] = useState<MapCoordinate[][]>([]);
  const [occupiedBoundaryLoading, setOccupiedBoundaryLoading] = useState(false);
  const [occupiedBoundaryError, setOccupiedBoundaryError] = useState<string | null>(null);

  // — detail sheet (replaces ActionSheet)
  const [detailLot, setDetailLot] = useState<LotSummary | null>(null);

  // — confirm dialog
  const [confirmLot, setConfirmLot] = useState<LotSummary | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const {
    lots,
    inactiveLots,
    allFields,
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
    if (statusFilter === 'inactive') return inactiveLots;
    return lots;
  }, [inactiveLots, lots, statusFilter]);

  const filteredRows = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return sourceRows;
    return sourceRows.filter((lot) => buildLotSearchText(lot).includes(normalized));
  }, [searchValue, sourceRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / LOT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * LOT_PAGE_SIZE;
    return filteredRows.slice(start, start + LOT_PAGE_SIZE);
  }, [currentPage, filteredRows]);

  const selectedField = useMemo(() => {
    if (!formValues.fieldId) return null;
    return allFields.find((field) => field.id === formValues.fieldId) ?? null;
  }, [allFields, formValues.fieldId]);

  const formFieldOptions = useMemo(() => {
    if (!formValues.fieldId || fieldOptions.some((option) => option.value === formValues.fieldId)) {
      return fieldOptions;
    }

    const selected = allFields.find((field) => field.id === formValues.fieldId);
    if (!selected) {
      return fieldOptions;
    }

    return [
      {
        label: `${selected.name} (${formatStatusLabel(selected.status)})`,
        value: selected.id,
      },
      ...fieldOptions,
    ];
  }, [allFields, fieldOptions, formValues.fieldId]);

  const selectedFieldBoundary = useMemo(() => {
    if (!selectedField) return [];
    return fromGeoJsonPolygon(selectedField.shapePolygon);
  }, [selectedField]);

  useEffect(() => {
    let isActive = true;

    if (!formVisible || !formValues.fieldId) {
      setOccupiedLotBoundaries([]);
      setOccupiedBoundaryLoading(false);
      setOccupiedBoundaryError(null);
      return () => { isActive = false; };
    }

    setOccupiedBoundaryLoading(true);
    setOccupiedBoundaryError(null);
    void listLotsByField(formValues.fieldId)
      .then((rows) => {
        if (!isActive) return;
        const occupied = rows
          .filter((lot) => lot.id !== editingLot?.id)
          .map((lot) => fromGeoJsonPolygon(lot.shapePolygon))
          .filter((points) => points.length >= 3);
        setOccupiedLotBoundaries(occupied);
        setOccupiedBoundaryError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setOccupiedLotBoundaries([]);
        setOccupiedBoundaryError('unable_to_load');
        showToast({ message: 'Failed to load lot context for boundary validation.', variant: 'error' });
      })
      .finally(() => {
        if (isActive) setOccupiedBoundaryLoading(false);
      });

    return () => { isActive = false; };
  }, [editingLot?.id, formValues.fieldId, formVisible, listLotsByField, showToast]);

  // ─── form helpers ────────────────────────────────────────────────────────

  async function openCreateSheet() {
    setFormMode('create');
    setEditingLot(null);
    setFormStep(1);
    formValidation.reset();
    const next = toLotFormValues();
    setFormValues(next);
    setLastValidBoundaryPoints(next.boundaryPoints);
    setOccupiedLotBoundaries([]);
    setOccupiedBoundaryLoading(false);
    setOccupiedBoundaryError(null);
    setFormVisible(true);
  }

  function openEditSheet(lot: LotSummary) {
    setDetailLot(null);
    setFormMode('edit');
    setEditingLot(lot);
    setFormStep(1);
    formValidation.reset();
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
    formValidation.reset();
    const next = toLotFormValues();
    setFormValues(next);
    setLastValidBoundaryPoints(next.boundaryPoints);
    setOccupiedLotBoundaries([]);
    setOccupiedBoundaryLoading(false);
    setOccupiedBoundaryError(null);
  }

  function setFieldId(nextFieldId: string) {
    formValidation.clearFieldError('fieldId');
    setFormValues((current) => ({ ...current, fieldId: nextFieldId || null, boundaryPoints: [] }));
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
      if (nextPoints.length === 0) setLastValidBoundaryPoints([]);
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
    const valid = formValidation.validate([
      {
        field: 'fieldId',
        message: t('validation', 'lotFieldRequired'),
        isValid: Boolean(formValues.fieldId),
      },
      {
        field: 'name',
        message: t('validation', 'lotNameRequired'),
        isValid: formValues.name.trim().length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
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
    if (!formValues.fieldId) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }
    if (!selectedField) {
      showToast({ message: 'Select a valid field before saving this lot.', variant: 'error' });
      return;
    }
    if (formValues.status === 'active' && !isActiveLifecycleStatus(selectedField.status)) {
      showToast({
        message: 'Active lots can only be assigned to active fields.',
        variant: 'error',
      });
      return;
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
      status: formValues.status,
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
      showToast({
        message: formatApiErrorMessage(error, 'Lot mutation failed.'),
        variant: 'error',
      });
    }
  }

  async function handleSubmitOrNext() {
    if (formStep < 3) {
      if (formStep === 1) {
        const valid = formValidation.validate([
          {
            field: 'fieldId',
            message: t('validation', 'lotFieldRequired'),
            isValid: Boolean(formValues.fieldId),
          },
          {
            field: 'name',
            message: t('validation', 'lotNameRequired'),
            isValid: formValues.name.trim().length > 0,
          },
        ]);
        if (!valid) {
          showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
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
      } else if (!isActiveLifecycleStatus(confirmLot.fieldStatus)) {
        showToast({ message: 'Activate the parent field before reactivating this lot.', variant: 'error' });
        return;
      } else if (reactivationPath === 'deactivated') {
        await reactivateLotFromDeactivated(confirmLot.id);
        showToast({ message: 'Lot reactivated.', variant: 'success' });
      } else {
        await reactivateLotMain(confirmLot.id);
        showToast({ message: 'Lot reactivated.', variant: 'success' });
      }
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Lot status update failed.'),
        variant: 'error',
      });
    } finally {
      setConfirmAction(null);
      setConfirmLot(null);
      setDetailLot(null);
    }
  }

  // ─── lot overlays for map ────────────────────────────────────────────────

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
      if (!points || points.length < 3) continue;
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
    !formValues.fieldId ||
    selectedFieldBoundary.length < 3 ||
    occupiedBoundaryLoading ||
    Boolean(occupiedBoundaryError);

  const boundaryHelperText = !formValues.fieldId
    ? 'Select a field to enable boundary drawing.'
    : selectedFieldBoundary.length < 3
      ? 'Selected field has no boundary polygon. Draw field boundary first.'
      : occupiedBoundaryLoading
        ? 'Loading existing lots for overlap checks…'
        : occupiedBoundaryError
          ? 'Unable to validate lot overlap right now. Re-select the field to retry.'
          : t('map', 'drawingOptional');

  // ─── quick actions ───────────────────────────────────────────────────────

  function buildLotQuickActions(lot: LotSummary): QuickAction[] {
    const actions: QuickAction[] = [];

    if (permissions.permissions.edit) {
      actions.push({
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => openEditSheet(lot),
      });
    }

    if (lot.status === 'active' && permissions.permissions.delete) {
      actions.push({
        key: 'deactivate',
        icon: 'pause-circle-outline',
        label: 'Deactivate',
        color: 'amber',
        onPress: () => {
          setDetailLot(null);
          setConfirmLot(lot);
          setConfirmAction('deactivate');
        },
      });
    } else if (lot.status !== 'active' && permissions.permissions.delete) {
      const canReactivate = isActiveLifecycleStatus(lot.fieldStatus);
      if (canReactivate) {
        actions.push({
          key: 'reactivate',
          icon: 'play-circle-outline',
          label: reactivationPath === 'deactivated' ? 'Reactivate' : 'Reactivate',
          color: 'green',
          onPress: () => {
            setDetailLot(null);
            setConfirmLot(lot);
            setConfirmAction('reactivate');
          },
        });
      }
    }

    return actions;
  }

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <AppScreen padded={false}>
      {/* Sticky header */}
      <View style={styles.header}>
        <View style={styles.headerLead}>
          <HeaderMenuButton testID="lots-header-menu" />
          <Text style={styles.headerTitle}>{t('lots', 'title')}</Text>
        </View>
        <SystemHeaderActions notificationTestID="lots-header-notifications">
          {permissions.permissions.add ? (
            <HeaderIconButton
              icon="plus"
              onPress={() => void openCreateSheet()}
              filled
              testID="lots-header-create"
            />
          ) : null}
        </SystemHeaderActions>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder={t('lots', 'searchPlaceholder')}
        />
      </View>

      {/* Module switcher */}
      <View style={styles.moduleSwitch}>
        <PillTabs
          value="lots"
          tabs={[
            { value: 'fields', label: t('fields', 'title') },
            { value: 'lots', label: t('lots', 'title') },
          ]}
          onValueChange={(nextValue) => {
            if ((nextValue as ModuleSwitcherValue) === 'fields') {
              router.replace('/(protected)/fields');
            }
          }}
          testID="lots-module-switch"
        />
      </View>

      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Summary strip */}
          <StatStrip
            items={[
              { value: filteredRows.length, label: 'Lots', color: 'green' },
              { value: inactiveLots.length, label: 'Inactive', color: 'amber' },
            ]}
          />

          {/* Status pill filter */}
          <PillTabs
            value={statusFilter}
            tabs={LOT_STATUS_FILTER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onValueChange={(v) => setStatusFilter(toLotStatusFilter(v) as LotStatusFilter)}
            testID="lots-status-filter"
          />

          {/* Field context filter (compact) */}
          <View style={styles.contextRow}>
            <AppSelect
              value={fieldContextFilter}
              onChange={(v) => setFieldContextFilter(v as FieldStatusFilter)}
              options={FIELD_CONTEXT_OPTIONS}
              label="Field context"
            />
          </View>

          {/* Reactivation path (only when showing inactive lots) */}
          {statusFilter === 'inactive' ? (
            <View style={styles.reactivationSection}>
              <PillTabs
                value={reactivationPath}
                tabs={[
                  { value: 'main', label: 'Main flow' },
                  { value: 'deactivated', label: 'Deactivated flow' },
                ]}
                onValueChange={(v) => setReactivationPath(v as ReactivationPath)}
              />
            </View>
          ) : null}

          {!permissions.permissions.view ? (
            <EmptyState
              title="Access denied"
              message={t('common', 'permissionDenied')}
            />
          ) : (
            <>
              <SectionHeader
                title={t('lots', 'records')}
                trailing={
                  filteredRows.length > 0
                    ? `${filteredRows.length} lot${filteredRows.length > 1 ? 's' : ''}`
                    : undefined
                }
              />

              {isLoading ? (
                <>
                  <Skeleton height={68} />
                  <Skeleton height={68} />
                  <Skeleton height={68} />
                </>
              ) : errorMessage ? (
                <ErrorState message={errorMessage} onRetry={() => void refresh()} />
              ) : paginatedRows.length === 0 ? (
                <EmptyState
                  title={t('lots', 'noRowsTitle')}
                  message={t('lots', 'noRowsMessage')}
                  actionLabel={permissions.permissions.add ? t('lots', 'create') : undefined}
                  onAction={
                    permissions.permissions.add ? () => void openCreateSheet() : undefined
                  }
                />
              ) : (
                paginatedRows.map((lot) => (
                  <ListRow
                    key={lot.id}
                    testID={`lot-row-${lot.id}`}
                    icon="layers"
                    iconVariant={toLotIconVariant(lot.status)}
                    title={lot.name}
                    subtitle={`${lot.fieldName ?? 'Unknown field'} • ${lot.lotType}`}
                    badge={
                      <DotBadge
                        label={formatStatusLabel(lot.status)}
                        variant={toLotDotBadgeVariant(lot.status)}
                      />
                    }
                    onPress={() => setDetailLot(lot)}
                  />
                ))
              )}

              {filteredRows.length > LOT_PAGE_SIZE ? (
                <PaginationFooter
                  page={currentPage}
                  pageSize={LOT_PAGE_SIZE}
                  totalItems={filteredRows.length}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </ScrollView>
      </PullToRefreshContainer>

      {/* ─── Lot detail sheet ─────────────────────────────────────────────── */}
      <BottomSheet
        visible={Boolean(detailLot)}
        onDismiss={() => setDetailLot(null)}
        title={detailLot?.name ?? 'Lot'}
      >
        {detailLot ? (
          <>
            <ProfileCard
              icon="layers"
              name={detailLot.name}
              subtitle={`${detailLot.fieldName ?? 'Unknown field'} • ${formatStatusLabel(detailLot.status)}`}
              cells={[
                { label: 'Status', value: formatStatusLabel(detailLot.status) },
                { label: 'Field', value: detailLot.fieldName ?? '—' },
                { label: 'Type', value: detailLot.lotType },
                {
                  label: 'Field Status',
                  value: detailLot.fieldStatus ? formatStatusLabel(detailLot.fieldStatus) : '—',
                },
              ]}
            />
            <QuickActionGrid actions={buildLotQuickActions(detailLot)} />
          </>
        ) : null}
      </BottomSheet>

      {/* ─── Lot form sheet ───────────────────────────────────────────────── */}
      <BottomSheet
        visible={formVisible}
        onDismiss={closeSheet}
        scrollViewRef={formScrollViewRef}
        title={formMode === 'create' ? t('lots', 'create') : t('lots', 'edit')}
        footer={
          <View style={styles.formFooter}>
            <View style={styles.formBtn}>
              <AppButton
                label={formStep === 1 ? t('common', 'cancel') : 'Back'}
                mode="outlined"
                tone="neutral"
                onPress={() => {
                  if (formStep === 1) {
                    closeSheet();
                    return;
                  }
                  setFormStep((current) => (current - 1) as LotFormStep);
                }}
              />
            </View>
            <View style={styles.formBtn}>
              <AppButton
                label={
                  formStep === 3
                    ? formMode === 'create'
                      ? t('common', 'create')
                      : t('common', 'save')
                    : t('common', 'next')
                }
                onPress={() => void handleSubmitOrNext()}
                loading={isMutating}
                disabled={isMutating}
                testID="lots-form-submit-next"
              />
            </View>
          </View>
        }
      >
        <UnderlineTabs
          value={`${formStep}`}
          tabs={[
            { value: '1', label: 'Basic' },
            { value: '2', label: 'Boundary' },
            { value: '3', label: 'Notes' },
          ]}
          onValueChange={(next) => {
            const nextStep = Number(next) as LotFormStep;
            if (nextStep === 2 && !formValues.fieldId) {
              formValidation.validate([
                {
                  field: 'fieldId',
                  message: t('validation', 'lotFieldRequired'),
                  isValid: false,
                },
              ]);
              showToast({ message: t('validation', 'lotFieldRequired'), variant: 'error' });
              setFormStep(1);
              return;
            }
            setFormStep(nextStep);
          }}
        />

        <FormValidationProvider value={formValidation.providerValue}>
          {/* Step 1: Basic */}
          {formStep === 1 ? (
            <>
              <FormField
                label="Field"
                name="fieldId"
                required
                helperText={
                  formFieldOptions.length === 0
                    ? 'No active fields available for lot workflows.'
                    : undefined
                }
              >
                <AppSelect
                  testID="lots-form-field-select"
                  value={formValues.fieldId}
                  onChange={setFieldId}
                  options={formFieldOptions}
                  placeholder="Select field"
                />
              </FormField>

              <FormField label="Lot name" name="name" required>
                <AppInput
                  value={formValues.name}
                  onChangeText={(nextValue) => {
                    formValidation.clearFieldError('name');
                    setFormValues((current) => ({ ...current, name: nextValue }));
                  }}
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
                  options={LOT_TYPE_OPTIONS.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
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

          {/* Step 2: Boundary */}
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
                      showToast({
                        message: t('validation', 'polygonSelfIntersect'),
                        variant: 'error',
                      });
                    }
                  }}
                  testID="lots-boundary-map"
                />
              </FormField>

              <Text style={styles.boundaryHint}>
                Field polygon is highlighted in blue. Occupied lots are highlighted in red.
              </Text>
            </>
          ) : null}

          {/* Step 3: Notes */}
          {formStep === 3 ? (
            <FormField label="Notes">
              <AppTextArea
                value={formValues.notes}
                onChangeText={(nextValue) =>
                  setFormValues((current) => ({ ...current, notes: nextValue }))
                }
                placeholder="Optional notes"
              />
            </FormField>
          ) : null}
        </FormValidationProvider>
      </BottomSheet>

      {/* ─── Confirm deactivate / reactivate ─────────────────────────────── */}
      <ConfirmDialog
        visible={Boolean(confirmLot) && Boolean(confirmAction)}
        onCancel={() => {
          setConfirmAction(null);
          setConfirmLot(null);
        }}
        onConfirm={() => void submitConfirmAction()}
        title={
          confirmAction === 'deactivate'
            ? t('lots', 'deactivateConfirm')
            : t('lots', 'reactivateConfirm')
        }
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
        cancelLabel="Cancel"
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: palette.background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.foreground,
  },
  headerLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  moduleSwitch: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
    backgroundColor: palette.background,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: palette.background,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  contextRow: {
    marginBottom: 12,
  },
  reactivationSection: {
    marginBottom: 4,
  },
  formFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  formBtn: {
    flex: 1,
  },
  boundaryHint: {
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: 6,
    marginBottom: 4,
  },
});
