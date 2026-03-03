# Code Map: `src/modules/lots/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type { LotSummary } from '../../api/modules/lots';`

## Exports
- `export const LOT_TYPE_OPTIONS = [`
- `export const CROP_ROTATION_OPTIONS = [`
- `export const LIGHT_PROFILE_OPTIONS = [`
- `export type LotType = (typeof LOT_TYPE_OPTIONS)[number]['value'];`
- `export type CropRotation = (typeof CROP_ROTATION_OPTIONS)[number]['value'];`
- `export type LightProfile = (typeof LIGHT_PROFILE_OPTIONS)[number]['value'];`
- `export type LotFormValues = {`
- `export type LotFormMode = 'create' | 'edit';`
- `export type LotListMode = 'active' | 'inactive';`
- `export function toLotFormValues(lot?: LotSummary | null): LotFormValues {`
