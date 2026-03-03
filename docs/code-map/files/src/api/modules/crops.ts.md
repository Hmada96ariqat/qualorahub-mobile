# Code Map: `src/api/modules/crops.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import {`

## Exports
- `export type CreateCropRequest =`
- `export type UpdateCropRequest =`
- `export type UpdateCropStatusRequest =`
- `export type CreateProductionCycleRequest =`
- `export type CloseProductionCycleRequest =`
- `export type UpdateProductionCycleNotesRequest =`
- `export type CreateProductionCycleOperationRequest =`
- `export type UpdateProductionCycleOperationRequest =`
- `export type LogbookSubmitRequest =`
- `export type LogbookSessionQuery = operations['LogbookController_getSession_v1']['parameters']['query'];`
- `export type LogbookPracticeCatalogQuery =`
- `export type CropSummary = {`
- `export type ProductionCycleSummary = {`
- `export type ProductionCycleOperationSummary = {`
- `export type LogbookFieldOption = {`
- `export type LogbookCategoryFamily = {`
- `export type LogbookCategoryOption = {`
- `export type LogbookEntityOption = {`
- `export type LogbookSessionSnapshot = {`
- `export type LogbookPracticeOption = {`
- `export type LogbookPracticeCatalog = {`
- `export type LogbookSubmitResult = {`
- `export async function listProductionCycles(token: string): Promise<ProductionCycleSummary[]> {`
- `export async function createProductionCycle(`
- `export async function getProductionCycleById(`
- `export async function getProductionCycleSummary(`
- `export async function closeProductionCycle(`
- `export async function updateProductionCycleNotes(`
- `export async function listProductionCycleOperations(`
- `export async function createProductionCycleOperation(`
- `export async function updateProductionCycleOperation(`
- `export async function deleteProductionCycleOperation(`
- `export async function createCrop(token: string, input: CreateCropRequest): Promise<CropSummary> {`
- `export async function updateCrop(`
- `export async function updateCropStatus(`
- `export async function getLogbookSession(`
- `export async function getLogbookPracticeCatalog(`
- `export async function submitLogbook(`
