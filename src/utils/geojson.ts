export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCoordinate(value: unknown): value is MapCoordinate {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return isFiniteNumber(candidate.latitude) && isFiniteNumber(candidate.longitude);
}

function toRingCoordinates(points: MapCoordinate[]): number[][] {
  if (points.length === 0) {
    return [];
  }

  const ring = points.map((point) => [point.longitude, point.latitude]);
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

export function normalizeMapCoordinates(points: readonly MapCoordinate[]): MapCoordinate[] {
  return points.filter((point): point is MapCoordinate => isCoordinate(point));
}

export function toGeoJsonPolygon(points: readonly MapCoordinate[]): GeoJsonPolygon | null {
  const normalized = normalizeMapCoordinates(points);
  if (normalized.length < 3) {
    return null;
  }

  return {
    type: 'Polygon',
    coordinates: [toRingCoordinates(normalized)],
  };
}

export function fromGeoJsonPolygon(input: unknown): MapCoordinate[] {
  if (!input || typeof input !== 'object') {
    return [];
  }

  const candidate = input as Record<string, unknown>;
  if (candidate.type !== 'Polygon' || !Array.isArray(candidate.coordinates)) {
    return [];
  }

  const firstRing = candidate.coordinates[0];
  if (!Array.isArray(firstRing)) {
    return [];
  }

  const points: MapCoordinate[] = [];
  for (const entry of firstRing) {
    if (!Array.isArray(entry) || entry.length < 2) {
      continue;
    }

    const [longitude, latitude] = entry;
    if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
      continue;
    }

    points.push({ latitude, longitude });
  }

  if (points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    if (first.latitude === last.latitude && first.longitude === last.longitude) {
      points.pop();
    }
  }

  return points;
}
