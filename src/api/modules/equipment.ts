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
type ReplaceMaintenancePartsRequestContract =
  operations['OrderWriteController_replaceMaintenanceParts_v1']['requestBody']['content']['application/json'];
type ReplaceMaintenancePartRequestContract = ReplaceMaintenancePartsRequestContract['parts'][number];
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
type ReplaceMaintenancePartsResponseContract =
  operations['OrderWriteController_replaceMaintenanceParts_v1']['responses'][200]['content']['application/json'];

export type EquipmentStatus = string;

export type EquipmentNamedReference = {
  id: string;
  name: string;
  email?: string | null;
};

export type EquipmentLocationReference = {
  id: string;
  name: string;
};

export type MaintenancePerformedBy = {
  kind: string | null;
  id: string | null;
  name: string | null;
};

export type MaintenancePart = {
  id: string;
  maintenanceRecordId: string | null;
  productId: string;
  quantity: string | null;
  unitCost: string | null;
  totalCost: string | null;
  farmId: string | null;
  productName: string | null;
  productUnit: string | null;
  createdAt: string;
  updatedAt: string;
};

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
  email?: string | null;
};

export type EquipmentUsageLog = {
  id: string;
  equipmentId: string;
  usagePurpose: string;
  operatorId: string | null;
  operator: EquipmentNamedReference | null;
  usedById: string | null;
  usedBy: EquipmentNamedReference | null;
  fieldId: string | null;
  field: EquipmentLocationReference | null;
  lotId: string | null;
  lot: EquipmentLocationReference | null;
  dateUsed: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  startingReading: string | null;
  endingReading: string | null;
  totalUsed: string | null;
  totalHoursUsed: string | null;
  fuelConsumablesUsed: string | null;
  cost: string | null;
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
  performedBy: MaintenancePerformedBy | null;
  datePerformed: string | null;
  nextMaintenanceDue: string | null;
  currentMeterReading: string | null;
  totalCost: string | null;
  laborCost: string | null;
  partsCost: string | null;
  vendorFee: string | null;
  partsCount: number;
  parts: MaintenancePart[];
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
  used_by_id?: string | null;
  field_id: string;
  lot_id?: string | null;
  usage_purpose: string;
  usage_description?: string | null;
  date_used?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  starting_reading?: string | number | null;
  ending_reading?: string | number | null;
  total_used?: string | number | null;
  total_hours_used?: string | number | null;
  fuel_consumables_used?: string | null;
  fuel_used?: string | null;
  cost?: string | number | null;
  keywords_tags?: string[];
};

export type UpdateUsageLogRequest = Partial<CreateUsageLogRequest>;

export type CreateMaintenanceRecordRequest = {
  service_type: string;
  service_description: string;
  date_performed: string;
  next_maintenance_due?: string | null;
  service_performed_by?: string | null;
  performed_by_id?: string | null;
  current_meter_reading?: string | number | null;
  total_cost?: string | number | null;
  labor_cost?: string | number | null;
  parts_cost?: string | number | null;
  vendor_fee?: string | number | null;
};

export type UpdateMaintenanceRecordRequest = Partial<CreateMaintenanceRecordRequest>;

export type ReplaceMaintenancePartRequest = {
  product_id: string;
  quantity: string | number;
  unit_cost: string | number;
  total_cost: string | number;
  farm_id?: string | null;
};

export type ReplaceMaintenancePartsResponse = {
  replacedCount: number;
};

function readTextValue(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function readFirstString(record: UnknownRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = readString(record, key);
    if (value.length > 0) return value;
  }
  return fallback;
}

function readFirstNullableText(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = readTextValue(record[key]);
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

function parseNamedReference(payload: unknown): EquipmentNamedReference | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readFirstString(payload, ['name', 'display_name', 'full_name', 'email'], 'Unknown'),
    email: readFirstNullableText(payload, ['email']),
  };
}

function parseLocationReference(payload: unknown): EquipmentLocationReference | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readFirstString(payload, ['name'], 'Unknown'),
  };
}

