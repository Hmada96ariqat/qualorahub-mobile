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

export type FieldStatus = 'active' | 'fallow' | 'maintenance' | 'inactive' | string;
export type FieldStatusFilter = 'active' | 'inactive' | 'fallow' | 'maintenance' | 'all';

export type ManualFieldBoundaryPayload = {
  manual: true;
  area: number;
  unit: 'hectares' | 'acres' | 'manzana';
};

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
  soilTypeCategory: string | null;
  soilTypeOther: string | null;
  irrigationType: string | null;
  irrigationTypeOther: string | null;
  soilConditions: string | null;
  activeCycleSummary: UnknownRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type FieldDetail = FieldSummary & {
  lots: Array<{
    id: string;
    name: string;
    status: FieldStatus;
    shapePolygon: UnknownRecord | null;
  }>;
  housingUnitBoundaries: Array<{
    id: string;
    name: string;
    shapePolygon: UnknownRecord | null;
  }>;
};

export type InactiveFieldWithLots = FieldSummary & {
  lots: Array<{
    id: string;
    name: string;
    status: FieldStatus;
    shapePolygon: UnknownRecord | null;
  }>;
};

export type CreateFieldFallbackRequest = {
  name: string;
  area_hectares: string | number;
  area_unit?: string;
  location?: string | null;
  soil_type?: string | null;
  status?: FieldStatus;
  notes?: string | null;
  soil_type_category?: string | null;
  soil_type_other?: string | null;
  irrigation_type?: string | null;
  irrigation_type_other?: string | null;
  soil_conditions?: string | null;
  shape_polygon?: UnknownRecord | ManualFieldBoundaryPayload | null;
};

export type UpdateFieldFallbackRequest = Partial<CreateFieldFallbackRequest>;

// TODO(openapi-blocker: QH-OAPI-003): Remove fallback union when CreateFieldDto is fully typed in OpenAPI.
export type CreateFieldRequest = CreateFieldRequestContract | CreateFieldFallbackRequest;

// TODO(openapi-blocker: QH-OAPI-003): Remove fallback union when UpdateFieldDto is fully typed in OpenAPI.
export type UpdateFieldRequest = UpdateFieldRequestContract | UpdateFieldFallbackRequest;

function readShapePolygon(record: UnknownRecord, key: string): UnknownRecord | null {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function parseFieldSummary(payload: unknown): FieldSummary | null {
  if (!isRecord(payload)) return null;

  return {
    id: readString(payload, 'id'),
    name: readString(payload, 'name'),
    areaHectares: readString(payload, 'area_hectares', '0'),
    areaUnit: readString(payload, 'area_unit', 'hectares'),
    status: readString(payload, 'status', 'active'),
    shapePolygon: readShapePolygon(payload, 'shape_polygon'),
    location: readNullableString(payload, 'location'),
    soilType: readNullableString(payload, 'soil_type'),
    notes: readNullableString(payload, 'notes'),
    soilTypeCategory: readNullableString(payload, 'soil_type_category'),
    soilTypeOther: readNullableString(payload, 'soil_type_other'),
    irrigationType: readNullableString(payload, 'irrigation_type'),
    irrigationTypeOther: readNullableString(payload, 'irrigation_type_other'),
    soilConditions: readNullableString(payload, 'soil_conditions'),
    activeCycleSummary: readShapePolygon(payload, 'active_cycle_summary'),
    createdAt: readString(payload, 'created_at'),
    updatedAt: readString(payload, 'updated_at'),
  };
}

function parseFieldLots(payload: unknown): FieldDetail['lots'] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      if (!isRecord(item)) return null;

      return {
        id: readString(item, 'id'),
        name: readString(item, 'name'),
        status: readString(item, 'status', 'inactive'),
        shapePolygon: readShapePolygon(item, 'shape_polygon'),
      };
    })
    .filter((item): item is FieldDetail['lots'][number] => Boolean(item));
}

function parseHousingBoundaries(payload: unknown): FieldDetail['housingUnitBoundaries'] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => {
      if (!isRecord(item)) return null;

      return {
        id: readString(item, 'id'),
        name: readString(item, 'barn_name', readString(item, 'name', 'Housing unit')),
        shapePolygon: readShapePolygon(item, 'shape_polygon'),
      };
    })
    .filter((item): item is FieldDetail['housingUnitBoundaries'][number] => Boolean(item));
}

