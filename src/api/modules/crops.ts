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

export type CreateCropRequest =
  operations['OrderWriteController_createCrop_v1']['requestBody']['content']['application/json'];
export type UpdateCropRequest =
  operations['OrderWriteController_updateCrop_v1']['requestBody']['content']['application/json'];
export type UpdateCropStatusRequest =
  operations['OrderWriteController_updateCropStatus_v1']['requestBody']['content']['application/json'];

export type CreateProductionCycleRequest =
  operations['OrderWriteController_createProductionCycle_v1']['requestBody']['content']['application/json'];
export type CloseProductionCycleRequest =
  operations['OrderWriteController_closeProductionCycle_v1']['requestBody']['content']['application/json'];
export type UpdateProductionCycleNotesRequest =
  operations['OrderWriteController_updateProductionCycleNotes_v1']['requestBody']['content']['application/json'];

export type CreateProductionCycleOperationRequest =
  operations['OrderWriteController_createProductionCycleOperation_v1']['requestBody']['content']['application/json'];
export type UpdateProductionCycleOperationRequest =
  operations['OrderWriteController_updateProductionCycleOperation_v1']['requestBody']['content']['application/json'];

export type LogbookSubmitRequest =
  operations['LogbookController_submit_v1']['requestBody']['content']['application/json'];

type ProductionCyclesResponse =
  operations['OrderWriteController_listProductionCycles_v1']['responses'][200]['content']['application/json'];
type ListCropsResponse =
  operations['OrderWriteController_listCrops_v1']['responses'][200]['content']['application/json'];
type CreateProductionCycleResponse =
  operations['OrderWriteController_createProductionCycle_v1']['responses'][201]['content']['application/json'];
type GetProductionCycleByIdResponse =
  operations['OrderWriteController_getProductionCycleById_v1']['responses'][200]['content']['application/json'];
type GetProductionCycleSummaryResponse =
  operations['OrderWriteController_getProductionCycleSummary_v1']['responses'][200]['content']['application/json'];
type CloseProductionCycleResponse =
  operations['OrderWriteController_closeProductionCycle_v1']['responses'][200]['content']['application/json'];
type UpdateProductionCycleNotesResponse =
  operations['OrderWriteController_updateProductionCycleNotes_v1']['responses'][200]['content']['application/json'];

type ListProductionCycleOperationsResponse =
  operations['OrderWriteController_listProductionCycleOperations_v1']['responses'][200]['content']['application/json'];
type CreateProductionCycleOperationResponse =
  operations['OrderWriteController_createProductionCycleOperation_v1']['responses'][201]['content']['application/json'];
type UpdateProductionCycleOperationResponse =
  operations['OrderWriteController_updateProductionCycleOperation_v1']['responses'][200]['content']['application/json'];
type DeleteProductionCycleOperationResponse =
  operations['OrderWriteController_deleteProductionCycleOperation_v1']['responses'][200]['content']['application/json'];

type CreateCropResponse =
  operations['OrderWriteController_createCrop_v1']['responses'][201]['content']['application/json'];
type UpdateCropResponse =
  operations['OrderWriteController_updateCrop_v1']['responses'][200]['content']['application/json'];
type UpdateCropStatusResponse =
  operations['OrderWriteController_updateCropStatus_v1']['responses'][200]['content']['application/json'];

type LogbookSessionResponse =
  operations['LogbookController_getSession_v1']['responses'][200]['content']['application/json'];
type LogbookPracticeCatalogResponse =
  operations['LogbookController_getPracticeCatalog_v1']['responses'][200]['content']['application/json'];
type LogbookSubmitResponse =
  operations['LogbookController_submit_v1']['responses'][201]['content']['application/json'];

export type LogbookSessionQuery = operations['LogbookController_getSession_v1']['parameters']['query'];
export type LogbookPracticeCatalogQuery =
  operations['LogbookController_getPracticeCatalog_v1']['parameters']['query'];

