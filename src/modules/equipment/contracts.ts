import type {
  EquipmentDetail,
  EquipmentUsageLog,
  MaintenanceRecord,
} from '../../api/modules/equipment';
import {
  OTHER_EQUIPMENT_USAGE_PURPOSE_KEY,
  resolveEquipmentUsagePurposeFormValues,
  type EquipmentUsagePurposeKey,
} from './equipmentUsagePurpose';
import {
  parseServicePerformerReference,
  resolveServicePerformerValue,
  type ServicePerformerContactLike,
  type ServicePerformerUserLike,
} from './servicePerformer';

export const EQUIPMENT_STATUS_OPTIONS = [
  { label: 'Operational', value: 'operational' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Inactive', value: 'inactive' },
] as const;

export { EQUIPMENT_USAGE_PURPOSE_OPTIONS as USAGE_PURPOSE_OPTIONS } from './equipmentUsagePurpose';

export const TRACK_USAGE_OPTIONS = [
  { label: 'Hours', value: 'hours' },
  { label: 'Miles', value: 'miles' },
  { label: 'KM', value: 'km' },
] as const;

export const MAINTENANCE_SERVICE_TYPE_OPTIONS = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Preventive', value: 'preventive' },
  { label: 'Emergency', value: 'emergency' },
] as const;

export type EquipmentStatusOption = (typeof EQUIPMENT_STATUS_OPTIONS)[number]['value'];
export type EquipmentTrackUsageOption = (typeof TRACK_USAGE_OPTIONS)[number]['value'];
export type UsagePurposeOption = EquipmentUsagePurposeKey;
export type MaintenanceServiceTypeOption =
  (typeof MAINTENANCE_SERVICE_TYPE_OPTIONS)[number]['value'];

export type EquipmentFormMode = 'create' | 'edit';
export type UsageLogFormMode = 'create' | 'edit';
export type MaintenanceFormMode = 'create' | 'edit';
export type EquipmentListMode = 'all' | 'active' | 'inactive';
export type MaintenancePerformerReferenceType = 'user' | 'contact';

export type EquipmentFormValues = {
  name: string;
  type: string;
  status: EquipmentStatusOption;
  serialNumber: string;
  trackUsage: EquipmentTrackUsageOption;
  currentUsageReading: string;
  notes: string;
};

export type UsageLogFormValues = {
  operatorId: string | null;
  usedById: string | null;
  fieldId: string | null;
  lotId: string | null;
  usagePurpose: UsagePurposeOption | '';
  otherPurpose: string;
  usageDescription: string;
  dateUsed: string | null;
  startingReading: string;
  endingReading: string;
  durationHours: string;
  fuelConsumablesUsed: string;
  cost: string;
};

export type MaintenanceFormValues = {
  serviceType: MaintenanceServiceTypeOption;
  serviceDescription: string;
  datePerformed: string;
  nextMaintenanceDue: string | null;
  servicePerformedBy: string | null;
};

export type MaintenancePerformerReferenceParseResult =
  | {
      valid: true;
      value: string | null;
      type: MaintenancePerformerReferenceType | null;
      id: string | null;
    }
  | {
      valid: false;
      value: null;
      type: null;
      id: null;
    };

export function parseMaintenancePerformerReference(
  value: string | null | undefined,
): MaintenancePerformerReferenceParseResult {
  const normalized = (value ?? '').trim();
  if (!normalized) {
    return { valid: true, value: null, type: null, id: null };
  }

  const parsed = parseServicePerformerReference(normalized);
  if (!parsed) {
    return { valid: false, value: null, type: null, id: null };
  }

  return {
    valid: true,
    value: `${parsed.kind}:${parsed.id}`,
    type: parsed.kind,
    id: parsed.id,
  };
}

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

export function normalizeTrackUsage(value: string | null | undefined): EquipmentTrackUsageOption {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'miles' || normalized === 'km') {
    return normalized;
  }
  return 'hours';
}

