import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';
import {
  isRecord,
  normalizeRows,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';

type CreateFieldRequestContract =
  operations['OrderWriteController_createField_v1']['requestBody']['content']['application/json'];
type UpdateFieldRequestContract =
  operations['OrderWriteController_updateField_v1']['requestBody']['content']['application/json'];

export type FieldStatus = 'active' | 'inactive' | string;

export type FieldSummary = {
  id: string;
  name: string;
  areaHectares: string;
  areaUnit: string;
  status: FieldStatus;
  shapePolygon: UnknownRecord | null;
  location: string | null;
  soilType: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InactiveFieldWithLots = FieldSummary & {
  lots: Array<{
    id: string;
    name: string;
    status: FieldStatus;
  }>;
};

export type CreateFieldFallbackRequest = {
  name: string;
  area_hectares: string | number;
  area_unit?: string;
  shape_polygon?: UnknownRecord | null;
  location?: string | null;
  soil_type?: string | null;
  notes?: string | null;
  status?: FieldStatus;
};

export type UpdateFieldFallbackRequest = Partial<CreateFieldFallbackRequest>;

// TODO(openapi-blocker: QH-OAPI-003): Remove fallback union when CreateFieldDto is typed in OpenAPI.
export type CreateFieldRequest = CreateFieldRequestContract | CreateFieldFallbackRequest;

// TODO(openapi-blocker: QH-OAPI-003): Remove fallback union when UpdateFieldDto is typed in OpenAPI.
export type UpdateFieldRequest = UpdateFieldRequestContract | UpdateFieldFallbackRequest;

function parseFieldSummary(payload: unknown): FieldSummary | null {
  if (!isRecord(payload)) return null;

  return {
    id: readString(payload, 'id'),
    name: readString(payload, 'name'),
    areaHectares: readString(payload, 'area_hectares', '0'),
    areaUnit: readString(payload, 'area_unit', 'hectares'),
    status: readString(payload, 'status', 'active'),
    shapePolygon: isRecord(payload.shape_polygon) ? payload.shape_polygon : null,
    location: readNullableString(payload, 'location'),
    soilType: readNullableString(payload, 'soil_type'),
    notes: readNullableString(payload, 'notes'),
    createdAt: readString(payload, 'created_at'),
    updatedAt: readString(payload, 'updated_at'),
  };
}

function parseLotsSummary(payload: unknown): InactiveFieldWithLots['lots'] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      if (!isRecord(item)) return null;

      return {
        id: readString(item, 'id'),
        name: readString(item, 'name'),
        status: readString(item, 'status', 'inactive'),
      };
    })
    .filter((item): item is InactiveFieldWithLots['lots'][number] => Boolean(item));
}

function parseInactiveFieldWithLots(payload: unknown): InactiveFieldWithLots | null {
  if (!isRecord(payload)) return null;

  const summary = parseFieldSummary(payload);
  if (!summary) return null;

  return {
    ...summary,
    lots: parseLotsSummary(payload.lots),
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
    throw new Error('Fields API returned an empty mutation payload.');
  }

  return rows[0];
}

function normalizeFieldRequest(input: CreateFieldRequest | UpdateFieldRequest): UnknownRecord {
  const record = isRecord(input) ? input : {};
  const normalized: UnknownRecord = {};

  if ('name' in record) normalized.name = readString(record, 'name');
  if ('area_hectares' in record) normalized.area_hectares = readString(record, 'area_hectares');
  if ('area_unit' in record) normalized.area_unit = readString(record, 'area_unit', 'hectares');
  if ('shape_polygon' in record) {
    normalized.shape_polygon = isRecord(record.shape_polygon) ? record.shape_polygon : null;
  }
  if ('location' in record) normalized.location = record.location ?? null;
  if ('soil_type' in record) normalized.soil_type = record.soil_type ?? null;
  if ('notes' in record) normalized.notes = record.notes ?? null;
  if ('status' in record) normalized.status = readString(record, 'status', 'active');

  return normalized;
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function listFields(token: string): Promise<FieldSummary[]> {
  const { data } = await apiClient.get<unknown>('/fields', { token });
  return parseList(data, parseFieldSummary);
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function listInactiveFieldsWithLots(token: string): Promise<InactiveFieldWithLots[]> {
  const { data } = await apiClient.get<unknown>('/fields/inactive/with-lots', { token });
  return parseList(data, parseInactiveFieldWithLots);
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function getFieldById(token: string, fieldId: string): Promise<FieldSummary> {
  const { data } = await apiClient.get<unknown>(`/fields/${fieldId}`, { token });
  return parseFirst(data, parseFieldSummary);
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function createField(token: string, input: CreateFieldRequest): Promise<FieldSummary> {
  const { data } = await apiClient.post<unknown, UnknownRecord>('/fields', {
    token,
    body: normalizeFieldRequest(input),
    idempotencyKey: `fields-create-${Date.now()}`,
  });
  return parseFirst(data, parseFieldSummary);
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function updateField(
  token: string,
  fieldId: string,
  input: UpdateFieldRequest,
): Promise<FieldSummary> {
  const { data } = await apiClient.patch<unknown, UnknownRecord>(`/fields/${fieldId}`, {
    token,
    body: normalizeFieldRequest(input),
  });
  return parseFirst(data, parseFieldSummary);
}

export async function deactivateField(token: string, fieldId: string): Promise<FieldSummary> {
  return updateField(token, fieldId, { status: 'inactive' });
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function reactivateField(token: string, fieldId: string): Promise<FieldSummary> {
  const { data } = await apiClient.patch<unknown, Record<string, never>>(
    `/fields/${fieldId}/reactivate`,
    {
      token,
      body: {},
    },
  );
  return parseFirst(data, parseFieldSummary);
}

export const FIELDS_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_REQUEST_DTOS;
export const FIELDS_RESPONSE_SCHEMA_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_RESPONSE_SCHEMAS;
