# Code Map: `src/modules/inventory/product-form.ts`

## Purpose
Feature module implementation.

## Imports
- `import type {`
- `import {`

## Exports
- `export type ProductWizardStep = 'a' | 'b' | 'c';`
- `export type ProductUsageType = 'Both' | 'Selling' | 'FarmInput';`
- `export type ProductInventoryRecordForm = {`
- `export type ProductCropGuidanceRowForm = {`
- `export type ProductFormValues = {`
- `export type ProductValidationErrors = Partial<Record<string, string>>;`
- `export const PRODUCT_TYPE_OPTIONS = [`
- `export const PRODUCT_USAGE_TYPE_OPTIONS = [`
- `export const PRODUCT_DOSE_UNIT_OPTIONS = DOSE_UNIT_OPTIONS.map((unit) => ({`
- `export const PRODUCT_FORM_OPTIONS = PRODUCT_FORM_GROUPS.flatMap((group) =>`
- `export const ACTIVE_INGREDIENT_OPTIONS = ACTIVE_INGREDIENT_GROUPS.flatMap((group) =>`
- `export function isPesticideFamilyProductType(productType: string): boolean {`
- `export function getVisibleProductSteps(productType: string): ProductWizardStep[] {`
- `export function createEmptyInventoryRecord(): ProductInventoryRecordForm {`
- `export function createEmptyCropGuidanceRow(): ProductCropGuidanceRowForm {`
- `export function createEmptyProductFormValues(): ProductFormValues {`
- `export function normalizeDoseUnitForEdit(`
- `export function toProductFormValues(row?: InventoryProduct | null): ProductFormValues {`
- `export function clearRegulatoryAgronomicFields(values: ProductFormValues): ProductFormValues {`
- `export function enforceUsageTypeRules(values: ProductFormValues): ProductFormValues {`
- `export function deriveTargetOrganismsFromIngredients(ingredients: string[]): string {`
- `export function validateProductFormValues(values: ProductFormValues): ProductValidationErrors {`
- `export function buildProductPayload(`
