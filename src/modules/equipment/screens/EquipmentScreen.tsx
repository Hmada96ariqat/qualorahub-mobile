import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type {
  EquipmentSummary,
  EquipmentUsageLog,
  MaintenanceRecord,
  UpcomingMaintenanceItem,
} from '../../../api/modules/equipment';
import {
  ActionSheet,
  AppButton,
  AppDatePicker,
  AppInput,
  AppScreen,
  AppSelect,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  DashedAddButton,
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
  UnderlineTabs,
  useFormValidation,
  useToast,
} from '../../../components';
import type { DotBadgeVariant, ListRowIconVariant, QuickAction } from '../../../components';
import { palette } from '../../../theme/tokens';
import {
  EQUIPMENT_STATUS_OPTIONS,
  MAINTENANCE_SERVICE_TYPE_OPTIONS,
  TRACK_USAGE_OPTIONS,
  USAGE_PURPOSE_OPTIONS,
  getTrackUsageLabel,
  getTrackUsageShortLabel,
  normalizeTrackUsage,
  parseMaintenancePerformerReference,
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
import {
  finalizeEquipmentUsagePurpose,
  getEquipmentUsagePurposeLabel,
} from '../equipmentUsagePurpose';
import { getServicePerformerLabel } from '../servicePerformer';
import { useEquipmentModule } from '../useEquipmentModule.hook';

type EquipmentAction = 'deactivate' | 'reactivate' | 'delete' | null;

type DetailTab = 'usage' | 'maintenance';

/* ─── Helpers ─── */

function toStatusBadgeLabel(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === 'operational') return 'Active';
  if (s === 'maintenance') return 'Service';
  if (s === 'inactive') return 'Inactive';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function toStatusBadgeVariant(status: string): DotBadgeVariant {
  const s = status.trim().toLowerCase();
  if (s === 'operational') return 'success';
  if (s === 'maintenance') return 'warning';
  if (s === 'inactive') return 'neutral';
  return 'neutral';
}

function toIconVariant(status: string): ListRowIconVariant {
  const s = status.trim().toLowerCase();
  if (s === 'operational') return 'green';
  if (s === 'maintenance') return 'amber';
  return 'neutral';
}

function toEquipmentIcon(type: string | null | undefined): string {
  const t = (type ?? '').trim().toLowerCase();
  if (t.includes('tractor')) return 'tractor';
  if (t.includes('harvest') || t.includes('combine')) return 'barley';
  if (t.includes('transport') || t.includes('truck')) return 'truck-outline';
  if (t.includes('spray')) return 'spray';
  if (t.includes('atv') || t.includes('vehicle')) return 'car-outline';
  return 'wrench-outline';
}

function toDateLabel(value: string | null | undefined): string {
  if (!value) return 'n/a';
  const dateStr = value.includes('T') ? value.slice(0, 10) : value;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function toShortDate(value: string | null | undefined): string {
  if (!value) return 'n/a';
  const dateStr = value.includes('T') ? value.slice(0, 10) : value;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function toServiceTypeLabel(serviceType: string): string {
  const normalized = serviceType.trim().toLowerCase();
  if (normalized === 'scheduled') return 'Scheduled';
  if (normalized === 'preventive') return 'Preventive';
  if (normalized === 'emergency') return 'Emergency';
  return serviceType;
}

function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toUsageAmountLabel(trackUsage: string | null | undefined): string {
  const normalized = normalizeTrackUsage(trackUsage);
  if (normalized === 'km') return 'Distance';
  if (normalized === 'miles') return 'Miles';
  return 'Hours';
}

/* ─── Component ─── */

export function EquipmentScreen() {
  const { showToast } = useToast();
  const equipmentFormScrollRef = useRef<ScrollView | null>(null);
  const equipmentFormValidation = useFormValidation<'name'>(equipmentFormScrollRef);
  const usageFormScrollRef = useRef<ScrollView | null>(null);
  const usageFormValidation = useFormValidation<
    'operatorId' | 'fieldId' | 'usagePurpose' | 'otherPurpose' | 'dateUsed'
  >(usageFormScrollRef);
  const maintenanceFormScrollRef = useRef<ScrollView | null>(null);
  const maintenanceFormValidation = useFormValidation<
    'serviceType' | 'datePerformed' | 'servicePerformedBy' | 'serviceDescription'
  >(maintenanceFormScrollRef);

  /* ─── List state ─── */
  const [listMode, setListMode] = useState<EquipmentListMode>('active');
  const [searchValue, setSearchValue] = useState('');

  /* ─── Equipment form state ─── */
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<EquipmentFormMode>('create');
  const [formValues, setFormValues] = useState<EquipmentFormValues>(toEquipmentFormValues());
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);

  /* ─── Equipment action state ─── */
  const [actionEquipment, setActionEquipment] = useState<EquipmentSummary | null>(null);
  const [confirmAction, setConfirmAction] = useState<EquipmentAction>(null);
  const [confirmEquipmentTarget, setConfirmEquipmentTarget] = useState<EquipmentSummary | null>(
    null,
  );

  /* ─── Detail state ─── */
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('usage');

  /* ─── Usage log state ─── */
  const [usageFormVisible, setUsageFormVisible] = useState(false);
  const [usageFormMode, setUsageFormMode] = useState<UsageLogFormMode>('create');
  const [usageFormValues, setUsageFormValues] =
    useState<UsageLogFormValues>(toUsageLogFormValues());
  const [usageEndingReadingManuallyEdited, setUsageEndingReadingManuallyEdited] = useState(false);
  const [editingUsageLog, setEditingUsageLog] = useState<EquipmentUsageLog | null>(null);
  const [actionUsageLog, setActionUsageLog] = useState<EquipmentUsageLog | null>(null);
  const [confirmUsageDeleteTarget, setConfirmUsageDeleteTarget] =
    useState<EquipmentUsageLog | null>(null);

  /* ─── Maintenance state ─── */
  const [maintenanceFormVisible, setMaintenanceFormVisible] = useState(false);
  const [maintenanceFormMode, setMaintenanceFormMode] = useState<MaintenanceFormMode>('create');
  const [maintenanceFormValues, setMaintenanceFormValues] =
    useState<MaintenanceFormValues>(toMaintenanceFormValues());
  const [editingMaintenanceRecord, setEditingMaintenanceRecord] =
    useState<MaintenanceRecord | null>(null);
  const [actionMaintenanceRecord, setActionMaintenanceRecord] = useState<MaintenanceRecord | null>(
    null,
  );
  const [confirmMaintenanceDeleteTarget, setConfirmMaintenanceDeleteTarget] =
    useState<MaintenanceRecord | null>(null);

  /* ─── Maintenance alerts sheet state ─── */
  const [maintenanceAlertsVisible, setMaintenanceAlertsVisible] = useState(false);

  /* ─── Hook ─── */
  const {
    equipment,
    upcomingMaintenance,
    operatorOptions,
    contactOptions,
    fieldOptions,
    lotOptions,
    servicePerformerOptions,
    equipmentDetail,
    usageLogs,
    maintenanceRecords,
    isLoading,
    isRefreshing,
    isMutating,
    detailsLoading,
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
  } = useEquipmentModule(selectedEquipmentId, {
    selectedUsageFieldId: usageFormValues.fieldId,
  });

  /* ─── Computed values ─── */

  const activeCount = useMemo(
    () => equipment.filter((e) => e.status === 'operational').length,
    [equipment],
  );
  const maintenanceCount = useMemo(
    () => equipment.filter((e) => e.status === 'maintenance').length,
    [equipment],
  );
  const overdueItems = useMemo(
    () => upcomingMaintenance.filter((m) => m.status === 'overdue'),
    [upcomingMaintenance],
  );
  const upcomingItems = useMemo(
    () => upcomingMaintenance.filter((m) => m.status !== 'overdue'),
    [upcomingMaintenance],
  );
  const overdueCount = overdueItems.length;

  const overdueEquipmentIds = useMemo(
    () => new Set(overdueItems.map((m) => m.equipmentId)),
    [overdueItems],
  );

  const sourceRows = useMemo(() => {
    if (listMode === 'all') return equipment;
    if (listMode === 'active') return equipment.filter((row) => row.status !== 'inactive');
    return equipment.filter((row) => row.status === 'inactive');
  }, [equipment, listMode]);

  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) return sourceRows;

    return sourceRows.filter((row) => {
      const nameMatch = row.name.toLowerCase().includes(term);
      const typeMatch = (row.type ?? '').toLowerCase().includes(term);
      const statusMatch = row.status.toLowerCase().includes(term);
      const serialMatch = (row.serialNumber ?? '').toLowerCase().includes(term);
      return nameMatch || typeMatch || statusMatch || serialMatch;
    });
  }, [searchValue, sourceRows]);

  const contactLabelById = useMemo(
    () => new Map(contactOptions.map((opt) => [opt.value, opt.label])),
    [contactOptions],
  );

  const fieldLabelById = useMemo(
    () => new Map(fieldOptions.map((opt) => [opt.value, opt.label])),
    [fieldOptions],
  );

  const lotLabelById = useMemo(
    () => new Map(lotOptions.map((opt) => [opt.value, opt.label])),
    [lotOptions],
  );

  const performerUsers = useMemo(
    () =>
      operatorOptions.map((option) => ({
        user_id: option.value,
        display_name: option.label,
        email: option.email ?? null,
      })),
    [operatorOptions],
  );

  const performerContacts = useMemo(
    () =>
      contactOptions.map((option) => ({
        id: option.value,
        name: option.label,
        email: option.email ?? null,
      })),
    [contactOptions],
  );

  const equipmentTrackUsage = useMemo(
    () => normalizeTrackUsage(equipmentDetail?.trackUsage),
    [equipmentDetail?.trackUsage],
  );

  useEffect(() => {
    if (!usageFormVisible) return;
    if (usageFormMode !== 'create') return;
    if (usageFormValues.lotId || lotOptions.length === 0) return;

    setUsageFormValues((current) => ({
      ...current,
      lotId: lotOptions[0]?.value ?? null,
    }));
  }, [lotOptions, usageFormMode, usageFormValues.lotId, usageFormVisible]);

  useEffect(() => {
    if (!usageFormValues.lotId) return;
    if (lotOptions.some((option) => option.value === usageFormValues.lotId)) return;

    setUsageFormValues((current) => ({
      ...current,
      lotId: null,
    }));
  }, [lotOptions, usageFormValues.lotId]);

  useEffect(() => {
    if (!usageFormVisible) return;
    if (equipmentTrackUsage !== 'hours') return;
    if (usageEndingReadingManuallyEdited) return;

    const startingReading = parseOptionalNumber(usageFormValues.startingReading);
    const durationHours = parseOptionalNumber(usageFormValues.durationHours);
    if (startingReading === null || durationHours === null) return;

    setUsageFormValues((current) => ({
      ...current,
      endingReading: String(startingReading + durationHours),
    }));
  }, [
    equipmentTrackUsage,
    usageEndingReadingManuallyEdited,
    usageFormValues.durationHours,
    usageFormValues.startingReading,
    usageFormVisible,
  ]);

  const inactiveCount = useMemo(
    () => equipment.filter((e) => e.status === 'inactive').length,
    [equipment],
  );

  /* ─── Equipment form handlers ─── */

  function closeEquipmentForm() {
    setFormVisible(false);
    setEditingEquipmentId(null);
    setFormValues(toEquipmentFormValues());
    equipmentFormValidation.reset();
  }

  function openCreateEquipmentForm() {
    setFormMode('create');
    setEditingEquipmentId(null);
    setFormValues(toEquipmentFormValues());
    equipmentFormValidation.reset();
    setFormVisible(true);
  }

  function openEditEquipmentForm(row: EquipmentSummary) {
    setFormMode('edit');
    setEditingEquipmentId(row.id);
    equipmentFormValidation.reset();
    if (equipmentDetail?.id === row.id) {
      setFormValues(toEquipmentFormValues(equipmentDetail));
    } else {
      setFormValues({
        ...toEquipmentFormValues(),
        name: row.name,
        type: row.type ?? '',
        status:
          row.status === 'inactive'
            ? 'inactive'
            : row.status === 'maintenance'
              ? 'maintenance'
              : 'operational',
        serialNumber: row.serialNumber ?? '',
        notes: row.notes ?? '',
      });
    }
    setFormVisible(true);
  }

  async function submitEquipmentForm() {
    const trimmedName = formValues.name.trim();
    const valid = equipmentFormValidation.validate([
      {
        field: 'name',
        message: 'Equipment name is required.',
        isValid: trimmedName.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const payload = {
      name: trimmedName,
      type: formValues.type.trim() || null,
      status: formValues.status,
      serial_number: formValues.serialNumber.trim() || null,
      track_usage: formValues.trackUsage,
      current_usage_reading: parseOptionalNumber(formValues.currentUsageReading),
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

  /* ─── Equipment action handlers ─── */

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

  /* ─── Detail handlers ─── */

  function openEquipmentDetails(row: EquipmentSummary) {
    setSelectedEquipmentId(row.id);
    setDetailTab('usage');
  }

  function closeEquipmentDetails() {
    setSelectedEquipmentId(null);
    setActionUsageLog(null);
    setActionMaintenanceRecord(null);
  }

  /* ─── Usage log handlers ─── */

  function closeUsageForm() {
    setUsageFormVisible(false);
    setEditingUsageLog(null);
    setUsageEndingReadingManuallyEdited(false);
    setUsageFormValues(toUsageLogFormValues());
    usageFormValidation.reset();
  }

  function openCreateUsageForm() {
    setUsageFormMode('create');
    setEditingUsageLog(null);
    setUsageEndingReadingManuallyEdited(false);
    usageFormValidation.reset();
    setUsageFormValues({
      ...toUsageLogFormValues(),
      startingReading: equipmentDetail?.currentUsageReading ?? '',
    });
    setUsageFormVisible(true);
  }

  function openEditUsageForm(log: EquipmentUsageLog) {
    setUsageFormMode('edit');
    setEditingUsageLog(log);
    setUsageEndingReadingManuallyEdited(false);
    usageFormValidation.reset();
    setUsageFormValues(toUsageLogFormValues(log));
    setUsageFormVisible(true);
  }

  async function submitUsageForm() {
    if (!selectedEquipmentId) {
      showToast({ message: 'Select an equipment record first.', variant: 'error' });
      return;
    }
    const finalPurpose = finalizeEquipmentUsagePurpose(
      usageFormValues.usagePurpose,
      usageFormValues.otherPurpose,
    );
    const valid = usageFormValidation.validate([
      {
        field: 'operatorId',
        message: 'Operator is required.',
        isValid: Boolean(usageFormValues.operatorId),
      },
      {
        field: 'fieldId',
        message: 'Field is required.',
        isValid: Boolean(usageFormValues.fieldId),
      },
      {
        field: 'usagePurpose',
        message: 'Usage purpose is required.',
        isValid: Boolean(usageFormValues.usagePurpose),
      },
      {
        field: 'otherPurpose',
        message: 'Other purpose is required.',
        isValid:
          usageFormValues.usagePurpose !== 'other' || usageFormValues.otherPurpose.trim().length > 0,
      },
      {
        field: 'dateUsed',
        message: 'Date used is required.',
        isValid: Boolean(usageFormValues.dateUsed),
      },
    ]);
    if (!valid || !finalPurpose) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const startingReading = parseOptionalNumber(usageFormValues.startingReading);
    const endingReading = parseOptionalNumber(usageFormValues.endingReading);
    const durationHours = parseOptionalNumber(usageFormValues.durationHours);
    const operatorId = usageFormValues.operatorId;
    const fieldId = usageFormValues.fieldId;
    const totalUsed =
      startingReading !== null && endingReading !== null ? endingReading - startingReading : null;

    if (totalUsed !== null && totalUsed < 0) {
      showToast({
        message: 'Ending reading must be greater than or equal to starting reading.',
        variant: 'error',
      });
      return;
    }
    if (!operatorId || !fieldId) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const payload = {
      operator_id: operatorId,
      used_by_id: usageFormValues.usedById,
      field_id: fieldId,
      lot_id: usageFormValues.lotId || null,
      usage_purpose: finalPurpose,
      usage_description: usageFormValues.usageDescription.trim() || null,
      date_used: usageFormValues.dateUsed,
      starting_reading: startingReading,
      ending_reading: endingReading,
      total_used: totalUsed,
      total_hours_used: durationHours,
      fuel_consumables_used: usageFormValues.fuelConsumablesUsed.trim() || null,
      cost: parseOptionalNumber(usageFormValues.cost),
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

  /* ─── Maintenance handlers ─── */

  function closeMaintenanceForm() {
    setMaintenanceFormVisible(false);
    setEditingMaintenanceRecord(null);
    setMaintenanceFormValues(toMaintenanceFormValues());
    maintenanceFormValidation.reset();
  }

  function openCreateMaintenanceForm() {
    setMaintenanceFormMode('create');
    setEditingMaintenanceRecord(null);
    setMaintenanceFormValues(toMaintenanceFormValues());
    maintenanceFormValidation.reset();
    setMaintenanceFormVisible(true);
  }

  function openEditMaintenanceForm(record: MaintenanceRecord) {
    setMaintenanceFormMode('edit');
    setEditingMaintenanceRecord(record);
    maintenanceFormValidation.reset();
    setMaintenanceFormValues(
      toMaintenanceFormValues(record, {
        users: performerUsers,
        contacts: performerContacts,
      }),
    );
    setMaintenanceFormVisible(true);
  }

  async function submitMaintenanceForm() {
    if (!selectedEquipmentId) {
      showToast({ message: 'Select an equipment record first.', variant: 'error' });
      return;
    }

    const performerReference = parseMaintenancePerformerReference(
      maintenanceFormValues.servicePerformedBy,
    );
    const valid = maintenanceFormValidation.validate([
      {
        field: 'serviceType',
        message: 'Service type is required.',
        isValid: maintenanceFormValues.serviceType.trim().length > 0,
      },
      {
        field: 'datePerformed',
        message: 'Date performed is required.',
        isValid: Boolean(maintenanceFormValues.datePerformed),
      },
      {
        field: 'servicePerformedBy',
        message: performerReference.valid
          ? 'Performed by is required.'
          : 'Performed by must use user:<uuid> or contact:<uuid> format.',
        isValid: Boolean(maintenanceFormValues.servicePerformedBy) && performerReference.valid,
      },
      {
        field: 'serviceDescription',
        message: 'Service description is required.',
        isValid: maintenanceFormValues.serviceDescription.trim().length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    if (!performerReference.valid) {
      showToast({
        message: 'Performed by must use user:<uuid> or contact:<uuid> format.',
        variant: 'error',
      });
      return;
    }

    const payload = {
      service_type: maintenanceFormValues.serviceType,
      service_description: maintenanceFormValues.serviceDescription.trim(),
      date_performed: maintenanceFormValues.datePerformed,
      next_maintenance_due: maintenanceFormValues.nextMaintenanceDue,
      service_performed_by: performerReference.value,
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

  /* ─── Detail quick actions ─── */

  function buildDetailQuickActions() {
    if (!equipmentDetail) return [];

    const actions: QuickAction[] = [
      {
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green' as const,
        onPress: () => {
          const summary: EquipmentSummary = {
            id: equipmentDetail.id,
            name: equipmentDetail.name,
            type: equipmentDetail.type,
            status: equipmentDetail.status,
            serialNumber: equipmentDetail.serialNumber,
            notes: equipmentDetail.notes,
            nextMaintenanceDate: equipmentDetail.nextMaintenanceDate,
            createdAt: equipmentDetail.createdAt,
            updatedAt: equipmentDetail.updatedAt,
          };
          openEditEquipmentForm(summary);
        },
      },
      {
        key: 'service',
        icon: 'wrench-outline',
        label: 'Service',
        color: 'amber' as const,
        onPress: openCreateMaintenanceForm,
      },
      {
        key: 'log-use',
        icon: 'clock-outline',
        label: 'Log Use',
        color: 'blue' as const,
        onPress: openCreateUsageForm,
      },
    ];

    if (equipmentDetail.status === 'inactive') {
      actions.push({
        key: 'reactivate',
        icon: 'check-circle-outline',
        label: 'Reactivate',
        color: 'green' as const,
        onPress: () => {
          setConfirmEquipmentTarget({
            id: equipmentDetail.id,
            name: equipmentDetail.name,
            type: equipmentDetail.type,
            status: equipmentDetail.status,
            serialNumber: equipmentDetail.serialNumber,
            notes: equipmentDetail.notes,
            nextMaintenanceDate: equipmentDetail.nextMaintenanceDate,
            createdAt: equipmentDetail.createdAt,
            updatedAt: equipmentDetail.updatedAt,
          });
          setConfirmAction('reactivate');
        },
      });
    } else {
      actions.push({
        key: 'deactivate',
        icon: 'close-circle-outline',
        label: 'Deactivate',
        color: 'red' as const,
        onPress: () => {
          setConfirmEquipmentTarget({
            id: equipmentDetail.id,
            name: equipmentDetail.name,
            type: equipmentDetail.type,
            status: equipmentDetail.status,
            serialNumber: equipmentDetail.serialNumber,
            notes: equipmentDetail.notes,
            nextMaintenanceDate: equipmentDetail.nextMaintenanceDate,
            createdAt: equipmentDetail.createdAt,
            updatedAt: equipmentDetail.updatedAt,
          });
          setConfirmAction('deactivate');
        },
      });
    }

    return actions;
  }

  /* ─── Render helpers ─── */

  function renderMaintenanceAlertItem(item: UpcomingMaintenanceItem) {
    const isOverdue = item.status === 'overdue';
    const daysText =
      typeof item.daysUntilDue === 'number'
        ? isOverdue
          ? `${item.daysUntilDue} days`
          : `${item.daysUntilDue} days`
        : '';

    return (
      <View
        key={item.id}
        style={[styles.mItem, isOverdue ? styles.mItemOverdue : styles.mItemUpcoming]}
      >
        <View
          style={[styles.mDot, { backgroundColor: isOverdue ? palette.destructive : '#FFC61A' }]}
        />
        <View style={styles.mBody}>
          <Text style={styles.mName}>{item.equipmentName}</Text>
          <Text style={styles.mInfo}>
            {item.serviceType ?? 'Service'} · Due {toShortDate(item.dueDate)}
          </Text>
        </View>
        <Text style={[styles.mDue, { color: isOverdue ? palette.destructive : '#8B6914' }]}>
          {daysText}
        </Text>
      </View>
    );
  }

  /* ─── RENDER ─── */

  return (
    <AppScreen padded={false}>
      {/* ─── Sticky Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLead}>
            <HeaderMenuButton testID="equipment-header-menu" />
            <Text style={styles.headerTitle}>Equipment</Text>
          </View>
          <View style={styles.headerBtns}>
            <NotificationHeaderButton testID="equipment-header-notifications" />
            <HeaderIconButton
              icon="alert-circle-outline"
              onPress={() => setMaintenanceAlertsVisible(true)}
              badgeDot={overdueCount > 0}
            />
            <HeaderIconButton icon="plus" onPress={openCreateEquipmentForm} filled />
          </View>
        </View>
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder="Search by name, type, serial..."
        />
      </View>

      {/* ─── Scrollable Main Content ─── */}
      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.main}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Stats Strip ─── */}
          <StatStrip
            items={[
              { value: activeCount, label: 'Active', color: 'green' },
              { value: maintenanceCount, label: 'In Service', color: 'amber' },
              { value: overdueCount, label: 'Overdue', color: 'red' },
            ]}
          />

          {/* ─── Pill Tabs ─── */}
          <PillTabs
            value={listMode}
            onValueChange={(v) => setListMode(v as EquipmentListMode)}
            tabs={[
              { value: 'all', label: `All (${equipment.length})` },
              { value: 'active', label: `Active (${activeCount})` },
              { value: 'inactive', label: `Inactive (${inactiveCount})` },
            ]}
          />

          {/* ─── Section Header ─── */}
          <SectionHeader title="Equipment" trailing={`${filteredRows.length} items`} />

          {/* ─── Equipment List ─── */}
          {isLoading ? (
            <>
              <Skeleton height={68} />
              <Skeleton height={68} />
              <Skeleton height={68} />
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
            filteredRows.map((row) => {
              const isOverdue = overdueEquipmentIds.has(row.id);
              const overdueItem = isOverdue
                ? overdueItems.find((m) => m.equipmentId === row.id)
                : undefined;
              const overdueDays =
                overdueItem && typeof overdueItem.daysUntilDue === 'number'
                  ? Math.abs(overdueItem.daysUntilDue)
                  : 0;

              return (
                <ListRow
                  key={row.id}
                  icon={toEquipmentIcon(row.type)}
                  iconVariant={toIconVariant(row.status)}
                  title={row.name}
                  subtitle={`${row.type ?? 'Equipment'} · ${row.serialNumber ?? 'No serial'}`}
                  badge={
                    <DotBadge
                      label={toStatusBadgeLabel(row.status)}
                      variant={toStatusBadgeVariant(row.status)}
                    />
                  }
                  overdueLine={isOverdue ? `Overdue ${overdueDays} days` : undefined}
                  accentBorder={isOverdue}
                  onPress={() => openEquipmentDetails(row)}
                />
              );
            })
          )}
        </ScrollView>
      </PullToRefreshContainer>

      {/* ════════════════════════════════════════
           DETAIL SHEET
           ════════════════════════════════════════ */}
      <BottomSheet
        visible={Boolean(selectedEquipmentId)}
        onDismiss={closeEquipmentDetails}
        title={equipmentDetail?.name ?? 'Equipment detail'}
      >
        {detailsLoading ? (
          <>
            <Skeleton height={120} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </>
        ) : detailsErrorMessage ? (
          <ErrorState message={detailsErrorMessage} onRetry={() => void refreshDetails()} />
        ) : !equipmentDetail ? (
          <EmptyState title="No details" message="Equipment detail could not be loaded." />
        ) : (
          <>
            {/* Profile Card */}
            <ProfileCard
              icon={toEquipmentIcon(equipmentDetail.type)}
              name={equipmentDetail.name}
              subtitle={`${equipmentDetail.type ?? 'Equipment'} · ${toStatusBadgeLabel(equipmentDetail.status)}`}
              cells={[
                { label: 'Serial', value: equipmentDetail.serialNumber ?? 'n/a' },
                { label: 'Next Service', value: toDateLabel(equipmentDetail.nextMaintenanceDate) },
                {
                  label: 'Current Reading',
                  value: equipmentDetail.currentUsageReading
                    ? `${equipmentDetail.currentUsageReading} ${getTrackUsageShortLabel(equipmentDetail.trackUsage)}`
                    : 'n/a',
                },
                { label: 'Tracking', value: getTrackUsageLabel(equipmentDetail.trackUsage) },
                { label: 'Brand', value: equipmentDetail.brand ?? 'n/a' },
              ]}
            />

            {/* Quick Actions */}
            <QuickActionGrid actions={buildDetailQuickActions()} />

            {/* Underline Tabs */}
            <UnderlineTabs
              value={detailTab}
              onValueChange={(v) => setDetailTab(v as DetailTab)}
              tabs={[
                { value: 'usage', label: 'Usage Logs' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
            />

            {/* Usage Tab */}
            {detailTab === 'usage' && (
              <>
                <DashedAddButton label="Add Usage Log" onPress={openCreateUsageForm} />
                {usageLogs.length === 0 ? (
                  <EmptyState
                    title="No usage logs"
                    message="Create the first usage log for this equipment."
                    actionLabel="Add usage"
                    onAction={openCreateUsageForm}
                  />
                ) : (
                  usageLogs.map((log) => (
                    <LogRow
                      key={log.id}
                      title={getEquipmentUsagePurposeLabel(log.usagePurpose)}
                      date={toDateLabel(log.dateUsed)}
                      chips={[
                        {
                          label: 'Operator',
                          value:
                            log.operator?.name ||
                            (log.operatorId ? contactLabelById.get(log.operatorId) : null) ||
                            'n/a',
                        },
                        ...(log.usedBy || log.usedById
                          ? [
                              {
                                label: 'Used By',
                                value:
                                  log.usedBy?.name ||
                                  (log.usedById ? contactLabelById.get(log.usedById) : null) ||
                                  'n/a',
                              },
                            ]
                          : []),
                        {
                          label: 'Field',
                          value:
                            log.field?.name ||
                            (log.fieldId ? fieldLabelById.get(log.fieldId) : null) ||
                            'n/a',
                        },
                        ...(log.lot || log.lotId
                          ? [
                              {
                                label: 'Lot',
                                value:
                                  log.lot?.name ||
                                  (log.lotId ? lotLabelById.get(log.lotId) : null) ||
                                  'n/a',
                              },
                            ]
                          : []),
                        ...((equipmentTrackUsage === 'hours' && log.totalHoursUsed) || log.totalUsed
                          ? [
                              {
                                label: toUsageAmountLabel(equipmentDetail?.trackUsage),
                                value:
                                  equipmentTrackUsage === 'hours'
                                    ? `${log.totalHoursUsed ?? log.totalUsed}${getTrackUsageShortLabel(equipmentDetail?.trackUsage)}`
                                    : `${log.totalUsed ?? 'n/a'} ${getTrackUsageShortLabel(equipmentDetail?.trackUsage)}`,
                              },
                            ]
                          : []),
                        ...(log.fuelConsumablesUsed
                          ? [{ label: 'Fuel', value: log.fuelConsumablesUsed }]
                          : []),
                      ]}
                      onPress={() => setActionUsageLog(log)}
                    />
                  ))
                )}
              </>
            )}

            {/* Maintenance Tab */}
            {detailTab === 'maintenance' && (
              <>
                <DashedAddButton
                  label="Add Maintenance Record"
                  onPress={openCreateMaintenanceForm}
                />
                {maintenanceRecords.length === 0 ? (
                  <EmptyState
                    title="No maintenance records"
                    message="Create the first maintenance record for this equipment."
                    actionLabel="Add maintenance"
                    onAction={openCreateMaintenanceForm}
                  />
                ) : (
                  maintenanceRecords.map((record) => (
                    <LogRow
                      key={record.id}
                      title={record.serviceDescription}
                      date={toDateLabel(record.datePerformed)}
                      chips={[
                        {
                          label: 'Type',
                          value: toServiceTypeLabel(record.serviceType),
                          valueColor: palette.primary,
                        },
                        {
                          label: 'By',
                          value: getServicePerformerLabel({
                            reference: record.servicePerformedBy,
                            performer: record.performedBy,
                            users: performerUsers,
                            contacts: performerContacts,
                            fallback: 'n/a',
                          }),
                        },
                        ...(record.nextMaintenanceDue
                          ? [{ label: 'Next', value: toShortDate(record.nextMaintenanceDue) }]
                          : []),
                        ...(record.partsCount
                          ? [{ label: 'Parts', value: String(record.partsCount) }]
                          : []),
                      ]}
                      onPress={() => setActionMaintenanceRecord(record)}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </BottomSheet>

      {/* ════════════════════════════════════════
           CREATE / EDIT EQUIPMENT SHEET
           ════════════════════════════════════════ */}
      <BottomSheet
        visible={formVisible}
        onDismiss={closeEquipmentForm}
        scrollViewRef={equipmentFormScrollRef}
        title={formMode === 'create' ? 'New Equipment' : 'Edit Equipment'}
        footer={
          <View style={styles.formBtns}>
            <View style={styles.formBtnHalf}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeEquipmentForm}
              />
            </View>
            <View style={styles.formBtnHalf}>
              <AppButton
                label={formMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitEquipmentForm()}
                disabled={isMutating}
                loading={isMutating}
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={equipmentFormValidation.providerValue}>
          <FormField label="Name" name="name" required>
            <AppInput
              value={formValues.name}
              onChangeText={(v) => {
                equipmentFormValidation.clearFieldError('name');
                setFormValues((c) => ({ ...c, name: v }));
              }}
              placeholder="e.g. John Deere 8R 410"
            />
          </FormField>
          <FormField label="Type">
            <AppInput
              value={formValues.type}
              onChangeText={(v) => setFormValues((c) => ({ ...c, type: v }))}
              placeholder="Tractor, Harvester, Transport..."
            />
          </FormField>
          <FormField label="Status" required>
            <AppSelect
              value={formValues.status}
              onChange={(v) =>
                setFormValues((c) => ({ ...c, status: v as EquipmentFormValues['status'] }))
              }
              options={EQUIPMENT_STATUS_OPTIONS.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
            />
          </FormField>
          <FormField label="Serial Number">
            <AppInput
              value={formValues.serialNumber}
              onChangeText={(v) => setFormValues((c) => ({ ...c, serialNumber: v }))}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Track Usage" required>
            <AppSelect
              value={formValues.trackUsage}
              onChange={(v) =>
                setFormValues((c) => ({
                  ...c,
                  trackUsage: v as EquipmentFormValues['trackUsage'],
                }))
              }
              options={TRACK_USAGE_OPTIONS.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
            />
          </FormField>
          <FormField label="Current Reading">
            <AppInput
              value={formValues.currentUsageReading}
              onChangeText={(v) => setFormValues((c) => ({ ...c, currentUsageReading: v }))}
              placeholder={`Current ${getTrackUsageLabel(formValues.trackUsage).toLowerCase()} reading`}
              keyboardType="decimal-pad"
            />
          </FormField>
          <FormField label="Notes">
            <AppTextArea
              value={formValues.notes}
              onChangeText={(v) => setFormValues((c) => ({ ...c, notes: v }))}
              placeholder="Optional notes..."
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ════════════════════════════════════════
           MAINTENANCE ALERTS SHEET
           ════════════════════════════════════════ */}
      <BottomSheet
        visible={maintenanceAlertsVisible}
        onDismiss={() => setMaintenanceAlertsVisible(false)}
        title="Upcoming Maintenance"
      >
        {overdueItems.length > 0 && (
          <>
            <SectionHeader title="Overdue" titleColor={palette.destructive} />
            {overdueItems.map(renderMaintenanceAlertItem)}
          </>
        )}
        {upcomingItems.length > 0 && (
          <>
            <View style={overdueItems.length > 0 ? styles.mSectionGap : undefined}>
              <SectionHeader title="Coming Up" titleColor="#8B6914" />
            </View>
            {upcomingItems.map(renderMaintenanceAlertItem)}
          </>
        )}
        {upcomingMaintenance.length === 0 && (
          <EmptyState title="No upcoming maintenance" message="All equipment is up to date." />
        )}
      </BottomSheet>

      {/* ════════════════════════════════════════
           EQUIPMENT ACTION SHEET
           ════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════
           EQUIPMENT CONFIRM DIALOG
           ════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════
           USAGE LOG FORM
           ════════════════════════════════════════ */}
      <BottomSheet
        visible={usageFormVisible}
        onDismiss={closeUsageForm}
        scrollViewRef={usageFormScrollRef}
        title={usageFormMode === 'create' ? 'Add Usage Log' : 'Edit Usage Log'}
        footer={
          <View style={styles.formBtns}>
            <View style={styles.formBtnHalf}>
              <AppButton label="Cancel" mode="outlined" tone="neutral" onPress={closeUsageForm} />
            </View>
            <View style={styles.formBtnHalf}>
              <AppButton
                label={usageFormMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitUsageForm()}
                disabled={isMutating}
                loading={isMutating}
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={usageFormValidation.providerValue}>
          <FormField
            label="Operator"
            name="operatorId"
            required
            helperText={contactOptions.length === 0 ? 'No active contacts available.' : undefined}
          >
            <AppSelect
              value={usageFormValues.operatorId}
              onChange={(v) => {
                usageFormValidation.clearFieldError('operatorId');
                setUsageFormValues((c) => ({ ...c, operatorId: v }));
              }}
              options={contactOptions}
              placeholder="Select operator"
            />
          </FormField>
          <FormField label="Used By">
            <AppSelect
              value={usageFormValues.usedById}
              onChange={(v) =>
                setUsageFormValues((c) => ({
                  ...c,
                  usedById: v === '__none__' ? null : v,
                }))
              }
              options={[{ label: 'No used-by contact', value: '__none__' }, ...contactOptions]}
              placeholder="Optional used-by contact"
            />
          </FormField>
          <FormField
            label="Field"
            name="fieldId"
            required
            helperText={fieldOptions.length === 0 ? 'No active fields available.' : undefined}
          >
            <AppSelect
              value={usageFormValues.fieldId}
              onChange={(v) => {
                usageFormValidation.clearFieldError('fieldId');
                setUsageFormValues((c) => ({
                  ...c,
                  fieldId: v,
                  lotId: null,
                }));
              }}
              options={fieldOptions}
              placeholder="Select field"
            />
          </FormField>
          <FormField
            label="Lot"
            helperText={
              usageFormValues.fieldId && lotOptions.length === 0
                ? 'No lots found for this field.'
                : undefined
            }
          >
            <AppSelect
              value={usageFormValues.lotId}
              onChange={(v) =>
                setUsageFormValues((c) => ({
                  ...c,
                  lotId: v === '__none__' ? null : v,
                }))
              }
              options={[{ label: 'No lot', value: '__none__' }, ...lotOptions]}
              placeholder="Optional lot"
            />
          </FormField>
          <FormField label="Usage purpose" name="usagePurpose" required>
            <AppSelect
              value={usageFormValues.usagePurpose}
              onChange={(v) => {
                usageFormValidation.clearFieldError('usagePurpose');
                usageFormValidation.clearFieldError('otherPurpose');
                setUsageFormValues((c) => ({
                  ...c,
                  usagePurpose: v as UsageLogFormValues['usagePurpose'],
                }));
              }}
              options={USAGE_PURPOSE_OPTIONS.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
            />
          </FormField>
          {usageFormValues.usagePurpose === 'other' ? (
            <FormField label="Other purpose" name="otherPurpose" required>
              <AppInput
                value={usageFormValues.otherPurpose}
                onChangeText={(v) => {
                  usageFormValidation.clearFieldError('otherPurpose');
                  setUsageFormValues((c) => ({ ...c, otherPurpose: v }));
                }}
                placeholder="Describe the purpose"
              />
            </FormField>
          ) : null}
          <FormField label="Date used" name="dateUsed" required>
            <AppDatePicker
              value={usageFormValues.dateUsed}
              onChange={(v) => {
                usageFormValidation.clearFieldError('dateUsed');
                setUsageFormValues((c) => ({ ...c, dateUsed: v }));
              }}
              label="Usage date"
            />
          </FormField>
          <FormField
            label={`Starting ${getTrackUsageLabel(equipmentDetail?.trackUsage).toLowerCase()} reading`}
          >
            <AppInput
              value={usageFormValues.startingReading}
              onChangeText={(v) => {
                setUsageEndingReadingManuallyEdited(false);
                setUsageFormValues((c) => ({ ...c, startingReading: v }));
              }}
              placeholder={`e.g. ${equipmentDetail?.currentUsageReading ?? '0'}`}
              keyboardType="decimal-pad"
            />
          </FormField>
          <FormField label="Duration (hours)">
            <AppInput
              value={usageFormValues.durationHours}
              onChangeText={(v) => setUsageFormValues((c) => ({ ...c, durationHours: v }))}
              placeholder="Optional duration"
              keyboardType="decimal-pad"
            />
          </FormField>
          <FormField
            label={`Ending ${getTrackUsageLabel(equipmentDetail?.trackUsage).toLowerCase()} reading`}
          >
            <AppInput
              value={usageFormValues.endingReading}
              onChangeText={(v) => {
                setUsageEndingReadingManuallyEdited(true);
                setUsageFormValues((c) => ({ ...c, endingReading: v }));
              }}
              placeholder="Optional ending reading"
              keyboardType="decimal-pad"
            />
          </FormField>
          <FormField label="Fuel / Consumables Used">
            <AppInput
              value={usageFormValues.fuelConsumablesUsed}
              onChangeText={(v) => setUsageFormValues((c) => ({ ...c, fuelConsumablesUsed: v }))}
              placeholder="Optional fuel or consumables"
            />
          </FormField>
          <FormField label="Cost">
            <AppInput
              value={usageFormValues.cost}
              onChangeText={(v) => setUsageFormValues((c) => ({ ...c, cost: v }))}
              placeholder="Optional cost"
              keyboardType="decimal-pad"
            />
          </FormField>
          <FormField label="Usage description">
            <AppTextArea
              value={usageFormValues.usageDescription}
              onChangeText={(v) => setUsageFormValues((c) => ({ ...c, usageDescription: v }))}
              placeholder="Optional usage notes"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ════════════════════════════════════════
           USAGE ACTION SHEET + CONFIRM
           ════════════════════════════════════════ */}
      <ActionSheet
        visible={Boolean(actionUsageLog) && !confirmUsageDeleteTarget}
        onDismiss={() => setActionUsageLog(null)}
        title={
          actionUsageLog ? getEquipmentUsagePurposeLabel(actionUsageLog.usagePurpose) : undefined
        }
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

      {/* ════════════════════════════════════════
           MAINTENANCE FORM
           ════════════════════════════════════════ */}
      <BottomSheet
        visible={maintenanceFormVisible}
        onDismiss={closeMaintenanceForm}
        scrollViewRef={maintenanceFormScrollRef}
        title={maintenanceFormMode === 'create' ? 'Add Maintenance' : 'Edit Maintenance'}
        footer={
          <View style={styles.formBtns}>
            <View style={styles.formBtnHalf}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeMaintenanceForm}
              />
            </View>
            <View style={styles.formBtnHalf}>
              <AppButton
                label={maintenanceFormMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitMaintenanceForm()}
                disabled={isMutating}
                loading={isMutating}
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={maintenanceFormValidation.providerValue}>
          <FormField label="Service type" name="serviceType" required>
            <AppSelect
              value={maintenanceFormValues.serviceType}
              onChange={(v) => {
                maintenanceFormValidation.clearFieldError('serviceType');
                setMaintenanceFormValues((c) => ({
                  ...c,
                  serviceType: v as MaintenanceFormValues['serviceType'],
                }));
              }}
              options={MAINTENANCE_SERVICE_TYPE_OPTIONS.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
            />
          </FormField>
          <FormField label="Date performed" name="datePerformed" required>
            <AppDatePicker
              value={maintenanceFormValues.datePerformed}
              onChange={(v) => {
                maintenanceFormValidation.clearFieldError('datePerformed');
                setMaintenanceFormValues((c) => ({
                  ...c,
                  datePerformed: v ?? '',
                }));
              }}
              label="Performed date"
            />
          </FormField>
          <FormField label="Next maintenance due">
            <AppDatePicker
              value={maintenanceFormValues.nextMaintenanceDue}
              onChange={(v) => setMaintenanceFormValues((c) => ({ ...c, nextMaintenanceDue: v }))}
              label="Next due date"
            />
          </FormField>
          <FormField
            label="Performed by"
            name="servicePerformedBy"
            required
            helperText={
              servicePerformerOptions.length === 0
                ? 'No farm users or contacts available.'
                : undefined
            }
          >
            <AppSelect
              value={maintenanceFormValues.servicePerformedBy}
              onChange={(v) => {
                maintenanceFormValidation.clearFieldError('servicePerformedBy');
                setMaintenanceFormValues((c) => ({ ...c, servicePerformedBy: v }));
              }}
              options={servicePerformerOptions}
              placeholder="Select performer"
            />
          </FormField>
          <FormField label="Service description" name="serviceDescription" required>
            <AppTextArea
              value={maintenanceFormValues.serviceDescription}
              onChangeText={(v) => {
                maintenanceFormValidation.clearFieldError('serviceDescription');
                setMaintenanceFormValues((c) => ({ ...c, serviceDescription: v }));
              }}
              placeholder="Describe maintenance performed"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ════════════════════════════════════════
           MAINTENANCE ACTION SHEET + CONFIRM
           ════════════════════════════════════════ */}
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

/* ─── Styles ─── */

const styles = StyleSheet.create({
  /* Header */
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

  /* Main content */
  scrollView: {
    flex: 1,
  },
  main: {
    padding: 16,
    paddingBottom: 96,
  },

  /* Form buttons */
  formBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  formBtnHalf: {
    flex: 1,
  },

  /* Maintenance alert items */
  mItem: {
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
  mItemOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: palette.destructive,
  },
  mItemUpcoming: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFC61A',
  },
  mDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mBody: {
    flex: 1,
  },
  mName: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.foreground,
  },
  mInfo: {
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: 1,
  },
  mDue: {
    fontSize: 11,
    fontWeight: '600',
  },
  mSectionGap: {
    marginTop: 16,
  },
});
