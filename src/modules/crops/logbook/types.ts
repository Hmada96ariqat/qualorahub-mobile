export type LogbookCategoryKey =
  | 'CROP_OPERATION'
  | 'EQUIPMENT_USAGE'
  | 'EQUIPMENT_MAINTENANCE'
  | 'ANIMAL_FEED_WATER'
  | 'ANIMAL_HOUSE_MAINTENANCE'
  | 'ANIMAL_YIELD'
  | 'LOT_MAINTENANCE';

export type LogbookEntityType =
  | 'CROP'
  | 'EQUIPMENT'
  | 'HOUSING_UNIT'
  | 'ANIMAL'
  | 'LOT';

export type LogbookOperationFamily =
  | 'LAND_PREP'
  | 'PLANTING'
  | 'IRRIGATION'
  | 'NUTRIENT'
  | 'TREATMENT'
  | 'WEED_MGMT'
  | 'CULTURAL'
  | 'HARVEST';

export type LogbookProductsEditorMode =
  | 'nutrient'
  | 'treatment'
  | 'inputs'
  | 'planting_inputs'
  | 'reusable_products'
  | 'parts'
  | 'products_used'
  | 'line_items';

export type ProductBindingTarget =
  | 'products'
  | 'inputs'
  | 'reusable_products'
  | 'parts'
  | 'products_used'
  | 'line_items';

export interface LogbookFormFieldOption {
  value: string;
  label: string;
}

export interface LogbookFormField {
  key: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'textarea'
    | 'select'
    | 'date'
    | 'checkbox'
    | 'products_editor';
  required?: boolean;
  placeholder?: string;
  options?: LogbookFormFieldOption[];
  editorMode?: LogbookProductsEditorMode;
  bindingTarget?: ProductBindingTarget;
}

export interface LogbookFormTemplate {
  title: string;
  description?: string;
  fields: LogbookFormField[];
}

export interface LogbookSubmitWarning {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface LogbookSubmitCommand {
  fieldId: string;
  date: string;
  category: LogbookCategoryKey;
  entityType: LogbookEntityType;
  entityId: string;
  family?: LogbookOperationFamily;
  practiceId?: string;
  payload: Record<string, unknown>;
  clientSessionId?: string;
}

export interface LogbookSubmitResult {
  status: 'saved' | 'saved_draft' | 'queued' | string;
  recordId: string | null;
  category: LogbookCategoryKey | string | null;
  family: LogbookOperationFamily | string | null;
  entityId: string | null;
  requires_followup?: boolean;
  requiresFollowup?: boolean;
  warning?: LogbookSubmitWarning;
}

export interface HarvestWorkerRow {
  workerId: string;
  workerName: string;
  quantity: number | '';
  unit: string;
  cost?: number | '';
}

export interface DynamicPracticeFieldOption {
  value: string;
  label: string;
}

export type DynamicPracticeFieldType = 'text' | 'number' | 'date' | 'textarea' | 'select';

export interface DynamicPracticeFieldDefinition {
  key: string;
  label: string;
  type: DynamicPracticeFieldType;
  placeholder?: string;
  min?: number;
  step?: string;
  options?: DynamicPracticeFieldOption[];
}

export interface LogbookDraftState {
  fieldId: string;
  date: string;
  category: LogbookCategoryKey;
  entityType: LogbookEntityType;
  entityId: string;
  family: string;
  practiceId: string;
  formData: Record<string, unknown>;
  detailValues: Record<string, string>;
  isCostManuallyOverridden: boolean;
  computedCost: number | null;
  updatedAt: string;
}
