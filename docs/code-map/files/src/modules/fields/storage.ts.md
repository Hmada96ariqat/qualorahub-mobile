# Code Map: `src/modules/fields/storage.ts`

## Purpose
Feature module implementation.

## Imports
- `import AsyncStorage from '@react-native-async-storage/async-storage';`

## Exports
- `export type PersistedFieldAreaUnit = 'hectares' | 'acres' | 'manzana';`
- `export async function readFieldAreaUnitPreference(): Promise<PersistedFieldAreaUnit> {`
- `export async function writeFieldAreaUnitPreference(unit: PersistedFieldAreaUnit): Promise<void> {`
- `export const FIELD_AREA_UNIT_STORAGE_KEY = FIELD_AREA_UNIT_KEY;`
