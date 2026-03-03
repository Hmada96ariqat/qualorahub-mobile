import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import {
  isRecord,
  normalizeRows,
  readArray,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';

type CreateEquipmentRequestContract =
  operations['OrderWriteController_createEquipment_v1']['requestBody']['content']['application/json'];
type UpdateEquipmentRequestContract =
  operations['OrderWriteController_updateEquipment_v1']['requestBody']['content']['application/json'];
type CreateUsageLogRequestContract =
  operations['OrderWriteController_createEquipmentUsageLog_v1']['requestBody']['content']['application/json'];
type UpdateUsageLogRequestContract =
  operations['OrderWriteController_updateEquipmentUsageLog_v1']['requestBody']['content']['application/json'];
type CreateMaintenanceRecordRequestContract =
  operations['OrderWriteController_createMaintenanceRecord_v1']['requestBody']['content']['application/json'];
type UpdateMaintenanceRecordRequestContract =
  operations['OrderWriteController_updateMaintenanceRecord_v1']['requestBody']['content']['application/json'];
type ListUpcomingMaintenanceResponseContract =
  operations['OrderWriteController_listUpcomingEquipmentMaintenance_v1']['responses'][200]['content']['application/json'];
type ListEquipmentOperatorsResponseContract =
  operations['OrderWriteController_listActiveEquipmentOperators_v1']['responses'][200]['content']['application/json'];
type GetEquipmentByIdResponseContract =
  operations['OrderWriteController_getEquipmentById_v1']['responses'][200]['content']['application/json'];
type CreateEquipmentResponseContract =
  operations['OrderWriteController_createEquipment_v1']['responses'][201]['content']['application/json'];
type UpdateEquipmentResponseContract =
  operations['OrderWriteController_updateEquipment_v1']['responses'][200]['content']['application/json'];
type ListUsageLogsResponseContract =
  operations['OrderWriteController_listEquipmentUsageLogs_v1']['responses'][200]['content']['application/json'];
type CreateUsageLogResponseContract =
  operations['OrderWriteController_createEquipmentUsageLog_v1']['responses'][201]['content']['application/json'];
type UpdateUsageLogResponseContract =
  operations['OrderWriteController_updateEquipmentUsageLog_v1']['responses'][200]['content']['application/json'];
type ListMaintenanceRecordsDetailedResponseContract =
  operations['OrderWriteController_listMaintenanceRecordsDetailed_v1']['responses'][200]['content']['application/json'];
type CreateMaintenanceRecordResponseContract =
  operations['OrderWriteController_createMaintenanceRecord_v1']['responses'][201]['content']['application/json'];
type UpdateMaintenanceRecordResponseContract =
  operations['OrderWriteController_updateMaintenanceRecord_v1']['responses'][200]['content']['application/json'];

export type EquipmentStatus = string;

export type EquipmentSummary = {
  id: string;
  name: string;
  type: string | null;
  status: EquipmentStatus;
  serialNumber: string | null;
  notes: string | null;
  nextMaintenanceDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentDetail = EquipmentSummary & {
  brand: string | null;
  model: string | null;
  modelYear: string | null;
  trackUsage: string | null;
  currentUsageReading: string | null;
  estimatedUsageCost: string | null;
};

export type EquipmentOperatorOption = {
  label: string;
  value: string;
};

export type EquipmentUsageLog = {
  id: string;
  equipmentId: string;
  usagePurpose: string;
  operatorId: string | null;
  fieldId: string | null;
  lotId: string | null;
  dateUsed: string | null;
  totalHoursUsed: string | null;
  usageDescription: string | null;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceRecord = {
  id: string;
  equipmentId: string;
  serviceType: string;
  serviceDescription: string;
  servicePerformedBy: string | null;
  datePerformed: string | null;
  nextMaintenanceDue: string | null;
  totalCost: string | null;
  partsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UpcomingMaintenanceItem = {
  id: string;
  equipmentId: string;
  equipmentName: string;
  serviceType: string | null;
  dueDate: string | null;
  status: string | null;
  daysUntilDue: number | null;
};

export type CreateEquipmentRequest = {
  name: string;
  type?: string | null;
  status?: EquipmentStatus;
  serial_number?: string | null;
  brand?: string | null;
  model?: string | null;
  notes?: string | null;
  track_usage?: string | null;
  current_usage_reading?: string | number | null;
  next_maintenance_date?: string | null;
};

export type UpdateEquipmentRequest = Partial<CreateEquipmentRequest>;

export type CreateUsageLogRequest = {
  operator_id: string;
  field_id: string;
  lot_id?: string | null;
  usage_purpose: string;
  usage_description?: string | null;
  date_used?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  total_hours_used?: string | number | null;
  keywords_tags?: string[];
};

export type UpdateUsageLogRequest = Partial<CreateUsageLogRequest>;

export type CreateMaintenanceRecordRequest = {
  service_type: string;
  service_description: string;
  date_performed: string;
  next_maintenance_due?: string | null;
  service_performed_by?: string | null;
};

export type UpdateMaintenanceRecordRequest = Partial<CreateMaintenanceRecordRequest>;

function readFirstString(record: UnknownRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = readString(record, key);
    if (value.length > 0) return value;
  }
  return fallback;
}

function readFirstNullableString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = readNullableString(record, key);
    if (value !== null) return value;
  }
  return null;
}

function readFirstNumber(record: UnknownRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function parseEquipmentSummary(payload: unknown): EquipmentSummary | null {
  if (!isRecord(payload)) return null;

  return {
    id: readString(payload, 'id'),
    name: readFirstString(payload, ['name'], 'Unnamed equipment'),
    type: readFirstNullableString(payload, ['type']),
    status: readFirstString(payload, ['status'], 'operational'),
    serialNumber: readFirstNullableString(payload, ['serial_number']),
    notes: readFirstNullableString(payload, ['notes']),
    nextMaintenanceDate: readFirstNullableString(payload, ['next_maintenance_date']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseEquipmentDetail(payload: unknown): EquipmentDetail | null {
  if (!isRecord(payload)) return null;

  const summary = parseEquipmentSummary(payload);
  if (!summary) return null;

  return {
    ...summary,
    brand: readFirstNullableString(payload, ['brand']),
    model: readFirstNullableString(payload, ['model']),
    modelYear: readFirstNullableString(payload, ['model_year']),
    trackUsage: readFirstNullableString(payload, ['track_usage']),
    currentUsageReading: readFirstNullableString(payload, ['current_usage_reading']),
    estimatedUsageCost: readFirstNullableString(payload, ['estimated_usage_cost']),
  };
}

function parseOperatorOption(payload: unknown): EquipmentOperatorOption | null {
  if (!isRecord(payload)) return null;

  const value = readFirstString(payload, ['user_id', 'id']);
  const label = readFirstString(payload, ['display_name', 'full_name', 'name', 'email']);
  if (!value || !label) return null;

  return { value, label };
}

function parseUsageLog(payload: unknown): EquipmentUsageLog | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    equipmentId: readFirstString(payload, ['equipment_id']),
    usagePurpose: readFirstString(payload, ['usage_purpose'], 'general'),
    operatorId: readFirstNullableString(payload, ['operator_id']),
    fieldId: readFirstNullableString(payload, ['field_id']),
    lotId: readFirstNullableString(payload, ['lot_id']),
    dateUsed: readFirstNullableString(payload, ['date_used']),
    totalHoursUsed: readFirstNullableString(payload, ['total_hours_used', 'total_used']),
    usageDescription: readFirstNullableString(payload, ['usage_description']),
    keywords: parseStringArray(payload.keywords_tags),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseMaintenanceRecord(payload: unknown): MaintenanceRecord | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    equipmentId: readFirstString(payload, ['equipment_id']),
    serviceType: readFirstString(payload, ['service_type'], 'preventive'),
    serviceDescription: readFirstString(payload, ['service_description'], 'Service entry'),
    servicePerformedBy: readFirstNullableString(payload, ['service_performed_by']),
    datePerformed: readFirstNullableString(payload, ['date_performed']),
    nextMaintenanceDue: readFirstNullableString(payload, ['next_maintenance_due']),
    totalCost: readFirstNullableString(payload, ['total_cost']),
    partsCount: readArray(payload, 'maintenance_parts').length,
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseUpcomingMaintenance(payload: unknown): UpcomingMaintenanceItem | null {
  if (!isRecord(payload)) return null;

  const equipment = isRecord(payload.equipment) ? payload.equipment : null;
  const id =
    readFirstString(payload, ['id']) ||
    readFirstString(payload, ['equipment_id']) ||
    (equipment ? readString(equipment, 'id') : '');
  if (!id) return null;

  return {
    id,
    equipmentId: readFirstString(payload, ['equipment_id']) || id,
    equipmentName:
      readFirstString(payload, ['equipment_name', 'name']) ||
      (equipment ? readString(equipment, 'name', 'Equipment item') : 'Equipment item'),
    serviceType: readFirstNullableString(payload, ['service_type']),
    dueDate: readFirstNullableString(payload, ['due_date', 'next_maintenance_due', 'date_performed']),
    status: readFirstNullableString(payload, ['status']),
    daysUntilDue: readFirstNumber(payload, ['days_until_due', 'daysUntilDue']),
  };
}

function parseList<T>(payload: unknown, parser: (value: unknown) => T | null): T[] {
  return normalizeRows(payload)
    .map((item) => parser(item))
    .filter((item): item is T => Boolean(item));
}

function parseFirst<T>(payload: unknown, parser: (value: unknown) => T | null, errorText: string): T {
  const rows = parseList(payload, parser);
  if (rows.length === 0) {
    throw new Error(errorText);
  }
  return rows[0];
}

function normalizeEquipmentCommandInput(
  input: CreateEquipmentRequest | UpdateEquipmentRequest,
): UnknownRecord {
  const record = isRecord(input) ? input : {};
  const normalized: UnknownRecord = {};

  if ('name' in record) normalized.name = readString(record, 'name');
  if ('type' in record) normalized.type = readNullableString(record, 'type');
  if ('status' in record) normalized.status = readString(record, 'status');
  if ('serial_number' in record) normalized.serial_number = readNullableString(record, 'serial_number');
  if ('brand' in record) normalized.brand = readNullableString(record, 'brand');
  if ('model' in record) normalized.model = readNullableString(record, 'model');
  if ('notes' in record) normalized.notes = readNullableString(record, 'notes');
  if ('track_usage' in record) normalized.track_usage = readNullableString(record, 'track_usage');
  if ('current_usage_reading' in record) {
    normalized.current_usage_reading = record.current_usage_reading ?? null;
  }
  if ('next_maintenance_date' in record) {
    normalized.next_maintenance_date = readNullableString(record, 'next_maintenance_date');
  }

  return normalized;
}

function normalizeUsageLogCommandInput(
  input: CreateUsageLogRequest | UpdateUsageLogRequest,
): UnknownRecord {
  const record = isRecord(input) ? input : {};
  const normalized: UnknownRecord = {};

  if ('operator_id' in record) normalized.operator_id = readNullableString(record, 'operator_id');
  if ('field_id' in record) normalized.field_id = readNullableString(record, 'field_id');
  if ('lot_id' in record) normalized.lot_id = readNullableString(record, 'lot_id');
  if ('usage_purpose' in record) normalized.usage_purpose = readString(record, 'usage_purpose');
  if ('usage_description' in record) {
    normalized.usage_description = readNullableString(record, 'usage_description');
  }
  if ('date_used' in record) normalized.date_used = readNullableString(record, 'date_used');
  if ('start_datetime' in record) {
    normalized.start_datetime = readNullableString(record, 'start_datetime');
  }
  if ('end_datetime' in record) normalized.end_datetime = readNullableString(record, 'end_datetime');
  if ('total_hours_used' in record) normalized.total_hours_used = record.total_hours_used ?? null;
  if ('keywords_tags' in record) normalized.keywords_tags = parseStringArray(record.keywords_tags);

  return normalized;
}

function normalizeMaintenanceCommandInput(
  input: CreateMaintenanceRecordRequest | UpdateMaintenanceRecordRequest,
): UnknownRecord {
  const record = isRecord(input) ? input : {};
  const normalized: UnknownRecord = {};

  if ('service_type' in record) normalized.service_type = readString(record, 'service_type');
  if ('service_description' in record) {
    normalized.service_description = readString(record, 'service_description');
  }
  if ('date_performed' in record) {
    normalized.date_performed = readNullableString(record, 'date_performed');
  }
  if ('next_maintenance_due' in record) {
    normalized.next_maintenance_due = readNullableString(record, 'next_maintenance_due');
  }
  if ('service_performed_by' in record) {
    normalized.service_performed_by = readNullableString(record, 'service_performed_by');
  }

  return normalized;
}

function wrapPayload(payload: UnknownRecord): { payload: UnknownRecord } {
  return { payload };
}

function toCreateEquipmentBody(input: CreateEquipmentRequest): CreateEquipmentRequestContract {
  return wrapPayload(normalizeEquipmentCommandInput(input));
}

function toUpdateEquipmentBody(input: UpdateEquipmentRequest): UpdateEquipmentRequestContract {
  return wrapPayload(normalizeEquipmentCommandInput(input));
}

function toCreateUsageLogBody(input: CreateUsageLogRequest): CreateUsageLogRequestContract {
  return wrapPayload(normalizeUsageLogCommandInput(input));
}

function toUpdateUsageLogBody(input: UpdateUsageLogRequest): UpdateUsageLogRequestContract {
  return wrapPayload(normalizeUsageLogCommandInput(input));
}

function toCreateMaintenanceBody(
  input: CreateMaintenanceRecordRequest,
): CreateMaintenanceRecordRequestContract {
  return wrapPayload(normalizeMaintenanceCommandInput(input));
}

function toUpdateMaintenanceBody(
  input: UpdateMaintenanceRecordRequest,
): UpdateMaintenanceRecordRequestContract {
  return wrapPayload(normalizeMaintenanceCommandInput(input));
}

export async function listEquipment(token: string): Promise<EquipmentSummary[]> {
  const { data } = await apiClient.get<unknown>('/dashboard/snapshot', { token });
  if (isRecord(data) && Array.isArray(data.equipment)) {
    return parseList(data.equipment, parseEquipmentSummary);
  }
  return parseList(data, parseEquipmentSummary);
}

export async function listUpcomingMaintenance(token: string): Promise<UpcomingMaintenanceItem[]> {
  const { data } = await apiClient.get<ListUpcomingMaintenanceResponseContract>(
    '/equipment/upcoming-maintenance',
    { token },
  );
  return parseList(data, parseUpcomingMaintenance);
}

export async function listEquipmentOperators(token: string): Promise<EquipmentOperatorOption[]> {
  const { data } = await apiClient.get<ListEquipmentOperatorsResponseContract>(
    '/equipment/references/operators/active',
    { token },
  );
  return parseList(data, parseOperatorOption);
}

export async function getEquipmentById(token: string, equipmentId: string): Promise<EquipmentDetail> {
  const { data } = await apiClient.get<GetEquipmentByIdResponseContract>(`/equipment/${equipmentId}`, {
    token,
  });
  return parseFirst(data, parseEquipmentDetail, 'Equipment API returned an empty detail payload.');
}

export async function createEquipment(
  token: string,
  input: CreateEquipmentRequest,
): Promise<EquipmentDetail> {
  const { data } = await apiClient.post<CreateEquipmentResponseContract, CreateEquipmentRequestContract>(
    '/equipment',
    {
      token,
      body: toCreateEquipmentBody(input),
      idempotencyKey: `equipment-create-${Date.now()}`,
    },
  );
  return parseFirst(data, parseEquipmentDetail, 'Equipment API returned an empty create payload.');
}

export async function updateEquipment(
  token: string,
  equipmentId: string,
  input: UpdateEquipmentRequest,
): Promise<EquipmentDetail> {
  const { data } = await apiClient.patch<UpdateEquipmentResponseContract, UpdateEquipmentRequestContract>(
    `/equipment/${equipmentId}`,
    {
      token,
      body: toUpdateEquipmentBody(input),
    },
  );
  return parseFirst(data, parseEquipmentDetail, 'Equipment API returned an empty update payload.');
}

export async function deactivateEquipment(token: string, equipmentId: string): Promise<EquipmentDetail> {
  return updateEquipment(token, equipmentId, { status: 'inactive' });
}

export async function reactivateEquipment(token: string, equipmentId: string): Promise<EquipmentDetail> {
  return updateEquipment(token, equipmentId, { status: 'operational' });
}

export async function deleteEquipment(token: string, equipmentId: string): Promise<void> {
  await apiClient.delete<unknown>(`/equipment/${equipmentId}`, { token });
}

export async function listUsageLogs(token: string, equipmentId: string): Promise<EquipmentUsageLog[]> {
  const { data } = await apiClient.get<ListUsageLogsResponseContract>(
    `/equipment/${equipmentId}/usage-logs`,
    { token },
  );
  return parseList(data, parseUsageLog);
}

export async function createUsageLog(
  token: string,
  equipmentId: string,
  input: CreateUsageLogRequest,
): Promise<EquipmentUsageLog> {
  const { data } = await apiClient.post<CreateUsageLogResponseContract, CreateUsageLogRequestContract>(
    `/equipment/${equipmentId}/usage-logs`,
    {
      token,
      body: toCreateUsageLogBody(input),
      idempotencyKey: `equipment-usage-create-${Date.now()}`,
    },
  );
  return parseFirst(data, parseUsageLog, 'Usage log API returned an empty create payload.');
}

export async function updateUsageLog(
  token: string,
  usageLogId: string,
  input: UpdateUsageLogRequest,
): Promise<EquipmentUsageLog> {
  const { data } = await apiClient.patch<UpdateUsageLogResponseContract, UpdateUsageLogRequestContract>(
    `/equipment/usage-logs/${usageLogId}`,
    {
      token,
      body: toUpdateUsageLogBody(input),
    },
  );
  return parseFirst(data, parseUsageLog, 'Usage log API returned an empty update payload.');
}

export async function deleteUsageLog(token: string, usageLogId: string): Promise<void> {
  await apiClient.delete<unknown>(`/equipment/usage-logs/${usageLogId}`, { token });
}

export async function listMaintenanceRecords(
  token: string,
  equipmentId: string,
): Promise<MaintenanceRecord[]> {
  const { data } = await apiClient.get<ListMaintenanceRecordsDetailedResponseContract>(
    `/equipment/${equipmentId}/maintenance-records/detailed`,
    { token },
  );
  return parseList(data, parseMaintenanceRecord);
}

export async function createMaintenanceRecord(
  token: string,
  equipmentId: string,
  input: CreateMaintenanceRecordRequest,
): Promise<MaintenanceRecord> {
  const { data } = await apiClient.post<
    CreateMaintenanceRecordResponseContract,
    CreateMaintenanceRecordRequestContract
  >(
    `/equipment/${equipmentId}/maintenance-records`,
    {
      token,
      body: toCreateMaintenanceBody(input),
      idempotencyKey: `equipment-maintenance-create-${Date.now()}`,
    },
  );
  return parseFirst(data, parseMaintenanceRecord, 'Maintenance API returned an empty create payload.');
}

export async function updateMaintenanceRecord(
  token: string,
  recordId: string,
  input: UpdateMaintenanceRecordRequest,
): Promise<MaintenanceRecord> {
  const { data } = await apiClient.patch<
    UpdateMaintenanceRecordResponseContract,
    UpdateMaintenanceRecordRequestContract
  >(
    `/equipment/maintenance-records/${recordId}`,
    {
      token,
      body: toUpdateMaintenanceBody(input),
    },
  );
  return parseFirst(data, parseMaintenanceRecord, 'Maintenance API returned an empty update payload.');
}

export async function deleteMaintenanceRecord(token: string, recordId: string): Promise<void> {
  await apiClient.delete<unknown>(`/equipment/maintenance-records/${recordId}`, { token });
}
