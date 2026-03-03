import { intersectsAnyPolygon, isPolygonInsideBoundary } from '../../utils/geometry';
import type { MapCoordinate } from '../../utils/geojson';

export type LotBoundaryValidationReason =
  | 'ok'
  | 'missing_field'
  | 'outside_field'
  | 'overlap';

export type LotBoundaryValidationResult = {
  valid: boolean;
  reason: LotBoundaryValidationReason;
};

export function validateLotBoundaryCandidate(params: {
  candidate: MapCoordinate[];
  fieldBoundary: MapCoordinate[];
  occupiedLots: MapCoordinate[][];
}): LotBoundaryValidationResult {
  const { candidate, fieldBoundary, occupiedLots } = params;

  if (candidate.length === 0) {
    return { valid: true, reason: 'ok' };
  }

  if (fieldBoundary.length < 3) {
    return { valid: false, reason: 'missing_field' };
  }

  if (!isPolygonInsideBoundary(candidate, fieldBoundary)) {
    return { valid: false, reason: 'outside_field' };
  }

  if (intersectsAnyPolygon(candidate, occupiedLots)) {
    return { valid: false, reason: 'overlap' };
  }

  return { valid: true, reason: 'ok' };
}

export function resolveBoundaryAfterValidation(params: {
  candidate: MapCoordinate[];
  lastValid: MapCoordinate[];
  validation: LotBoundaryValidationResult;
}): MapCoordinate[] {
  if (params.validation.valid) {
    return params.candidate;
  }

  return params.lastValid;
}
