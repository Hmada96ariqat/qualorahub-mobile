import type {
  CreateProductRequest,
  InventoryProduct,
  UpdateProductRequest,
} from '../../api/modules/inventory';
import {
  ACTIVE_INGREDIENT_GROUPS,
  ACTIVE_INGREDIENT_TARGET_MAP,
  DOSE_UNIT_OPTIONS,
  PEST_PRODUCT_TYPES,
  PRODUCT_FORM_GROUPS,
} from './pesticideData';

export type ProductWizardStep = 'a' | 'b' | 'c';
export type ProductUsageType = 'Both' | 'Selling' | 'FarmInput';

export type ProductInventoryRecordForm = {
  batchNumber: string;
  warehouseId: string;
  quantity: string;
  manufacturingDate: string;
  expiryDate: string;
  expiryDays: string;
  notes: string;
};

export type ProductCropGuidanceRowForm = {
  cropId: string;
  regionScope: string;
  targetOrganismsText: string;
  doseText: string;
  doseUnit: string;
  phiDays: string;
  reiHours: string;
  notes: string;
  referenceUrls: string[];
};

export type ProductFormValues = {
  name: string;
  sku: string;
  description: string;
  productType: string;
  otherProductType: string;
  usageType: ProductUsageType;
  categoryId: string;
  supplierId: string;
  taxId: string;
  manufacturerId: string;
  manufacturer: string;
  originCountry: string;
  barcode: string;
  imagesExisting: string[];
  imagesNew: string[];

  productFormCode: string;
  activeIngredients: string[];
  doseText: string;
  doseUnit: string;
  doseUnitOtherText: string;
  activeIngredientConcentrationPercent: string;
  phiMinDays: string;
  phiMaxDays: string;
  targetOrganismsText: string;
  referenceUrls: string[];
  cropGuidanceRows: ProductCropGuidanceRowForm[];

  salePrice: string;
  wholesalePrice: string;
  threshold: string;
  inventoryRecords: ProductInventoryRecordForm[];

  displayOnStorefront: boolean;
  status: 'active' | 'inactive';
};

export type ProductValidationErrors = Partial<Record<string, string>>;

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'seed', label: 'Seed' },
  { value: 'seedling_transplant', label: 'Seedling / Transplant' },
  { value: 'bulb_tuber_rhizome', label: 'Bulb / Tuber / Rhizome' },
  { value: 'sapling_tree_stock', label: 'Sapling / Tree Stock' },
  { value: 'cover_crop_seed', label: 'Cover Crop Seed' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'soil_amendment', label: 'Soil Amendment' },
  { value: 'pesticide', label: 'Pesticide' },
  { value: 'herbicide', label: 'Herbicide' },
  { value: 'insecticide', label: 'Insecticide' },
  { value: 'fungicide', label: 'Fungicide' },
  { value: 'nematicide', label: 'Nematicide' },
  { value: 'growth_regulator', label: 'Growth Regulator' },
  { value: 'adjuvant_surfactant', label: 'Adjuvant / Surfactant' },
  { value: 'compost', label: 'Compost' },
  { value: 'manure', label: 'Manure' },
  { value: 'lime', label: 'Lime' },
  { value: 'gypsum', label: 'Gypsum' },
  { value: 'micronutrient', label: 'Micronutrient' },
  { value: 'bio_fertilizer', label: 'Bio-fertilizer' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'lubricants', label: 'Lubricants' },
  { value: 'packaging_materials', label: 'Packaging Materials' },
  { value: 'mulch_plastic_film', label: 'Mulch / Plastic Film' },
  { value: 'netting_shade_cloth', label: 'Netting / Shade Cloth' },
  { value: 'irrigation_supplies', label: 'Irrigation Supplies' },
  { value: 'greenhouse_supplies', label: 'Greenhouse Supplies' },
  { value: 'animal_feed', label: 'Animal Feed' },
  { value: 'feed_supplement', label: 'Feed Supplement' },
  { value: 'veterinary_medicine', label: 'Veterinary Medicine' },
  { value: 'vaccine', label: 'Vaccine' },
  { value: 'breeding_material', label: 'Breeding Material' },
  { value: 'bedding', label: 'Bedding' },
  { value: 'grain', label: 'Grain' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'herb_spice', label: 'Herb / Spice' },
  { value: 'forage_hay', label: 'Forage / Hay' },
  { value: 'fiber_crop', label: 'Fiber Crop' },
  { value: 'other', label: 'Other' },
] as const;

