import { ApiError, apiClient } from '../client';
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

export type ReplaceCropPracticeMappingsRequest = {
  practiceIds: string[];
};

export type HarvestWorkerRequest = {
  workerId: string;
  workerName: string;
  quantity: number;
  unit: string;
  cost?: number;
};

export type CreateHarvestOperationRequest = {
  harvestDate: string;
  workers: HarvestWorkerRequest[];
  totalHarvestedQuantity?: number | null;
  totalHarvestedUnit?: string | null;
  notes?: string | null;
  attachments?: unknown[] | null;
  practiceId?: string | null;
};

export type UpdateHarvestOperationRequest = Partial<CreateHarvestOperationRequest>;

export type TreatmentOperationProductRequest = {
  productId: string;
  qty: number;
  unit: string;
  warehouseId: string;
  batchNumber?: string | null;
  unitCost: number;
  estimatedCost: number;
  recommendedDoseText?: string | null;
  recommendedDoseUnit?: string | null;
  doseUsedText?: string | null;
  doseOverridden?: boolean;
  activeIngredientConcentrationPercent?: string | null;
  phiDays?: number | null;
  restrictedUntilDate?: string | null;
};

export type CreateTreatmentOperationRequest = {
  treatment_date: string;
  treatment_type: string;
  application_method?: string | null;
  treatment_location?: string | null;
  retreat_date?: string | null;
  keywords?: string[] | null;
  description?: string | null;
  notes?: string | null;
  products: TreatmentOperationProductRequest[];
  attachments?: unknown[] | null;
  practiceId?: string | null;
};

export type UpdateTreatmentOperationRequest = Partial<CreateTreatmentOperationRequest>;

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
type ListHarvestOperationsResponse =
  operations['OrderWriteController_listHarvestOperations_v1']['responses'][200]['content']['application/json'];
type CreateHarvestOperationResponse =
  operations['OrderWriteController_createHarvestOperation_v1']['responses'][201]['content']['application/json'];
type UpdateHarvestOperationResponse =
  operations['OrderWriteController_updateHarvestOperation_v1']['responses'][200] extends {
    content: { 'application/json': infer TPayload };
  }
    ? TPayload
    : unknown;
type ListTreatmentOperationsResponse =
  operations['OrderWriteController_listTreatmentOperations_v1']['responses'][200]['content']['application/json'];
type CreateTreatmentOperationResponse =
  operations['OrderWriteController_createTreatmentOperation_v1']['responses'][201]['content']['application/json'];
type UpdateTreatmentOperationResponse =
  operations['OrderWriteController_updateTreatmentOperation_v1']['responses'][200] extends {
    content: { 'application/json': infer TPayload };
  }
    ? TPayload
    : unknown;

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
  cropGroupId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CropGroupSummary = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type CropPracticeMapping = {
  id: string;
  code: string;
  label: string;
  domainArea: string;
  operationFamily: string;
  description: string | null;
  isActive: boolean;
  enabled: boolean;
  relevance: string | null;
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
  meta?: Record<string, unknown>;
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
  practicesByCrop: Record<string, Record<string, LogbookPracticeOption[]>>;
  totalPractices: number;
};

export type LogbookSubmitWarning = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type LogbookSubmitResult = {
  status: string;
  recordId: string | null;
  category: string | null;
  family: string | null;
  entityId: string | null;
  requiresFollowup: boolean;
  warning?: LogbookSubmitWarning;
};

export type HarvestWorkerSummary = {
  workerId: string;
  workerName: string;
  quantity: number;
  unit: string;
  cost: number | null;
};

export type HarvestOperationSummary = {
  id: string;
  cycleId: string | null;
  harvestDate: string;
  workers: HarvestWorkerSummary[];
  totalHarvestedQuantity: number | null;
  totalHarvestedUnit: string | null;
  notes: string | null;
  attachments: unknown[];
  practiceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TreatmentProductSummary = {
  productId: string;
  qty: number;
  unit: string;
  warehouseId: string;
  batchNumber: string | null;
  unitCost: number;
  estimatedCost: number;
  recommendedDoseText: string | null;
  recommendedDoseUnit: string | null;
  doseUsedText: string | null;
  doseOverridden: boolean;
  activeIngredientConcentrationPercent: string | null;
  phiDays: number | null;
  restrictedUntilDate: string | null;
};

export type TreatmentOperationSummary = {
  id: string;
  cycleId: string | null;
  status: string;
  treatmentDate: string;
  treatmentType: string;
  applicationMethod: string | null;
  treatmentLocation: string | null;
  retreatDate: string | null;
  keywords: string[];
  description: string | null;
  notes: string | null;
  products: TreatmentProductSummary[];
  attachments: unknown[];
  practiceId: string | null;
  createdAt: string;
  updatedAt: string;
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
    cropGroupId: readFirstNullableString(row, ['crop_group_id']),
    createdAt: readFirstString(row, ['created_at', 'createdAt']),
    updatedAt: readFirstString(row, ['updated_at', 'updatedAt']),
  };
}