export type CropSummary = {
  id: string;
  name: string;
  variety: string | null;
  status: string;
  notes: string | null;
  fieldId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductionCycleSummary = {
  id: string;
  fieldId: string;
  fieldName: string | null;
  lotId: string;
  lotName: string | null;
  cropId: string;
  cropName: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductionCycleOperationSummary = {
  id: string;
  cycleId: string;
  type: string;
  status: string;
  date: string;
  performedById: string | null;
  quantity: number | null;
  unit: string | null;
  cost: number;
  notes: string | null;
  practiceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LogbookFieldOption = {
  id: string;
  name: string;
  status: string | null;
};

export type LogbookCategoryFamily = {
  key: string;
  label: string;
};

export type LogbookCategoryOption = {
  key: string;
  label: string;
  entityType: string;
  families: LogbookCategoryFamily[];
};

export type LogbookEntityOption = {
  id: string;
  name: string;
  type: string;
  fieldId: string | null;
};

export type LogbookSessionSnapshot = {
  date: string | null;
  selectedFieldId: string | null;
  fields: LogbookFieldOption[];
  categories: LogbookCategoryOption[];
  entitiesByCategory: Record<string, LogbookEntityOption[]>;
};

export type LogbookPracticeOption = {
  id: string;
  code: string;
  label: string;
  family: string;
  description: string | null;
};

export type LogbookPracticeCatalog = {
  fieldId: string;
  date: string | null;
  practicesByFamily: Record<string, LogbookPracticeOption[]>;
  totalPractices: number;
};

export type LogbookSubmitResult = {
  status: string;
  recordId: string | null;
  category: string | null;
  family: string | null;
  entityId: string | null;
  requiresFollowup: boolean;
};

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

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

function unwrapCycleRow(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;

  if (isRecord(payload.cycle)) return payload.cycle;
  return payload;
}

function parseCropSummary(payload: unknown): CropSummary | null {
  if (!isRecord(payload)) return null;
  const row = isRecord(payload.crop) ? payload.crop : payload;
  if (!isRecord(row)) return null;

  const id = readString(row, 'id');
  if (!id) return null;

  return {
    id,
    name: readFirstString(row, ['crop_name', 'name'], 'Unnamed crop'),
    variety: readFirstNullableString(row, ['crop_variety', 'variety']),
    status: readFirstString(row, ['status'], 'unknown'),
    notes: readFirstNullableString(row, ['notes']),
    fieldId: readFirstNullableString(row, ['field_id']),
    createdAt: readFirstString(row, ['created_at', 'createdAt']),
    updatedAt: readFirstString(row, ['updated_at', 'updatedAt']),
  };
}

function parseProductionCycleSummary(payload: unknown): ProductionCycleSummary | null {
  const row = unwrapCycleRow(payload);
  if (!isRecord(row)) return null;

  const id = readString(row, 'id');
  if (!id) return null;

  const field = isRecord(row.field) ? row.field : null;
  const lot = isRecord(row.lot) ? row.lot : null;
  const crop = isRecord(row.crop) ? row.crop : null;

  return {
    id,
    fieldId: readString(row, 'field_id'),
    fieldName: field ? readNullableString(field, 'name') : null,
    lotId: readString(row, 'lot_id'),
    lotName: lot ? readNullableString(lot, 'name') : null,
    cropId: readString(row, 'crop_id'),
    cropName: crop
      ? readNullableString(crop, 'name')
      : readFirstNullableString(row, ['crop_name', 'name']),
    status: readFirstString(row, ['status'], 'unknown'),
    startDate: readFirstString(row, ['start_date', 'startDate']),
    endDate: readFirstNullableString(row, ['end_date']),
    notes: readFirstNullableString(row, ['notes']),
    estimatedCost: readNumber(row.estimated_cost),
    actualCost: readNumber(row.actual_cost),
    createdAt: readFirstString(row, ['created_at', 'createdAt']),
    updatedAt: readFirstString(row, ['updated_at', 'updatedAt']),
  };
}

function parseProductionCycleOperation(payload: unknown): ProductionCycleOperationSummary | null {
  if (!isRecord(payload)) return null;
  const row = isRecord(payload.operation) ? payload.operation : payload;
  if (!isRecord(row)) return null;

  const id = readString(row, 'id');
  if (!id) return null;

  return {
    id,
    cycleId: readString(row, 'cycle_id'),
    type: readFirstString(row, ['type'], 'UNKNOWN'),
    status: readFirstString(row, ['status'], 'draft'),
    date: readFirstString(row, ['date']),
    performedById: readFirstNullableString(row, ['performed_by_id']),
    quantity: readNumber(row.quantity),
    unit: readFirstNullableString(row, ['unit']),
    cost: readNumber(row.cost) ?? 0,
    notes: readFirstNullableString(row, ['notes']),
    practiceId: readFirstNullableString(row, ['practice_id']),
    createdAt: readFirstString(row, ['created_at', 'createdAt']),
    updatedAt: readFirstString(row, ['updated_at', 'updatedAt']),
  };
}

function parseLogbookField(payload: unknown): LogbookFieldOption | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name', 'Field'),
    status: readNullableString(payload, 'status'),
  };
}

function parseLogbookCategoryFamily(payload: unknown): LogbookCategoryFamily | null {
  if (!isRecord(payload)) return null;
  const key = readFirstString(payload, ['key']);
  if (!key) return null;

  return {
    key,
    label: readFirstString(payload, ['label'], key),
  };
}

function parseLogbookCategory(payload: unknown): LogbookCategoryOption | null {
  if (!isRecord(payload)) return null;
  const key = readFirstString(payload, ['key']);
  if (!key) return null;

  const familyRows = readArray(payload, 'families')
    .map((family) => parseLogbookCategoryFamily(family))
    .filter((family): family is LogbookCategoryFamily => Boolean(family));

  return {
    key,
    label: readFirstString(payload, ['label'], key),
    entityType: readFirstString(payload, ['entityType'], 'UNKNOWN'),
    families: familyRows,
  };
}

function parseLogbookEntity(payload: unknown): LogbookEntityOption | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    name: readString(payload, 'name', 'Entity'),
    type: readString(payload, 'type', 'UNKNOWN'),
    fieldId: readNullableString(payload, 'fieldId'),
  };
}

