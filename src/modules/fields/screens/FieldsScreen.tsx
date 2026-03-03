import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import type {
  FieldDetail,
  FieldSummary,
  FieldStatusFilter,
  InactiveFieldWithLots,
  ManualFieldBoundaryPayload,
} from '../../../api/modules/fields';
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
import { polygonAreaHectares } from '../../../utils/geometry';
import { fromGeoJsonPolygon, toGeoJsonPolygon, type MapCoordinate } from '../../../utils/geojson';
import {
  FIELD_AREA_UNIT_OPTIONS,
  FIELD_PAGE_SIZE,
  FIELD_STATUS_FILTER_OPTIONS,
  buildFieldSearchText,
  displayToHectares,
  formatCanonicalHectares,
  formatDisplayArea,
  parseUserAreaInput,
  toAreaUnitLabel,
  toFieldFormValues,
  type FieldFormMode,
  type FieldFormValues,
} from '../contracts';
import {
  readFieldAreaUnitPreference,
  writeFieldAreaUnitPreference,
  type PersistedFieldAreaUnit,
} from '../storage';
import { useFieldsModule } from '../useFieldsModule.hook';
import { validateFieldBoundaryInput } from '../validation';

type ConfirmAction = 'deactivate' | 'reactivate' | null;

type DisplayField = FieldSummary & {
  lotsCount: number;
};

type ModuleSwitcherValue = 'fields' | 'lots';

function toDisplayField(field: FieldSummary | InactiveFieldWithLots): DisplayField {
  const lotsCount = Array.isArray((field as InactiveFieldWithLots).lots)
    ? (field as InactiveFieldWithLots).lots.length
    : 0;

  return {
    ...field,
    lotsCount,
  };
}

