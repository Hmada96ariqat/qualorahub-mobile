export const EQUIPMENT_USAGE_PURPOSE_KEYS = [
  'tilling',
  'plowing',
  'seeding',
  'spraying',
  'harvesting',
  'transport',
  'fertilizing',
  'irrigationSupport',
  'landPreparation',
  'mulching',
  'weeding',
  'pesticideApplication',
  'soilSampling',
  'mowing',
  'baling',
  'hayRaking',
  'livestockFeedingSupport',
  'cleaning',
  'other',
] as const;

export const OTHER_EQUIPMENT_USAGE_PURPOSE_KEY = 'other';

export type EquipmentUsagePurposeKey = (typeof EQUIPMENT_USAGE_PURPOSE_KEYS)[number];

const PURPOSE_LABELS: Record<EquipmentUsagePurposeKey, string> = {
  tilling: 'Tilling',
  plowing: 'Plowing',
  seeding: 'Seeding',
  spraying: 'Spraying',
  harvesting: 'Harvesting',
  transport: 'Transport/Delivery',
  fertilizing: 'Fertilizing',
  irrigationSupport: 'Irrigation Support',
  landPreparation: 'Land Preparation',
  mulching: 'Mulching',
  weeding: 'Weeding',
  pesticideApplication: 'Pesticide Application',
  soilSampling: 'Soil Sampling',
  mowing: 'Mowing',
  baling: 'Baling',
  hayRaking: 'Hay Raking',
  livestockFeedingSupport: 'Livestock Feeding Support',
  cleaning: 'Cleaning',
  other: 'Other',
};

const PURPOSE_LABEL_BUNDLES: ReadonlyArray<Record<EquipmentUsagePurposeKey, string>> = [
  PURPOSE_LABELS,
  {
    tilling: 'Labranza',
    plowing: 'Arado',
    seeding: 'Siembra',
    spraying: 'Fumigacion',
    harvesting: 'Cosecha',
    transport: 'Transporte/Entrega',
    fertilizing: 'Fertilizacion',
    irrigationSupport: 'Apoyo de Riego',
    landPreparation: 'Preparacion de Tierra',
    mulching: 'Acolchado',
    weeding: 'Deshierbe',
    pesticideApplication: 'Aplicacion de Pesticidas',
    soilSampling: 'Muestreo de Suelo',
    mowing: 'Corte de Cesped',
    baling: 'Empacado',
    hayRaking: 'Rastrillado de Heno',
    livestockFeedingSupport: 'Apoyo Alimentacion Ganado',
    cleaning: 'Limpieza',
    other: 'Otro',
  },
  {
    tilling: 'الحراثة',
    plowing: 'الحرث',
    seeding: 'البذر',
    spraying: 'الرش',
    harvesting: 'الحصاد',
    transport: 'النقل/التوصيل',
    fertilizing: 'التسميد',
    irrigationSupport: 'دعم الري',
    landPreparation: 'تحضير الأرض',
    mulching: 'التغطية',
    weeding: 'إزالة الأعشاب',
    pesticideApplication: 'تطبيق المبيدات',
    soilSampling: 'أخذ عينات التربة',
    mowing: 'القص',
    baling: 'التعبئة',
    hayRaking: 'جرف التبن',
    livestockFeedingSupport: 'دعم تغذية الماشية',
    cleaning: 'التنظيف',
    other: 'أخرى',
  },
];

const LEGACY_PURPOSE_ALIASES: Record<string, EquipmentUsagePurposeKey> = {
  general: 'other',
  field_work: 'other',
  harvest: 'harvesting',
  maintenance: 'other',
};

function normalizePurposeToken(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const PURPOSE_KEY_SET = new Set<string>(EQUIPMENT_USAGE_PURPOSE_KEYS);
const PURPOSE_ALIAS_MAP = new Map<string, EquipmentUsagePurposeKey>();

for (const purposeKey of EQUIPMENT_USAGE_PURPOSE_KEYS) {
  PURPOSE_ALIAS_MAP.set(normalizePurposeToken(purposeKey), purposeKey);
}

for (const [legacyValue, purposeKey] of Object.entries(LEGACY_PURPOSE_ALIASES)) {
  PURPOSE_ALIAS_MAP.set(normalizePurposeToken(legacyValue), purposeKey);
}

for (const bundle of PURPOSE_LABEL_BUNDLES) {
  for (const purposeKey of EQUIPMENT_USAGE_PURPOSE_KEYS) {
    PURPOSE_ALIAS_MAP.set(normalizePurposeToken(bundle[purposeKey]), purposeKey);
  }
}

export const EQUIPMENT_USAGE_PURPOSE_OPTIONS = EQUIPMENT_USAGE_PURPOSE_KEYS.map((value) => ({
  value,
  label: PURPOSE_LABELS[value],
})) as ReadonlyArray<{ value: EquipmentUsagePurposeKey; label: string }>;

export function isEquipmentUsagePurposeKey(value: string): value is EquipmentUsagePurposeKey {
  return PURPOSE_KEY_SET.has(value);
}

export function resolveEquipmentUsagePurposeKey(value: unknown): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return '';
  }

  const normalizedToken = normalizePurposeToken(normalized);
  return PURPOSE_ALIAS_MAP.get(normalizedToken) ?? normalized;
}

export function resolveEquipmentUsagePurposeFormValues(value: unknown): {
  usagePurpose: EquipmentUsagePurposeKey | '';
  otherPurpose: string;
} {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return {
      usagePurpose: '',
      otherPurpose: '',
    };
  }

  const purposeKey = resolveEquipmentUsagePurposeKey(normalized);
  if (isEquipmentUsagePurposeKey(purposeKey)) {
    return {
      usagePurpose: purposeKey,
      otherPurpose: '',
    };
  }

  return {
    usagePurpose: OTHER_EQUIPMENT_USAGE_PURPOSE_KEY,
    otherPurpose: normalized,
  };
}

export function finalizeEquipmentUsagePurpose(usagePurpose: string, otherPurpose: string): string {
  const purposeKey = resolveEquipmentUsagePurposeKey(usagePurpose);
  if (!purposeKey) {
    return '';
  }

  if (purposeKey === OTHER_EQUIPMENT_USAGE_PURPOSE_KEY) {
    return String(otherPurpose ?? '').trim();
  }

  return purposeKey;
}

export function getEquipmentUsagePurposeLabel(value: unknown): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return '';
  }

  const purposeKey = resolveEquipmentUsagePurposeKey(normalized);
  if (isEquipmentUsagePurposeKey(purposeKey)) {
    return PURPOSE_LABELS[purposeKey];
  }

  return normalized;
}
