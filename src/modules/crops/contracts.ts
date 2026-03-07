import type {
  CropSummary,
  ProductionCycleOperationSummary,
  ProductionCycleSummary,
} from '../../api/modules/crops';

export const CROP_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

export type CropStatusValue = (typeof CROP_STATUS_OPTIONS)[number]['value'];

export type CropFormMode = 'create' | 'edit';

export type CropFormValues = {
  cropName: string;
  cropVariety: string;
  cropGroupId: string;
  notes: string;
};

export const CROP_LIST_MODE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Operational', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

export type CropListMode = (typeof CROP_LIST_MODE_OPTIONS)[number]['value'];

export type CycleFormValues = {
  fieldId: string;
  lotId: string;
  cropId: string;
  startDate: string;
  notes: string;
};

export type CycleCloseFormValues = {
  endDate: string;
  notes: string;
};

export const CYCLE_LIST_MODE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
  { label: 'Inactive', value: 'inactive' },
] as const;

export type CycleListMode = (typeof CYCLE_LIST_MODE_OPTIONS)[number]['value'];

export const OPERATION_TYPE_OPTIONS = [
  { label: 'Land Prep', value: 'LAND_PREP' },
  { label: 'Planting', value: 'PLANTING' },
] as const;

export type OperationTypeValue = (typeof OPERATION_TYPE_OPTIONS)[number]['value'];

export type OperationFormMode = 'create' | 'edit';

export type OperationFormValues = {
  date: string;
  type: OperationTypeValue;
  cost: string;
  notes: string;
};

export const LOGBOOK_CATEGORY_OPTIONS = [
  { label: 'Crop Operation', value: 'CROP_OPERATION' },
  { label: 'Equipment Usage', value: 'EQUIPMENT_USAGE' },
  { label: 'Equipment Maintenance', value: 'EQUIPMENT_MAINTENANCE' },
  { label: 'Animal Feed / Water', value: 'ANIMAL_FEED_WATER' },
  { label: 'Animal House Maintenance', value: 'ANIMAL_HOUSE_MAINTENANCE' },
  { label: 'Animal Yield', value: 'ANIMAL_YIELD' },
  { label: 'Lot Maintenance', value: 'LOT_MAINTENANCE' },
] as const;

export type LogbookCategoryValue = (typeof LOGBOOK_CATEGORY_OPTIONS)[number]['value'];

export const LOGBOOK_ENTITY_TYPE_OPTIONS = [
  { label: 'Crop', value: 'CROP' },
  { label: 'Equipment', value: 'EQUIPMENT' },
  { label: 'Housing Unit', value: 'HOUSING_UNIT' },
  { label: 'Animal', value: 'ANIMAL' },
  { label: 'Lot', value: 'LOT' },
] as const;

export type LogbookEntityTypeValue = (typeof LOGBOOK_ENTITY_TYPE_OPTIONS)[number]['value'];

export const LOGBOOK_FAMILY_OPTIONS = [
  { label: 'Land Prep', value: 'LAND_PREP' },
  { label: 'Planting', value: 'PLANTING' },
  { label: 'Irrigation', value: 'IRRIGATION' },
  { label: 'Nutrient', value: 'NUTRIENT' },
  { label: 'Treatment', value: 'TREATMENT' },
  { label: 'Weed Management', value: 'WEED_MGMT' },
  { label: 'Cultural', value: 'CULTURAL' },
  { label: 'Harvest', value: 'HARVEST' },
] as const;

export type LogbookFamilyValue = (typeof LOGBOOK_FAMILY_OPTIONS)[number]['value'];

export type LogbookFormValues = {
  fieldId: string;
  date: string;
  category: LogbookCategoryValue;
  entityType: LogbookEntityTypeValue;
  entityId: string;
  family: string;
  practiceId: string;
  payloadText: string;
};

export function toCropFormValues(crop?: CropSummary | null): CropFormValues {
  if (!crop) {
    return {
      cropName: '',
      cropVariety: '',
      cropGroupId: '',
      notes: '',
    };
  }

  return {
    cropName: crop.name,
    cropVariety: crop.variety ?? '',
    cropGroupId: crop.cropGroupId ?? '',
    notes: crop.notes ?? '',
  };
}

export function toCycleFormValues(cycle?: ProductionCycleSummary | null): CycleFormValues {
  if (!cycle) {
    return {
      fieldId: '',
      lotId: '',
      cropId: '',
      startDate: new Date().toISOString().slice(0, 10),
      notes: '',
    };
  }

  return {
    fieldId: cycle.fieldId,
    lotId: cycle.lotId,
    cropId: cycle.cropId,
    startDate: cycle.startDate.slice(0, 10),
    notes: cycle.notes ?? '',
  };
}

export function toCycleCloseFormValues(cycle?: ProductionCycleSummary | null): CycleCloseFormValues {
  if (!cycle) {
    return {
      endDate: new Date().toISOString().slice(0, 10),
      notes: '',
    };
  }

  return {
    endDate: cycle.endDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    notes: cycle.notes ?? '',
  };
}

export function toOperationFormValues(
  operation?: ProductionCycleOperationSummary | null,
): OperationFormValues {
  if (!operation) {
    return {
      date: new Date().toISOString().slice(0, 10),
      type: 'LAND_PREP',
      cost: '0',
      notes: '',
    };
  }

  const normalizedType =
    operation.type === 'PLANTING' || operation.type === 'LAND_PREP' ? operation.type : 'LAND_PREP';

  return {
    date: operation.date.slice(0, 10),
    type: normalizedType,
    cost: String(operation.cost),
    notes: operation.notes ?? '',
  };
}

export function toLogbookFormValues(fieldId?: string | null): LogbookFormValues {
  return {
    fieldId: fieldId ?? '',
    date: new Date().toISOString().slice(0, 10),
    category: 'CROP_OPERATION',
    entityType: 'CROP',
    entityId: '',
    family: 'LAND_PREP',
    practiceId: '',
    payloadText: '{\n  "notes": ""\n}',
  };
}

export function normalizeCycleListMode(status: string): CycleListMode {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'active') return 'active';
  if (normalized === 'closed') return 'closed';
  if (normalized === 'inactive') return 'inactive';
  return 'all';
}