function parseCropGroupSummary(payload: unknown): CropGroupSummary | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    code: readString(payload, 'code'),
    name: readFirstString(payload, ['name'], 'Crop group'),
    description: readNullableString(payload, 'description'),
  };
}

function parseCropPracticeMapping(payload: unknown): CropPracticeMapping | null {
  if (!isRecord(payload)) return null;

  const id = readString(payload, 'id');
  if (!id) return null;

  return {
    id,
    code: readString(payload, 'code'),
    label: readFirstString(payload, ['label'], 'Operation'),
    domainArea: readFirstString(payload, ['domain_area'], 'OTHER'),
    operationFamily: readFirstString(payload, ['operation_family'], 'OTHER'),
    description: readNullableString(payload, 'description'),
    isActive: readBoolean(payload, 'is_active', true),
    enabled: readBoolean(payload, 'enabled'),
    relevance: readNullableString(payload, 'relevance'),
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
    meta: isRecord(payload.meta) ? payload.meta : undefined,
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
      practicesByCrop: {},
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

  const practicesByCrop: Record<string, Record<string, LogbookPracticeOption[]>> = {};
  const cropMap = isRecord(payload.practicesByCrop) ? payload.practicesByCrop : {};

  for (const [cropId, familyValue] of Object.entries(cropMap)) {
    if (!isRecord(familyValue)) {
      continue;
    }

    const cropFamilies: Record<string, LogbookPracticeOption[]> = {};
    for (const [family, rows] of Object.entries(familyValue)) {
      const parsedRows = (Array.isArray(rows) ? rows : [])
        .map((row) => parsePracticeOption(row, family))
        .filter((row): row is LogbookPracticeOption => Boolean(row));

      cropFamilies[family] = parsedRows;
    }

    practicesByCrop[cropId] = cropFamilies;
  }

  const totalPractices = Object.values(practicesByFamily).reduce(
    (sum, rows) => sum + rows.length,
    0,
  );

  return {
    fieldId: readString(payload, 'fieldId'),
    date: readNullableString(payload, 'date'),
    practicesByFamily,
    practicesByCrop,
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
    requiresFollowup: readBoolean(payload, 'requires_followup') || readBoolean(payload, 'requiresFollowup'),
    warning:
      isRecord(payload.warning) &&
      typeof payload.warning.code === 'string' &&
      typeof payload.warning.message === 'string'
        ? {
            code: payload.warning.code,
            message: payload.warning.message,
            details: isRecord(payload.warning.details) ? payload.warning.details : undefined,
          }
        : undefined,
  };
}

function parseHarvestWorker(payload: unknown): HarvestWorkerSummary | null {
  if (!isRecord(payload)) return null;
  const workerId = readString(payload, 'workerId');
  if (!workerId) return null;

  return {
    workerId,
    workerName: readString(payload, 'workerName', 'Worker'),
    quantity: readNumber(payload.quantity) ?? 0,
    unit: readString(payload, 'unit', 'kg'),
    cost: readNumber(payload.cost),
  };
}

function parseHarvestOperation(payload: unknown): HarvestOperationSummary | null {
  if (!isRecord(payload)) return null;
  const row = isRecord(payload.harvestOperation) ? payload.harvestOperation : payload;
  if (!isRecord(row)) return null;

  const id = readString(row, 'id');
  if (!id) return null;

  return {
    id,
    cycleId: readFirstNullableString(row, ['cycle_id', 'production_cycle_id']),
    harvestDate: readFirstString(row, ['harvest_date', 'harvestDate']),
    workers: readArray(row, 'workers')
      .map((entry) => parseHarvestWorker(entry))
      .filter((entry): entry is HarvestWorkerSummary => Boolean(entry)),
    totalHarvestedQuantity: readNumber(row.total_harvested_quantity ?? row.totalHarvestedQuantity),
    totalHarvestedUnit: readFirstNullableString(row, ['total_harvested_unit', 'totalHarvestedUnit']),
    notes: readFirstNullableString(row, ['notes']),
    attachments: readArray(row, 'attachments'),
    practiceId: readFirstNullableString(row, ['practice_id', 'practiceId']),
    createdAt: readFirstString(row, ['created_at', 'createdAt']),
    updatedAt: readFirstString(row, ['updated_at', 'updatedAt']),
  };
}

function parseTreatmentProduct(payload: unknown): TreatmentProductSummary | null {
  if (!isRecord(payload)) return null;
  const productId = readString(payload, 'productId');
  if (!productId) return null;

  return {
    productId,
    qty: readNumber(payload.qty) ?? 0,
    unit: readString(payload, 'unit'),
    warehouseId: readString(payload, 'warehouseId'),
    batchNumber: readFirstNullableString(payload, ['batchNumber', 'batch_number']),
    unitCost: readNumber(payload.unitCost) ?? 0,
    estimatedCost: readNumber(payload.estimatedCost) ?? 0,
    recommendedDoseText: readFirstNullableString(payload, ['recommendedDoseText']),
    recommendedDoseUnit: readFirstNullableString(payload, ['recommendedDoseUnit']),
    doseUsedText: readFirstNullableString(payload, ['doseUsedText']),
    doseOverridden: readBoolean(payload, 'doseOverridden'),
    activeIngredientConcentrationPercent: readFirstNullableString(payload, [
      'activeIngredientConcentrationPercent',
    ]),
    phiDays: readNumber(payload.phiDays),
    restrictedUntilDate: readFirstNullableString(payload, ['restrictedUntilDate']),
  };
}

function parseTreatmentOperation(payload: unknown): TreatmentOperationSummary | null {
  if (!isRecord(payload)) return null;
  const row = isRecord(payload.treatmentOperation) ? payload.treatmentOperation : payload;
  if (!isRecord(row)) return null;

  const id = readString(row, 'id');
  if (!id) return null;

  return {
    id,
    cycleId: readFirstNullableString(row, ['cycle_id', 'production_cycle_id']),
    status: readFirstString(row, ['status'], 'draft'),
    treatmentDate: readFirstString(row, ['treatment_date', 'treatmentDate']),
    treatmentType: readFirstString(row, ['treatment_type', 'treatmentType']),
    applicationMethod: readFirstNullableString(row, ['application_method', 'applicationMethod']),
    treatmentLocation: readFirstNullableString(row, ['treatment_location', 'treatmentLocation']),
    retreatDate: readFirstNullableString(row, ['retreat_date', 'retreatDate']),
    keywords: readArray(row, 'keywords')
      .map((entry) => String(entry ?? '').trim())
      .filter((entry) => entry.length > 0),
    description: readFirstNullableString(row, ['description']),
    notes: readFirstNullableString(row, ['notes']),
    products: readArray(row, 'products')
      .map((entry) => parseTreatmentProduct(entry))
      .filter((entry): entry is TreatmentProductSummary => Boolean(entry)),
    attachments: readArray(row, 'attachments'),
    practiceId: readFirstNullableString(row, ['practiceId', 'practice_id']),
    createdAt: readFirstString(row, ['created_at', 'createdAt']),
    updatedAt: readFirstString(row, ['updated_at', 'updatedAt']),
  };
}

async function postWithOptionalTimeout<TResponse, TBody>(
  path: string,
  args: {
    token: string;
    body: TBody;
    idempotencyKey: string;
    timeoutMs?: number;
  },
): Promise<TResponse> {
  if (!args.timeoutMs || args.timeoutMs <= 0) {
    const { data } = await apiClient.post<TResponse, TBody>(path, {
      token: args.token,
      body: args.body,
      idempotencyKey: args.idempotencyKey,
    });
    return data;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs);

  try {
    const { data } = await apiClient.post<TResponse, TBody>(path, {
      token: args.token,
      body: args.body,
      idempotencyKey: args.idempotencyKey,
      signal: controller.signal,
    });
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError({
        status: 0,
        code: 'REQUEST_TIMEOUT',
        message: 'Request timed out.',
        details: {
          reason: 'REQUEST_TIMEOUT',
        },
      });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeCropPayload(
  input: CreateCropRequest | UpdateCropRequest,
): CreateCropRequest | UpdateCropRequest {
  const row: UnknownRecord = isRecord(input) ? input : {};
  const payload = isRecord(row.payload) ? row.payload : {};
  return { payload };
}

function normalizeReplaceCropPracticeMappingsInput(
  input: ReplaceCropPracticeMappingsRequest,
): ReplaceCropPracticeMappingsRequest {
  const uniquePracticeIds = Array.from(
    new Set(
      (Array.isArray(input.practiceIds) ? input.practiceIds : [])
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0),
    ),
  );

  return {
    practiceIds: uniquePracticeIds,
  };
}

export async function listProductionCycles(token: string): Promise<ProductionCycleSummary[]> {
  const { data } = await apiClient.get<ProductionCyclesResponse>('/production-cycles', { token });
  return parseList(data, parseProductionCycleSummary);
}

export async function listCrops(token: string): Promise<CropSummary[]> {
  const { data } = await apiClient.get<ListCropsResponse>('/crops', { token });
  return parseList(data, parseCropSummary);
}

export async function listCropGroups(token: string): Promise<CropGroupSummary[]> {
  const { data } = await apiClient.get<unknown>('/operation-practices/crop-groups', { token });
  return parseList(data, parseCropGroupSummary);
}

export async function listCropPracticeMappings(
  token: string,
  cropId: string,
): Promise<CropPracticeMapping[]> {
  const { data } = await apiClient.get<unknown>(`/operation-practices/crops/${cropId}/mappings`, {
    token,
  });
  return parseList(data, parseCropPracticeMapping);
}

export async function replaceCropPracticeMappings(
  token: string,
  cropId: string,
  input: ReplaceCropPracticeMappingsRequest,
): Promise<number> {
  const { data } = await apiClient.post<unknown, ReplaceCropPracticeMappingsRequest>(
    `/operation-practices/crops/${cropId}/commands/replace-mappings`,
    {
      token,
      body: normalizeReplaceCropPracticeMappingsInput(input),
      idempotencyKey: `crop-practices-replace-${cropId}-${Date.now()}`,
    },
  );

  if (isRecord(data)) {
    const updatedRaw = readString(data, 'updated');
    const updated = updatedRaw ? Number(updatedRaw) : Number.NaN;
    if (Number.isFinite(updated)) {
      return updated;
    }
  }

  return input.practiceIds.length;
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
  options?: {
    idempotencyKey?: string;
    timeoutMs?: number;
  },
): Promise<LogbookSubmitResult> {
  const data = await postWithOptionalTimeout<LogbookSubmitResponse, LogbookSubmitRequest>(
    '/logbook/submit',
    {
      token,
      body: input,
      idempotencyKey: options?.idempotencyKey ?? `logbook-submit-${Date.now()}`,
      timeoutMs: options?.timeoutMs,
    },
  );

  return parseLogbookSubmitResult(data);
}

export async function listHarvestOperations(
  token: string,
  cycleId: string,
): Promise<HarvestOperationSummary[]> {
  const { data } = await apiClient.get<ListHarvestOperationsResponse>(
    `/production-cycles/${cycleId}/harvest-operations`,
    {
      token,
    },
  );

  return parseList(data, parseHarvestOperation);
}

export async function createHarvestOperation(
  token: string,
  cycleId: string,
  input: CreateHarvestOperationRequest,
): Promise<HarvestOperationSummary> {
  const { data } = await apiClient.post<CreateHarvestOperationResponse, CreateHarvestOperationRequest>(
    `/production-cycles/${cycleId}/harvest-operations`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseHarvestOperation, 'Harvest operation create returned an empty payload.');
}

export async function updateHarvestOperation(
  token: string,
  operationId: string,
  input: UpdateHarvestOperationRequest,
): Promise<HarvestOperationSummary> {
  const { data } = await apiClient.patch<UpdateHarvestOperationResponse, UpdateHarvestOperationRequest>(
    `/harvest-operations/${operationId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseHarvestOperation, 'Harvest operation update returned an empty payload.');
}

export async function listTreatmentOperations(
  token: string,
  cycleId: string,
): Promise<TreatmentOperationSummary[]> {
  const { data } = await apiClient.get<ListTreatmentOperationsResponse>(
    `/production-cycles/${cycleId}/treatment-operations`,
    {
      token,
    },
  );

  return parseList(data, parseTreatmentOperation);
}

export async function createTreatmentOperation(
  token: string,
  cycleId: string,
  input: CreateTreatmentOperationRequest,
): Promise<TreatmentOperationSummary> {
  const { data } = await apiClient.post<CreateTreatmentOperationResponse, CreateTreatmentOperationRequest>(
    `/production-cycles/${cycleId}/treatment-operations`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseTreatmentOperation, 'Treatment operation create returned an empty payload.');
}

export async function updateTreatmentOperation(
  token: string,
  operationId: string,
  input: UpdateTreatmentOperationRequest,
): Promise<TreatmentOperationSummary> {
  const { data } = await apiClient.patch<UpdateTreatmentOperationResponse, UpdateTreatmentOperationRequest>(
    `/treatment-operations/${operationId}`,
    {
      token,
      body: input,
    },
  );

  return parseFirst(data, parseTreatmentOperation, 'Treatment operation update returned an empty payload.');
}