export const PRODUCT_USAGE_TYPE_OPTIONS = [
  { value: 'Both', label: 'Both' },
  { value: 'Selling', label: 'Selling' },
  { value: 'FarmInput', label: 'Farm Input' },
] as const;

export const PRODUCT_DOSE_UNIT_OPTIONS = DOSE_UNIT_OPTIONS.map((unit) => ({
  value: unit,
  label: unit,
}));

export const PRODUCT_FORM_OPTIONS = PRODUCT_FORM_GROUPS.flatMap((group) =>
  group.options.map((option) => ({
    value: option.value,
    label: `${option.value} - ${option.label}`,
  })),
);

export const ACTIVE_INGREDIENT_OPTIONS = ACTIVE_INGREDIENT_GROUPS.flatMap((group) =>
  group.options.map((option) => option.value),
);

function parseStringArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          if (typeof record.value === 'string') return record.value.trim();
          if (typeof record.label === 'string') return record.label.trim();
        }
        return '';
      })
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parseStringArray(parsed);
    } catch {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
  }

  return [];
}

function parseNumberAsString(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return String(parsed);
  }
  return '';
}

function parseRowArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
  );
}

function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toOptionalInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(normalized);
  }

  return deduped;
}

export function isPesticideFamilyProductType(productType: string): boolean {
  return (PEST_PRODUCT_TYPES as readonly string[]).includes(productType as (typeof PEST_PRODUCT_TYPES)[number]);
}

export function getVisibleProductSteps(productType: string): ProductWizardStep[] {
  return isPesticideFamilyProductType(productType) ? ['a', 'b', 'c'] : ['a', 'c'];
}

export function createEmptyInventoryRecord(): ProductInventoryRecordForm {
  return {
    batchNumber: '',
    warehouseId: '',
    quantity: '',
    manufacturingDate: '',
    expiryDate: '',
    expiryDays: '',
    notes: '',
  };
}

export function createEmptyCropGuidanceRow(): ProductCropGuidanceRowForm {
  return {
    cropId: '',
    regionScope: '',
    targetOrganismsText: '',
    doseText: '',
    doseUnit: '',
    phiDays: '',
    reiHours: '',
    notes: '',
    referenceUrls: [],
  };
}

export function createEmptyProductFormValues(): ProductFormValues {
  return {
    name: '',
    sku: '',
    description: '',
    productType: '',
    otherProductType: '',
    usageType: 'Both',
    categoryId: '',
    supplierId: '',
    taxId: '',
    manufacturerId: '',
    manufacturer: '',
    originCountry: '',
    barcode: '',
    imagesExisting: [],
    imagesNew: [],

    productFormCode: '',
    activeIngredients: [],
    doseText: '',
    doseUnit: '',
    doseUnitOtherText: '',
    activeIngredientConcentrationPercent: '',
    phiMinDays: '',
    phiMaxDays: '',
    targetOrganismsText: '',
    referenceUrls: [],
    cropGuidanceRows: [],

    salePrice: '',
    wholesalePrice: '',
    threshold: '',
    inventoryRecords: [createEmptyInventoryRecord()],

    displayOnStorefront: false,
    status: 'active',
  };
}

export function normalizeDoseUnitForEdit(
  doseUnit: string | null,
): Pick<ProductFormValues, 'doseUnit' | 'doseUnitOtherText'> {
  const allowed = new Set<string>(['', ...DOSE_UNIT_OPTIONS]);
  const normalized = (doseUnit ?? '').trim();

  if (!normalized) {
    return {
      doseUnit: '',
      doseUnitOtherText: '',
    };
  }

  if (allowed.has(normalized)) {
    return {
      doseUnit: normalized,
      doseUnitOtherText: '',
    };
  }

  return {
    doseUnit: 'other',
    doseUnitOtherText: normalized,
  };
}