function parseFieldDetail(payload: unknown): FieldDetail | null {
  if (!isRecord(payload)) return null;

  const summary = parseFieldSummary(payload);
  if (!summary) return null;

  return {
    ...summary,
    lots: parseFieldLots(payload.lots),
    housingUnitBoundaries: parseHousingBoundaries(
      payload.housing_units ?? payload.housingUnitBoundaries,
    ),
  };
}

function parseInactiveFieldWithLots(payload: unknown): InactiveFieldWithLots | null {
  if (!isRecord(payload)) return null;

  const summary = parseFieldSummary(payload);
  if (!summary) return null;

  return {
    ...summary,
    lots: parseFieldLots(payload.lots),
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

function toQueryString(options: { status?: FieldStatusFilter }): string {
  const search = new URLSearchParams();
  if (options.status && options.status !== 'all') {
    search.set('status', options.status);
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

function normalizeFieldRequest(input: CreateFieldRequest | UpdateFieldRequest): UnknownRecord {
  const record = isRecord(input) ? input : {};
  const normalized: UnknownRecord = {};

  if ('name' in record) normalized.name = readString(record, 'name');
  if ('area_hectares' in record) {
    const value = record.area_hectares;
    normalized.area_hectares = typeof value === 'number' ? value : Number(readString(record, 'area_hectares', '0'));
  }
  if ('area_unit' in record) normalized.area_unit = readString(record, 'area_unit', 'hectares');
  if ('location' in record) normalized.location = record.location ?? null;
  if ('soil_type' in record) normalized.soil_type = record.soil_type ?? null;
  if ('status' in record) normalized.status = readString(record, 'status', 'active');
  if ('notes' in record) normalized.notes = record.notes ?? null;
  if ('soil_type_category' in record) normalized.soil_type_category = record.soil_type_category ?? null;
  if ('soil_type_other' in record) normalized.soil_type_other = record.soil_type_other ?? null;
  if ('irrigation_type' in record) normalized.irrigation_type = record.irrigation_type ?? null;
  if ('irrigation_type_other' in record) normalized.irrigation_type_other = record.irrigation_type_other ?? null;
  if ('soil_conditions' in record) normalized.soil_conditions = record.soil_conditions ?? null;

  if ('shape_polygon' in record) {
    const shape = record.shape_polygon;
    normalized.shape_polygon = isRecord(shape) ? shape : null;
  }

  return normalized;
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function listFields(
  token: string,
  options: { status?: FieldStatusFilter } = {},
): Promise<FieldSummary[]> {
  const { data } = await apiClient.get<unknown>(`/fields${toQueryString(options)}`, { token });
  return parseList(data, parseFieldSummary);
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function listInactiveFieldsWithLots(token: string): Promise<InactiveFieldWithLots[]> {
  const { data } = await apiClient.get<unknown>('/fields/inactive/with-lots', { token });
  return parseList(data, parseInactiveFieldWithLots);
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function getFieldById(token: string, fieldId: string): Promise<FieldDetail> {
  const { data } = await apiClient.get<unknown>(`/fields/${fieldId}`, { token });
  return parseFirst(data, parseFieldDetail);
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

export async function setFieldStatus(
  token: string,
  fieldId: string,
  status: Exclude<FieldStatusFilter, 'all'>,
): Promise<FieldSummary> {
  return updateField(token, fieldId, { status });
}

export async function deactivateField(token: string, fieldId: string): Promise<FieldSummary> {
  return setFieldStatus(token, fieldId, 'inactive');
}

export async function reactivateFieldMain(token: string, fieldId: string): Promise<FieldSummary> {
  return setFieldStatus(token, fieldId, 'active');
}

// TODO(openapi-blocker: QH-OAPI-004): Replace unknown payload parsing once field responses are typed.
export async function reactivateFieldFromDeactivated(
  token: string,
  fieldId: string,
): Promise<FieldSummary> {
  const { data } = await apiClient.patch<unknown, Record<string, never>>(
    `/fields/${fieldId}/reactivate`,
    {
      token,
      body: {},
    },
  );
  return parseFirst(data, parseFieldSummary);
}

// Backward-compatible alias for existing module/tests.
export const reactivateField = reactivateFieldFromDeactivated;

export const FIELDS_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_REQUEST_DTOS;
export const FIELDS_RESPONSE_SCHEMA_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_RESPONSE_SCHEMAS;
