# Code Map: `src/modules/crops/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type {`

## Exports
- `export const CROP_STATUS_OPTIONS = [`
- `export type CropStatusValue = (typeof CROP_STATUS_OPTIONS)[number]['value'];`
- `export type CropFormMode = 'create' | 'edit';`
- `export type CropFormValues = {`
- `export type CycleFormValues = {`
- `export type CycleCloseFormValues = {`
- `export const CYCLE_LIST_MODE_OPTIONS = [`
- `export type CycleListMode = (typeof CYCLE_LIST_MODE_OPTIONS)[number]['value'];`
- `export const OPERATION_TYPE_OPTIONS = [`
- `export type OperationTypeValue = (typeof OPERATION_TYPE_OPTIONS)[number]['value'];`
- `export type OperationFormMode = 'create' | 'edit';`
- `export type OperationFormValues = {`
- `export const LOGBOOK_CATEGORY_OPTIONS = [`
- `export type LogbookCategoryValue = (typeof LOGBOOK_CATEGORY_OPTIONS)[number]['value'];`
- `export const LOGBOOK_ENTITY_TYPE_OPTIONS = [`
- `export type LogbookEntityTypeValue = (typeof LOGBOOK_ENTITY_TYPE_OPTIONS)[number]['value'];`
- `export const LOGBOOK_FAMILY_OPTIONS = [`
- `export type LogbookFamilyValue = (typeof LOGBOOK_FAMILY_OPTIONS)[number]['value'];`
- `export type LogbookFormValues = {`
- `export function toCropFormValues(crop?: CropSummary | null): CropFormValues {`
- `export function toCycleFormValues(cycle?: ProductionCycleSummary | null): CycleFormValues {`
- `export function toCycleCloseFormValues(cycle?: ProductionCycleSummary | null): CycleCloseFormValues {`
- `export function toOperationFormValues(`
- `export function toLogbookFormValues(fieldId?: string | null): LogbookFormValues {`
- `export function normalizeCycleListMode(status: string): CycleListMode {`
