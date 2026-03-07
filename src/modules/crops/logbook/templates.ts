import type { LogbookCategoryKey, LogbookFormTemplate, LogbookOperationFamily } from './types';
import {
  LOGBOOK_IRRIGATION_METHOD_OPTIONS,
  LOGBOOK_TREATMENT_APPLICATION_METHOD_OPTIONS,
  LOGBOOK_TREATMENT_TYPE_OPTIONS,
  LOGBOOK_WATER_SOURCE_OPTIONS,
} from './selectOptions';

const AREA_UNIT_OPTIONS = [
  { value: 'ha', label: 'ha' },
  { value: 'acre', label: 'acre' },
  { value: 'm2', label: 'm2' },
];

const HARVEST_UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 't', label: 't' },
  { value: 'lb', label: 'lb' },
];

const formTemplateKey = (
  category: LogbookCategoryKey,
  family: LogbookOperationFamily | null,
): string => `${category}:${family ?? 'NONE'}`;

const FORM_TEMPLATES: Record<string, LogbookFormTemplate> = {
  [formTemplateKey('CROP_OPERATION', 'LAND_PREP')]: {
    title: 'Land Preparation Log',
    fields: [
      { key: 'cost', label: 'Cost', type: 'number', placeholder: '0' },
      { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
      {
        key: 'unit',
        label: 'Unit',
        type: 'select',
        options: AREA_UNIT_OPTIONS,
      },
      {
        key: 'inputs',
        label: 'Products used',
        type: 'products_editor',
        editorMode: 'inputs',
        bindingTarget: 'inputs',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('CROP_OPERATION', 'PLANTING')]: {
    title: 'Planting Log',
    fields: [
      { key: 'plantingDate', label: 'Planting Date', type: 'date' },
      {
        key: 'inputs',
        label: 'Products used',
        type: 'products_editor',
        editorMode: 'planting_inputs',
        bindingTarget: 'inputs',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('CROP_OPERATION', 'IRRIGATION')]: {
    title: 'Irrigation Log',
    fields: [
      {
        key: 'method',
        label: 'Method',
        type: 'select',
        required: true,
        options: LOGBOOK_IRRIGATION_METHOD_OPTIONS,
      },
      {
        key: 'water_source',
        label: 'Water Source',
        type: 'select',
        required: true,
        options: LOGBOOK_WATER_SOURCE_OPTIONS,
      },
      { key: 'volume_value', label: 'Volume', type: 'number', required: true, placeholder: '100' },
      {
        key: 'volume_unit',
        label: 'Volume Unit',
        type: 'select',
        required: true,
        options: [
          { value: 'L', label: 'L' },
          { value: 'm3', label: 'm3' },
        ],
      },
      { key: 'duration_hours', label: 'Duration (hours)', type: 'number', placeholder: '2' },
      {
        key: 'inputs',
        label: 'Products used',
        type: 'products_editor',
        editorMode: 'inputs',
        bindingTarget: 'inputs',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('CROP_OPERATION', 'NUTRIENT')]: {
    title: 'Nutrient Application Log',
    fields: [
      { key: 'dateApplied', label: 'Date', type: 'date' },
      {
        key: 'applicationMethod',
        label: 'Application Method',
        type: 'text',
        placeholder: 'Fertigation',
      },
      {
        key: 'products',
        label: 'Products used',
        type: 'products_editor',
        editorMode: 'nutrient',
        bindingTarget: 'products',
      },
      { key: 'totalCost', label: 'Total Cost', type: 'number', placeholder: '0' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('CROP_OPERATION', 'TREATMENT')]: {
    title: 'Treatment Log',
    fields: [
      { key: 'treatment_date', label: 'Date', type: 'date', required: true },
      {
        key: 'treatment_type',
        label: 'Treatment Type',
        type: 'select',
        required: true,
        options: LOGBOOK_TREATMENT_TYPE_OPTIONS,
      },
      {
        key: 'application_method',
        label: 'Application Method',
        type: 'select',
        options: LOGBOOK_TREATMENT_APPLICATION_METHOD_OPTIONS,
      },
      { key: 'treatment_location', label: 'Location', type: 'text', placeholder: 'North block' },
      {
        key: 'products',
        label: 'Products used',
        type: 'products_editor',
        editorMode: 'treatment',
        bindingTarget: 'products',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('CROP_OPERATION', 'WEED_MGMT')]: {
    title: 'Weed Management Log',
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'cost', label: 'Cost', type: 'number', placeholder: '0' },
      {
        key: 'reusable_products',
        label: 'Products used',
        type: 'products_editor',
        editorMode: 'reusable_products',
        bindingTarget: 'reusable_products',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('CROP_OPERATION', 'CULTURAL')]: {
    title: 'Cultural Operation Log',
    fields: [
      { key: 'operationDate', label: 'Date', type: 'date' },
      { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
      {
        key: 'unit',
        label: 'Unit',
        type: 'select',
        options: AREA_UNIT_OPTIONS,
      },
      { key: 'cost', label: 'Cost', type: 'number', placeholder: '0' },
      {
        key: 'inputs',
        label: 'Products used',
        type: 'products_editor',
        editorMode: 'inputs',
        bindingTarget: 'inputs',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('CROP_OPERATION', 'HARVEST')]: {
    title: 'Harvest Log',
    fields: [
      { key: 'harvestDate', label: 'Date', type: 'date' },
      {
        key: 'totalHarvestedQuantity',
        label: 'Total Harvested Quantity',
        type: 'number',
        placeholder: '1',
      },
      {
        key: 'totalHarvestedUnit',
        label: 'Unit',
        type: 'select',
        options: HARVEST_UNIT_OPTIONS,
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('EQUIPMENT_USAGE', null)]: {
    title: 'Equipment Usage Log',
    fields: [
      { key: 'usage_purpose', label: 'Usage Purpose', type: 'text', required: true },
      { key: 'operator_id', label: 'User', type: 'text', required: true },
      { key: 'date_used', label: 'Date Used', type: 'date' },
      { key: 'total_hours_used', label: 'Total Hours Used', type: 'number', placeholder: '2' },
      { key: 'fuel_consumables_used', label: 'Fuel / Consumables Used', type: 'text' },
      { key: 'cost', label: 'Cost', type: 'number', placeholder: '0' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('EQUIPMENT_MAINTENANCE', null)]: {
    title: 'Equipment Maintenance Log',
    fields: [
      {
        key: 'service_type',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: [
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'preventive', label: 'Preventive' },
          { value: 'emergency', label: 'Emergency' },
        ],
      },
      { key: 'date_performed', label: 'Date Performed', type: 'date' },
      {
        key: 'service_description',
        label: 'Service Description',
        type: 'textarea',
        required: true,
      },
      {
        key: 'service_performed_by',
        label: 'Performed By',
        type: 'text',
        placeholder: 'user:<uuid> or contact:<uuid>',
      },
      {
        key: 'parts',
        label: 'Parts used',
        type: 'products_editor',
        editorMode: 'parts',
        bindingTarget: 'parts',
      },
      { key: 'total_cost', label: 'Total Cost', type: 'number', placeholder: '0' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('ANIMAL_FEED_WATER', null)]: {
    title: 'Animal Feed & Water Log',
    fields: [
      {
        key: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: [
          { value: 'Feed', label: 'Feed' },
          { value: 'Water', label: 'Water' },
        ],
      },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '1' },
      {
        key: 'unit',
        label: 'Unit',
        type: 'select',
        options: [
          { value: 'kg', label: 'kg' },
          { value: 'L', label: 'L' },
        ],
      },
      { key: 'expense', label: 'Expense', type: 'number', placeholder: '0' },
      { key: 'feed_type', label: 'Feed Type', type: 'text', placeholder: 'Starter feed' },
      { key: 'attach_to_finance', label: 'Attach to Finance', type: 'checkbox' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('ANIMAL_HOUSE_MAINTENANCE', null)]: {
    title: 'Animal House Maintenance Log',
    fields: [
      { key: 'date_performed', label: 'Date', type: 'date' },
      { key: 'service_type', label: 'Service Type', type: 'text', required: true },
      { key: 'service_description', label: 'Description', type: 'textarea' },
      { key: 'total_cost', label: 'Total Cost', type: 'number', placeholder: '0' },
      {
        key: 'products_used',
        label: 'Products used',
        type: 'products_editor',
        editorMode: 'products_used',
        bindingTarget: 'products_used',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('ANIMAL_YIELD', null)]: {
    title: 'Animal Yield Log',
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'text', placeholder: 'draft' },
      {
        key: 'line_items',
        label: 'Line items used',
        type: 'products_editor',
        editorMode: 'line_items',
        bindingTarget: 'line_items',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
  [formTemplateKey('LOT_MAINTENANCE', null)]: {
    title: 'Lot Maintenance Log',
    fields: [
      { key: 'cost', label: 'Cost', type: 'number', placeholder: '0' },
      { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
      {
        key: 'unit',
        label: 'Unit',
        type: 'select',
        options: AREA_UNIT_OPTIONS,
      },
      {
        key: 'inputs',
        label: 'Products used',
        type: 'products_editor',
        editorMode: 'inputs',
        bindingTarget: 'inputs',
      },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional notes' },
    ],
  },
};

export function getFormTemplate(
  category: LogbookCategoryKey,
  family: LogbookOperationFamily | null,
): LogbookFormTemplate {
  return (
    FORM_TEMPLATES[formTemplateKey(category, family)] ??
    FORM_TEMPLATES[formTemplateKey(category, null)] ?? {
      title: 'Log Details',
      fields: [{ key: 'notes', label: 'Notes', type: 'textarea' }],
    }
  );
}
