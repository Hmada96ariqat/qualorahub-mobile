import { z } from 'zod';
import { parseUserAreaInput } from './contracts';
import type { MapCoordinate } from '../../utils/geojson';

const fieldStatusEnum = z.enum(['active', 'fallow', 'maintenance', 'inactive']);
const areaUnitEnum = z.enum(['hectares', 'acres', 'manzana']);

export const fieldPayloadSchema = z.object({
  name: z.string().trim().min(1),
  area_hectares: z.number().positive(),
  area_unit: areaUnitEnum,
  status: fieldStatusEnum.optional(),
});

export type FieldBoundaryValidationParams = {
  points: MapCoordinate[];
  manualEnabled: boolean;
  manualArea: string;
};

export type FieldBoundaryValidationResult = {
  valid: boolean;
  reason: 'ok' | 'missing_boundary' | 'invalid_manual_area';
};

export function validateFieldBoundaryInput(
  params: FieldBoundaryValidationParams,
): FieldBoundaryValidationResult {
  if (params.manualEnabled) {
    const area = parseUserAreaInput(params.manualArea);
    if (!area) {
      return {
        valid: false,
        reason: 'invalid_manual_area',
      };
    }

    return {
      valid: true,
      reason: 'ok',
    };
  }

  if (params.points.length < 3) {
    return {
      valid: false,
      reason: 'missing_boundary',
    };
  }

  return {
    valid: true,
    reason: 'ok',
  };
}
