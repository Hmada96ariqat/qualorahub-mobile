import type { FieldSummary } from '../../api/modules/fields';
import type { MapCoordinate } from '../../utils/geojson';
import { fromGeoJsonPolygon } from '../../utils/geojson';

export const FIELD_AREA_UNIT_OPTIONS = [
  { label: 'Hectares', value: 'hectares' },
  { label: 'Acres', value: 'acres' },
] as const;

export type FieldAreaUnit = (typeof FIELD_AREA_UNIT_OPTIONS)[number]['value'];

export type FieldFormValues = {
  name: string;
  areaHectares: string;
  areaUnit: FieldAreaUnit;
  boundaryPoints: MapCoordinate[];
  location: string;
  soilType: string;
  notes: string;
};

export type FieldFormMode = 'create' | 'edit';

export type FieldListMode = 'active' | 'inactive';

export function toFieldFormValues(field?: FieldSummary | null): FieldFormValues {
  if (!field) {
    return {
      name: '',
      areaHectares: '1.00',
      areaUnit: 'hectares',
      boundaryPoints: [],
      location: '',
      soilType: '',
      notes: '',
    };
  }

  const areaUnit = field.areaUnit === 'acres' ? 'acres' : 'hectares';

  return {
    name: field.name,
    areaHectares: field.areaHectares,
    areaUnit,
    boundaryPoints: fromGeoJsonPolygon(field.shapePolygon),
    location: field.location ?? '',
    soilType: field.soilType ?? '',
    notes: field.notes ?? '',
  };
}
