import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';
import {
  isRecord,
  normalizeRows,
  readArray,
  readBoolean,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';

type CreateLotRequestContract =
  operations['OrderWriteController_createLot_v1']['requestBody']['content']['application/json'];
type UpdateLotRequestContract =
  operations['OrderWriteController_updateLot_v1']['requestBody']['content']['application/json'];

export type LotStatus = 'active' | 'inactive' | string;

export type LotSummary = {
  id: string;
  fieldId: string;
  name: string;
  lotType: string;
  cropRotationPlan: string;
  lightProfile: string;
  shapePolygon: UnknownRecord | null;
  weatherAlertsEnabled: boolean;
  notes: string | null;
  status: LotStatus;
  fieldName: string | null;
  fieldStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLotFallbackRequest = {
  field_id: string;
  name: string;
  lot_type: string;
  crop_rotation_plan: string;
  light_profile: string;
  shape_polygon?: UnknownRecord | null;
  lot_type_other?: string | null;
  crop_rotation_plan_other?: string | null;
  past_seasons_crops?: string[];
  weather_alerts_enabled?: boolean;
  notes?: string | null;
  status?: LotStatus;
};

export type UpdateLotFallbackRequest = Partial<CreateLotFallbackRequest>;

// TODO(openapi-blocker: QH-OAPI-003): Remove fallback union when CreateLotDto is typed in OpenAPI.
export type CreateLotRequest = CreateLotRequestContract | CreateLotFallbackRequest;

// TODO(openapi-blocker: QH-OAPI-003): Remove fallback union when UpdateLotDto is typed in OpenAPI.
export type UpdateLotRequest = UpdateLotRequestContract | UpdateLotFallbackRequest;

function parseFieldMetadata(payload: unknown): { fieldName: string | null; fieldStatus: string | null } {
  if (!isRecord(payload)) {
    return { fieldName: null, fieldStatus: null };
  }

  return {
    fieldName: readNullableString(payload, 'name'),
    fieldStatus: readNullableString(payload, 'status'),
  };
}

function parseLotSummary(payload: unknown): LotSummary | null {
  if (!isRecord(payload)) return null;
  const fieldMeta = parseFieldMetadata(payload.fields);

  return {
    id: readString(payload, 'id'),
    fieldId: readString(payload, 'field_id'),
    name: readString(payload, 'name'),
    lotType: readString(payload, 'lot_type'),
    cropRotationPlan: readString(payload, 'crop_rotation_plan'),
    lightProfile: readString(payload, 'light_profile'),
    shapePolygon: isRecord(payload.shape_polygon) ? payload.shape_polygon : null,
    weatherAlertsEnabled: readBoolean(payload, 'weather_alerts_enabled', false),
    notes: readNullableString(payload, 'notes'),
    status: readString(payload, 'status', 'active'),
    fieldName: fieldMeta.fieldName,
    fieldStatus: fieldMeta.fieldStatus,
    createdAt: readString(payload, 'created_at'),
    updatedAt: readString(payload, 'updated_at'),
  };
}

function parseList<T>(payload: unknown, parser: (value: unknown) => T | null): T[] {
  return normalizeRows(payload)
    .map((item) => parser(item))
    .filter((item): item is T => Boolean(item));
}

function parseFirst<T>(payload: unknown, parser: (value: unknown) => T | null): T {
  const rows = parseList(payload, parser);
  if (rows.length === 0) {
    throw new Error('Lots API returned an empty mutation payload.');
  }

  return rows[0];
}

function normalizeLotRequest(input: CreateLotRequest | UpdateLotRequest): UnknownRecord {
  const record = isRecord(input) ? input : {};
  const normalized: UnknownRecord = {};

  if ('field_id' in record) normalized.field_id = readString(record, 'field_id');
  if ('name' in record) normalized.name = readString(record, 'name');
  if ('lot_type' in record) normalized.lot_type = readString(record, 'lot_type');
  if ('lot_type_other' in record) normalized.lot_type_other = record.lot_type_other ?? null;
  if ('crop_rotation_plan' in record) {
    normalized.crop_rotation_plan = readString(record, 'crop_rotation_plan');
  }
  if ('crop_rotation_plan_other' in record) {
    normalized.crop_rotation_plan_other = record.crop_rotation_plan_other ?? null;
  }
  if ('light_profile' in record) normalized.light_profile = readString(record, 'light_profile');
  if ('shape_polygon' in record) {
    normalized.shape_polygon = isRecord(record.shape_polygon) ? record.shape_polygon : null;
  }
  if ('past_seasons_crops' in record) normalized.past_seasons_crops = readArray(record, 'past_seasons_crops');
  if ('weather_alerts_enabled' in record) {
    normalized.weather_alerts_enabled = readBoolean(record, 'weather_alerts_enabled');
  }
  if ('notes' in record) normalized.notes = record.notes ?? null;
  if ('status' in record) normalized.status = readString(record, 'status', 'active');

  return normalized;
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once lot responses are typed.
export async function listLots(token: string): Promise<LotSummary[]> {
  const { data } = await apiClient.get<unknown>('/lots', { token });
  return parseList(data, parseLotSummary);
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once lot responses are typed.
export async function listInactiveLotsWithFields(token: string): Promise<LotSummary[]> {
  const { data } = await apiClient.get<unknown>('/lots/inactive/with-fields', { token });
  return parseList(data, parseLotSummary);
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once lot responses are typed.
export async function createLot(token: string, input: CreateLotRequest): Promise<LotSummary> {
  const { data } = await apiClient.post<unknown, UnknownRecord>('/lots', {
    token,
    body: normalizeLotRequest(input),
    idempotencyKey: `lots-create-${Date.now()}`,
  });
  return parseFirst(data, parseLotSummary);
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once lot responses are typed.
export async function updateLot(
  token: string,
  lotId: string,
  input: UpdateLotRequest,
): Promise<LotSummary> {
  const { data } = await apiClient.patch<unknown, UnknownRecord>(`/lots/${lotId}`, {
    token,
    body: normalizeLotRequest(input),
  });
  return parseFirst(data, parseLotSummary);
}

export async function deactivateLot(token: string, lotId: string): Promise<LotSummary> {
  return updateLot(token, lotId, { status: 'inactive' });
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once lot responses are typed.
export async function reactivateLot(token: string, lotId: string): Promise<LotSummary> {
  const { data } = await apiClient.patch<unknown, Record<string, never>>(`/lots/${lotId}/reactivate`, {
    token,
    body: {},
  });
  return parseFirst(data, parseLotSummary);
}

export const LOTS_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_REQUEST_DTOS;
export const LOTS_RESPONSE_SCHEMA_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_RESPONSE_SCHEMAS;
