# Code Map: `src/utils/geometry.ts`

## Purpose
Pure utility or guard helper.

## Imports
- `import booleanIntersects from '@turf/boolean-intersects';`
- `import booleanWithin from '@turf/boolean-within';`
- `import area from '@turf/area';`
- `import { polygon } from '@turf/helpers';`
- `import type { MapCoordinate } from './geojson';`

## Exports
- `export function distanceMeters(a: MapCoordinate, b: MapCoordinate): number {`
- `export function isNearFirstPoint(`
- `export function hasSelfIntersection(points: readonly MapCoordinate[]): boolean {`
- `export function isPolygonInsideBoundary(`
- `export function intersectsAnyPolygon(`
- `export function normalizeEditablePolygon(points: readonly MapCoordinate[]): MapCoordinate[] {`
- `export function polygonAreaHectares(points: readonly MapCoordinate[]): number {`
