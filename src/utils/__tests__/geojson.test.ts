import { fromGeoJsonPolygon, toGeoJsonPolygon } from '../geojson';

describe('geojson utils', () => {
  it('creates a closed GeoJSON polygon from map points', () => {
    const polygon = toGeoJsonPolygon([
      { latitude: 31.95, longitude: 35.91 },
      { latitude: 31.951, longitude: 35.912 },
      { latitude: 31.952, longitude: 35.913 },
    ]);

    expect(polygon).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [35.91, 31.95],
          [35.912, 31.951],
          [35.913, 31.952],
          [35.91, 31.95],
        ],
      ],
    });
  });

  it('returns null when there are fewer than three points', () => {
    const polygon = toGeoJsonPolygon([
      { latitude: 31.95, longitude: 35.91 },
      { latitude: 31.951, longitude: 35.912 },
    ]);

    expect(polygon).toBeNull();
  });

  it('parses GeoJSON polygon into unclosed map points', () => {
    const points = fromGeoJsonPolygon({
      type: 'Polygon',
      coordinates: [
        [
          [35.91, 31.95],
          [35.912, 31.951],
          [35.913, 31.952],
          [35.91, 31.95],
        ],
      ],
    });

    expect(points).toEqual([
      { latitude: 31.95, longitude: 35.91 },
      { latitude: 31.951, longitude: 35.912 },
      { latitude: 31.952, longitude: 35.913 },
    ]);
  });

  it('returns empty points for invalid payloads', () => {
    expect(fromGeoJsonPolygon(null)).toEqual([]);
    expect(fromGeoJsonPolygon({ type: 'Point', coordinates: [35.9, 31.9] })).toEqual([]);
  });
});
