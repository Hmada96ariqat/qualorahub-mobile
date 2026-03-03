# Code Map: `src/modules/fields/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type { FieldSummary, FieldStatus } from '../../api/modules/fields';`
- `import type { MapCoordinate } from '../../utils/geojson';`
- `import { fromGeoJsonPolygon } from '../../utils/geojson';`

## Exports
- `export const FIELD_PAGE_SIZE = 12;`
- `export const FIELD_AREA_UNIT_OPTIONS = [`
- `export const FIELD_STATUS_FILTER_OPTIONS = [`
- `export type FieldAreaUnit = (typeof FIELD_AREA_UNIT_OPTIONS)[number]['value'];`
- `export type FieldStatusFilter = (typeof FIELD_STATUS_FILTER_OPTIONS)[number]['value'];`
- `export type FieldFormMode = 'create' | 'edit';`
- `export type ManualAreaFallback = {`
- `export type FieldFormValues = {`
- `export function toFieldFormValues(`
- `export function hectaresToDisplay(hectares: number, unit: FieldAreaUnit): number {`
- `export function displayToHectares(areaValue: number, unit: FieldAreaUnit): number {`
- `export function formatDisplayArea(hectares: string | number, unit: FieldAreaUnit): string {`
- `export function formatCanonicalHectares(value: number): string {`
- `export function parseUserAreaInput(value: string): number | null {`
- `export function buildFieldSearchText(field: FieldSummary): string {`
- `export function toAreaUnitLabel(unit: FieldAreaUnit): string {`
