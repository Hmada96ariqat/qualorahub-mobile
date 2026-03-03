import type {
  LotSummary,
  LotType,
  CropRotationPlan,
  LightProfile,
  LotStatus,
} from '../../api/modules/lots';
import type { MapCoordinate } from '../../utils/geojson';
import { fromGeoJsonPolygon } from '../../utils/geojson';

export const LOT_PAGE_SIZE = 12;

export const LOT_TYPE_OPTIONS = [
  { label: 'Open Lot', value: 'open_lot' },
  { label: 'Greenhouse', value: 'greenhouse' },
  { label: 'Shade House', value: 'shade_house' },
  { label: 'Tunnel/Polytunnel', value: 'tunnel_polytunnel' },
  { label: 'Nursery', value: 'nursery' },
  { label: 'Grow Area/Planting Area', value: 'grow_area_planting_area' },
  { label: 'Orchard', value: 'orchard' },
  { label: 'Vineyard', value: 'vineyard' },
  { label: 'Livestock Barn', value: 'livestock_barn' },
  { label: 'Livestock Pasture/Grazing', value: 'livestock_pasture_grazing' },
  { label: 'Storage Pad/Warehouse', value: 'storage_pad_warehouse' },
  { label: 'Other', value: 'other' },
] as const;

export const CROP_ROTATION_OPTIONS = [
  { label: 'Monoculture', value: 'monoculture' },
  { label: 'Two-field rotation', value: 'two_field_rotation' },
  { label: 'Three-field rotation', value: 'three_field_rotation' },
  { label: 'Four-field rotation', value: 'four_field_rotation' },
  { label: 'Cover cropping', value: 'cover_cropping' },
  { label: 'Fallow periods', value: 'fallow_periods' },
  { label: 'Intercropping', value: 'intercropping' },
  { label: 'Other', value: 'other' },
] as const;

export const LIGHT_PROFILE_OPTIONS = [
  { label: 'Full sun', value: 'full_sun' },
  { label: 'Partial sun', value: 'partial_sun' },
  { label: 'Partial shade', value: 'partial_shade' },
  { label: 'Dappled shade', value: 'dappled_shade' },
  { label: 'Full shade', value: 'full_shade' },
  { label: 'Indoor controlled light', value: 'indoor_controlled_light' },
] as const;

export const LOT_STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'All', value: 'all' },
] as const;

export type LotStatusFilter = (typeof LOT_STATUS_FILTER_OPTIONS)[number]['value'];
export type LotFormMode = 'create' | 'edit';
export type LotFormStep = 1 | 2 | 3;

export type LotFormValues = {
  fieldId: string | null;
  name: string;
  lotType: LotType;
  lotTypeOther: string;
  cropRotationPlan: CropRotationPlan;
  cropRotationPlanOther: string;
  lightProfile: LightProfile;
  boundaryPoints: MapCoordinate[];
  pastSeasonsCropsCsv: string;
  weatherAlertsEnabled: boolean;
  notes: string;
  status: LotStatus;
};

function safeLotType(value: string | null | undefined): LotType {
  return LOT_TYPE_OPTIONS.some((option) => option.value === value)
    ? (value as LotType)
    : 'open_lot';
}

function safeRotation(value: string | null | undefined): CropRotationPlan {
  return CROP_ROTATION_OPTIONS.some((option) => option.value === value)
    ? (value as CropRotationPlan)
    : 'monoculture';
}

function safeLight(value: string | null | undefined): LightProfile {
  return LIGHT_PROFILE_OPTIONS.some((option) => option.value === value)
    ? (value as LightProfile)
    : 'full_sun';
}

export function toLotFormValues(lot?: LotSummary | null): LotFormValues {
  if (!lot) {
    return {
      fieldId: null,
      name: '',
      lotType: 'open_lot',
      lotTypeOther: '',
      cropRotationPlan: 'monoculture',
      cropRotationPlanOther: '',
      lightProfile: 'full_sun',
      boundaryPoints: [],
      pastSeasonsCropsCsv: '',
      weatherAlertsEnabled: false,
      notes: '',
      status: 'active',
    };
  }

  return {
    fieldId: lot.fieldId || null,
    name: lot.name,
    lotType: safeLotType(lot.lotType),
    lotTypeOther: lot.lotTypeOther ?? '',
    cropRotationPlan: safeRotation(lot.cropRotationPlan),
    cropRotationPlanOther: lot.cropRotationPlanOther ?? '',
    lightProfile: safeLight(lot.lightProfile),
    boundaryPoints: fromGeoJsonPolygon(lot.shapePolygon),
    pastSeasonsCropsCsv: lot.pastSeasonsCrops.join(', '),
    weatherAlertsEnabled: lot.weatherAlertsEnabled,
    notes: lot.notes ?? '',
    status: lot.status,
  };
}

export function parseCsvValues(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function buildLotSearchText(lot: LotSummary): string {
  return [
    lot.name,
    lot.description,
    lot.lotType,
    lot.lotTypeOther,
    lot.fieldName,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();
}