export function getTrackUsageLabel(value: string | null | undefined): string {
  const trackUsage = normalizeTrackUsage(value);
  if (trackUsage === 'km') return 'KM';
  if (trackUsage === 'miles') return 'Miles';
  return 'Hours';
}

export function getTrackUsageShortLabel(value: string | null | undefined): string {
  const trackUsage = normalizeTrackUsage(value);
  if (trackUsage === 'km') return 'km';
  if (trackUsage === 'miles') return 'mi';
  return 'h';
}

export function normalizeUsagePurpose(value: string | null | undefined): UsagePurposeOption {
  const { usagePurpose } = resolveEquipmentUsagePurposeFormValues(value);
  if (usagePurpose) {
    return usagePurpose;
  }
  return OTHER_EQUIPMENT_USAGE_PURPOSE_KEY;
}

export function normalizeServiceType(
  value: string | null | undefined,
): MaintenanceServiceTypeOption {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'scheduled' || normalized === 'emergency') {
    return normalized;
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
      trackUsage: 'hours',
      currentUsageReading: '',
      notes: '',
    };
  }

  return {
    name: equipment.name,
    type: equipment.type ?? '',
    status: normalizeEquipmentStatus(equipment.status),
    serialNumber: equipment.serialNumber ?? '',
    trackUsage: normalizeTrackUsage(equipment.trackUsage),
    currentUsageReading: equipment.currentUsageReading ?? '',
    notes: equipment.notes ?? '',
  };
}

export function toUsageLogFormValues(log?: EquipmentUsageLog | null): UsageLogFormValues {
  if (!log) {
    return {
      operatorId: null,
      usedById: null,
      fieldId: null,
      lotId: null,
      usagePurpose: '',
      otherPurpose: '',
      usageDescription: '',
      dateUsed: null,
      startingReading: '',
      endingReading: '',
      durationHours: '',
      fuelConsumablesUsed: '',
      cost: '',
    };
  }

  const usagePurposeDefaults = resolveEquipmentUsagePurposeFormValues(log.usagePurpose);

  return {
    operatorId: log.operator?.id ?? log.operatorId,
    usedById: log.usedBy?.id ?? log.usedById,
    fieldId: log.field?.id ?? log.fieldId,
    lotId: log.lot?.id ?? log.lotId,
    usagePurpose: usagePurposeDefaults.usagePurpose,
    otherPurpose: usagePurposeDefaults.otherPurpose,
    usageDescription: log.usageDescription ?? '',
    dateUsed: toDateOnly(log.dateUsed),
    startingReading: log.startingReading ?? '',
    endingReading: log.endingReading ?? '',
    durationHours: log.totalHoursUsed ?? '',
    fuelConsumablesUsed: log.fuelConsumablesUsed ?? '',
    cost: log.cost ?? '',
  };
}

export function toMaintenanceFormValues(
  record?: MaintenanceRecord | null,
  options?: {
    users?: ServicePerformerUserLike[];
    contacts?: ServicePerformerContactLike[];
  },
): MaintenanceFormValues {
  if (!record) {
    return {
      serviceType: 'scheduled',
      serviceDescription: '',
      datePerformed: new Date().toISOString().slice(0, 10),
      nextMaintenanceDue: null,
      servicePerformedBy: null,
    };
  }

  return {
    serviceType: normalizeServiceType(record.serviceType),
    serviceDescription: record.serviceDescription,
    datePerformed: toDateOnly(record.datePerformed) ?? new Date().toISOString().slice(0, 10),
    nextMaintenanceDue: toDateOnly(record.nextMaintenanceDue),
    servicePerformedBy:
      resolveServicePerformerValue({
        reference: record.servicePerformedBy,
        performer: record.performedBy,
        users: options?.users,
        contacts: options?.contacts,
      }) ?? null,
  };
}
