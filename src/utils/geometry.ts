import booleanIntersects from '@turf/boolean-intersects';
import booleanWithin from '@turf/boolean-within';
import area from '@turf/area';
import { polygon } from '@turf/helpers';
import type { MapCoordinate } from './geojson';

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function makeClosedRing(points: readonly MapCoordinate[]): number[][] {
  const ring = points.map((point) => [point.longitude, point.latitude]);
  if (ring.length === 0) {
    return ring;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (!first || !last) {
    return ring;
  }

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  return ring;
}

function toPolygonFeature(points: readonly MapCoordinate[]) {
  if (points.length < 3) {
    return null;
  }

  return polygon([makeClosedRing(points)]);
}

function samePoint(a: MapCoordinate, b: MapCoordinate): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

function isPointOnSegment(point: MapCoordinate, start: MapCoordinate, end: MapCoordinate): boolean {
  const cross =
    (point.latitude - start.latitude) * (end.longitude - start.longitude) -
    (point.longitude - start.longitude) * (end.latitude - start.latitude);
  if (Math.abs(cross) > 1e-10) {
    return false;
  }

  const dot =
    (point.longitude - start.longitude) * (point.longitude - end.longitude) +
    (point.latitude - start.latitude) * (point.latitude - end.latitude);
  return dot <= 1e-12;
}

function ccw(a: MapCoordinate, b: MapCoordinate, c: MapCoordinate): boolean {
  return (c.latitude - a.latitude) * (b.longitude - a.longitude) >
    (b.latitude - a.latitude) * (c.longitude - a.longitude);
}

function segmentsIntersect(
  a1: MapCoordinate,
  a2: MapCoordinate,
  b1: MapCoordinate,
  b2: MapCoordinate,
): boolean {
  if (samePoint(a1, b1) || samePoint(a1, b2) || samePoint(a2, b1) || samePoint(a2, b2)) {
    return false;
  }

  return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2);
}

export function distanceMeters(a: MapCoordinate, b: MapCoordinate): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLng = toRadians(b.longitude - a.longitude);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);

  const haversine =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_METERS * arc;
}

export function isNearFirstPoint(
  points: readonly MapCoordinate[],
  point: MapCoordinate,
  maxDistanceMeters: number,
): boolean {
  if (points.length < 3) {
    return false;
  }

  const first = points[0];
  if (!first) {
    return false;
  }

  return distanceMeters(first, point) <= maxDistanceMeters;
}

export function hasSelfIntersection(points: readonly MapCoordinate[]): boolean {
  if (points.length < 4) {
    return false;
  }

  for (let i = 0; i < points.length; i += 1) {
    const a1 = points[i];
    const a2 = points[(i + 1) % points.length];

    if (!a1 || !a2) {
      continue;
    }

    for (let j = i + 1; j < points.length; j += 1) {
      const b1 = points[j];
      const b2 = points[(j + 1) % points.length];

      if (!b1 || !b2) {
        continue;
      }

      // Skip adjacent segments and the first/last shared segment.
      if (Math.abs(i - j) <= 1 || (i === 0 && j === points.length - 1)) {
        continue;
      }

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
}

export function isPolygonInsideBoundary(
  candidatePoints: readonly MapCoordinate[],
  boundaryPoints: readonly MapCoordinate[],
): boolean {
  const candidate = toPolygonFeature(candidatePoints);
  const boundary = toPolygonFeature(boundaryPoints);
  if (!candidate || !boundary) {
    return false;
  }

  return booleanWithin(candidate, boundary);
}

export function isPointInsideBoundary(
  point: MapCoordinate,
  boundaryPoints: readonly MapCoordinate[],
): boolean {
  if (boundaryPoints.length < 3) {
    return false;
  }

  let inside = false;
  const pointLat = point.latitude;
  const pointLng = point.longitude;

  for (let i = 0, j = boundaryPoints.length - 1; i < boundaryPoints.length; j = i, i += 1) {
    const current = boundaryPoints[i];
    const previous = boundaryPoints[j];
    if (!current || !previous) {
      continue;
    }

    if (isPointOnSegment(point, previous, current)) {
      return true;
    }

    const currentLat = current.latitude;
    const currentLng = current.longitude;
    const previousLat = previous.latitude;
    const previousLng = previous.longitude;

    const intersects =
      currentLat > pointLat !== previousLat > pointLat &&
      pointLng <
        ((previousLng - currentLng) * (pointLat - currentLat)) / (previousLat - currentLat) +
          currentLng;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function intersectsAnyPolygon(
  candidatePoints: readonly MapCoordinate[],
  polygonSet: readonly MapCoordinate[][],
): boolean {
  const candidate = toPolygonFeature(candidatePoints);
  if (!candidate) {
    return false;
  }

  return polygonSet.some((points) => {
    const shape = toPolygonFeature(points);
    if (!shape) {
      return false;
    }

    return booleanIntersects(candidate, shape);
  });
}

export function normalizeEditablePolygon(points: readonly MapCoordinate[]): MapCoordinate[] {
  return points.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));
}

export function polygonAreaHectares(points: readonly MapCoordinate[]): number {
  const feature = toPolygonFeature(points);
  if (!feature) {
    return 0;
  }

  const areaSquareMeters = area(feature);
  if (!Number.isFinite(areaSquareMeters)) {
    return 0;
  }

  return areaSquareMeters / 10_000;
}
