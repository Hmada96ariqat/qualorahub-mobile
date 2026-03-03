import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type {
  EquipmentSummary,
  EquipmentUsageLog,
  MaintenanceRecord,
} from '../../../api/modules/equipment';
import {
  ActionSheet,
  AppBadge,
  AppButton,
  AppCard,
  AppDatePicker,
  AppHeader,
  AppInput,
  AppListItem,
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
import {
  EQUIPMENT_STATUS_OPTIONS,
  MAINTENANCE_SERVICE_TYPE_OPTIONS,
  USAGE_PURPOSE_OPTIONS,
  toEquipmentFormValues,
  toMaintenanceFormValues,
  toUsageLogFormValues,
  type EquipmentFormMode,
  type EquipmentFormValues,
  type EquipmentListMode,
  type MaintenanceFormMode,
  type MaintenanceFormValues,
  type UsageLogFormMode,
  type UsageLogFormValues,
} from '../contracts';
import { useEquipmentModule } from '../useEquipmentModule.hook';

type EquipmentAction = 'deactivate' | 'reactivate' | 'delete' | null;

type DetailTab = 'usage' | 'maintenance';

function toStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (!normalized) return 'Unknown';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function toStatusVariant(status: string): 'success' | 'warning' | 'destructive' {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'inactive') return 'warning';
  if (normalized === 'emergency') return 'destructive';
  return 'success';
}

function toDateLabel(value: string | null | undefined): string {
  if (!value) return 'n/a';
  if (value.includes('T')) return value.slice(0, 10);
  return value;
}

function formatUsageMeta(log: EquipmentUsageLog): string {
  const date = toDateLabel(log.dateUsed);
  return log.totalHoursUsed ? `${date} • ${log.totalHoursUsed}h` : date;
}

function formatMaintenanceMeta(record: MaintenanceRecord): string {
  const performed = toDateLabel(record.datePerformed);
  return `${performed} • ${record.serviceType}`;
}

