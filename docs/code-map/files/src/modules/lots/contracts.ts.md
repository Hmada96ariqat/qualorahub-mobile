# Code Map: `src/modules/lots/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type {`
- `import type { MapCoordinate } from '../../utils/geojson';`
- `import { fromGeoJsonPolygon } from '../../utils/geojson';`

## Exports
- `export const LOT_PAGE_SIZE = 12;`
- `export const LOT_TYPE_OPTIONS = [`
- `export const CROP_ROTATION_OPTIONS = [`
- `export const LIGHT_PROFILE_OPTIONS = [`
- `export const LOT_STATUS_FILTER_OPTIONS = [`
- `export type LotStatusFilter = (typeof LOT_STATUS_FILTER_OPTIONS)[number]['value'];`
- `export type LotFormMode = 'create' | 'edit';`
- `export type LotFormStep = 1 | 2 | 3;`
- `export type LotFormValues = {`
- `export function toLotFormValues(lot?: LotSummary | null): LotFormValues {`
- `export function parseCsvValues(value: string): string[] {`
- `export function buildLotSearchText(lot: LotSummary): string {`
