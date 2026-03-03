import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import {
  isRecord,
  normalizeRows,
  readArray,
  readBoolean,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';

export type CreateAnimalRequest =
  operations['LivestockController_createAnimal_v1']['requestBody']['content']['application/json'];
export type UpdateAnimalRequest =
  operations['LivestockController_updateAnimal_v1']['requestBody']['content']['application/json'];

export type CreateHousingUnitRequest =
  operations['LivestockController_createHousingUnit_v1']['requestBody']['content']['application/json'];
export type UpdateHousingUnitRequest =
  operations['LivestockController_updateHousingUnit_v1']['requestBody']['content']['application/json'];

export type CreateWeatherAlertRuleRequest =
  operations['LivestockController_createWeatherAlertRule_v1']['requestBody']['content']['application/json'];
export type UpdateWeatherAlertRuleRequest =
  operations['LivestockController_updateWeatherAlertRule_v1']['requestBody']['content']['application/json'];

export type CreateAnimalGroupRequest =
  operations['LivestockController_createGroup_v1']['requestBody']['content']['application/json'];
export type UpdateAnimalGroupRequest =
  operations['LivestockController_updateGroup_v1']['requestBody']['content']['application/json'];

export type CreateAnimalHealthCheckRequest =
  operations['LivestockController_createHealthCheck_v1']['requestBody']['content']['application/json'];
export type UpdateAnimalHealthCheckRequest =
  operations['LivestockController_updateHealthCheck_v1']['requestBody']['content']['application/json'];

export type CreateAnimalYieldRecordRequest =
  operations['LivestockController_createYieldRecord_v1']['requestBody']['content']['application/json'];
export type UpdateAnimalYieldRecordRequest =
  operations['LivestockController_updateYieldRecord_v1']['requestBody']['content']['application/json'];

export type CreateHousingMaintenanceRecordRequest =
  operations['LivestockController_createHousingUnitMaintenanceRecord_v1']['requestBody']['content']['application/json'];
export type UpdateHousingMaintenanceRecordRequest =
  operations['LivestockController_updateHousingUnitMaintenanceRecord_v1']['requestBody']['content']['application/json'];

export type CreateHousingConsumptionLogRequest =
  operations['LivestockController_createConsumptionLog_v1']['requestBody']['content']['application/json'];
export type UpdateHousingConsumptionLogRequest =
  operations['LivestockController_updateConsumptionLog_v1']['requestBody']['content']['application/json'];

type ListAnimalsResponse =
  operations['LivestockController_listAnimals_v1']['responses'][200]['content']['application/json'];
type CreateAnimalResponse =
  operations['LivestockController_createAnimal_v1']['responses'][201]['content']['application/json'];
type UpdateAnimalResponse =
  operations['LivestockController_updateAnimal_v1']['responses'][200]['content']['application/json'];

type ListHousingUnitsResponse =
  operations['LivestockController_listHousingUnits_v1']['responses'][200]['content']['application/json'];
type CreateHousingUnitResponse =
  operations['LivestockController_createHousingUnit_v1']['responses'][201]['content']['application/json'];
type UpdateHousingUnitResponse =
  operations['LivestockController_updateHousingUnit_v1']['responses'][200]['content']['application/json'];

type ListWeatherAlertRulesResponse =
  operations['LivestockController_listWeatherAlertRules_v1']['responses'][200]['content']['application/json'];
type CreateWeatherAlertRuleResponse =
  operations['LivestockController_createWeatherAlertRule_v1']['responses'][201]['content']['application/json'];
type UpdateWeatherAlertRuleResponse =
  operations['LivestockController_updateWeatherAlertRule_v1']['responses'][200]['content']['application/json'];

type ListWeatherAlertRulesByLotResponse =
  operations['LivestockController_listWeatherAlertRulesByLot_v1']['responses'][200]['content']['application/json'];
type ListWeatherAlertRulesByLocationResponse =
  operations['LivestockController_listWeatherAlertRulesByLocation_v1']['responses'][200]['content']['application/json'];

export type AnimalRecord = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  tagNumber: string | null;
  healthStatus: string | null;
  activeStatus: string | null;
  quantity: number | null;
  currentHousingUnitId: string | null;
  groupId: string | null;
  lastVetVisit: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnimalGroup = {
  id: string;
  name: string;
  species: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnimalHealthCheck = {
  id: string;
  animalId: string | null;
  date: string | null;
  status: string | null;
  notes: string | null;
  performedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnimalYieldRecord = {
  id: string;
  animalId: string | null;
  date: string | null;
  yieldType: string | null;
  amount: number | null;
  unit: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HousingUnit = {
  id: string;
  barnName: string;
  unitCode: string | null;
  fieldId: string | null;
  capacity: number | null;
  currentStatus: string | null;
  animalTypes: string[];
  shapePolygon: UnknownRecord | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HousingMaintenanceRecord = {
  id: string;
  housingUnitId: string | null;
  date: string | null;
  maintenanceType: string | null;
  status: string | null;
  cost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HousingConsumptionLog = {
  id: string;
  housingUnitId: string | null;
  date: string | null;
  feedAmount: number | null;
  waterAmount: number | null;
  unit: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WeatherAlertRule = {
  id: string;
  lotId: string | null;
  fieldId: string | null;
  name: string;
  condition: string | null;
  operator: string | null;
  value: number | null;
  unit: string | null;
  enabled: boolean;
  severity: string | null;
  customMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

function readFirstString(record: UnknownRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = readString(record, key);
    if (value.length > 0) {
      return value;
    }
  }

  return fallback;
}

function readFirstNullableString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = readNullableString(record, key);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function readFirstNumber(record: UnknownRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readFirstBoolean(record: UnknownRecord, keys: string[], fallback = false): boolean {
  for (const key of keys) {
    if (!(key in record)) {
      continue;
    }

    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }

    return readBoolean(record, key, fallback);
  }

  return fallback;
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function parseList<T>(payload: unknown, parser: (value: unknown) => T | null): T[] {
  return normalizeRows(payload)
    .map((value) => parser(value))
    .filter((value): value is T => Boolean(value));
}

function parseFirst<T>(payload: unknown, parser: (value: unknown) => T | null, errorText: string): T {
  const rows = parseList(payload, parser);
  if (rows.length === 0) {
    throw new Error(errorText);
  }

  return rows[0];
}

function normalizeUnknownInput(input: unknown): UnknownRecord {
  return isRecord(input) ? { ...input } : {};
}

function parseAnimal(payload: unknown): AnimalRecord | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readFirstString(payload, ['name', 'animal_name'], 'Animal'),
    species: readFirstNullableString(payload, ['species']),
    breed: readFirstNullableString(payload, ['breed']),
    tagNumber: readFirstNullableString(payload, ['tag_number', 'tagNumber']),
    healthStatus: readFirstNullableString(payload, ['health_status', 'healthStatus']),
    activeStatus: readFirstNullableString(payload, ['active_status', 'activeStatus', 'status']),
    quantity: readFirstNumber(payload, ['quantity']),
    currentHousingUnitId: readFirstNullableString(payload, ['current_housing_unit_id', 'housing_unit_id']),
    groupId: readFirstNullableString(payload, ['group_id']),
    lastVetVisit: readFirstNullableString(payload, ['last_vet_visit']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseAnimalGroup(payload: unknown): AnimalGroup | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readFirstString(payload, ['name', 'group_name', 'label'], 'Group'),
    species: readFirstNullableString(payload, ['species']),
    status: readFirstNullableString(payload, ['status', 'active_status']),
    notes: readFirstNullableString(payload, ['notes', 'description']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseAnimalHealthCheck(payload: unknown): AnimalHealthCheck | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    animalId: readFirstNullableString(payload, ['animal_id', 'livestock_id']),
    date: readFirstNullableString(payload, ['check_date', 'date', 'created_at']),
    status: readFirstNullableString(payload, ['status', 'health_status']),
    notes: readFirstNullableString(payload, ['notes', 'remarks', 'findings']),
    performedBy: readFirstNullableString(payload, ['vet_name', 'performed_by', 'technician']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseAnimalYieldRecord(payload: unknown): AnimalYieldRecord | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    animalId: readFirstNullableString(payload, ['animal_id', 'livestock_id']),
    date: readFirstNullableString(payload, ['record_date', 'date', 'yield_date']),
    yieldType: readFirstNullableString(payload, ['yield_type', 'product_type']),
    amount: readFirstNumber(payload, ['amount', 'yield_amount', 'quantity']),
    unit: readFirstNullableString(payload, ['unit', 'measure_unit']),
    notes: readFirstNullableString(payload, ['notes', 'description']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseHousingUnit(payload: unknown): HousingUnit | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    barnName: readFirstString(payload, ['barn_name', 'name'], 'Housing unit'),
    unitCode: readFirstNullableString(payload, ['unit_code']),
    fieldId: readFirstNullableString(payload, ['field_id']),
    capacity: readFirstNumber(payload, ['capacity']),
    currentStatus: readFirstNullableString(payload, ['current_status', 'status']),
    animalTypes: parseStringArray(payload.animal_types),
    shapePolygon: isRecord(payload.shape_polygon) ? payload.shape_polygon : null,
    notes: readFirstNullableString(payload, ['notes']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseHousingMaintenanceRecord(payload: unknown): HousingMaintenanceRecord | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    housingUnitId: readFirstNullableString(payload, ['housing_unit_id', 'unit_id']),
    date: readFirstNullableString(payload, ['date', 'service_date', 'date_performed']),
    maintenanceType: readFirstNullableString(payload, ['maintenance_type', 'service_type', 'type']),
    status: readFirstNullableString(payload, ['status']),
    cost: readFirstNumber(payload, ['cost', 'total_cost']),
    notes: readFirstNullableString(payload, ['notes', 'description', 'service_description']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseHousingConsumptionLog(payload: unknown): HousingConsumptionLog | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    housingUnitId: readFirstNullableString(payload, ['housing_unit_id', 'unit_id']),
    date: readFirstNullableString(payload, ['date', 'log_date', 'consumed_at']),
    feedAmount: readFirstNumber(payload, ['feed_amount', 'feed_qty', 'quantity_feed']),
    waterAmount: readFirstNumber(payload, ['water_amount', 'water_qty', 'quantity_water']),
    unit: readFirstNullableString(payload, ['unit']),
    notes: readFirstNullableString(payload, ['notes', 'description']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseWeatherAlertRule(payload: unknown): WeatherAlertRule | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    lotId: readFirstNullableString(payload, ['lot_id']),
    fieldId: readFirstNullableString(payload, ['field_id']),
    name: readFirstString(payload, ['name'], 'Weather rule'),
    condition: readFirstNullableString(payload, ['condition']),
    operator: readFirstNullableString(payload, ['operator']),
    value: readFirstNumber(payload, ['value']),
    unit: readFirstNullableString(payload, ['unit']),
    enabled: readFirstBoolean(payload, ['enabled'], true),
    severity: readFirstNullableString(payload, ['severity']),
    customMessage: readFirstNullableString(payload, ['custom_message']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function normalizeAnimalGroupInput(input: CreateAnimalGroupRequest | UpdateAnimalGroupRequest): UnknownRecord {
  const record = normalizeUnknownInput(input);
  const normalized: UnknownRecord = { ...record };

  const name = readFirstString(record, ['name', 'group_name']).trim();
  if (name) {
    normalized.name = name;
  }

  const species = readFirstNullableString(record, ['species']);
  if (species !== null) {
    normalized.species = species;
  }

  return normalized;
}

function normalizeHealthCheckInput(
  input: CreateAnimalHealthCheckRequest | UpdateAnimalHealthCheckRequest,
  animalId: string,
): UnknownRecord {
  const record = normalizeUnknownInput(input);
  const normalized: UnknownRecord = { ...record };

  normalized.animal_id = readFirstString(record, ['animal_id', 'animalId'], animalId);

  const date = readFirstNullableString(record, ['check_date', 'date']);
  if (date) {
    normalized.check_date = date;
  }

  return normalized;
}

function normalizeYieldRecordInput(
  input: CreateAnimalYieldRecordRequest | UpdateAnimalYieldRecordRequest,
  animalId: string,
): UnknownRecord {
  const record = normalizeUnknownInput(input);
  const normalized: UnknownRecord = { ...record };

  normalized.animal_id = readFirstString(record, ['animal_id', 'animalId'], animalId);

  const date = readFirstNullableString(record, ['record_date', 'date', 'yield_date']);
  if (date) {
    normalized.record_date = date;
  }

  return normalized;
}

function normalizeHousingMaintenanceInput(
  input: CreateHousingMaintenanceRecordRequest | UpdateHousingMaintenanceRecordRequest,
  housingUnitId: string,
): UnknownRecord {
  const record = normalizeUnknownInput(input);
  const normalized: UnknownRecord = { ...record };

  normalized.housing_unit_id = readFirstString(
    record,
    ['housing_unit_id', 'housingUnitId'],
    housingUnitId,
  );

  return normalized;
}

function normalizeHousingConsumptionInput(
  input: CreateHousingConsumptionLogRequest | UpdateHousingConsumptionLogRequest,
  housingUnitId: string,
): UnknownRecord {
  const record = normalizeUnknownInput(input);
  const normalized: UnknownRecord = { ...record };

  normalized.housing_unit_id = readFirstString(
    record,
    ['housing_unit_id', 'housingUnitId'],
    housingUnitId,
  );

  return normalized;
}

function normalizeWeatherAlertRuleInput(
  input: CreateWeatherAlertRuleRequest | UpdateWeatherAlertRuleRequest,
): UnknownRecord {
  const record = normalizeUnknownInput(input);
  const normalized: UnknownRecord = { ...record };

  if ('name' in record) {
    normalized.name = readString(record, 'name').trim();
  }

  if ('condition' in record) {
    normalized.condition = readNullableString(record, 'condition');
  }

  if ('operator' in record) {
    normalized.operator = readNullableString(record, 'operator');
  }

  if ('custom_message' in record) {
    normalized.custom_message = readNullableString(record, 'custom_message');
  }

  if ('severity' in record) {
    normalized.severity = readNullableString(record, 'severity');
  }

  if ('enabled' in record) {
    normalized.enabled = readBoolean(record, 'enabled', true);
  }

  if ('notify_in_app' in record) {
    normalized.notify_in_app = readBoolean(record, 'notify_in_app', true);
  }

  if ('notify_email' in record) {
    normalized.notify_email = readBoolean(record, 'notify_email', false);
  }

  if ('notify_sms' in record) {
    normalized.notify_sms = readBoolean(record, 'notify_sms', false);
  }

  if ('value' in record) {
    normalized.value = readFirstNumber(record, ['value']);
  }

  return normalized;
}

export async function listAnimals(token: string): Promise<AnimalRecord[]> {
  const { data } = await apiClient.get<ListAnimalsResponse>('/animals', { token });
  return parseList(data, parseAnimal);
}

export async function createAnimal(token: string, input: CreateAnimalRequest): Promise<AnimalRecord> {
  const { data } = await apiClient.post<CreateAnimalResponse, CreateAnimalRequest>('/animals', {
    token,
    body: input,
    idempotencyKey: `animals-create-${Date.now()}`,
  });
  return parseFirst(data, parseAnimal, 'Animals API returned an empty create payload.');
}

export async function updateAnimal(
  token: string,
  animalId: string,
  input: UpdateAnimalRequest,
): Promise<AnimalRecord> {
  const { data } = await apiClient.patch<UpdateAnimalResponse, UpdateAnimalRequest>(`/animals/${animalId}`, {
    token,
    body: input,
  });
  return parseFirst(data, parseAnimal, 'Animals API returned an empty update payload.');
}

export async function deactivateAnimal(token: string, animalId: string): Promise<boolean> {
  await apiClient.delete<unknown>(`/animals/${animalId}`, { token });
  return true;
}

export async function listAnimalGroups(token: string): Promise<AnimalGroup[]> {
  const { data } = await apiClient.get<unknown>('/animal-groups', { token });
  return parseList(data, parseAnimalGroup);
}

export async function createAnimalGroup(
  token: string,
  input: CreateAnimalGroupRequest,
): Promise<AnimalGroup> {
  const { data } = await apiClient.post<unknown, UnknownRecord>('/animal-groups', {
    token,
    body: normalizeAnimalGroupInput(input),
    idempotencyKey: `animal-groups-create-${Date.now()}`,
  });
  return parseFirst(data, parseAnimalGroup, 'Animal groups API returned an empty create payload.');
}

export async function updateAnimalGroup(
  token: string,
  groupId: string,
  input: UpdateAnimalGroupRequest,
): Promise<AnimalGroup> {
  const { data } = await apiClient.patch<unknown, UnknownRecord>(`/animal-groups/${groupId}`, {
    token,
    body: normalizeAnimalGroupInput(input),
  });
  return parseFirst(data, parseAnimalGroup, 'Animal groups API returned an empty update payload.');
}

export async function deactivateAnimalGroup(token: string, groupId: string): Promise<boolean> {
  await apiClient.post<unknown>(`/animal-groups/${groupId}/commands/deactivate`, {
    token,
    idempotencyKey: `animal-groups-deactivate-${groupId}-${Date.now()}`,
  });
  return true;
}

export async function listAnimalHealthChecks(token: string, animalId: string): Promise<AnimalHealthCheck[]> {
  const { data } = await apiClient.get<unknown>(`/animals/${animalId}/health-checks`, { token });
  return parseList(data, parseAnimalHealthCheck);
}

export async function createAnimalHealthCheck(
  token: string,
  animalId: string,
  input: CreateAnimalHealthCheckRequest,
): Promise<AnimalHealthCheck> {
  const { data } = await apiClient.post<unknown, UnknownRecord>('/animal-health-checks', {
    token,
    body: normalizeHealthCheckInput(input, animalId),
    idempotencyKey: `animal-health-checks-create-${animalId}-${Date.now()}`,
  });
  return parseFirst(data, parseAnimalHealthCheck, 'Animal health checks API returned an empty create payload.');
}

export async function updateAnimalHealthCheck(
  token: string,
  healthCheckId: string,
  input: UpdateAnimalHealthCheckRequest,
): Promise<AnimalHealthCheck> {
  const { data } = await apiClient.patch<unknown, UnknownRecord>(
    `/animal-health-checks/${healthCheckId}`,
    {
      token,
      body: normalizeUnknownInput(input),
    },
  );
  return parseFirst(data, parseAnimalHealthCheck, 'Animal health checks API returned an empty update payload.');
}

export async function deleteAnimalHealthCheck(token: string, healthCheckId: string): Promise<boolean> {
  await apiClient.delete<unknown>(`/animal-health-checks/${healthCheckId}`, { token });
  return true;
}

export async function listAnimalYieldRecords(token: string, animalId: string): Promise<AnimalYieldRecord[]> {
  const { data } = await apiClient.get<unknown>(`/animals/${animalId}/yield-records`, { token });
  return parseList(data, parseAnimalYieldRecord);
}

export async function createAnimalYieldRecord(
  token: string,
  animalId: string,
  input: CreateAnimalYieldRecordRequest,
): Promise<AnimalYieldRecord> {
  const { data } = await apiClient.post<unknown, UnknownRecord>('/animal-yield-records', {
    token,
    body: normalizeYieldRecordInput(input, animalId),
    idempotencyKey: `animal-yield-records-create-${animalId}-${Date.now()}`,
  });
  return parseFirst(data, parseAnimalYieldRecord, 'Animal yield API returned an empty create payload.');
}

export async function updateAnimalYieldRecord(
  token: string,
  yieldRecordId: string,
  input: UpdateAnimalYieldRecordRequest,
): Promise<AnimalYieldRecord> {
  const { data } = await apiClient.patch<unknown, UnknownRecord>(
    `/animal-yield-records/${yieldRecordId}`,
    {
      token,
      body: normalizeUnknownInput(input),
    },
  );
  return parseFirst(data, parseAnimalYieldRecord, 'Animal yield API returned an empty update payload.');
}

export async function deleteAnimalYieldRecord(token: string, yieldRecordId: string): Promise<boolean> {
  await apiClient.delete<unknown>(`/animal-yield-records/${yieldRecordId}`, { token });
  return true;
}

export async function listHousingUnits(token: string): Promise<HousingUnit[]> {
  const { data } = await apiClient.get<ListHousingUnitsResponse>('/housing-units', { token });
  return parseList(data, parseHousingUnit);
}

export async function createHousingUnit(
  token: string,
  input: CreateHousingUnitRequest,
): Promise<HousingUnit> {
  const { data } = await apiClient.post<CreateHousingUnitResponse, CreateHousingUnitRequest>(
    '/housing-units',
    {
      token,
      body: input,
      idempotencyKey: `housing-units-create-${Date.now()}`,
    },
  );
  return parseFirst(data, parseHousingUnit, 'Housing API returned an empty create payload.');
}

export async function updateHousingUnit(
  token: string,
  housingUnitId: string,
  input: UpdateHousingUnitRequest,
): Promise<HousingUnit> {
  const { data } = await apiClient.patch<UpdateHousingUnitResponse, UpdateHousingUnitRequest>(
    `/housing-units/${housingUnitId}`,
    {
      token,
      body: input,
    },
  );
  return parseFirst(data, parseHousingUnit, 'Housing API returned an empty update payload.');
}

export async function deactivateHousingUnit(token: string, housingUnitId: string): Promise<boolean> {
  await apiClient.delete<unknown>(`/housing-units/${housingUnitId}`, { token });
  return true;
}

export async function reactivateHousingUnit(token: string, housingUnitId: string): Promise<boolean> {
  await apiClient.post<unknown>(`/housing-units/${housingUnitId}/commands/reactivate`, {
    token,
    idempotencyKey: `housing-units-reactivate-${housingUnitId}-${Date.now()}`,
  });
  return true;
}

export async function listHousingMaintenanceRecords(
  token: string,
  housingUnitId: string,
): Promise<HousingMaintenanceRecord[]> {
  const { data } = await apiClient.get<unknown>(`/housing-units/${housingUnitId}/maintenance-records`, {
    token,
  });
  return parseList(data, parseHousingMaintenanceRecord);
}

export async function createHousingMaintenanceRecord(
  token: string,
  housingUnitId: string,
  input: CreateHousingMaintenanceRecordRequest,
): Promise<HousingMaintenanceRecord> {
  const { data } = await apiClient.post<unknown, UnknownRecord>(
    `/housing-units/${housingUnitId}/maintenance-records`,
    {
      token,
      body: normalizeHousingMaintenanceInput(input, housingUnitId),
      idempotencyKey: `housing-maintenance-create-${housingUnitId}-${Date.now()}`,
    },
  );
  return parseFirst(
    data,
    parseHousingMaintenanceRecord,
    'Housing maintenance API returned an empty create payload.',
  );
}

export async function updateHousingMaintenanceRecord(
  token: string,
  maintenanceRecordId: string,
  input: UpdateHousingMaintenanceRecordRequest,
): Promise<HousingMaintenanceRecord> {
  const { data } = await apiClient.patch<unknown, UnknownRecord>(
    `/housing-unit-maintenance-records/${maintenanceRecordId}`,
    {
      token,
      body: normalizeUnknownInput(input),
    },
  );
  return parseFirst(
    data,
    parseHousingMaintenanceRecord,
    'Housing maintenance API returned an empty update payload.',
  );
}

export async function deleteHousingMaintenanceRecord(
  token: string,
  maintenanceRecordId: string,
): Promise<boolean> {
  await apiClient.delete<unknown>(`/housing-unit-maintenance-records/${maintenanceRecordId}`, {
    token,
  });
  return true;
}

export async function listHousingConsumptionLogs(
  token: string,
  housingUnitId: string,
): Promise<HousingConsumptionLog[]> {
  const { data } = await apiClient.get<unknown>(`/housing-units/${housingUnitId}/consumption-logs`, {
    token,
  });
  return parseList(data, parseHousingConsumptionLog);
}

export async function createHousingConsumptionLog(
  token: string,
  housingUnitId: string,
  input: CreateHousingConsumptionLogRequest,
): Promise<HousingConsumptionLog> {
  const { data } = await apiClient.post<unknown, UnknownRecord>(
    `/housing-units/${housingUnitId}/consumption-logs`,
    {
      token,
      body: normalizeHousingConsumptionInput(input, housingUnitId),
      idempotencyKey: `housing-consumption-create-${housingUnitId}-${Date.now()}`,
    },
  );
  return parseFirst(
    data,
    parseHousingConsumptionLog,
    'Housing consumption API returned an empty create payload.',
  );
}

export async function updateHousingConsumptionLog(
  token: string,
  consumptionLogId: string,
  input: UpdateHousingConsumptionLogRequest,
): Promise<HousingConsumptionLog> {
  const { data } = await apiClient.patch<unknown, UnknownRecord>(
    `/housing-unit-consumption-logs/${consumptionLogId}`,
    {
      token,
      body: normalizeUnknownInput(input),
    },
  );
  return parseFirst(
    data,
    parseHousingConsumptionLog,
    'Housing consumption API returned an empty update payload.',
  );
}

export async function deleteHousingConsumptionLog(
  token: string,
  consumptionLogId: string,
): Promise<boolean> {
  await apiClient.delete<unknown>(`/housing-unit-consumption-logs/${consumptionLogId}`, {
    token,
  });
  return true;
}

export async function listWeatherAlertRules(
  token: string,
  lotId?: string | null,
): Promise<WeatherAlertRule[]> {
  const query = lotId ? `?lotId=${encodeURIComponent(lotId)}` : '';
  const { data } = await apiClient.get<ListWeatherAlertRulesResponse>(`/weather-alert-rules${query}`, {
    token,
  });
  return parseList(data, parseWeatherAlertRule);
}

export async function listWeatherAlertRulesByLot(
  token: string,
  lotId: string,
): Promise<WeatherAlertRule[]> {
  const { data } = await apiClient.get<ListWeatherAlertRulesByLotResponse>(
    `/weather-alert-rules/lot/${lotId}`,
    {
      token,
    },
  );
  return parseList(data, parseWeatherAlertRule);
}

export async function listWeatherAlertRulesByLocation(
  token: string,
  locationId: string,
): Promise<WeatherAlertRule[]> {
  const { data } = await apiClient.get<ListWeatherAlertRulesByLocationResponse>(
    `/weather-alert-rules/location/${locationId}`,
    {
      token,
    },
  );
  return parseList(data, parseWeatherAlertRule);
}

export async function createWeatherAlertRule(
  token: string,
  input: CreateWeatherAlertRuleRequest,
): Promise<WeatherAlertRule> {
  const { data } = await apiClient.post<CreateWeatherAlertRuleResponse, UnknownRecord>(
    '/weather-alert-rules',
    {
      token,
      body: normalizeWeatherAlertRuleInput(input),
      idempotencyKey: `weather-alert-rules-create-${Date.now()}`,
    },
  );
  return parseFirst(data, parseWeatherAlertRule, 'Weather rules API returned an empty create payload.');
}

export async function updateWeatherAlertRule(
  token: string,
  weatherAlertRuleId: string,
  input: UpdateWeatherAlertRuleRequest,
): Promise<WeatherAlertRule> {
  const { data } = await apiClient.patch<UpdateWeatherAlertRuleResponse, UnknownRecord>(
    `/weather-alert-rules/${weatherAlertRuleId}`,
    {
      token,
      body: normalizeWeatherAlertRuleInput(input),
    },
  );
  return parseFirst(data, parseWeatherAlertRule, 'Weather rules API returned an empty update payload.');
}

export async function deleteWeatherAlertRule(
  token: string,
  weatherAlertRuleId: string,
): Promise<boolean> {
  await apiClient.delete<unknown>(`/weather-alert-rules/${weatherAlertRuleId}`, {
    token,
  });
  return true;
}

export function buildAnimalTypeOptions(housingUnits: HousingUnit[]): Array<{ label: string; value: string }> {
  const values = new Set<string>();
  for (const unit of housingUnits) {
    for (const animalType of unit.animalTypes) {
      values.add(animalType);
    }
  }

  return Array.from(values).map((value) => ({ label: value, value }));
}

export function inferHousingAnimalTypes(payload: unknown): string[] {
  if (!isRecord(payload)) {
    return [];
  }

  const direct = parseStringArray(payload.animal_types);
  if (direct.length > 0) return direct;

  return parseStringArray(readArray(payload, 'animalTypes'));
}