export function EquipmentScreen() {
  const { showToast } = useToast();
  const [listMode, setListMode] = useState<EquipmentListMode>('active');
  const [searchValue, setSearchValue] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<EquipmentFormMode>('create');
  const [formValues, setFormValues] = useState<EquipmentFormValues>(toEquipmentFormValues());
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [actionEquipment, setActionEquipment] = useState<EquipmentSummary | null>(null);
  const [confirmAction, setConfirmAction] = useState<EquipmentAction>(null);
  const [confirmEquipmentTarget, setConfirmEquipmentTarget] = useState<EquipmentSummary | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('usage');

  const [usageFormVisible, setUsageFormVisible] = useState(false);
  const [usageFormMode, setUsageFormMode] = useState<UsageLogFormMode>('create');
  const [usageFormValues, setUsageFormValues] = useState<UsageLogFormValues>(toUsageLogFormValues());
  const [editingUsageLog, setEditingUsageLog] = useState<EquipmentUsageLog | null>(null);
  const [actionUsageLog, setActionUsageLog] = useState<EquipmentUsageLog | null>(null);
  const [confirmUsageDeleteTarget, setConfirmUsageDeleteTarget] = useState<EquipmentUsageLog | null>(
    null,
  );

  const [maintenanceFormVisible, setMaintenanceFormVisible] = useState(false);
  const [maintenanceFormMode, setMaintenanceFormMode] = useState<MaintenanceFormMode>('create');
  const [maintenanceFormValues, setMaintenanceFormValues] = useState<MaintenanceFormValues>(
    toMaintenanceFormValues(),
  );
  const [editingMaintenanceRecord, setEditingMaintenanceRecord] = useState<MaintenanceRecord | null>(
    null,
  );
  const [actionMaintenanceRecord, setActionMaintenanceRecord] = useState<MaintenanceRecord | null>(
    null,
  );
  const [confirmMaintenanceDeleteTarget, setConfirmMaintenanceDeleteTarget] =
    useState<MaintenanceRecord | null>(null);

  const {
    equipment,
    upcomingMaintenance,
    operatorOptions,
    fieldOptions,
    equipmentDetail,
    usageLogs,
    maintenanceRecords,
    isLoading,
    isRefreshing,
    isMutating,
    detailsLoading,
    detailsRefreshing,
    errorMessage,
    detailsErrorMessage,
    refresh,
    refreshDetails,
    createEquipment,
    updateEquipment,
    deactivateEquipment,
    reactivateEquipment,
    deleteEquipment,
    createUsageLog,
    updateUsageLog,
    deleteUsageLog,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
  } = useEquipmentModule(selectedEquipmentId);

  const sourceRows = useMemo(
    () =>
      equipment.filter((row) =>
        listMode === 'active' ? row.status !== 'inactive' : row.status === 'inactive',
      ),
    [equipment, listMode],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return sourceRows;

    return sourceRows.filter((row) => {
      const nameMatch = row.name.toLowerCase().includes(normalizedSearch);
      const typeMatch = (row.type ?? '').toLowerCase().includes(normalizedSearch);
      const statusMatch = row.status.toLowerCase().includes(normalizedSearch);
      return nameMatch || typeMatch || statusMatch;
    });
  }, [searchValue, sourceRows]);

  const operatorLabelById = useMemo(() => {
    return new Map(operatorOptions.map((option) => [option.value, option.label]));
  }, [operatorOptions]);

  const fieldLabelById = useMemo(() => {
    return new Map(fieldOptions.map((option) => [option.value, option.label]));
  }, [fieldOptions]);

  function closeEquipmentForm() {
    setFormVisible(false);
    setEditingEquipmentId(null);
    setFormValues(toEquipmentFormValues());
  }

  function openCreateEquipmentForm() {
    setFormMode('create');
    setEditingEquipmentId(null);
    setFormValues(toEquipmentFormValues());
    setFormVisible(true);
  }

  function openEditEquipmentForm(row: EquipmentSummary) {
    setFormMode('edit');
    setEditingEquipmentId(row.id);
    setFormValues({
      name: row.name,
      type: row.type ?? '',
      status: row.status === 'inactive' ? 'inactive' : row.status === 'maintenance' ? 'maintenance' : 'operational',
      serialNumber: row.serialNumber ?? '',
      notes: row.notes ?? '',
    });
    setFormVisible(true);
  }

  async function submitEquipmentForm() {
    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      showToast({ message: 'Equipment name is required.', variant: 'error' });
      return;
    }

    const payload = {
      name: trimmedName,
      type: formValues.type.trim() || null,
      status: formValues.status,
      serial_number: formValues.serialNumber.trim() || null,
      notes: formValues.notes.trim() || null,
    };

    try {
      if (formMode === 'create') {
        await createEquipment(payload);
        showToast({ message: 'Equipment created.', variant: 'success' });
      } else if (editingEquipmentId) {
        await updateEquipment(editingEquipmentId, payload);
        showToast({ message: 'Equipment updated.', variant: 'success' });
      }
      closeEquipmentForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Equipment mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitEquipmentAction() {
    if (!confirmEquipmentTarget || !confirmAction) return;

    try {
      if (confirmAction === 'deactivate') {
        await deactivateEquipment(confirmEquipmentTarget.id);
        showToast({ message: 'Equipment deactivated.', variant: 'success' });
      }
      if (confirmAction === 'reactivate') {
        await reactivateEquipment(confirmEquipmentTarget.id);
        showToast({ message: 'Equipment reactivated.', variant: 'success' });
      }
      if (confirmAction === 'delete') {
        await deleteEquipment(confirmEquipmentTarget.id);
        if (selectedEquipmentId === confirmEquipmentTarget.id) {
          setSelectedEquipmentId(null);
        }
        showToast({ message: 'Equipment deleted.', variant: 'success' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Equipment status update failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmAction(null);
      setConfirmEquipmentTarget(null);
      setActionEquipment(null);
    }
  }

  function openEquipmentDetails(row: EquipmentSummary) {
    setSelectedEquipmentId(row.id);
    setDetailTab('usage');
  }

  function closeEquipmentDetails() {
    setSelectedEquipmentId(null);
    setActionUsageLog(null);
    setActionMaintenanceRecord(null);
  }

  function closeUsageForm() {
    setUsageFormVisible(false);
    setEditingUsageLog(null);
    setUsageFormValues(toUsageLogFormValues());
  }

  function openCreateUsageForm() {
    setUsageFormMode('create');
    setEditingUsageLog(null);
    setUsageFormValues(toUsageLogFormValues());
    setUsageFormVisible(true);
  }

  function openEditUsageForm(log: EquipmentUsageLog) {
    setUsageFormMode('edit');
    setEditingUsageLog(log);
    setUsageFormValues(toUsageLogFormValues(log));
    setUsageFormVisible(true);
  }

  async function submitUsageForm() {
    if (!selectedEquipmentId) {
      showToast({ message: 'Select an equipment record first.', variant: 'error' });
      return;
    }
    if (!usageFormValues.operatorId || !usageFormValues.fieldId) {
      showToast({ message: 'Operator and field are required.', variant: 'error' });
      return;
    }

    const payload = {
      operator_id: usageFormValues.operatorId,
      field_id: usageFormValues.fieldId,
      lot_id: usageFormValues.lotId || null,
      usage_purpose: usageFormValues.usagePurpose,
      usage_description: usageFormValues.usageDescription.trim() || null,
      date_used: usageFormValues.dateUsed,
    };

    try {
      if (usageFormMode === 'create') {
        await createUsageLog(selectedEquipmentId, payload);
        showToast({ message: 'Usage log created.', variant: 'success' });
      } else if (editingUsageLog) {
        await updateUsageLog(editingUsageLog.id, payload);
        showToast({ message: 'Usage log updated.', variant: 'success' });
      }
      closeUsageForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Usage log mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitUsageDelete() {
    if (!confirmUsageDeleteTarget) return;

    try {
      await deleteUsageLog(confirmUsageDeleteTarget.id);
      showToast({ message: 'Usage log deleted.', variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Usage log deletion failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmUsageDeleteTarget(null);
      setActionUsageLog(null);
    }
  }

  function closeMaintenanceForm() {
    setMaintenanceFormVisible(false);
    setEditingMaintenanceRecord(null);
    setMaintenanceFormValues(toMaintenanceFormValues());
  }

  function openCreateMaintenanceForm() {
    setMaintenanceFormMode('create');
    setEditingMaintenanceRecord(null);
    setMaintenanceFormValues(toMaintenanceFormValues());
    setMaintenanceFormVisible(true);
  }

  function openEditMaintenanceForm(record: MaintenanceRecord) {
    setMaintenanceFormMode('edit');
    setEditingMaintenanceRecord(record);
    setMaintenanceFormValues(toMaintenanceFormValues(record));
    setMaintenanceFormVisible(true);
  }

  async function submitMaintenanceForm() {
    if (!selectedEquipmentId) {
      showToast({ message: 'Select an equipment record first.', variant: 'error' });
      return;
    }
    if (!maintenanceFormValues.serviceDescription.trim()) {
      showToast({ message: 'Service description is required.', variant: 'error' });
      return;
    }

    const payload = {
      service_type: maintenanceFormValues.serviceType,
      service_description: maintenanceFormValues.serviceDescription.trim(),
      date_performed: maintenanceFormValues.datePerformed,
      next_maintenance_due: maintenanceFormValues.nextMaintenanceDue,
      service_performed_by: maintenanceFormValues.servicePerformedBy.trim() || null,
    };

    try {
      if (maintenanceFormMode === 'create') {
        await createMaintenanceRecord(selectedEquipmentId, payload);
        showToast({ message: 'Maintenance record created.', variant: 'success' });
      } else if (editingMaintenanceRecord) {
        await updateMaintenanceRecord(editingMaintenanceRecord.id, payload);
        showToast({ message: 'Maintenance record updated.', variant: 'success' });
      }
      closeMaintenanceForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Maintenance mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitMaintenanceDelete() {
    if (!confirmMaintenanceDeleteTarget) return;

    try {
      await deleteMaintenanceRecord(confirmMaintenanceDeleteTarget.id);
      showToast({ message: 'Maintenance record deleted.', variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Maintenance deletion failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setConfirmMaintenanceDeleteTarget(null);
      setActionMaintenanceRecord(null);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="Equipment"
        subtitle="Manage equipment assets, usage logs, and maintenance records."
      />

      <View style={styles.topActions}>
        <View style={styles.primaryAction}>
          <AppButton label="Create Equipment" onPress={openCreateEquipmentForm} />
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
        <AppSection
          title="Upcoming maintenance"
          description="Summary from /equipment/upcoming-maintenance."
        >
          {upcomingMaintenance.length === 0 ? (
            <EmptyState
              title="No upcoming maintenance"
              message="No equipment maintenance due right now."
            />
          ) : (
            <View style={styles.rows}>
              {upcomingMaintenance.slice(0, 3).map((item) => (
                <AppCard key={item.id}>
                  <AppListItem
                    title={item.equipmentName}
                    description={`${item.serviceType ?? 'service'} • due ${toDateLabel(item.dueDate)}`}
                    leftIcon="calendar-clock"
                  />
                  <View style={styles.rowMeta}>
                    <View style={styles.metaGroup}>
                      <Text style={styles.metaText}>Status</Text>
                      <AppBadge
                        value={item.status ?? 'scheduled'}
                        variant={item.status === 'overdue' ? 'destructive' : 'accent'}
                      />
                    </View>
                    <View style={styles.metaGroup}>
                      <Text style={styles.metaText}>Days</Text>
                      <AppBadge
                        value={item.daysUntilDue ?? 'n/a'}
                        variant={
                          typeof item.daysUntilDue === 'number' && item.daysUntilDue < 0
                            ? 'destructive'
                            : 'warning'
                        }
                      />
                    </View>
                  </View>
                </AppCard>
              ))}
            </View>
          )}
        </AppSection>
      </AppCard>

      <AppCard>
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search equipment"
        >
          <AppTabs
            value={listMode}
            onValueChange={(nextValue) => setListMode(nextValue as EquipmentListMode)}
            tabs={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </FilterBar>
      </AppCard>

      <AppCard>
        <AppSection
          title="Equipment records"
          description="Reusable list/filter/pagination patterns from the shared UI kit."
        >
          {isLoading ? (
            <>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title="No equipment found"
              message="Try another search or create a new equipment record."
              actionLabel="Create equipment"
              onAction={openCreateEquipmentForm}
            />
          ) : (
            <PullToRefreshContainer
              refreshing={isRefreshing}
              onRefresh={() => void refresh()}
            >
              <View style={styles.rows}>
                {filteredRows.map((row) => (
                  <AppCard key={row.id}>
                    <AppListItem
                      title={row.name}
                      description={`${row.type ?? 'Unknown type'} • ${toDateLabel(row.nextMaintenanceDate)}`}
                      leftIcon="tractor"
                      onPress={() => setActionEquipment(row)}
                    />
                    <View style={styles.rowMeta}>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaText}>Status</Text>
                        <AppBadge value={toStatusLabel(row.status)} variant={toStatusVariant(row.status)} />
                      </View>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaText}>Serial</Text>
                        <AppBadge value={row.serialNumber ?? 'n/a'} variant="neutral" />
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
        onDismiss={closeEquipmentForm}
        title={formMode === 'create' ? 'Create Equipment' : 'Edit Equipment'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeEquipmentForm} />
            <AppButton
              label={formMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitEquipmentForm()}
              disabled={isMutating || !formValues.name.trim()}
              loading={isMutating}
            />
          </View>
        }
      >
        <FormField label="Name" required>
          <AppInput
            value={formValues.name}
            onChangeText={(nextValue) => setFormValues((current) => ({ ...current, name: nextValue }))}
            placeholder="Equipment name"
          />
        </FormField>
        <FormField label="Type">
          <AppInput
            value={formValues.type}
            onChangeText={(nextValue) => setFormValues((current) => ({ ...current, type: nextValue }))}
            placeholder="Tractor, Harvester, ..."
          />
        </FormField>
        <FormField label="Status" required>
          <AppSelect
            value={formValues.status}
            onChange={(nextValue) =>
              setFormValues((current) => ({
                ...current,
                status: nextValue as EquipmentFormValues['status'],
              }))
            }
            options={EQUIPMENT_STATUS_OPTIONS.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
          />
        </FormField>
        <FormField label="Serial number">
          <AppInput
            value={formValues.serialNumber}
            onChangeText={(nextValue) =>
              setFormValues((current) => ({ ...current, serialNumber: nextValue }))
            }
            placeholder="Optional serial number"
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
        visible={Boolean(actionEquipment) && !confirmAction}
        onDismiss={() => setActionEquipment(null)}
        title={actionEquipment?.name}
        message="Choose an action for this equipment item."
        actions={
          actionEquipment
            ? [
                {
                  key: 'details',
                  label: 'Open details',
                  onPress: () => openEquipmentDetails(actionEquipment),
                },
                {
                  key: 'edit',
                  label: 'Edit',
                  onPress: () => openEditEquipmentForm(actionEquipment),
                },
                actionEquipment.status === 'inactive'
                  ? {
                      key: 'reactivate',
                      label: 'Reactivate',
                      onPress: () => {
                        setConfirmEquipmentTarget(actionEquipment);
                        setConfirmAction('reactivate');
                      },
                    }
                  : {
                      key: 'deactivate',
                      label: 'Deactivate',
                      onPress: () => {
                        setConfirmEquipmentTarget(actionEquipment);
                        setConfirmAction('deactivate');
                      },
                    },
                {
                  key: 'delete',
                  label: 'Delete',
                  destructive: true,
                  onPress: () => {
                    setConfirmEquipmentTarget(actionEquipment);
                    setConfirmAction('delete');
                  },
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(confirmAction && confirmEquipmentTarget)}
        title={
          confirmAction === 'delete'
            ? 'Delete Equipment'
            : confirmAction === 'reactivate'
              ? 'Reactivate Equipment'
              : 'Deactivate Equipment'
        }
        message={
          confirmAction === 'delete'
            ? `Delete ${confirmEquipmentTarget?.name ?? 'this equipment'}?`
            : confirmAction === 'reactivate'
              ? `Reactivate ${confirmEquipmentTarget?.name ?? 'this equipment'}?`
              : `Deactivate ${confirmEquipmentTarget?.name ?? 'this equipment'}?`
        }
        confirmLabel={confirmAction === 'delete' ? 'Delete' : 'Confirm'}
        confirmTone={confirmAction === 'delete' ? 'destructive' : 'primary'}
        confirmLoading={isMutating}
        onConfirm={() => void submitEquipmentAction()}
        onCancel={() => {
          setConfirmAction(null);
          setConfirmEquipmentTarget(null);
        }}
      />

      <BottomSheet
        visible={Boolean(selectedEquipmentId)}
        onDismiss={closeEquipmentDetails}
        title={equipmentDetail?.name ?? 'Equipment detail'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton
              label="Refresh"
              mode="outlined"
              tone="neutral"
              onPress={() => void refreshDetails()}
              loading={detailsRefreshing}
            />
            <AppButton label="Close" mode="text" tone="neutral" onPress={closeEquipmentDetails} />
          </View>
        }
      >
        {detailsLoading ? (
          <>
            <Skeleton height={56} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </>
        ) : detailsErrorMessage ? (
          <ErrorState message={detailsErrorMessage} onRetry={() => void refreshDetails()} />
        ) : !equipmentDetail ? (
          <EmptyState title="No details" message="Equipment detail could not be loaded." />
        ) : (
          <>
            <AppSection
              title="Equipment profile"
              description="Detail endpoint plus usage and maintenance history."
            >
              <AppListItem title="Type" description={equipmentDetail.type ?? 'n/a'} leftIcon="tractor" />
              <AppListItem
                title="Status"
                description={toStatusLabel(equipmentDetail.status)}
                leftIcon="shield-check"
              />
              <AppListItem
                title="Serial number"
                description={equipmentDetail.serialNumber ?? 'n/a'}
                leftIcon="barcode"
              />
              <AppListItem
                title="Next maintenance"
                description={toDateLabel(equipmentDetail.nextMaintenanceDate)}
                leftIcon="calendar-clock"
              />
            </AppSection>

            <AppTabs
              value={detailTab}
              onValueChange={(nextValue) => setDetailTab(nextValue as DetailTab)}
              tabs={[
                { value: 'usage', label: 'Usage Logs' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
            />

            {detailTab === 'usage' ? (
              <AppSection
                title="Usage logs"
                description="Create, edit, and delete usage records for this equipment."
              >
                <View style={styles.inlineActions}>
                  <AppButton label="Add Usage Log" onPress={openCreateUsageForm} />
                </View>
                {usageLogs.length === 0 ? (
                  <EmptyState
                    title="No usage logs"
                    message="Create the first usage log for this equipment."
                    actionLabel="Add usage"
                    onAction={openCreateUsageForm}
                  />
                ) : (
                  <View style={styles.rows}>
                    {usageLogs.map((log) => (
                      <AppCard key={log.id}>
                        <AppListItem
                          title={log.usagePurpose}
                          description={formatUsageMeta(log)}
                          leftIcon="timeline-clock"
                          onPress={() => setActionUsageLog(log)}
                        />
                        <View style={styles.rowMeta}>
                          <View style={styles.metaGroup}>
                            <Text style={styles.metaText}>Operator</Text>
                            <AppBadge
                              value={
                                (log.operatorId && operatorLabelById.get(log.operatorId)) ||
                                log.operatorId ||
                                'n/a'
                              }
                              variant="neutral"
                            />
                          </View>
                          <View style={styles.metaGroup}>
                            <Text style={styles.metaText}>Field</Text>
                            <AppBadge
                              value={
                                (log.fieldId && fieldLabelById.get(log.fieldId)) || log.fieldId || 'n/a'
                              }
                              variant="accent"
                            />
                          </View>
                        </View>
                      </AppCard>
                    ))}
                  </View>
                )}
              </AppSection>
            ) : null}

            {detailTab === 'maintenance' ? (
              <AppSection
                title="Maintenance records"
                description="Create, edit, and delete maintenance records with due dates."
              >
                <View style={styles.inlineActions}>
                  <AppButton label="Add Maintenance" onPress={openCreateMaintenanceForm} />
                </View>
                {maintenanceRecords.length === 0 ? (
                  <EmptyState
                    title="No maintenance records"
                    message="Create the first maintenance record for this equipment."
                    actionLabel="Add maintenance"
                    onAction={openCreateMaintenanceForm}
                  />
                ) : (
                  <View style={styles.rows}>
                    {maintenanceRecords.map((record) => (
                      <AppCard key={record.id}>
                        <AppListItem
                          title={record.serviceDescription}
                          description={formatMaintenanceMeta(record)}
                          leftIcon="wrench"
                          onPress={() => setActionMaintenanceRecord(record)}
                        />
                        <View style={styles.rowMeta}>
                          <View style={styles.metaGroup}>
                            <Text style={styles.metaText}>Service</Text>
                            <AppBadge value={record.serviceType} variant="warning" />
                          </View>
                          <View style={styles.metaGroup}>
                            <Text style={styles.metaText}>Parts</Text>
                            <AppBadge value={record.partsCount} variant="neutral" />
                          </View>
                        </View>
                      </AppCard>
                    ))}
                  </View>
                )}
              </AppSection>
            ) : null}
          </>
        )}
      </BottomSheet>

      <BottomSheet
        visible={usageFormVisible}
        onDismiss={closeUsageForm}
        title={usageFormMode === 'create' ? 'Add Usage Log' : 'Edit Usage Log'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeUsageForm} />
            <AppButton
              label={usageFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitUsageForm()}
              disabled={isMutating || !usageFormValues.operatorId || !usageFormValues.fieldId}
              loading={isMutating}
            />
          </View>
        }
      >
        <FormField
          label="Operator"
          required
          helperText={operatorOptions.length === 0 ? 'No active operators available.' : undefined}
        >
          <AppSelect
            value={usageFormValues.operatorId}
            onChange={(nextValue) =>
              setUsageFormValues((current) => ({ ...current, operatorId: nextValue }))
            }
            options={operatorOptions}
            placeholder="Select operator"
          />
        </FormField>
        <FormField
          label="Field"
          required
          helperText={fieldOptions.length === 0 ? 'No active fields available.' : undefined}
        >
          <AppSelect
            value={usageFormValues.fieldId}
            onChange={(nextValue) => setUsageFormValues((current) => ({ ...current, fieldId: nextValue }))}
            options={fieldOptions}
            placeholder="Select field"
          />
        </FormField>
        <FormField label="Usage purpose" required>
          <AppSelect
            value={usageFormValues.usagePurpose}
            onChange={(nextValue) =>
              setUsageFormValues((current) => ({
                ...current,
                usagePurpose: nextValue as UsageLogFormValues['usagePurpose'],
              }))
            }
            options={USAGE_PURPOSE_OPTIONS.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
          />
        </FormField>
        <FormField label="Date used">
          <AppDatePicker
            value={usageFormValues.dateUsed}
            onChange={(nextValue) =>
              setUsageFormValues((current) => ({ ...current, dateUsed: nextValue }))
            }
            label="Usage date"
          />
        </FormField>
        <FormField label="Usage description">
          <AppTextArea
            value={usageFormValues.usageDescription}
            onChangeText={(nextValue) =>
              setUsageFormValues((current) => ({ ...current, usageDescription: nextValue }))
            }
            placeholder="Optional usage notes"
          />
        </FormField>
      </BottomSheet>

      <ActionSheet
        visible={Boolean(actionUsageLog) && !confirmUsageDeleteTarget}
        onDismiss={() => setActionUsageLog(null)}
        title={actionUsageLog?.usagePurpose}
        message="Choose an action for this usage log."
        actions={
          actionUsageLog
            ? [
                {
                  key: 'edit-usage',
                  label: 'Edit',
                  onPress: () => openEditUsageForm(actionUsageLog),
                },
                {
                  key: 'delete-usage',
                  label: 'Delete',
                  destructive: true,
                  onPress: () => setConfirmUsageDeleteTarget(actionUsageLog),
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(confirmUsageDeleteTarget)}
        title="Delete Usage Log"
        message="Delete this usage log entry?"
        confirmLabel="Delete"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void submitUsageDelete()}
        onCancel={() => setConfirmUsageDeleteTarget(null)}
      />

      <BottomSheet
        visible={maintenanceFormVisible}
        onDismiss={closeMaintenanceForm}
        title={maintenanceFormMode === 'create' ? 'Add Maintenance' : 'Edit Maintenance'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeMaintenanceForm} />
            <AppButton
              label={maintenanceFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitMaintenanceForm()}
              disabled={isMutating || !maintenanceFormValues.serviceDescription.trim()}
              loading={isMutating}
            />
          </View>
        }
      >
        <FormField label="Service type" required>
          <AppSelect
            value={maintenanceFormValues.serviceType}
            onChange={(nextValue) =>
              setMaintenanceFormValues((current) => ({
                ...current,
                serviceType: nextValue as MaintenanceFormValues['serviceType'],
              }))
            }
            options={MAINTENANCE_SERVICE_TYPE_OPTIONS.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
          />
        </FormField>
        <FormField label="Date performed" required>
          <AppDatePicker
            value={maintenanceFormValues.datePerformed}
            onChange={(nextValue) =>
              setMaintenanceFormValues((current) => ({
                ...current,
                datePerformed: nextValue ?? current.datePerformed,
              }))
            }
            label="Performed date"
          />
        </FormField>
        <FormField label="Next maintenance due">
          <AppDatePicker
            value={maintenanceFormValues.nextMaintenanceDue}
            onChange={(nextValue) =>
              setMaintenanceFormValues((current) => ({ ...current, nextMaintenanceDue: nextValue }))
            }
            label="Next due date"
          />
        </FormField>
        <FormField label="Performed by">
          <AppInput
            value={maintenanceFormValues.servicePerformedBy}
            onChangeText={(nextValue) =>
              setMaintenanceFormValues((current) => ({ ...current, servicePerformedBy: nextValue }))
            }
            placeholder="Optional technician name"
          />
        </FormField>
        <FormField label="Service description" required>
          <AppTextArea
            value={maintenanceFormValues.serviceDescription}
            onChangeText={(nextValue) =>
              setMaintenanceFormValues((current) => ({ ...current, serviceDescription: nextValue }))
            }
            placeholder="Describe maintenance performed"
          />
        </FormField>
      </BottomSheet>

      <ActionSheet
        visible={Boolean(actionMaintenanceRecord) && !confirmMaintenanceDeleteTarget}
        onDismiss={() => setActionMaintenanceRecord(null)}
        title={actionMaintenanceRecord?.serviceDescription}
        message="Choose an action for this maintenance record."
        actions={
          actionMaintenanceRecord
            ? [
                {
                  key: 'edit-maintenance',
                  label: 'Edit',
                  onPress: () => openEditMaintenanceForm(actionMaintenanceRecord),
                },
                {
                  key: 'delete-maintenance',
                  label: 'Delete',
                  destructive: true,
                  onPress: () => setConfirmMaintenanceDeleteTarget(actionMaintenanceRecord),
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(confirmMaintenanceDeleteTarget)}
        title="Delete Maintenance Record"
        message="Delete this maintenance record?"
        confirmLabel="Delete"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void submitMaintenanceDelete()}
        onCancel={() => setConfirmMaintenanceDeleteTarget(null)}
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
    minWidth: 124,
  },
  inlineActions: {
    marginBottom: spacing.sm,
  },
  rows: {
    gap: spacing.sm,
  },
  rowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