export function toProductFormValues(row?: InventoryProduct | null): ProductFormValues {
  if (!row) {
    return createEmptyProductFormValues();
  }

  const normalizedDose = normalizeDoseUnitForEdit(row.doseUnit);

  const inventoryRecords = parseRowArray(row.inventoryRecords).map((record) => ({
    batchNumber:
      typeof record.batch_number === 'string' ? record.batch_number : '',
    warehouseId:
      typeof record.warehouse_id === 'string' ? record.warehouse_id : '',
    quantity: parseNumberAsString(record.quantity),
    manufacturingDate:
      typeof record.manufacturing_date === 'string' ? record.manufacturing_date : '',
    expiryDate: typeof record.expiry_date === 'string' ? record.expiry_date : '',
    expiryDays: parseNumberAsString(record.expired_after_days),
    notes: typeof record.notes === 'string' ? record.notes : '',
  }));

  return {
    name: row.name,
    sku: row.sku ?? '',
    description: row.description ?? '',
    productType: row.productType ?? '',
    otherProductType: row.otherProductType ?? '',
    usageType: row.usageType ?? 'Both',
    categoryId: row.categoryId ?? '',
    supplierId: row.supplierId ?? '',
    taxId: row.taxId ?? '',
    manufacturerId: row.manufacturerId ?? '',
    manufacturer: row.manufacturer ?? '',
    originCountry: row.originCountry ?? '',
    barcode: row.barcode ?? '',
    imagesExisting: parseStringArray(row.images),
    imagesNew: [],

    productFormCode: row.productFormCode ?? '',
    activeIngredients: dedupeStrings(parseStringArray(row.activeIngredients)),
    doseText: row.doseText ?? '',
    doseUnit: normalizedDose.doseUnit,
    doseUnitOtherText: normalizedDose.doseUnitOtherText,
    activeIngredientConcentrationPercent:
      row.activeIngredientConcentrationPercent ?? '',
    phiMinDays: parseNumberAsString(row.phiMinDays),
    phiMaxDays: parseNumberAsString(row.phiMaxDays),
    targetOrganismsText: row.targetOrganismsText ?? '',
    referenceUrls: dedupeStrings(parseStringArray(row.referenceUrls)),
    cropGuidanceRows: parseRowArray(row.cropGuidanceRows).map((rowValue) => ({
      cropId: typeof rowValue.crop_id === 'string' ? rowValue.crop_id : '',
      regionScope:
        typeof rowValue.region_scope === 'string' ? rowValue.region_scope : '',
      targetOrganismsText:
        typeof rowValue.target_organisms_text === 'string'
          ? rowValue.target_organisms_text
          : '',
      doseText: typeof rowValue.dose_text === 'string' ? rowValue.dose_text : '',
      doseUnit: typeof rowValue.dose_unit === 'string' ? rowValue.dose_unit : '',
      phiDays: parseNumberAsString(rowValue.phi_days),
      reiHours: parseNumberAsString(rowValue.rei_hours),
      notes: typeof rowValue.notes === 'string' ? rowValue.notes : '',
      referenceUrls: dedupeStrings(parseStringArray(rowValue.reference_urls)),
    })),

    salePrice: parseNumberAsString(row.pricePerUnit),
    wholesalePrice: parseNumberAsString(row.wholesalePrice),
    threshold: parseNumberAsString(row.threshold),
    inventoryRecords: inventoryRecords.length > 0 ? inventoryRecords : [createEmptyInventoryRecord()],

    displayOnStorefront: row.displayOnStorefront,
    status: row.status === 'inactive' ? 'inactive' : 'active',
  };
}

export function clearRegulatoryAgronomicFields(values: ProductFormValues): ProductFormValues {
  return {
    ...values,
    productFormCode: '',
    activeIngredients: [],
    doseText: '',
    doseUnit: '',
    doseUnitOtherText: '',
    activeIngredientConcentrationPercent: '',
    phiMinDays: '',
    phiMaxDays: '',
    targetOrganismsText: '',
    referenceUrls: [],
    cropGuidanceRows: [],
  };
}

export function enforceUsageTypeRules(values: ProductFormValues): ProductFormValues {
  if (values.usageType !== 'FarmInput') {
    return values;
  }

  if (!values.displayOnStorefront) {
    return values;
  }

  return {
    ...values,
    displayOnStorefront: false,
  };
}

export function deriveTargetOrganismsFromIngredients(ingredients: string[]): string {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return '';
  }

  const lookup = new Map<string, string[]>(
    Object.entries(ACTIVE_INGREDIENT_TARGET_MAP).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );

  const targets: string[] = [];
  for (const ingredient of ingredients) {
    const normalized = ingredient.trim().toLowerCase();
    if (!normalized) continue;
    const mapped = lookup.get(normalized);
    if (Array.isArray(mapped) && mapped.length > 0) {
      targets.push(...mapped);
      continue;
    }
    targets.push(ingredient.trim());
  }

  return dedupeStrings(targets).join(', ');
}

