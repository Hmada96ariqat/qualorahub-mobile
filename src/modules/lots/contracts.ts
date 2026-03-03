import type { LotSummary } from '../../api/modules/lots';
import type { MapCoordinate } from '../../utils/geojson';
import { fromGeoJsonPolygon } from '../../utils/geojson';

export const LOT_TYPE_OPTIONS = [
  { label: 'Open Lot', value: 'open_lot' },
  { label: 'Greenhouse', value: 'greenhouse' },
  { label: 'Livestock Barn', value: 'livestock_barn' },
] as const;

export const CROP_ROTATION_OPTIONS = [
  { label: 'Monoculture', value: 'monoculture' },
  { label: 'Rotation', value: 'rotation' },
] as const;

export const LIGHT_PROFILE_OPTIONS = [
  { label: 'Full Sun', value: 'full_sun' },
  { label: 'Partial Shade', value: 'partial_shade' },
  { label: 'Shade', value: 'shade' },
] as const;

export type LotType = (typeof LOT_TYPE_OPTIONS)[number]['value'];
export type CropRotation = (typeof CROP_ROTATION_OPTIONS)[number]['value'];
export type LightProfile = (typeof LIGHT_PROFILE_OPTIONS)[number]['value'];

export type LotFormValues = {
  fieldId: string | null;
  name: string;
  lotType: LotType;
  cropRotationPlan: CropRotation;
  lightProfile: LightProfile;
  boundaryPoints: MapCoordinate[];
  notes: string;
};

export type LotFormMode = 'create' | 'edit';
export type LotListMode = 'active' | 'inactive';

export function toLotFormValues(lot?: LotSummary | null): LotFormValues {
  if (!lot) {
    return {
      fieldId: null,
      name: '',
      lotType: 'open_lot',
      cropRotationPlan: 'monoculture',
      lightProfile: 'full_sun',
      boundaryPoints: [],
      notes: '',
    };
  }

  const lotType = LOT_TYPE_OPTIONS.some((option) => option.value === lot.lotType)
    ? (lot.lotType as LotType)
    : 'open_lot';
  const cropRotationPlan = CROP_ROTATION_OPTIONS.some(
    (option) => option.value === lot.cropRotationPlan,
  )
    ? (lot.cropRotationPlan as CropRotation)
    : 'monoculture';
  const lightProfile = LIGHT_PROFILE_OPTIONS.some((option) => option.value === lot.lightProfile)
    ? (lot.lightProfile as LightProfile)
    : 'full_sun';

  return {
    fieldId: lot.fieldId || null,
    name: lot.name,
    lotType,
    cropRotationPlan,
    lightProfile,
    boundaryPoints: fromGeoJsonPolygon(lot.shapePolygon),
    notes: lot.notes ?? '',
  };
}
