import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type {
  FieldDetail,
  FieldSummary,
  InactiveFieldWithLots,
  ManualFieldBoundaryPayload,
} from '../../../api/modules/fields';
import {
  AppButton,
  AppInput,
  AppPolygonMapEditor,
  AppScreen,
  AppSelect,
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
  LogRow,
  NotificationHeaderButton,
  PillTabs,
  ProfileCard,
  PullToRefreshContainer,
  QuickActionGrid,
  SearchBar,
  SectionHeader,
  Skeleton,
  StatStrip,
  useFormValidation,
  useToast,
} from '../../../components';
import type { DotBadgeVariant, ListRowIconVariant, QuickAction } from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { useModuleActionPermissions } from '../../../hooks/useModuleActionPermissions';
import { palette } from '../../../theme/tokens';
import { polygonAreaHectares } from '../../../utils/geometry';
import { fromGeoJsonPolygon, toGeoJsonPolygon } from '../../../utils/geojson';
import { formatApiErrorMessage } from '../../../utils/lifecycle';
import {
  FIELD_AREA_UNIT_OPTIONS,
  buildFieldSearchText,
  displayToHectares,
  formatCanonicalHectares,
  formatDisplayArea,
  parseUserAreaInput,
  toAreaUnitLabel,
  toFieldFormValues,
  type FieldFormMode,
  type FieldFormValues,
  type FieldListMode,
} from '../contracts';
import {
  readFieldAreaUnitPreference,
  writeFieldAreaUnitPreference,
  type PersistedFieldAreaUnit,
} from '../storage';
import { useFieldsModule } from '../useFieldsModule.hook';
import { validateFieldBoundaryInput } from '../validation';

type ConfirmAction = 'deactivate' | 'reactivate' | null;
type ModuleSwitcherValue = 'fields' | 'lots';

type DisplayField = FieldSummary & {
  lotsCount: number;
};

function toDisplayField(field: FieldSummary | InactiveFieldWithLots): DisplayField {
  const lotsCount = Array.isArray((field as InactiveFieldWithLots).lots)
    ? (field as InactiveFieldWithLots).lots.length
    : 0;

  return {
    ...field,
    lotsCount,
  };
}

function toDisplayFieldFromDetail(detail: FieldDetail): DisplayField {
  return {
    ...detail,
    lotsCount: detail.lots.length,
  };
}

function toFieldStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'active') return 'Active';
  if (normalized === 'inactive') return 'Inactive';
  if (normalized === 'maintenance') return 'Maintenance';
  if (normalized === 'fallow') return 'Fallow';
  if (!normalized) return 'Unknown';
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

function toStatusBadgeVariant(status: string): DotBadgeVariant {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'active') return 'success';
  if (normalized === 'maintenance' || normalized === 'fallow') return 'warning';
  return 'neutral';
}

function toIconVariant(status: string): ListRowIconVariant {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'active') return 'green';
  if (normalized === 'maintenance' || normalized === 'fallow') return 'amber';
  return 'neutral';
}

function toFieldIcon(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'maintenance') return 'wrench-outline';
  if (normalized === 'fallow') return 'leaf';
  if (normalized === 'inactive') return 'map-marker-off-outline';
  return 'map-outline';
}

