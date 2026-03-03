# Code Map: `src/api/modules/inventory.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import {`
- `import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';`

## Exports
- `export type InventoryStatus = 'active' | 'inactive' | string;`
- `export type PaginatedCatalogResult<T> = {`
- `export type CatalogListOptions = {`
- `export type InventoryCategory = {`
- `export type InventoryTax = {`
- `export type InventoryWarehouse = {`
- `export type InventoryProduct = {`
- `export type StockAdjustmentProduct = {`
- `export type InventoryContactOption = {`
- `export type InventoryCropOption = {`
- `export type CreateCategoryRequest = CreateCategoryRequestContract;`
- `export type UpdateCategoryRequest = UpdateCategoryRequestContract;`
- `export type CreateTaxRequest = CreateTaxRequestContract;`
- `export type UpdateTaxRequest = UpdateTaxRequestContract;`
- `export type CreateWarehouseRequest = CreateWarehouseRequestContract;`
- `export type UpdateWarehouseRequest = UpdateWarehouseRequestContract;`
- `export type CreateContactRequest = CreateContactRequestContract;`
- `export type CreateProductRequest = CreateProductRequestContract;`
- `export type UpdateProductRequest = UpdateProductRequestContract;`
- `export type CreateInventoryContactRequest =`
- `export type HardDeleteProductsRequest =`
- `export async function listCategories(`
- `export async function createCategory(`
- `export async function updateCategory(`
- `export async function enableStorefrontForActiveCategories(token: string): Promise<number> {`
- `export async function listTaxes(`
- `export async function createTax(`
- `export async function updateTax(`
- `export async function listWarehouses(`
- `export async function createWarehouse(`
- `export async function updateWarehouse(`
- `export async function listProducts(`
- `export async function listStockAdjustmentProducts(`
- `export async function listSupplierContacts(token: string): Promise<InventoryContactOption[]> {`
- `export async function listManufacturerContacts(token: string): Promise<InventoryContactOption[]> {`
- `export async function createInventoryContact(`
- `export async function listCropsForGuidance(token: string): Promise<InventoryCropOption[]> {`
- `export async function createProduct(`
- `export async function updateProduct(`
- `export async function hardDeleteProducts(`
