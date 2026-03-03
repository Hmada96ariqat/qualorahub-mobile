import {
  distanceMeters,
  hasSelfIntersection,
  intersectsAnyPolygon,
  isNearFirstPoint,
  isPointInsideBoundary,
  isPolygonInsideBoundary,
  polygonAreaHectares,
} from '../geometry';

describe('geometry utils', () => {
  const fieldBoundary = [
    { latitude: 31.95, longitude: 35.91 },
    { latitude: 31.95, longitude: 35.92 },
    { latitude: 31.96, longitude: 35.92 },
    { latitude: 31.96, longitude: 35.91 },
  ];

  it('measures haversine distance in meters', () => {
    const meters = distanceMeters(
      { latitude: 31.95, longitude: 35.91 },
      { latitude: 31.9501, longitude: 35.9101 },
    );

    expect(meters).toBeGreaterThan(10);
    expect(meters).toBeLessThan(20);
  });

  it('detects snap-to-close proximity', () => {
    const near = isNearFirstPoint(
      [
        { latitude: 31.95, longitude: 35.91 },
        { latitude: 31.951, longitude: 35.911 },
        { latitude: 31.952, longitude: 35.912 },
      ],
      { latitude: 31.95001, longitude: 35.91001 },
      15,
    );

    expect(near).toBe(true);
  });

  it('detects polygon self intersection', () => {
    const bowTie = [
      { latitude: 31.95, longitude: 35.91 },
      { latitude: 31.96, longitude: 35.92 },
      { latitude: 31.95, longitude: 35.92 },
      { latitude: 31.96, longitude: 35.91 },
    ];

    expect(hasSelfIntersection(bowTie)).toBe(true);
  });

  it('checks polygon-inside-boundary', () => {
    const lotInside = [
      { latitude: 31.951, longitude: 35.911 },
      { latitude: 31.951, longitude: 35.919 },
      { latitude: 31.959, longitude: 35.919 },
      { latitude: 31.959, longitude: 35.911 },
    ];

    expect(isPolygonInsideBoundary(lotInside, fieldBoundary)).toBe(true);
  });

  it('checks point-inside-boundary', () => {
    expect(
      isPointInsideBoundary(
        { latitude: 31.955, longitude: 35.915 },
        fieldBoundary,
      ),
    ).toBe(true);
    expect(
      isPointInsideBoundary(
        { latitude: 31.970, longitude: 35.930 },
        fieldBoundary,
      ),
    ).toBe(false);
  });

  it('treats points on polygon edge as inside', () => {
    expect(
      isPointInsideBoundary(
        { latitude: 31.95, longitude: 35.915 },
        fieldBoundary,
      ),
    ).toBe(true);
  });

  it('checks overlap against occupied polygons', () => {
    const occupied = [
      [
        { latitude: 31.951, longitude: 35.911 },
        { latitude: 31.951, longitude: 35.914 },
        { latitude: 31.954, longitude: 35.914 },
        { latitude: 31.954, longitude: 35.911 },
      ],
    ];
    const candidate = [
      { latitude: 31.953, longitude: 35.913 },
      { latitude: 31.953, longitude: 35.916 },
      { latitude: 31.956, longitude: 35.916 },
      { latitude: 31.956, longitude: 35.913 },
    ];

    expect(intersectsAnyPolygon(candidate, occupied)).toBe(true);
  });

  it('calculates polygon area in hectares', () => {
    const hectares = polygonAreaHectares(fieldBoundary);
    expect(hectares).toBeGreaterThan(0.5);
    expect(hectares).toBeLessThan(200);
  });
});
