# Code Map: `src/modules/equipment/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type {`

## Exports
- `export const EQUIPMENT_STATUS_OPTIONS = [`
- `export const USAGE_PURPOSE_OPTIONS = [`
- `export const MAINTENANCE_SERVICE_TYPE_OPTIONS = [`
- `export type EquipmentStatusOption = (typeof EQUIPMENT_STATUS_OPTIONS)[number]['value'];`
- `export type UsagePurposeOption = (typeof USAGE_PURPOSE_OPTIONS)[number]['value'];`
- `export type MaintenanceServiceTypeOption =`
- `export type EquipmentFormMode = 'create' | 'edit';`
- `export type UsageLogFormMode = 'create' | 'edit';`
- `export type MaintenanceFormMode = 'create' | 'edit';`
- `export type EquipmentListMode = 'active' | 'inactive';`
- `export type EquipmentFormValues = {`
- `export type UsageLogFormValues = {`
- `export type MaintenanceFormValues = {`
- `export function normalizeEquipmentStatus(value: string | null | undefined): EquipmentStatusOption {`
- `export function normalizeUsagePurpose(value: string | null | undefined): UsagePurposeOption {`
- `export function normalizeServiceType(`
- `export function toEquipmentFormValues(equipment?: EquipmentDetail | null): EquipmentFormValues {`
- `export function toUsageLogFormValues(log?: EquipmentUsageLog | null): UsageLogFormValues {`
- `export function toMaintenanceFormValues(`
