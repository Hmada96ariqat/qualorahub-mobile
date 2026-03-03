# Code Map: `src/modules/inventory/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type {`

## Exports
- `export type InventoryTab = 'products' | 'categories' | 'taxes' | 'warehouses';`
- `export type InventoryFormMode = 'create' | 'edit';`
- `export type InventoryStatusFilter = 'all' | 'active' | 'inactive';`
- `export type InventoryRowStatus = 'active' | 'inactive';`
- `export const INVENTORY_TAB_OPTIONS = [`
- `export const INVENTORY_STATUS_OPTIONS = [`
- `export const ROW_STATUS_OPTIONS = [`
- `export type CategoryFormValues = {`
- `export type TaxFormValues = {`
- `export type WarehouseFormValues = {`
- `export type ProductFormValues = {`
- `export function toCategoryFormValues(row?: InventoryCategory | null): CategoryFormValues {`
- `export function toTaxFormValues(row?: InventoryTax | null): TaxFormValues {`
- `export function toWarehouseFormValues(row?: InventoryWarehouse | null): WarehouseFormValues {`
- `export function toProductFormValues(row?: InventoryProduct | null): ProductFormValues {`
- `export function normalizeStatus(value: string): InventoryRowStatus {`
- `export function parseOptionalNumber(value: string): number | undefined {`
