import type {
  EquipmentDetail,
  EquipmentUsageLog,
  MaintenanceRecord,
} from '../../api/modules/equipment';

export const EQUIPMENT_STATUS_OPTIONS = [
  { label: 'Operational', value: 'operational' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Inactive', value: 'inactive' },
] as const;

export const USAGE_PURPOSE_OPTIONS = [
  { label: 'General', value: 'general' },
  { label: 'Field Work', value: 'field_work' },
  { label: 'Transport', value: 'transport' },
  { label: 'Harvest', value: 'harvest' },
  { label: 'Maintenance', value: 'maintenance' },
] as const;

export const MAINTENANCE_SERVICE_TYPE_OPTIONS = [
  { label: 'Preventive', value: 'preventive' },
  { label: 'Emergency', value: 'emergency' },
] as const;

export type EquipmentStatusOption = (typeof EQUIPMENT_STATUS_OPTIONS)[number]['value'];
export type UsagePurposeOption = (typeof USAGE_PURPOSE_OPTIONS)[number]['value'];
export type MaintenanceServiceTypeOption =
  (typeof MAINTENANCE_SERVICE_TYPE_OPTIONS)[number]['value'];

export type EquipmentFormMode = 'create' | 'edit';
export type UsageLogFormMode = 'create' | 'edit';
export type MaintenanceFormMode = 'create' | 'edit';
export type EquipmentListMode = 'active' | 'inactive';

export type EquipmentFormValues = {
  name: string;
  type: string;
  status: EquipmentStatusOption;
  serialNumber: string;
  notes: string;
};

export type UsageLogFormValues = {
  operatorId: string | null;
  fieldId: string | null;
  lotId: string | null;
  usagePurpose: UsagePurposeOption;
  usageDescription: string;
  dateUsed: string | null;
};

export type MaintenanceFormValues = {
  serviceType: MaintenanceServiceTypeOption;
  serviceDescription: string;
  datePerformed: string;
  nextMaintenanceDue: string | null;
  servicePerformedBy: string;
};

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.includes('T')) return value.slice(0, 10);
  return value;
}

export function normalizeEquipmentStatus(value: string | null | undefined): EquipmentStatusOption {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'inactive' || normalized === 'maintenance') {
    return normalized;
  }
  return 'operational';
}

export function normalizeUsagePurpose(value: string | null | undefined): UsagePurposeOption {
  const normalized = (value ?? '').trim().toLowerCase();
  if (
    normalized === 'field_work' ||
    normalized === 'transport' ||
    normalized === 'harvest' ||
    normalized === 'maintenance'
  ) {
    return normalized;
  }
  return 'general';
}

export function normalizeServiceType(
  value: string | null | undefined,
): MaintenanceServiceTypeOption {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'emergency') {
    return 'emergency';
  }
  return 'preventive';
}

export function toEquipmentFormValues(equipment?: EquipmentDetail | null): EquipmentFormValues {
  if (!equipment) {
    return {
      name: '',
      type: '',
      status: 'operational',
      serialNumber: '',
      notes: '',
    };
  }

  return {
    name: equipment.name,
    type: equipment.type ?? '',
    status: normalizeEquipmentStatus(equipment.status),
    serialNumber: equipment.serialNumber ?? '',
    notes: equipment.notes ?? '',
  };
}

export function toUsageLogFormValues(log?: EquipmentUsageLog | null): UsageLogFormValues {
  if (!log) {
    return {
      operatorId: null,
      fieldId: null,
      lotId: null,
      usagePurpose: 'general',
      usageDescription: '',
      dateUsed: null,
    };
  }

  return {
    operatorId: log.operatorId,
    fieldId: log.fieldId,
    lotId: log.lotId,
    usagePurpose: normalizeUsagePurpose(log.usagePurpose),
    usageDescription: log.usageDescription ?? '',
    dateUsed: toDateOnly(log.dateUsed),
  };
}

export function toMaintenanceFormValues(
  record?: MaintenanceRecord | null,
): MaintenanceFormValues {
  if (!record) {
    return {
      serviceType: 'preventive',
      serviceDescription: '',
      datePerformed: new Date().toISOString().slice(0, 10),
      nextMaintenanceDue: null,
      servicePerformedBy: '',
    };
  }

  return {
    serviceType: normalizeServiceType(record.serviceType),
    serviceDescription: record.serviceDescription,
    datePerformed: toDateOnly(record.datePerformed) ?? new Date().toISOString().slice(0, 10),
    nextMaintenanceDue: toDateOnly(record.nextMaintenanceDue),
    servicePerformedBy: record.servicePerformedBy ?? '',
  };
}