function parseLogbookSession(payload: unknown): LogbookSessionSnapshot {
  if (!isRecord(payload)) {
    return {
      date: null,
      selectedFieldId: null,
      fields: [],
      categories: [],
      entitiesByCategory: {},
    };
  }

  const fields = readArray(payload, 'fields')
    .map((item) => parseLogbookField(item))
    .filter((item): item is LogbookFieldOption => Boolean(item));

  const categories = readArray(payload, 'categories')
    .map((item) => parseLogbookCategory(item))
    .filter((item): item is LogbookCategoryOption => Boolean(item));

  const entitiesByCategory: Record<string, LogbookEntityOption[]> = {};
  const categoryMap = isRecord(payload.entitiesByCategory) ? payload.entitiesByCategory : {};

  for (const [categoryKey, rows] of Object.entries(categoryMap)) {
    const parsedRows = (Array.isArray(rows) ? rows : [])
      .map((row) => parseLogbookEntity(row))
      .filter((row): row is LogbookEntityOption => Boolean(row));

    entitiesByCategory[categoryKey] = parsedRows;
  }

  return {
    date: readNullableString(payload, 'date'),
    selectedFieldId: readNullableString(payload, 'selectedFieldId'),
    fields,
    categories,
    entitiesByCategory,
  };
}

function parsePracticeOption(payload: unknown, family: string): LogbookPracticeOption | null {
  if (!isRecord(payload)) return null;
  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    code: readString(payload, 'code'),
    label: readString(payload, 'label', 'Practice'),
    family,
    description: readNullableString(payload, 'description'),
  };
}

function parsePracticeCatalog(payload: unknown): LogbookPracticeCatalog {
  if (!isRecord(payload)) {
    return {
      fieldId: '',
      date: null,
      practicesByFamily: {},
      totalPractices: 0,
    };
  }

  const practicesByFamily: Record<string, LogbookPracticeOption[]> = {};
  const familyMap = isRecord(payload.practicesByFamily) ? payload.practicesByFamily : {};

  for (const [family, rows] of Object.entries(familyMap)) {
    const parsedRows = (Array.isArray(rows) ? rows : [])
      .map((row) => parsePracticeOption(row, family))
      .filter((row): row is LogbookPracticeOption => Boolean(row));

    practicesByFamily[family] = parsedRows;
  }

  const totalPractices = Object.values(practicesByFamily).reduce(
    (sum, rows) => sum + rows.length,
    0,
  );

  return {
    fieldId: readString(payload, 'fieldId'),
    date: readNullableString(payload, 'date'),
    practicesByFamily,
    totalPractices,
  };
}

