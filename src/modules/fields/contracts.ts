import type { FieldSummary, FieldStatus } from '../../api/modules/fields';
import type { MapCoordinate } from '../../utils/geojson';
import { fromGeoJsonPolygon } from '../../utils/geojson';

export const FIELD_PAGE_SIZE = 12;

export const FIELD_AREA_UNIT_OPTIONS = [
  { label: 'Hectares', value: 'hectares' },
  { label: 'Acres', value: 'acres' },
  { label: 'Manzana', value: 'manzana' },
] as const;

export const FIELD_STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Fallow', value: 'fallow' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'All', value: 'all' },
] as const;

export type FieldAreaUnit = (typeof FIELD_AREA_UNIT_OPTIONS)[number]['value'];
export type FieldStatusFilter = (typeof FIELD_STATUS_FILTER_OPTIONS)[number]['value'];
export type FieldFormMode = 'create' | 'edit';

export type ManualAreaFallback = {
  enabled: boolean;
  area: string;
  unit: FieldAreaUnit;
};

export type FieldFormValues = {
  name: string;
  soilType: string;
  boundaryPoints: MapCoordinate[];
  manualAreaFallback: ManualAreaFallback;
  // Hidden-but-preserved field schema values.
  areaHectares: string;
  areaUnit: FieldAreaUnit;
  location: string;
  notes: string;
  soilTypeCategory: string;
  soilTypeOther: string;
  irrigationType: string;
  irrigationTypeOther: string;
  soilConditions: string;
  status: FieldStatus;
};

function parseAreaUnit(value: string | null | undefined): FieldAreaUnit {
  if (value === 'acres' || value === 'manzana') {
    return value;
  }
  return 'hectares';
}

function toDisplayAreaUnitLabel(unit: FieldAreaUnit): string {
  if (unit === 'acres') return 'Acres';
  if (unit === 'manzana') return 'Manzana';
  return 'Hectares';
}

export function toFieldFormValues(
  field?: FieldSummary | null,
  preferredUnit: FieldAreaUnit = 'hectares',
): FieldFormValues {
  if (!field) {
    return {
      name: '',
      soilType: '',
      boundaryPoints: [],
      manualAreaFallback: {
        enabled: false,
        area: '1.00',
        unit: preferredUnit,
      },
      areaHectares: '1.00',
      areaUnit: preferredUnit,
      location: '',
      notes: '',
      soilTypeCategory: '',
      soilTypeOther: '',
      irrigationType: '',
      irrigationTypeOther: '',
      soilConditions: '',
      status: 'active',
    };
  }

  const areaUnit = parseAreaUnit(field.areaUnit);

  return {
    name: field.name,
    soilType: field.soilType ?? '',
    boundaryPoints: fromGeoJsonPolygon(field.shapePolygon),
    manualAreaFallback: {
      enabled: false,
      area: field.areaHectares,
      unit: areaUnit,
    },
    areaHectares: field.areaHectares,
    areaUnit,
    location: field.location ?? '',
    notes: field.notes ?? '',
    soilTypeCategory: field.soilTypeCategory ?? '',
    soilTypeOther: field.soilTypeOther ?? '',
    irrigationType: field.irrigationType ?? '',
    irrigationTypeOther: field.irrigationTypeOther ?? '',
    soilConditions: field.soilConditions ?? '',
    status: field.status,
  };
}

export function hectaresToDisplay(hectares: number, unit: FieldAreaUnit): number {
  if (!Number.isFinite(hectares)) {
    return 0;
  }

  if (unit === 'acres') {
    return hectares / 0.404686;
  }

  if (unit === 'manzana') {
    return hectares / 0.7;
  }

  return hectares;
}

export function displayToHectares(areaValue: number, unit: FieldAreaUnit): number {
  if (!Number.isFinite(areaValue)) {
    return 0;
  }

  if (unit === 'acres') {
    return areaValue * 0.404686;
  }

  if (unit === 'manzana') {
    return areaValue * 0.7;
  }

  return areaValue;
}

export function formatDisplayArea(hectares: string | number, unit: FieldAreaUnit): string {
  const numeric = typeof hectares === 'number' ? hectares : Number(hectares);
  const converted = hectaresToDisplay(numeric, unit);
  return Number.isFinite(converted) ? converted.toFixed(2) : '0.00';
}

export function formatCanonicalHectares(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const rounded = Math.round(value * 10_000) / 10_000;
  return `${rounded}`;
}

export function parseUserAreaInput(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function buildFieldSearchText(field: FieldSummary): string {
  return [field.name, field.location, field.soilType]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

export function toAreaUnitLabel(unit: FieldAreaUnit): string {
  return toDisplayAreaUnitLabel(unit);
}
