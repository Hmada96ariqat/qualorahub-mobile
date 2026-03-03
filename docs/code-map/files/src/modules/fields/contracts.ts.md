# Code Map: `src/modules/fields/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type { FieldSummary } from '../../api/modules/fields';`

## Exports
- `export const FIELD_AREA_UNIT_OPTIONS = [`
- `export type FieldAreaUnit = (typeof FIELD_AREA_UNIT_OPTIONS)[number]['value'];`
- `export type FieldFormValues = {`
- `export type FieldFormMode = 'create' | 'edit';`
- `export type FieldListMode = 'active' | 'inactive';`
- `export function toFieldFormValues(field?: FieldSummary | null): FieldFormValues {`