function parseMaintenancePerformer(payload: unknown): MaintenancePerformedBy | null {
  if (!isRecord(payload)) return null;

  const kind = readFirstNullableText(payload, ['kind']);
  const id = readFirstNullableText(payload, ['id']);
  const name = readFirstNullableText(payload, ['name']);

  if (!kind && !id && !name) {
    return null;
  }

  return {
    kind,
    id,
    name,
  };
}

function parseMaintenancePart(payload: unknown): MaintenancePart | null {
  if (!isRecord(payload)) return null;

  const products = isRecord(payload.products) ? payload.products : null;
  const id = readFirstString(payload, ['id', 'product_id']);
  const productId = readFirstString(payload, ['product_id']);
  if (!id || !productId) return null;

  return {
    id,
    maintenanceRecordId: readFirstNullableText(payload, ['maintenance_record_id']),
    productId,
    quantity: readFirstNullableText(payload, ['quantity']),
    unitCost: readFirstNullableText(payload, ['unit_cost']),
    totalCost: readFirstNullableText(payload, ['total_cost']),
    farmId: readFirstNullableText(payload, ['farm_id']),
    productName: products
      ? readFirstNullableText(products, ['name'])
      : readFirstNullableText(payload, ['product_name']),
    productUnit: products
      ? readFirstNullableText(products, ['unit'])
      : readFirstNullableText(payload, ['product_unit']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseEquipmentSummary(payload: unknown): EquipmentSummary | null {
  if (!isRecord(payload)) return null;

  return {
    id: readString(payload, 'id'),
    name: readFirstString(payload, ['name'], 'Unnamed equipment'),
    type: readFirstNullableText(payload, ['type']),
    status: readFirstString(payload, ['status'], 'operational'),
    serialNumber: readFirstNullableText(payload, ['serial_number']),
    notes: readFirstNullableText(payload, ['notes']),
    nextMaintenanceDate: readFirstNullableText(payload, ['next_maintenance_date']),
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
    brand: readFirstNullableText(payload, ['brand']),
    model: readFirstNullableText(payload, ['model']),
    modelYear: readFirstNullableText(payload, ['model_year']),
    trackUsage: readFirstNullableText(payload, ['track_usage']),
    currentUsageReading: readFirstNullableText(payload, ['current_usage_reading']),
    estimatedUsageCost: readFirstNullableText(payload, ['estimated_usage_cost']),
  };
}

function parseOperatorOption(payload: unknown): EquipmentOperatorOption | null {
  if (!isRecord(payload)) return null;

  const value = readFirstString(payload, ['user_id', 'id']);
  const label = readFirstString(payload, ['display_name', 'full_name', 'name', 'email']);
  if (!value || !label) return null;

  return {
    value,
    label,
    email: readFirstNullableText(payload, ['email']),
  };
}

function parseUsageLog(payload: unknown): EquipmentUsageLog | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  const operator = parseNamedReference(payload.operator);
  const usedBy = parseNamedReference(payload.used_by);
  const field = parseLocationReference(payload.field);
  const lot = parseLocationReference(payload.lot);
  const startingReading = readFirstNullableText(payload, ['starting_reading']);
  const endingReading = readFirstNullableText(payload, ['ending_reading']);
  const totalUsed = readFirstNullableText(payload, ['total_used']);
  const totalHoursUsed =
    readFirstNullableText(payload, ['total_hours_used']) ??
    (startingReading === null && endingReading === null ? totalUsed : null);

  return {
    id,
    equipmentId: readFirstString(payload, ['equipment_id']),
    usagePurpose: readFirstString(payload, ['usage_purpose'], 'other'),
    operatorId: operator?.id ?? readFirstNullableText(payload, ['operator_id']),
    operator,
    usedById: usedBy?.id ?? readFirstNullableText(payload, ['used_by_id']),
    usedBy,
    fieldId: field?.id ?? readFirstNullableText(payload, ['field_id']),
    field,
    lotId: lot?.id ?? readFirstNullableText(payload, ['lot_id']),
    lot,
    dateUsed: readFirstNullableText(payload, ['date_used']),
    startDateTime: readFirstNullableText(payload, ['start_datetime']),
    endDateTime: readFirstNullableText(payload, ['end_datetime']),
    startingReading,
    endingReading,
    totalUsed,
    totalHoursUsed,
    fuelConsumablesUsed: readFirstNullableText(payload, ['fuel_consumables_used', 'fuel_used']),
    cost: readFirstNullableText(payload, ['cost']),
    usageDescription: readFirstNullableText(payload, ['usage_description']),
    keywords: parseStringArray(payload.keywords_tags),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseMaintenanceRecord(payload: unknown): MaintenanceRecord | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  const performedBy = parseMaintenancePerformer(payload.performed_by);
  const parts = parseList(payload.maintenance_parts, parseMaintenancePart);
  const canonicalPerformedBy =
    readFirstNullableText(payload, ['service_performed_by']) ??
    (performedBy?.kind && performedBy.id ? `${performedBy.kind}:${performedBy.id}` : null);

  return {
    id,
    equipmentId: readFirstString(payload, ['equipment_id']),
    serviceType: readFirstString(payload, ['service_type'], 'scheduled'),
    serviceDescription: readFirstString(payload, ['service_description'], 'Service entry'),
    servicePerformedBy: canonicalPerformedBy,
    performedBy,
    datePerformed: readFirstNullableText(payload, ['date_performed']),
    nextMaintenanceDue: readFirstNullableText(payload, ['next_maintenance_due']),
    currentMeterReading: readFirstNullableText(payload, ['current_meter_reading']),
    totalCost: readFirstNullableText(payload, ['total_cost']),
    laborCost: readFirstNullableText(payload, ['labor_cost']),
    partsCost: readFirstNullableText(payload, ['parts_cost']),
    vendorFee: readFirstNullableText(payload, ['vendor_fee']),
    partsCount: parts.length || readArray(payload, 'maintenance_parts').length,
    parts,
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
    serviceType: readFirstNullableText(payload, ['service_type']),
    dueDate: readFirstNullableText(payload, [
      'due_date',
      'next_maintenance_date',
      'next_maintenance_due',
      'date_performed',
    ]),
    status: readFirstNullableText(payload, ['status']),
    daysUntilDue: readFirstNumber(payload, ['days_until_due', 'daysUntilDue']),
  };
}

function parseList<T>(payload: unknown, parser: (value: unknown) => T | null): T[] {
  return normalizeRows(payload)
    .map((item) => parser(item))
    .filter((item): item is T => Boolean(item));
}

function parseFirst<T>(
  payload: unknown,
  parser: (value: unknown) => T | null,
  errorText: string,
): T {
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
  if ('serial_number' in record)
    normalized.serial_number = readFirstNullableText(record, ['serial_number']);
  if ('brand' in record) normalized.brand = readFirstNullableText(record, ['brand']);
  if ('model' in record) normalized.model = readFirstNullableText(record, ['model']);
  if ('notes' in record) normalized.notes = readFirstNullableText(record, ['notes']);
  if ('track_usage' in record)
    normalized.track_usage = readFirstNullableText(record, ['track_usage']);
  if ('current_usage_reading' in record) {
    normalized.current_usage_reading = record.current_usage_reading ?? null;
  }
  if ('next_maintenance_date' in record) {
    normalized.next_maintenance_date = readFirstNullableText(record, ['next_maintenance_date']);
  }

  return normalized;
}

function normalizeUsageLogCommandInput(
  input: CreateUsageLogRequest | UpdateUsageLogRequest,
): UnknownRecord {
  const record = isRecord(input) ? input : {};
  const normalized: UnknownRecord = {};

  if ('operator_id' in record)
    normalized.operator_id = readFirstNullableText(record, ['operator_id']);
  if ('used_by_id' in record) normalized.used_by_id = readFirstNullableText(record, ['used_by_id']);
  if ('field_id' in record) normalized.field_id = readFirstNullableText(record, ['field_id']);
  if ('lot_id' in record) normalized.lot_id = readFirstNullableText(record, ['lot_id']);
  if ('usage_purpose' in record) normalized.usage_purpose = readString(record, 'usage_purpose');
  if ('usage_description' in record) {
    normalized.usage_description = readFirstNullableText(record, ['usage_description']);
  }
  if ('date_used' in record) normalized.date_used = readFirstNullableText(record, ['date_used']);
  if ('start_datetime' in record) {
    normalized.start_datetime = readFirstNullableText(record, ['start_datetime']);
  }
  if ('end_datetime' in record)
    normalized.end_datetime = readFirstNullableText(record, ['end_datetime']);
  if ('starting_reading' in record) normalized.starting_reading = record.starting_reading ?? null;
  if ('ending_reading' in record) normalized.ending_reading = record.ending_reading ?? null;
  if ('total_used' in record) normalized.total_used = record.total_used ?? null;
  if ('total_hours_used' in record) normalized.total_hours_used = record.total_hours_used ?? null;
  if ('cost' in record) normalized.cost = record.cost ?? null;
  if ('fuel_consumables_used' in record) {
    normalized.fuel_consumables_used = readFirstNullableText(record, ['fuel_consumables_used']);
  } else if ('fuel_used' in record) {
    normalized.fuel_consumables_used = readFirstNullableText(record, ['fuel_used']);
  }
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
    normalized.date_performed = readFirstNullableText(record, ['date_performed']);
  }
  if ('next_maintenance_due' in record) {
    normalized.next_maintenance_due = readFirstNullableText(record, ['next_maintenance_due']);
  }
  if ('service_performed_by' in record) {
    normalized.service_performed_by = readFirstNullableText(record, ['service_performed_by']);
  }
  if ('performed_by_id' in record) {
    normalized.performed_by_id = readFirstNullableText(record, ['performed_by_id']);
  }
  if ('current_meter_reading' in record) {
    normalized.current_meter_reading = record.current_meter_reading ?? null;
  }
  if ('total_cost' in record) normalized.total_cost = record.total_cost ?? null;
  if ('labor_cost' in record) normalized.labor_cost = record.labor_cost ?? null;
  if ('parts_cost' in record) normalized.parts_cost = record.parts_cost ?? null;
  if ('vendor_fee' in record) normalized.vendor_fee = record.vendor_fee ?? null;

  return normalized;
}

function normalizeMaintenancePartsInput(
  parts: ReplaceMaintenancePartRequest[],
): ReplaceMaintenancePartRequestContract[] {
  return parts
    .map((part) => {
      const record: UnknownRecord = isRecord(part) ? part : {};
      const productId = readString(record, 'product_id');
      const quantity = readFirstNumber(record, ['quantity']);
      const unitCost = readFirstNumber(record, ['unit_cost']);
      const totalCost = readFirstNumber(record, ['total_cost']);
      if (!productId) {
        return null;
      }
      if (quantity === null || unitCost === null || totalCost === null) {
        return null;
      }

      const normalized: ReplaceMaintenancePartRequestContract = {
        product_id: productId,
        quantity,
        unit_cost: unitCost,
        total_cost: totalCost,
      };

      if ('farm_id' in record) {
        normalized.farm_id = readFirstNullableText(record, ['farm_id']);
      }

      return normalized;
    })
    .filter((part): part is ReplaceMaintenancePartRequestContract => Boolean(part));
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

function toReplaceMaintenancePartsBody(
  parts: ReplaceMaintenancePartRequest[],
): ReplaceMaintenancePartsRequestContract {
  return {
    parts: normalizeMaintenancePartsInput(parts),
  };
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

export async function getEquipmentById(
  token: string,
  equipmentId: string,
): Promise<EquipmentDetail> {
  const { data } = await apiClient.get<GetEquipmentByIdResponseContract>(
    `/equipment/${equipmentId}`,
    {
      token,
    },
  );
  return parseFirst(data, parseEquipmentDetail, 'Equipment API returned an empty detail payload.');
}

export async function createEquipment(
  token: string,
  input: CreateEquipmentRequest,
): Promise<EquipmentDetail> {
  const { data } = await apiClient.post<
    CreateEquipmentResponseContract,
    CreateEquipmentRequestContract
  >('/equipment', {
    token,
    body: toCreateEquipmentBody(input),
    idempotencyKey: `equipment-create-${Date.now()}`,
  });
  return parseFirst(data, parseEquipmentDetail, 'Equipment API returned an empty create payload.');
}

export async function updateEquipment(
  token: string,
  equipmentId: string,
  input: UpdateEquipmentRequest,
): Promise<EquipmentDetail> {
  const { data } = await apiClient.patch<
    UpdateEquipmentResponseContract,
    UpdateEquipmentRequestContract
  >(`/equipment/${equipmentId}`, {
    token,
    body: toUpdateEquipmentBody(input),
  });
  return parseFirst(data, parseEquipmentDetail, 'Equipment API returned an empty update payload.');
}

export async function deactivateEquipment(
  token: string,
  equipmentId: string,
): Promise<EquipmentDetail> {
  return updateEquipment(token, equipmentId, { status: 'inactive' });
}

export async function reactivateEquipment(
  token: string,
  equipmentId: string,
): Promise<EquipmentDetail> {
  return updateEquipment(token, equipmentId, { status: 'operational' });
}

export async function deleteEquipment(token: string, equipmentId: string): Promise<void> {
  await apiClient.delete<unknown>(`/equipment/${equipmentId}`, { token });
}

export async function listUsageLogs(
  token: string,
  equipmentId: string,
): Promise<EquipmentUsageLog[]> {
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
  const { data } = await apiClient.post<
    CreateUsageLogResponseContract,
    CreateUsageLogRequestContract
  >(`/equipment/${equipmentId}/usage-logs`, {
    token,
    body: toCreateUsageLogBody(input),
    idempotencyKey: `equipment-usage-create-${Date.now()}`,
  });
  return parseFirst(data, parseUsageLog, 'Usage log API returned an empty create payload.');
}

export async function updateUsageLog(
  token: string,
  usageLogId: string,
  input: UpdateUsageLogRequest,
): Promise<EquipmentUsageLog> {
  const { data } = await apiClient.patch<
    UpdateUsageLogResponseContract,
    UpdateUsageLogRequestContract
  >(`/equipment/usage-logs/${usageLogId}`, {
    token,
    body: toUpdateUsageLogBody(input),
  });
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
  >(`/equipment/${equipmentId}/maintenance-records`, {
    token,
    body: toCreateMaintenanceBody(input),
    idempotencyKey: `equipment-maintenance-create-${Date.now()}`,
  });
  return parseFirst(
    data,
    parseMaintenanceRecord,
    'Maintenance API returned an empty create payload.',
  );
}

export async function updateMaintenanceRecord(
  token: string,
  recordId: string,
  input: UpdateMaintenanceRecordRequest,
): Promise<MaintenanceRecord> {
  const { data } = await apiClient.patch<
    UpdateMaintenanceRecordResponseContract,
    UpdateMaintenanceRecordRequestContract
  >(`/equipment/maintenance-records/${recordId}`, {
    token,
    body: toUpdateMaintenanceBody(input),
  });
  return parseFirst(
    data,
    parseMaintenanceRecord,
    'Maintenance API returned an empty update payload.',
  );
}

export async function deleteMaintenanceRecord(token: string, recordId: string): Promise<void> {
  await apiClient.delete<unknown>(`/equipment/maintenance-records/${recordId}`, { token });
}

export async function replaceMaintenanceParts(
  token: string,
  recordId: string,
  parts: ReplaceMaintenancePartRequest[],
): Promise<ReplaceMaintenancePartsResponse> {
  const { data } = await apiClient.post<
    ReplaceMaintenancePartsResponseContract,
    ReplaceMaintenancePartsRequestContract
  >(`/equipment/maintenance-records/${recordId}/parts/replace`, {
    token,
    body: toReplaceMaintenancePartsBody(parts),
  });

  if (isRecord(data)) {
    return {
      replacedCount: readFirstNumber(data, ['replacedCount']) ?? 0,
    };
  }

  return { replacedCount: 0 };
}