function parseLogbookSubmitResult(payload: unknown): LogbookSubmitResult {
  if (!isRecord(payload)) {
    return {
      status: 'unknown',
      recordId: null,
      category: null,
      family: null,
      entityId: null,
      requiresFollowup: false,
    };
  }

  return {
    status: readFirstString(payload, ['status'], 'saved'),
    recordId: readFirstNullableString(payload, ['recordId']),
    category: readFirstNullableString(payload, ['category']),
    family: readFirstNullableString(payload, ['family']),
    entityId: readFirstNullableString(payload, ['entityId']),
    requiresFollowup: readBoolean(payload, 'requires_followup'),
  };
}

function normalizeCropPayload(
  input: CreateCropRequest | UpdateCropRequest,
): CreateCropRequest | UpdateCropRequest {
  const row: UnknownRecord = isRecord(input) ? input : {};
  const payload = isRecord(row.payload) ? row.payload : {};
  return { payload };
}

export async function listProductionCycles(token: string): Promise<ProductionCycleSummary[]> {
  const { data } = await apiClient.get<ProductionCyclesResponse>('/production-cycles', { token });
  return parseList(data, parseProductionCycleSummary);
}

export async function listCrops(token: string): Promise<CropSummary[]> {
  const { data } = await apiClient.get<ListCropsResponse>('/crops', { token });
  return parseList(data, parseCropSummary);
}

export async function createProductionCycle(
  token: string,
  input: CreateProductionCycleRequest,
): Promise<ProductionCycleSummary> {
  const { data } = await apiClient.post<CreateProductionCycleResponse, CreateProductionCycleRequest>(
    '/production-cycles',
    {
      token,
      body: input,
      idempotencyKey: `production-cycles-create-${Date.now()}`,
    },
  );

  return parseFirst(data, parseProductionCycleSummary, 'Production cycle create returned an empty payload.');
}

export async function getProductionCycleById(
  token: string,
  cycleId: string,
): Promise<ProductionCycleSummary | null> {
  const { data } = await apiClient.get<GetProductionCycleByIdResponse>(`/production-cycles/${cycleId}`, {
    token,
  });
  return parseProductionCycleSummary(data);
}

export async function getProductionCycleSummary(
  token: string,
  cycleId: string,
): Promise<ProductionCycleSummary | null> {
  const { data } = await apiClient.get<GetProductionCycleSummaryResponse>(
    `/production-cycles/${cycleId}/summary`,
    {
      token,
    },
  );
  return parseProductionCycleSummary(data);
}

export async function closeProductionCycle(
  token: string,
  cycleId: string,
  input: CloseProductionCycleRequest,
): Promise<ProductionCycleSummary> {
  const { data } = await apiClient.patch<CloseProductionCycleResponse, CloseProductionCycleRequest>(
    `/production-cycles/${cycleId}/close`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseProductionCycleSummary, 'Production cycle close returned an empty payload.');
}

export async function updateProductionCycleNotes(
  token: string,
  cycleId: string,
  input: UpdateProductionCycleNotesRequest,
): Promise<ProductionCycleSummary> {
  const { data } = await apiClient.patch<
    UpdateProductionCycleNotesResponse,
    UpdateProductionCycleNotesRequest
  >(`/production-cycles/${cycleId}/notes`, {
    token,
    body: input,
  });

  return parseFirst(
    data,
    parseProductionCycleSummary,
    'Production cycle notes update returned an empty payload.',
  );
}

export async function listProductionCycleOperations(
  token: string,
  cycleId: string,
): Promise<ProductionCycleOperationSummary[]> {
  const { data } = await apiClient.get<ListProductionCycleOperationsResponse>(
    `/production-cycles/${cycleId}/operations`,
    {
      token,
    },
  );

  return parseList(data, parseProductionCycleOperation);
}