function toDateLabel(value: string | null | undefined): string {
  if (!value) return 'n/a';
  const dateStr = value.includes('T') ? value.slice(0, 10) : value;
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function toManualShapePayload(values: FieldFormValues): ManualFieldBoundaryPayload | null {
  if (!values.manualAreaFallback.enabled) {
    return null;
  }

  const area = parseUserAreaInput(values.manualAreaFallback.area);
  if (!area) {
    return null;
  }

  return {
    manual: true,
    area,
    unit: values.manualAreaFallback.unit,
  };
}

export function FieldsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const formSheetScrollRef = useRef<ScrollView | null>(null);
  const formValidation = useFormValidation<
    'name' | 'boundary' | 'manualAreaValue' | 'manualAreaUnit'
  >(formSheetScrollRef);
  const { t } = useAppI18n();

  const [listMode, setListMode] = useState<FieldListMode>('active');
  const [searchValue, setSearchValue] = useState('');

  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<FieldFormMode>('create');
  const [editingField, setEditingField] = useState<FieldSummary | null>(null);
  const [preferredAreaUnit, setPreferredAreaUnit] = useState<PersistedFieldAreaUnit>('hectares');
  const [formValues, setFormValues] = useState<FieldFormValues>(toFieldFormValues());

  const [confirmField, setConfirmField] = useState<DisplayField | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailField, setDetailField] = useState<FieldDetail | null>(null);
  const detailRequestIdRef = useRef(0);

  const [fieldAlertsVisible, setFieldAlertsVisible] = useState(false);

  const permissions = useModuleActionPermissions('fields');

  const {
    fields,
    inactiveFieldsWithLots,
    isLoading,
    isRefreshing,
    isMutating,
    errorMessage,
    refresh,
    loadFieldDetail,
    createField,
    updateField,
    deactivateField,
    reactivateFieldMain,
    reactivateFieldFromDeactivated,
  } = useFieldsModule('all');

  useEffect(() => {
    void (async () => {
      const stored = await readFieldAreaUnitPreference();
      setPreferredAreaUnit(stored);
      setFormValues((current) => ({
        ...current,
        areaUnit: stored,
        manualAreaFallback: {
          ...current.manualAreaFallback,
          unit: stored,
        },
      }));
    })();
  }, []);

  const allRows = useMemo(() => fields.map((field) => toDisplayField(field)), [fields]);

  const inactiveRows = useMemo(
    () => inactiveFieldsWithLots.map((field) => toDisplayField(field)),
    [inactiveFieldsWithLots],
  );

  const activeCount = useMemo(
    () => allRows.filter((row) => row.status === 'active').length,
    [allRows],
  );

  const watchCount = useMemo(
    () =>
      allRows.filter((row) => row.status === 'maintenance' || row.status === 'fallow').length,
    [allRows],
  );

  const inactiveCount = useMemo(
    () => allRows.filter((row) => row.status === 'inactive').length,
    [allRows],
  );

  const criticalAlertRows = useMemo(
    () => inactiveRows.filter((row) => row.lotsCount > 0),
    [inactiveRows],
  );

  const watchAlertRows = useMemo(
    () => allRows.filter((row) => row.status === 'maintenance' || row.status === 'fallow'),
    [allRows],
  );

  const criticalAlertCount = criticalAlertRows.length;

  const criticalAlertFieldIds = useMemo(
    () => new Set(criticalAlertRows.map((row) => row.id)),
    [criticalAlertRows],
  );

  const sourceRows = useMemo(() => {
    if (listMode === 'all') return allRows;
    if (listMode === 'active') return allRows.filter((row) => row.status !== 'inactive');
    return inactiveRows;
  }, [allRows, inactiveRows, listMode]);

  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) return sourceRows;

    return sourceRows.filter((row) => {
      const text = buildFieldSearchText(row);
      const status = row.status.toLowerCase();
      const area = String(row.areaHectares).toLowerCase();
      return text.includes(term) || status.includes(term) || area.includes(term);
    });
  }, [searchValue, sourceRows]);

  function closeFormSheet() {
    setFormVisible(false);
    setEditingField(null);
    setFormValues(toFieldFormValues(null, preferredAreaUnit));
    formValidation.reset();
  }

  function openCreateSheet() {
    setFormMode('create');
    setEditingField(null);
    setFormValues(toFieldFormValues(null, preferredAreaUnit));
    setFormVisible(true);
  }

  function openEditSheet(field: DisplayField) {
    setFormMode('edit');
    setEditingField(field);
    setFormValues(toFieldFormValues(field, preferredAreaUnit));
    setFormVisible(true);
  }

  async function openFieldDetails(field: DisplayField) {
    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;
    setSelectedFieldId(field.id);
    setDetailLoading(true);
    setDetailField(null);

    try {
      const detail = await loadFieldDetail(field.id);
      if (detailRequestIdRef.current !== requestId) return;
      setDetailField(detail);
    } catch (error) {
      if (detailRequestIdRef.current !== requestId) return;
      setDetailField(null);
      setSelectedFieldId(null);
      const message = error instanceof Error ? error.message : 'Failed to load field details.';
      showToast({ message, variant: 'error' });
    } finally {
      if (detailRequestIdRef.current !== requestId) return;
      setDetailLoading(false);
    }
  }

  function closeFieldDetails() {
    detailRequestIdRef.current += 1;
    setSelectedFieldId(null);
    setDetailLoading(false);
    setDetailField(null);
  }

  async function refreshSelectedFieldDetail() {
    if (!selectedFieldId) return;
    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;

    setDetailLoading(true);
    try {
      const detail = await loadFieldDetail(selectedFieldId);
      if (detailRequestIdRef.current !== requestId) return;
      setDetailField(detail);
    } catch (error) {
      if (detailRequestIdRef.current !== requestId) return;
      setDetailField(null);
      const message = error instanceof Error ? error.message : 'Failed to refresh field details.';
      showToast({ message, variant: 'error' });
    } finally {
      if (detailRequestIdRef.current !== requestId) return;
      setDetailLoading(false);
    }
  }

  async function setPreferredUnit(nextUnit: PersistedFieldAreaUnit) {
    setPreferredAreaUnit(nextUnit);
    await writeFieldAreaUnitPreference(nextUnit);
  }

  async function submitForm() {
    const manualShape = toManualShapePayload(formValues);
    const geoPolygon = toGeoJsonPolygon(formValues.boundaryPoints);

    const boundaryValidation = validateFieldBoundaryInput({
      points: formValues.boundaryPoints,
      manualEnabled: formValues.manualAreaFallback.enabled,
      manualArea: formValues.manualAreaFallback.area,
    });

    const valid = formValidation.validate([
      {
        field: 'name',
        message: t('validation', 'fieldNameRequired'),
        isValid: formValues.name.trim().length > 0,
      },
      {
        field: 'boundary',
        message: t('validation', 'fieldBoundaryRequired'),
        isValid: formValues.manualAreaFallback.enabled || boundaryValidation.valid,
      },
      {
        field: 'manualAreaValue',
        message: 'Manual area value must be a positive number.',
        isValid:
          !formValues.manualAreaFallback.enabled || boundaryValidation.reason !== 'invalid_manual_area',
      },
      {
        field: 'manualAreaUnit',
        message: 'Area unit is required.',
        isValid: !formValues.manualAreaFallback.enabled || formValues.manualAreaFallback.unit.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    if (!boundaryValidation.valid) {
      showToast({
        message:
          boundaryValidation.reason === 'invalid_manual_area'
            ? 'Manual area value must be a positive number.'
            : t('validation', 'fieldBoundaryRequired'),
        variant: 'error',
      });
      return;
    }

    const derivedHectares = manualShape
      ? formatCanonicalHectares(displayToHectares(manualShape.area, manualShape.unit))
      : formatCanonicalHectares(Math.max(polygonAreaHectares(formValues.boundaryPoints), 0.0001));

    const payload = {
      name: formValues.name.trim(),
      area_hectares: Number(derivedHectares),
      area_unit: manualShape?.unit ?? formValues.areaUnit,
      location: formValues.location.trim() || null,
      soil_type: formValues.soilType.trim() || null,
      status: formValues.status,
      notes: formValues.notes.trim() || null,
      soil_type_category: formValues.soilTypeCategory.trim() || null,
      soil_type_other: formValues.soilTypeOther.trim() || null,
      irrigation_type: formValues.irrigationType.trim() || null,
      irrigation_type_other: formValues.irrigationTypeOther.trim() || null,
      soil_conditions: formValues.soilConditions.trim() || null,
      shape_polygon: manualShape ?? geoPolygon,
    };

    try {
      if (formMode === 'create') {
        await createField(payload);
        showToast({ message: 'Field created.', variant: 'success' });
      } else if (editingField) {
        await updateField(editingField.id, payload);
        showToast({ message: 'Field updated.', variant: 'success' });
      }

      await setPreferredUnit(formValues.manualAreaFallback.unit);
      closeFormSheet();
    } catch (error) {
      const message = formatApiErrorMessage(error, 'Field mutation failed.');
      showToast({ message, variant: 'error' });
    }
  }

  async function submitConfirmAction() {
    if (!confirmField || !confirmAction) {
      return;
    }

    try {
      if (confirmAction === 'deactivate') {
        await deactivateField(confirmField.id);
        showToast({ message: 'Field deactivated.', variant: 'success' });
      } else if (listMode === 'inactive') {
        await reactivateFieldFromDeactivated(confirmField.id);
        showToast({ message: 'Field reactivated.', variant: 'success' });
      } else {
        await reactivateFieldMain(confirmField.id);
        showToast({ message: 'Field reactivated.', variant: 'success' });
      }

      if (detailField && confirmField.id === detailField.id) {
        await refreshSelectedFieldDetail();
      }
    } catch (error) {
      const message = formatApiErrorMessage(error, 'Field status update failed.');
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmAction(null);
      setConfirmField(null);
    }
  }

  function buildDetailQuickActions(): QuickAction[] {
    if (!detailField) return [];

    const detailSummary = toDisplayFieldFromDetail(detailField);
    const actions: QuickAction[] = [];

    if (permissions.permissions.edit) {
      actions.push({
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green',
        onPress: () => openEditSheet(detailSummary),
      });
    }

    if (permissions.permissions.delete && detailField.status === 'inactive') {
      actions.push({
        key: 'reactivate',
        icon: 'check-circle-outline',
        label: 'Reactivate',
        color: 'green',
        onPress: () => {
          setConfirmField(detailSummary);
          setConfirmAction('reactivate');
        },
      });
    } else if (permissions.permissions.delete) {
      actions.push({
        key: 'deactivate',
        icon: 'close-circle-outline',
        label: 'Deactivate',
        color: 'red',
        onPress: () => {
          setConfirmField(detailSummary);
          setConfirmAction('deactivate');
        },
      });
    }

    return actions;
  }

  const detailSummary = useMemo(() => {
    if (!detailField) return null;

    const fieldBoundaryPoints = fromGeoJsonPolygon(detailField.shapePolygon);
    const lotsInside = detailField.lots;
    const lotsMappedCount = lotsInside.filter(
      (lot) => fromGeoJsonPolygon(lot.shapePolygon).length >= 3,
    ).length;
    const activeLotsCount = lotsInside.filter((lot) => lot.status === 'active').length;
    const inactiveLotsCount = lotsInside.filter((lot) => lot.status === 'inactive').length;

    return {
      fieldBoundaryPoints: fieldBoundaryPoints.length,
      hasFieldPolygon: fieldBoundaryPoints.length >= 3,
      lotsInsideCount: lotsInside.length,
      lotsMappedCount,
      activeLotsCount,
      inactiveLotsCount,
    };
  }, [detailField]);

  function renderFieldAlertItem(item: DisplayField, variant: 'critical' | 'watch') {
    const isCritical = variant === 'critical';

    return (
      <View
        key={item.id}
        style={[
          styles.alertItem,
          isCritical ? styles.alertItemCritical : styles.alertItemWatch,
        ]}
      >
        <View
          style={[
            styles.alertDot,
            { backgroundColor: isCritical ? palette.destructive : '#FFC61A' },
          ]}
        />
        <View style={styles.alertBody}>
          <Text style={styles.alertName}>{item.name}</Text>
          <Text style={styles.alertInfo}>
            {item.location ?? item.soilType ?? 'No location'} · {formatDisplayArea(item.areaHectares, preferredAreaUnit)}{' '}
            {toAreaUnitLabel(preferredAreaUnit)}
          </Text>
        </View>
        <Text
          style={[
            styles.alertMeta,
            { color: isCritical ? palette.destructive : '#8B6914' },
          ]}
        >
          {isCritical ? `${item.lotsCount} lots` : toFieldStatusLabel(item.status)}
        </Text>
      </View>
    );
  }

  const detailQuickActions = buildDetailQuickActions();

  return (
    <AppScreen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLead}>
            <HeaderMenuButton testID="fields-header-menu" />
            <Text style={styles.headerTitle}>Fields</Text>
          </View>
          <View style={styles.headerBtns}>
            <NotificationHeaderButton testID="fields-header-notifications" />
            <HeaderIconButton
              icon="alert-circle-outline"
              onPress={() => setFieldAlertsVisible(true)}
              badgeDot={criticalAlertCount > 0}
              testID="fields-header-alert"
            />
            {permissions.permissions.add ? (
              <HeaderIconButton
                icon="plus"
                onPress={openCreateSheet}
                filled
                testID="fields-header-create"
              />
            ) : null}
          </View>
        </View>
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder="Search by name, location, soil..."
          testID="fields-search"
        />
      </View>

      <View style={styles.moduleSwitch}>
        <PillTabs
          value="fields"
          onValueChange={(nextValue) => {
            if ((nextValue as ModuleSwitcherValue) === 'lots') {
              router.replace('/(protected)/lots');
            }
          }}
          tabs={[
            { value: 'fields', label: 'Fields' },
            { value: 'lots', label: 'Lots' },
          ]}
          testID="fields-module-switch"
        />
      </View>

      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.main}
          showsVerticalScrollIndicator={false}
        >
          <StatStrip
            items={[
              { value: activeCount, label: 'Active', color: 'green' },
              { value: watchCount, label: 'Watch', color: 'amber' },
              { value: inactiveCount, label: 'Inactive', color: 'red' },
            ]}
          />

          <PillTabs
            value={listMode}
            onValueChange={(nextValue) => setListMode(nextValue as FieldListMode)}
            tabs={[
              { value: 'all', label: `All (${allRows.length})` },
              { value: 'active', label: `Active (${activeCount})` },
              { value: 'inactive', label: `Inactive (${inactiveCount})` },
            ]}
            testID="fields-list-mode"
          />

          <SectionHeader title="Fields" trailing={`${filteredRows.length} items`} />

          {permissions.loading ? (
            <>
              <Skeleton height={68} />
              <Skeleton height={68} />
              <Skeleton height={68} />
            </>
          ) : !permissions.permissions.view ? (
            <EmptyState title="Fields view blocked" message={t('common', 'permissionDenied')} />
          ) : isLoading ? (
            <>
              <Skeleton height={68} />
              <Skeleton height={68} />
              <Skeleton height={68} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title="No fields found"
              message="Try another search or create a new field record."
              actionLabel={permissions.permissions.add ? 'Create field' : undefined}
              onAction={permissions.permissions.add ? openCreateSheet : undefined}
            />
          ) : (
            filteredRows.map((row) => {
              const isCritical = criticalAlertFieldIds.has(row.id);
              const areaLabel = `${formatDisplayArea(row.areaHectares, preferredAreaUnit)} ${toAreaUnitLabel(preferredAreaUnit)}`;

              return (
                <ListRow
                  key={row.id}
                  icon={toFieldIcon(row.status)}
                  iconVariant={toIconVariant(row.status)}
                  title={row.name}
                  subtitle={`${row.location ?? row.soilType ?? 'No location'} · ${areaLabel}`}
                  badge={
                    <DotBadge
                      label={toFieldStatusLabel(row.status)}
                      variant={toStatusBadgeVariant(row.status)}
                    />
                  }
                  overdueLine={isCritical ? `Inactive with ${row.lotsCount} lots` : undefined}
                  accentBorder={isCritical}
                  onPress={() => void openFieldDetails(row)}
                />
              );
            })
          )}
        </ScrollView>
      </PullToRefreshContainer>

      <BottomSheet
        visible={Boolean(selectedFieldId)}
        onDismiss={closeFieldDetails}
        title={detailField?.name ?? 'Field detail'}
        heightRatio={0.75}
      >
        {detailLoading ? (
          <>
            <Skeleton height={120} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </>
        ) : !detailField ? (
          <EmptyState
            title="No details"
            message="Field detail could not be loaded."
            actionLabel="Retry"
            onAction={() => void refreshSelectedFieldDetail()}
          />
        ) : (
          <>
            <ProfileCard
              icon={toFieldIcon(detailField.status)}
              name={detailField.name}
              subtitle={`${toFieldStatusLabel(detailField.status)} · ${formatDisplayArea(detailField.areaHectares, preferredAreaUnit)} ${toAreaUnitLabel(preferredAreaUnit)}`}
              cells={[
                {
                  label: 'Area',
                  value: `${formatDisplayArea(detailField.areaHectares, preferredAreaUnit)} ${toAreaUnitLabel(preferredAreaUnit)}`,
                },
                { label: 'Status', value: toFieldStatusLabel(detailField.status) },
                { label: 'Soil', value: detailField.soilType ?? 'n/a' },
                { label: 'Lots', value: String(detailField.lots.length) },
              ]}
            />

            {detailQuickActions.length > 0 ? (
              <QuickActionGrid actions={detailQuickActions} />
            ) : null}

            <SectionHeader title="Polygon Summary" />
            <LogRow
              title={
                detailSummary?.hasFieldPolygon
                  ? 'Field polygon is mapped'
                  : 'Field polygon is not mapped'
              }
              date={toDateLabel(detailField.updatedAt)}
              chips={[
                {
                  label: 'Boundary points',
                  value: String(detailSummary?.fieldBoundaryPoints ?? 0),
                },
                {
                  label: 'Lots inside',
                  value: String(detailSummary?.lotsInsideCount ?? 0),
                  valueColor:
                    (detailSummary?.lotsInsideCount ?? 0) > 0
                      ? palette.primary
                      : palette.mutedForeground,
                },
                {
                  label: 'Mapped lots',
                  value: String(detailSummary?.lotsMappedCount ?? 0),
                },
              ]}
            />
            <LogRow
              title="Lot status summary"
              date={toFieldStatusLabel(detailField.status)}
              chips={[
                {
                  label: 'Active lots',
                  value: String(detailSummary?.activeLotsCount ?? 0),
                },
                {
                  label: 'Inactive lots',
                  value: String(detailSummary?.inactiveLotsCount ?? 0),
                  valueColor:
                    (detailSummary?.inactiveLotsCount ?? 0) > 0
                      ? palette.destructive
                      : palette.mutedForeground,
                },
              ]}
            />

            <SectionHeader
              title="Lots Inside Field"
              trailing={`${detailField.lots.length} lots`}
            />
            {detailField.lots.length === 0 ? (
              <EmptyState
                title="No lots inside this field"
                message="This field polygon has no linked lots."
              />
            ) : (
              detailField.lots.map((lot) => (
                <LogRow
                  key={lot.id}
                  title={lot.name}
                  date={toFieldStatusLabel(lot.status)}
                  chips={[
                    {
                      label: 'Boundary',
                      value: fromGeoJsonPolygon(lot.shapePolygon).length >= 3 ? 'Mapped' : 'No map',
                    },
                    {
                      label: 'Status',
                      value: toFieldStatusLabel(lot.status),
                      valueColor: lot.status === 'inactive' ? palette.destructive : palette.primary,
                    },
                  ]}
                />
              ))
            )}
          </>
        )}
      </BottomSheet>

      <BottomSheet
        visible={formVisible}
        onDismiss={closeFormSheet}
        scrollViewRef={formSheetScrollRef}
        title={formMode === 'create' ? 'New Field' : 'Edit Field'}
        footer={
          <View style={styles.formBtns}>
            <View style={styles.formBtnHalf}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeFormSheet}
              />
            </View>
            <View style={styles.formBtnHalf}>
              <AppButton
                label={formMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitForm()}
                disabled={isMutating}
                loading={isMutating}
                testID="fields-form-submit"
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={formValidation.providerValue}>
          <FormField label="Field name" name="name" required>
            <AppInput
              value={formValues.name}
              onChangeText={(nextValue) => {
                formValidation.clearFieldError('name');
                setFormValues((current) => ({ ...current, name: nextValue }));
              }}
              placeholder="Field name"
            />
          </FormField>

          <FormField label="Soil type">
            <AppInput
              value={formValues.soilType}
              onChangeText={(nextValue) =>
                setFormValues((current) => ({ ...current, soilType: nextValue }))
              }
              placeholder="Optional soil type"
            />
          </FormField>

          <FormField
            label={t('map', 'boundary')}
            name="boundary"
            required={!formValues.manualAreaFallback.enabled}
          >
            <AppPolygonMapEditor
              points={formValues.boundaryPoints}
              onChangePoints={(nextPoints) => {
                formValidation.clearFieldError('boundary');
                setFormValues((current) => ({ ...current, boundaryPoints: nextPoints }));
              }}
              onMapUnavailable={() =>
                setFormValues((current) => ({
                  ...current,
                  manualAreaFallback: { ...current.manualAreaFallback, enabled: true },
                }))
              }
              onInvalidAction={(reason) => {
                if (reason === 'self_intersection') {
                  showToast({ message: t('validation', 'polygonSelfIntersect'), variant: 'error' });
                }
                if (reason === 'min_points') {
                  showToast({ message: t('validation', 'polygonMinPoints'), variant: 'error' });
                }
              }}
              testID="fields-boundary-map"
            />
          </FormField>

          <FormField label="Manual area fallback">
            <AppButton
              label={
                formValues.manualAreaFallback.enabled
                  ? 'Use map boundary'
                  : 'Use manual area fallback'
              }
              mode="outlined"
              tone="neutral"
              onPress={() =>
                setFormValues((current) => ({
                  ...current,
                  manualAreaFallback: {
                    ...current.manualAreaFallback,
                    enabled: !current.manualAreaFallback.enabled,
                  },
                }))
              }
            />
          </FormField>

          {formValues.manualAreaFallback.enabled ? (
            <>
              <FormField label="Area value" name="manualAreaValue" required>
                <AppInput
                  value={formValues.manualAreaFallback.area}
                  onChangeText={(nextValue) => {
                    formValidation.clearFieldError('manualAreaValue');
                    setFormValues((current) => ({
                      ...current,
                      manualAreaFallback: { ...current.manualAreaFallback, area: nextValue },
                    }));
                  }}
                  placeholder="1.00"
                />
              </FormField>

              <FormField label="Area unit" name="manualAreaUnit" required>
                <AppSelect
                  testID="fields-manual-unit"
                  value={formValues.manualAreaFallback.unit}
                  onChange={(nextValue) => {
                    formValidation.clearFieldError('manualAreaUnit');
                    setFormValues((current) => ({
                      ...current,
                      areaUnit: nextValue as PersistedFieldAreaUnit,
                      manualAreaFallback: {
                        ...current.manualAreaFallback,
                        unit: nextValue as PersistedFieldAreaUnit,
                      },
                    }));
                  }}
                  options={FIELD_AREA_UNIT_OPTIONS.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                />
              </FormField>
            </>
          ) : null}
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={fieldAlertsVisible}
        onDismiss={() => setFieldAlertsVisible(false)}
        title="Field Alerts"
      >
        {criticalAlertRows.length > 0 ? (
          <>
            <SectionHeader title="Needs Review" titleColor={palette.destructive} />
            {criticalAlertRows.map((row) => renderFieldAlertItem(row, 'critical'))}
          </>
        ) : null}

        {watchAlertRows.length > 0 ? (
          <>
            <View style={criticalAlertRows.length > 0 ? styles.alertSectionGap : undefined}>
              <SectionHeader title="Watchlist" titleColor="#8B6914" />
            </View>
            {watchAlertRows.map((row) => renderFieldAlertItem(row, 'watch'))}
          </>
        ) : null}

        {criticalAlertRows.length === 0 && watchAlertRows.length === 0 ? (
          <EmptyState title="No active alerts" message="All fields are stable." />
        ) : null}
      </BottomSheet>

      <ConfirmDialog
        visible={Boolean(confirmField) && Boolean(confirmAction)}
        onCancel={() => {
          setConfirmAction(null);
          setConfirmField(null);
        }}
        onConfirm={() => void submitConfirmAction()}
        title={
          confirmAction === 'deactivate'
            ? 'Deactivate Field'
            : 'Reactivate Field'
        }
        message={
          confirmAction === 'deactivate'
            ? `Deactivate ${confirmField?.name ?? 'this field'}?`
            : listMode === 'inactive'
              ? 'This uses the deactivated fields reactivation flow.'
              : 'This uses the main fields status update flow.'
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        confirmTone={confirmAction === 'deactivate' ? 'destructive' : 'primary'}
        confirmLoading={isMutating}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  headerLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: palette.foreground,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  moduleSwitch: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  main: {
    padding: 16,
    paddingBottom: 96,
  },
  formBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  formBtnHalf: {
    flex: 1,
  },
  alertItem: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertItemCritical: {
    borderLeftWidth: 3,
    borderLeftColor: palette.destructive,
  },
  alertItemWatch: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFC61A',
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertBody: {
    flex: 1,
  },
  alertName: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.foreground,
  },
  alertInfo: {
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: 1,
  },
  alertMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  alertSectionGap: {
    marginTop: 16,
  },
});