export function validateProductFormValues(values: ProductFormValues): ProductValidationErrors {
  const errors: ProductValidationErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Product name is required.';
  }

  if (!values.productType.trim()) {
    errors.productType = 'Product type is required.';
  }

  if (!values.usageType.trim()) {
    errors.usageType = 'Usage type is required.';
  }

  if (isPesticideFamilyProductType(values.productType)) {
    if (values.doseUnit === 'other' && !values.doseUnitOtherText.trim()) {
      errors.doseUnitOtherText = 'Dose unit text is required when dose unit is "other".';
    }

    const min = toOptionalInteger(values.phiMinDays);
    const max = toOptionalInteger(values.phiMaxDays);

    if (min !== null && max !== null && max < min) {
      errors.phiMaxDays = 'Max PHI must be greater than or equal to Min PHI.';
    }
  }

  return errors;
}

function mapInventoryRecord(
  record: ProductInventoryRecordForm,
): Record<string, unknown> {
  return {
    batch_number: record.batchNumber.trim() || null,
    warehouse_id: record.warehouseId.trim() || null,
    quantity: toOptionalNumber(record.quantity),
    manufacturing_date: record.manufacturingDate.trim() || null,
    expiry_date: record.expiryDate.trim() || null,
    expired_after_days: toOptionalInteger(record.expiryDays),
    notes: record.notes.trim() || null,
  };
}

function mapCropGuidanceRow(
  row: ProductCropGuidanceRowForm,
): Record<string, unknown> {
  return {
    crop_id: row.cropId.trim(),
    region_scope: row.regionScope.trim() || null,
    target_organisms_text: row.targetOrganismsText.trim() || null,
    dose_text: row.doseText.trim() || null,
    dose_unit: row.doseUnit.trim() || null,
    phi_days: toOptionalInteger(row.phiDays),
    rei_hours: toOptionalInteger(row.reiHours),
    notes: row.notes.trim() || null,
    reference_urls: dedupeStrings(row.referenceUrls),
  };
}

export function buildProductPayload(
  values: ProductFormValues,
): CreateProductRequest | UpdateProductRequest {
  const normalized = enforceUsageTypeRules(values);

  const resolvedDoseUnit =
    normalized.doseUnit === 'other'
      ? normalized.doseUnitOtherText.trim() || null
      : normalized.doseUnit.trim() || null;

  const images = dedupeStrings([
    ...normalized.imagesExisting,
    ...normalized.imagesNew,
  ]);

  const payload: Record<string, unknown> = {
    name: normalized.name.trim(),
    sku: normalized.sku.trim() || null,
    description: normalized.description.trim() || null,
    product_type: normalized.productType.trim() || null,
    other_product_type:
      normalized.productType === 'other'
        ? normalized.otherProductType.trim() || null
        : null,
    usage_type: normalized.usageType,
    category_id: normalized.categoryId.trim() || null,
    supplier_id: normalized.supplierId.trim() || null,
    tax_id: normalized.taxId.trim() || null,
    manufacturer_id: normalized.manufacturerId.trim() || null,
    manufacturer: normalized.manufacturer.trim() || null,
    origin_country: normalized.originCountry.trim() || null,
    barcode: normalized.barcode.trim() || null,

    product_form_code: normalized.productFormCode.trim() || null,
    active_ingredients: dedupeStrings(normalized.activeIngredients),
    dose_text: normalized.doseText.trim() || null,
    dose_unit: resolvedDoseUnit,
    phi_min_days: toOptionalInteger(normalized.phiMinDays),
    phi_max_days: toOptionalInteger(normalized.phiMaxDays),
    active_ingredient_concentration_percent:
      normalized.activeIngredientConcentrationPercent.trim() || null,
    target_organisms_text: normalized.targetOrganismsText.trim() || null,
    reference_urls: dedupeStrings(normalized.referenceUrls),
    crop_guidance_rows: normalized.cropGuidanceRows
      .filter((row) => row.cropId.trim().length > 0)
      .map(mapCropGuidanceRow),

    price_per_unit: toOptionalNumber(normalized.salePrice),
    wholesale_price: toOptionalNumber(normalized.wholesalePrice),
    threshold: toOptionalNumber(normalized.threshold),
    inventoryRecords: normalized.inventoryRecords.map(mapInventoryRecord),

    display_on_storefront: normalized.displayOnStorefront,
    status: normalized.status,
    images,
  };

  // TODO(typed): OpenAPI currently models several Create/UpdateProductDto string-array fields as object[].
  // Keep web-compatible payload shape here and confine type coercion to this API-adjacent mapper.
  return payload as unknown as CreateProductRequest | UpdateProductRequest;
}