function formatFieldStatus(status: string): string {
  if (!status) return 'Unknown';
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function toFieldStatusFilter(value: string): FieldStatusFilter {
  if (value === 'active' || value === 'inactive' || value === 'fallow' || value === 'maintenance') {
    return value;
  }
  return 'all';
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
  const { t } = useAppI18n();
  const [statusFilter, setStatusFilter] = useState<FieldStatusFilter>('active');
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<FieldFormMode>('create');
  const [editingField, setEditingField] = useState<FieldSummary | null>(null);
  const [preferredAreaUnit, setPreferredAreaUnit] = useState<PersistedFieldAreaUnit>('hectares');
  const [formValues, setFormValues] = useState<FieldFormValues>(toFieldFormValues());
  const [actionField, setActionField] = useState<DisplayField | null>(null);
  const [confirmField, setConfirmField] = useState<DisplayField | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailField, setDetailField] = useState<FieldDetail | null>(null);

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
  } = useFieldsModule(statusFilter);

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

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchValue]);

  const sourceRows = useMemo(() => {
    if (statusFilter === 'inactive') {
      return inactiveFieldsWithLots.map((field) => toDisplayField(field));
    }
    return fields.map((field) => toDisplayField(field));
  }, [fields, inactiveFieldsWithLots, statusFilter]);

  const filteredRows = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) {
      return sourceRows;
    }

    return sourceRows.filter((field) => buildFieldSearchText(field).includes(normalized));
  }, [searchValue, sourceRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / FIELD_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * FIELD_PAGE_SIZE;
    return filteredRows.slice(start, start + FIELD_PAGE_SIZE);
  }, [currentPage, filteredRows]);
  const mapOverlays = useMemo(() => {
    if (!detailField) {
      return [] as Array<{
        id: string;
        points: MapCoordinate[];
        strokeColor?: string;
        fillColor?: string;
      }>;
    }

    const overlays = [] as Array<{
      id: string;
      points: MapCoordinate[];
      strokeColor?: string;
      fillColor?: string;
    }>;
    const fieldBoundary = fromGeoJsonPolygon(detailField.shapePolygon);
    if (fieldBoundary.length >= 3) {
      overlays.push({
        id: `field-${detailField.id}`,
        points: fieldBoundary,
        strokeColor: '#2C6BED',
        fillColor: 'rgba(44, 107, 237, 0.15)',
      });
    }

    for (const lot of detailField.lots) {
      const points = fromGeoJsonPolygon(lot.shapePolygon);
      if (points.length < 3) continue;
      overlays.push({
        id: `lot-${lot.id}`,
        points,
        strokeColor: '#248F36',
        fillColor: 'rgba(36, 143, 54, 0.15)',
      });
    }

    for (const housing of detailField.housingUnitBoundaries) {
      const points = fromGeoJsonPolygon(housing.shapePolygon);
      if (points.length < 3) continue;
      overlays.push({
        id: `housing-${housing.id}`,
        points,
        strokeColor: '#8C6239',
        fillColor: 'rgba(140, 98, 57, 0.15)',
      });
    }

    return overlays;
  }, [detailField]);

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

  async function openDetails(fieldId: string) {
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const detail = await loadFieldDetail(fieldId);
      setDetailField(detail);
    } catch (error) {
      setDetailField(null);
      const message = error instanceof Error ? error.message : 'Failed to load field details.';
      showToast({ message, variant: 'error' });
      setDetailVisible(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeFormSheet() {
    setFormVisible(false);
    setEditingField(null);
    setFormValues(toFieldFormValues(null, preferredAreaUnit));
  }

  async function setPreferredUnit(nextUnit: PersistedFieldAreaUnit) {
    setPreferredAreaUnit(nextUnit);
    await writeFieldAreaUnitPreference(nextUnit);
  }

  async function submitForm() {
    if (!formValues.name.trim()) {
      showToast({ message: t('validation', 'fieldNameRequired'), variant: 'error' });
      return;
    }

    const manualShape = toManualShapePayload(formValues);
    const geoPolygon = toGeoJsonPolygon(formValues.boundaryPoints);

    const boundaryValidation = validateFieldBoundaryInput({
      points: formValues.boundaryPoints,
      manualEnabled: formValues.manualAreaFallback.enabled,
      manualArea: formValues.manualAreaFallback.area,
    });

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
      ? formatCanonicalHectares(
          displayToHectares(manualShape.area, manualShape.unit),
        )
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
      const message = error instanceof Error ? error.message : 'Field mutation failed.';
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
      } else if (statusFilter === 'inactive') {
        await reactivateFieldFromDeactivated(confirmField.id);
        showToast({ message: 'Field reactivated.', variant: 'success' });
      } else {
        await reactivateFieldMain(confirmField.id);
        showToast({ message: 'Field reactivated.', variant: 'success' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Field status update failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmAction(null);
      setConfirmField(null);
      setActionField(null);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader title={t('fields', 'title')} subtitle={t('fields', 'subtitle')} />

      <AppTabs
        value="fields"
        onValueChange={(nextValue) => {
          if ((nextValue as ModuleSwitcherValue) === 'lots') {
            router.push('/(protected)/lots');
          }
        }}
        tabs={[
          { value: 'fields', label: t('fields', 'title') },
          { value: 'lots', label: t('lots', 'title') },
        ]}
      />

      <SectionTopActions
        canCreate={permissions.permissions.add}
        onCreate={openCreateSheet}
        onRefresh={() => void refresh()}
        loading={isRefreshing || isMutating}
      />

      {permissions.permissions.view ? null : (
        <AppCard>
          <EmptyState
            title="Fields view blocked"
            message={t('common', 'permissionDenied')}
          />
        </AppCard>
      )}

      {permissions.permissions.view ? (
        <>
          <AppCard>
            <FilterBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              searchPlaceholder={t('fields', 'searchPlaceholder')}
            >
              <AppSelect
                testID="fields-status-filter"
                value={statusFilter}
                onChange={(nextValue) => setStatusFilter(toFieldStatusFilter(nextValue))}
                options={FIELD_STATUS_FILTER_OPTIONS.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
                label="Field status"
              />
            </FilterBar>
          </AppCard>

          <AppCard>
            <AppSection title={t('fields', 'records')}>
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
                  title={t('fields', 'noRowsTitle')}
                  message={t('fields', 'noRowsMessage')}
                  actionLabel={permissions.permissions.add ? t('fields', 'create') : undefined}
                  onAction={permissions.permissions.add ? openCreateSheet : undefined}
                />
              ) : (
                <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
                  <View style={styles.rows}>
                    {paginatedRows.map((field) => (
                      <AppCard key={field.id}>
                        <AppListItem
                          title={field.name}
                          description={`Soil ${field.soilType ?? 'N/A'} • Area ${formatDisplayArea(field.areaHectares, preferredAreaUnit)} ${toAreaUnitLabel(preferredAreaUnit)}`}
                          leftIcon="map"
                          onPress={() => setActionField(field)}
                        />
                        <View style={styles.rowMeta}>
                          <View style={styles.metaGroup}>
                            <Text style={styles.metaText}>Status</Text>
                            <AppBadge value={formatFieldStatus(field.status)} variant={field.status === 'inactive' ? 'warning' : 'success'} />
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
            page={currentPage}
            pageSize={FIELD_PAGE_SIZE}
            totalItems={filteredRows.length}
            onPageChange={setPage}
          />
        </>
      ) : null}

      <BottomSheet
        visible={formVisible}
        onDismiss={closeFormSheet}
        title={formMode === 'create' ? t('fields', 'create') : t('fields', 'edit')}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label={t('common', 'cancel')} mode="text" tone="neutral" onPress={closeFormSheet} />
            <AppButton
              label={formMode === 'create' ? t('common', 'create') : t('common', 'save')}
              onPress={() => void submitForm()}
              disabled={isMutating || !formValues.name.trim()}
              loading={isMutating}
              testID="fields-form-submit"
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

        <FormField label="Soil type">
          <AppInput
            value={formValues.soilType}
            onChangeText={(nextValue) => setFormValues((current) => ({ ...current, soilType: nextValue }))}
            placeholder="Optional soil type"
          />
        </FormField>

        <FormField label={t('map', 'boundary')} required={!formValues.manualAreaFallback.enabled}>
          <AppPolygonMapEditor
            points={formValues.boundaryPoints}
            onChangePoints={(nextPoints) =>
              setFormValues((current) => ({ ...current, boundaryPoints: nextPoints }))
            }
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
            label={formValues.manualAreaFallback.enabled ? 'Use map boundary' : 'Use manual area fallback'}
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
            <FormField label="Area value" required>
              <AppInput
                value={formValues.manualAreaFallback.area}
                onChangeText={(nextValue) =>
                  setFormValues((current) => ({
                    ...current,
                    manualAreaFallback: { ...current.manualAreaFallback, area: nextValue },
                  }))
                }
                placeholder="1.00"
              />
            </FormField>

            <FormField label="Area unit" required>
              <AppSelect
                testID="fields-manual-unit"
                value={formValues.manualAreaFallback.unit}
                onChange={(nextValue) =>
                  setFormValues((current) => ({
                    ...current,
                    areaUnit: nextValue as PersistedFieldAreaUnit,
                    manualAreaFallback: {
                      ...current.manualAreaFallback,
                      unit: nextValue as PersistedFieldAreaUnit,
                    },
                  }))
                }
                options={FIELD_AREA_UNIT_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />
            </FormField>
          </>
        ) : null}
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
                  key: 'view',
                  label: t('fields', 'view'),
                  onPress: () => void openDetails(actionField.id),
                  disabled: !permissions.permissions.view,
                },
                {
                  key: 'edit',
                  label: t('fields', 'edit'),
                  onPress: () => openEditSheet(actionField),
                  disabled: !permissions.permissions.edit,
                },
                actionField.status === 'inactive'
                  ? {
                      key: 'reactivate',
                      label: 'Reactivate field',
                      onPress: () => {
                        setConfirmField(actionField);
                        setConfirmAction('reactivate');
                      },
                      disabled: !permissions.permissions.delete,
                    }
                  : {
                      key: 'deactivate',
                      label: 'Deactivate field',
                      destructive: true,
                      onPress: () => {
                        setConfirmField(actionField);
                        setConfirmAction('deactivate');
                      },
                      disabled: !permissions.permissions.delete,
                    },
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(confirmField) && Boolean(confirmAction)}
        onCancel={() => {
          setConfirmAction(null);
          setConfirmField(null);
        }}
        onConfirm={() => void submitConfirmAction()}
        title={confirmAction === 'deactivate' ? t('fields', 'deactivateConfirm') : t('fields', 'reactivateConfirm')}
        message={
          confirmAction === 'deactivate'
            ? 'This field will move to the inactive list.'
            : statusFilter === 'inactive'
              ? 'This uses the deactivated fields reactivation flow.'
              : 'This uses the main fields status update flow.'
        }
        confirmLabel={confirmAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        confirmTone={confirmAction === 'deactivate' ? 'destructive' : 'primary'}
        confirmLoading={isMutating}
      />

      <BottomSheet
        visible={detailVisible}
        onDismiss={() => {
          setDetailVisible(false);
          setDetailField(null);
        }}
        title={detailField?.name ?? t('fields', 'view')}
      >
        {detailLoading || !detailField ? (
          <>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={160} />
          </>
        ) : (
          <>
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.metaText}>Status</Text>
                <AppBadge value={formatFieldStatus(detailField.status)} variant={detailField.status === 'inactive' ? 'warning' : 'success'} />
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.metaText}>Soil</Text>
                <Text style={styles.detailValue}>{detailField.soilType ?? 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.metaText}>Area</Text>
                <Text style={styles.detailValue}>
                  {formatDisplayArea(detailField.areaHectares, preferredAreaUnit)} {toAreaUnitLabel(preferredAreaUnit)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.metaText}>Created</Text>
                <Text style={styles.detailValue}>{detailField.createdAt ? detailField.createdAt.slice(0, 10) : 'N/A'}</Text>
              </View>
            </View>

            <AppCard>
              <AppSection title="Active cycle summary">
                <Text style={styles.detailValue}>
                  {detailField.activeCycleSummary ? JSON.stringify(detailField.activeCycleSummary) : 'No active cycle summary.'}
                </Text>
              </AppSection>
            </AppCard>

            <AppCard>
              <AppSection title="Lots in this field">
                {detailField.lots.length === 0 ? (
                  <Text style={styles.detailValue}>No lots linked to this field.</Text>
                ) : (
                  detailField.lots.map((lot) => (
                    <AppListItem
                      key={lot.id}
                      title={lot.name}
                      description={`Status ${formatFieldStatus(lot.status)}`}
                    />
                  ))
                )}
              </AppSection>
            </AppCard>

            <FormField label="Map overlays">
              <AppPolygonMapEditor
                points={[]}
                onChangePoints={() => undefined}
                disabled
                overlays={mapOverlays}
                helperText="Field, lot, and housing overlays."
                showCompleteButton={false}
              />
            </FormField>
          </>
        )}
      </BottomSheet>
    </AppScreen>
  );
}

function SectionTopActions({
  canCreate,
  onCreate,
  onRefresh,
  loading,
}: {
  canCreate: boolean;
  onCreate: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.topActions}>
      <View style={styles.primaryAction}>
        <AppButton label="Create Field" onPress={onCreate} disabled={!canCreate} />
      </View>
      <View style={styles.secondaryAction}>
        <AppButton label="Refresh" mode="outlined" tone="neutral" onPress={onRefresh} loading={loading} />
      </View>
    </View>
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
  detailGrid: {
    gap: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailValue: {
    ...typography.body,
    color: palette.foreground,
  },
});