export async function createProductionCycleOperation(
  token: string,
  cycleId: string,
  input: CreateProductionCycleOperationRequest,
): Promise<ProductionCycleOperationSummary> {
  const { data } = await apiClient.post<
    CreateProductionCycleOperationResponse,
    CreateProductionCycleOperationRequest
  >(`/production-cycles/${cycleId}/operations`, {
    token,
    body: input,
    idempotencyKey: `production-cycle-operations-create-${cycleId}-${Date.now()}`,
  });

  return parseFirst(
    data,
    parseProductionCycleOperation,
    'Production cycle operation create returned an empty payload.',
  );
}

export async function updateProductionCycleOperation(
  token: string,
  operationId: string,
  input: UpdateProductionCycleOperationRequest,
): Promise<ProductionCycleOperationSummary> {
  const { data } = await apiClient.patch<
    UpdateProductionCycleOperationResponse,
    UpdateProductionCycleOperationRequest
  >(`/production-cycles/operations/${operationId}`, {
    token,
    body: input,
  });

  return parseFirst(
    data,
    parseProductionCycleOperation,
    'Production cycle operation update returned an empty payload.',
  );
}

export async function deleteProductionCycleOperation(
  token: string,
  operationId: string,
): Promise<boolean> {
  const { data } = await apiClient.delete<DeleteProductionCycleOperationResponse>(
    `/production-cycles/operations/${operationId}`,
    {
      token,
    },
  );

  return isRecord(data) ? readBoolean(data, 'deleted') : false;
}

export async function createCrop(token: string, input: CreateCropRequest): Promise<CropSummary> {
  const { data } = await apiClient.post<CreateCropResponse, CreateCropRequest>('/crops', {
    token,
    body: normalizeCropPayload(input),
    idempotencyKey: `crops-create-${Date.now()}`,
  });

  return parseFirst(data, parseCropSummary, 'Crop create returned an empty payload.');
}

export async function updateCrop(
  token: string,
  cropId: string,
  input: UpdateCropRequest,
): Promise<CropSummary> {
  const { data } = await apiClient.patch<UpdateCropResponse, UpdateCropRequest>(`/crops/${cropId}`, {
    token,
    body: normalizeCropPayload(input),
  });

  return parseFirst(data, parseCropSummary, 'Crop update returned an empty payload.');
}

export async function updateCropStatus(
  token: string,
  cropId: string,
  input: UpdateCropStatusRequest,
): Promise<CropSummary> {
  const { data } = await apiClient.patch<UpdateCropStatusResponse, UpdateCropStatusRequest>(
    `/crops/${cropId}/status`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseCropSummary, 'Crop status update returned an empty payload.');
}

export async function getLogbookSession(
  token: string,
  query?: LogbookSessionQuery,
): Promise<LogbookSessionSnapshot> {
  const search = new URLSearchParams();
  if (query?.fieldId) search.set('fieldId', query.fieldId);
  if (query?.date) search.set('date', query.date);

  const path = search.size > 0 ? `/logbook/session?${search.toString()}` : '/logbook/session';
  const { data } = await apiClient.get<LogbookSessionResponse>(path, { token });
  return parseLogbookSession(data);
}

export async function getLogbookPracticeCatalog(
  token: string,
  query: LogbookPracticeCatalogQuery,
): Promise<LogbookPracticeCatalog> {
  const search = new URLSearchParams();
  search.set('fieldId', query.fieldId);
  if (query.date) search.set('date', query.date);

  const { data } = await apiClient.get<LogbookPracticeCatalogResponse>(
    `/logbook/practices/catalog?${search.toString()}`,
    { token },
  );

  return parsePracticeCatalog(data);
}

export async function submitLogbook(
  token: string,
  input: LogbookSubmitRequest,
): Promise<LogbookSubmitResult> {
  const { data } = await apiClient.post<LogbookSubmitResponse, LogbookSubmitRequest>('/logbook/submit', {
    token,
    body: input,
    idempotencyKey: `logbook-submit-${Date.now()}`,
  });

  return parseLogbookSubmitResult(data);
}
