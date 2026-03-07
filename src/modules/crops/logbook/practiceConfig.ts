import type { DynamicPracticeFieldDefinition, LogbookFormField, LogbookOperationFamily } from './types';

type PracticeRequirementDefinition = {
  requiredBaseFields: string[];
  requiredDetailFields: string[];
  requireAnyDetailFieldKeys?: string[];
};

const selectOptions = (...values: string[]) =>
  values.map((value) => ({
    value,
    label: value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase()),
  }));

const PRACTICE_DYNAMIC_FIELDS: Record<string, DynamicPracticeFieldDefinition[]> = {
  basin_maintenance: [
    { key: 'area_covered', label: 'Area covered', type: 'number', min: 0, step: '0.01' },
    { key: 'area_unit', label: 'Area unit', type: 'text', placeholder: 'e.g. m2, dunum, hectare' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  bed_ridge_formation: [
    { key: 'area_covered', label: 'Area covered', type: 'number', min: 0, step: '0.01' },
    { key: 'bed_width_cm', label: 'Bed width (cm)', type: 'number', min: 0, step: '0.1' },
    { key: 'ridge_height_cm', label: 'Ridge height (cm)', type: 'number', min: 0, step: '0.1' },
  ],
  composting_organic_amendment: [
    { key: 'product_or_material', label: 'Product or material', type: 'text' },
    { key: 'rate_per_area', label: 'Rate per area', type: 'text', placeholder: 'e.g. 2 kg/m2' },
  ],
  primary_plowing: [
    { key: 'area_covered', label: 'Area covered', type: 'number', min: 0, step: '0.01' },
    { key: 'depth_cm', label: 'Depth (cm)', type: 'number', min: 0, step: '0.1' },
    { key: 'equipment_used', label: 'Equipment used', type: 'text' },
    { key: 'fuel_or_energy_cost', label: 'Fuel / energy cost', type: 'number', min: 0, step: '0.01' },
  ],
  soil_solarization_pre_plant: [
    { key: 'area_covered', label: 'Area covered', type: 'number', min: 0, step: '0.01' },
    { key: 'start_date', label: 'Start date', type: 'date' },
    { key: 'end_date', label: 'End date', type: 'date' },
    { key: 'plastic_type', label: 'Plastic type', type: 'text' },
  ],
  seedling_planting: [
    { key: 'seedling_count', label: 'Seedling count', type: 'number', min: 0, step: '1' },
    { key: 'spacing_plant_cm', label: 'Plant spacing (cm)', type: 'number', min: 0, step: '0.1' },
    { key: 'spacing_row_cm', label: 'Row spacing (cm)', type: 'number', min: 0, step: '0.1' },
  ],
  transplanting: [
    { key: 'transplant_source', label: 'Transplant source', type: 'text' },
    { key: 'seedling_count', label: 'Seedling count', type: 'number', min: 0, step: '1' },
    { key: 'spacing_plant_cm', label: 'Plant spacing (cm)', type: 'number', min: 0, step: '0.1' },
    { key: 'spacing_row_cm', label: 'Row spacing (cm)', type: 'number', min: 0, step: '0.1' },
  ],
  regular_irrigation: [{ key: 'water_ph', label: 'Water pH', type: 'number', min: 0, step: '0.01' }],
  fertigation: [{ key: 'water_ph', label: 'Water pH', type: 'number', min: 0, step: '0.01' }],
  base_dressing: [
    { key: 'rate_per_area', label: 'Rate per area', type: 'text', placeholder: 'e.g. 100 kg/hectare' },
    { key: 'n_percent', label: 'Nitrogen (%)', type: 'number', min: 0, step: '0.01' },
    { key: 'p_percent', label: 'Phosphorus (%)', type: 'number', min: 0, step: '0.01' },
    { key: 'k_percent', label: 'Potassium (%)', type: 'number', min: 0, step: '0.01' },
  ],
  in_season_fertilization_topdress_side_dress: [
    { key: 'growth_stage', label: 'Growth stage', type: 'text' },
    { key: 'rate_per_area', label: 'Rate per area', type: 'text', placeholder: 'e.g. 75 kg/hectare' },
    { key: 'n_percent', label: 'Nitrogen (%)', type: 'number', min: 0, step: '0.01' },
    { key: 'p_percent', label: 'Phosphorus (%)', type: 'number', min: 0, step: '0.01' },
    { key: 'k_percent', label: 'Potassium (%)', type: 'number', min: 0, step: '0.01' },
  ],
  bagging_bunches: [{ key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' }],
  bending_bunches: [{ key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' }],
  cluster_thinning: [
    { key: 'target_cluster_load', label: 'Target cluster load', type: 'number', min: 0, step: '0.01' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  fruit_thinning: [
    { key: 'target_fruit_load', label: 'Target fruit load', type: 'number', min: 0, step: '0.01' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  inflorescences_cutting: [{ key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' }],
  leaf_pruning: [{ key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' }],
  offshoot_management: [{ key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' }],
  pollination: [
    { key: 'pollination_method', label: 'Pollination method', type: 'select', options: selectOptions('manual', 'assisted', 'natural', 'other') },
    { key: 'pollination_window', label: 'Pollination window', type: 'text', placeholder: 'e.g. 07:00 - 10:00' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  pruning: [
    { key: 'pruning_type', label: 'Pruning type', type: 'select', options: selectOptions('maintenance', 'formation', 'rejuvenation', 'other') },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  pruning_remove_dead_branches: [{ key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' }],
  pruning_remove_diseased_parts: [
    { key: 'disease_reason', label: 'Disease reason', type: 'text' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  shoot_pruning: [{ key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' }],
  spines_cutting: [{ key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' }],
  training_install_twines: [
    { key: 'material_type', label: 'Material type', type: 'text' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  field_cleaning_and_sanitation: [
    { key: 'cleaning_scope', label: 'Cleaning scope', type: 'text' },
    { key: 'waste_disposal_method', label: 'Waste disposal method', type: 'text' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  monitoring_and_inspection: [
    { key: 'inspection_type', label: 'Inspection type', type: 'select', options: selectOptions('visual', 'sampling', 'trap_check', 'other') },
    { key: 'findings_summary', label: 'Findings summary', type: 'textarea' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  post_harvest_sanitation: [
    { key: 'sanitation_method', label: 'Sanitation method', type: 'text' },
    { key: 'area_or_batch_scope', label: 'Area or batch scope', type: 'text' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
  post_harvesting: [
    { key: 'post_harvest_activity_type', label: 'Post-harvest activity type', type: 'text' },
    { key: 'handled_quantity', label: 'Handled quantity', type: 'number', min: 0, step: '0.01' },
  ],
  sorting_and_grading: [
    { key: 'input_quantity', label: 'Input quantity', type: 'number', min: 0, step: '0.01' },
    { key: 'output_grades', label: 'Output grades', type: 'textarea', placeholder: 'e.g. Grade A: 120kg, Grade B: 45kg' },
  ],
  manual_weeding: [
    { key: 'control_method', label: 'Control method', type: 'text' },
    { key: 'treated_area', label: 'Treated area', type: 'number', min: 0, step: '0.01' },
    { key: 'area_unit', label: 'Area unit', type: 'text', placeholder: 'e.g. m2, dunum, hectare' },
    { key: 'labor_hours', label: 'Labor hours', type: 'number', min: 0, step: '0.1' },
  ],
};

const defineRequirement = (
  requiredBaseFields: string[],
  requiredDetailFields: string[],
  requireAnyDetailFieldKeys?: string[],
): PracticeRequirementDefinition => ({
  requiredBaseFields,
  requiredDetailFields,
  ...(requireAnyDetailFieldKeys?.length ? { requireAnyDetailFieldKeys } : {}),
});

const PRACTICE_REQUIREMENTS_BY_FAMILY: Partial<
  Record<Exclude<LogbookOperationFamily, 'TREATMENT' | 'HARVEST'>, Record<string, PracticeRequirementDefinition>>
> = {
  CULTURAL: {
    bagging_bunches: defineRequirement(['quantity', 'unit'], ['labor_hours']),
    bending_bunches: defineRequirement(['quantity', 'unit'], ['labor_hours']),
    cluster_thinning: defineRequirement(['quantity', 'unit'], ['target_cluster_load', 'labor_hours']),
    field_cleaning_and_sanitation: defineRequirement([], ['cleaning_scope', 'waste_disposal_method', 'labor_hours']),
    fruit_thinning: defineRequirement(['quantity', 'unit'], ['target_fruit_load', 'labor_hours']),
    inflorescences_cutting: defineRequirement(['quantity', 'unit'], ['labor_hours']),
    leaf_pruning: defineRequirement(['quantity', 'unit'], ['labor_hours']),
    monitoring_and_inspection: defineRequirement([], ['inspection_type', 'findings_summary', 'labor_hours']),
    offshoot_management: defineRequirement(['quantity', 'unit'], ['labor_hours']),
    pollination: defineRequirement(['quantity', 'unit'], ['pollination_method', 'pollination_window']),
    post_harvest_sanitation: defineRequirement([], ['sanitation_method', 'area_or_batch_scope', 'labor_hours']),
    post_harvesting: defineRequirement(['unit'], ['post_harvest_activity_type', 'handled_quantity']),
    pruning: defineRequirement(['quantity', 'unit'], ['pruning_type', 'labor_hours']),
    pruning_remove_dead_branches: defineRequirement(['quantity', 'unit'], ['labor_hours']),
    pruning_remove_diseased_parts: defineRequirement(['quantity', 'unit'], ['disease_reason', 'labor_hours']),
    shoot_pruning: defineRequirement(['quantity', 'unit'], ['labor_hours']),
    sorting_and_grading: defineRequirement(['unit'], ['input_quantity', 'output_grades']),
    spines_cutting: defineRequirement(['quantity', 'unit'], ['labor_hours']),
    training_install_twines: defineRequirement(['quantity', 'unit'], ['material_type', 'labor_hours']),
  },
  IRRIGATION: {
    fertigation: defineRequirement(['method', 'water_source', 'volume_value', 'volume_unit', 'inputs'], [], ['water_ph']),
    regular_irrigation: defineRequirement(['method', 'water_source', 'volume_value', 'volume_unit'], [], ['water_ph']),
  },
  LAND_PREP: {
    basin_maintenance: defineRequirement([], ['area_covered', 'area_unit', 'labor_hours']),
    bed_ridge_formation: defineRequirement([], ['area_covered', 'bed_width_cm', 'ridge_height_cm']),
    composting_organic_amendment: defineRequirement(['quantity', 'unit'], ['product_or_material', 'rate_per_area']),
    primary_plowing: defineRequirement([], ['area_covered', 'depth_cm', 'equipment_used', 'fuel_or_energy_cost']),
    soil_solarization_pre_plant: defineRequirement([], ['area_covered', 'start_date', 'end_date', 'plastic_type']),
  },
  NUTRIENT: {
    base_dressing: defineRequirement(['applicationMethod', 'products'], ['rate_per_area'], ['n_percent', 'p_percent', 'k_percent']),
    in_season_fertilization_topdress_side_dress: defineRequirement(['applicationMethod', 'products'], ['growth_stage', 'rate_per_area'], ['n_percent', 'p_percent', 'k_percent']),
  },
  PLANTING: {
    seedling_planting: defineRequirement(['plantingDate'], ['seedling_count', 'spacing_plant_cm', 'spacing_row_cm']),
    transplanting: defineRequirement(['plantingDate'], ['transplant_source', 'seedling_count', 'spacing_plant_cm', 'spacing_row_cm']),
  },
  WEED_MGMT: {
    manual_weeding: defineRequirement([], ['control_method', 'treated_area', 'area_unit', 'labor_hours']),
  },
};

const PRACTICE_DYNAMIC_FIELD_KEYS = Object.keys(PRACTICE_DYNAMIC_FIELDS).sort(
  (left, right) => right.length - left.length,
);

const normalizePracticeCode = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const isPresent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  return true;
};

const parseObjectValue = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

export function resolvePracticeCode(
  practice: { code?: unknown; label?: unknown } | null | undefined,
): string | null {
  const byCode = normalizePracticeCode(practice?.code);
  if (byCode) {
    return byCode;
  }

  const byLabel = normalizePracticeCode(practice?.label);
  return byLabel || null;
}

export function getDynamicFieldsForPractice(
  practiceCode: string | null | undefined,
): DynamicPracticeFieldDefinition[] {
  const normalizedCode = normalizePracticeCode(practiceCode);
  if (!normalizedCode) {
    return [];
  }

  const directMatch = PRACTICE_DYNAMIC_FIELDS[normalizedCode];
  if (directMatch) {
    return directMatch;
  }

  const suffixMatch = PRACTICE_DYNAMIC_FIELD_KEYS.find((key) =>
    normalizedCode.endsWith(`_${key}`),
  );

  return suffixMatch ? PRACTICE_DYNAMIC_FIELDS[suffixMatch] : [];
}

export function detailsToFieldState(details: unknown): Record<string, string> {
  const record = parseObjectValue(details);
  const state: Record<string, string> = {};

  Object.entries(record).forEach(([key, value]) => {
    if (!isPresent(value)) {
      return;
    }

    state[key] = String(value);
  });

  return state;
}

export function buildDetailsPayload(
  practiceCode: string | null | undefined,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const fields = getDynamicFieldsForPractice(practiceCode);
  if (fields.length === 0) {
    return {};
  }

  const payload: Record<string, unknown> = {};

  fields.forEach((field) => {
    const value = values[field.key];
    if (!isPresent(value)) {
      return;
    }

    if (field.type === 'number') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        payload[field.key] = parsed;
      }
      return;
    }

    if (field.type === 'date') {
      payload[field.key] = String(value).slice(0, 10);
      return;
    }

    payload[field.key] = String(value).trim();
  });

  return payload;
}

export function buildPracticeValidationFields(practiceCode: string | null | undefined): LogbookFormField[] {
  return getDynamicFieldsForPractice(practiceCode).map((field) => ({
    key: field.key,
    label: field.label,
    type: 'text',
  }));
}

export function getPracticeRequirement(
  family: LogbookOperationFamily | null | undefined,
  practiceCode: string | null | undefined,
): PracticeRequirementDefinition | null {
  if (!family || !practiceCode) {
    return null;
  }

  const familyRequirements = PRACTICE_REQUIREMENTS_BY_FAMILY[
    family as keyof typeof PRACTICE_REQUIREMENTS_BY_FAMILY
  ];
  if (!familyRequirements) {
    return null;
  }

  const normalizedCode = normalizePracticeCode(practiceCode);
  if (!normalizedCode) {
    return null;
  }

  return familyRequirements[normalizedCode] ?? null;
}

export function getPracticeRequirementAnyOfKey(
  requirement: PracticeRequirementDefinition | null,
): string | null {
  return requirement?.requireAnyDetailFieldKeys?.[0] ?? null;
}
