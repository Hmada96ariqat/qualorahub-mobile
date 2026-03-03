# Code Map: `src/api/modules/lots.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';`
- `import {`

## Exports
- `export type LotType =`
- `export type CropRotationPlan =`
- `export type LightProfile =`
- `export type LotStatus = 'active' | 'inactive' | string;`
- `export type LotStatusFilter = 'active' | 'inactive' | 'all';`
- `export type LotSummary = {`
- `export type CreateLotFallbackRequest = {`
- `export type UpdateLotFallbackRequest = Partial<CreateLotFallbackRequest>;`
- `export type CreateLotRequest = CreateLotRequestContract | CreateLotFallbackRequest;`
- `export type UpdateLotRequest = UpdateLotRequestContract | UpdateLotFallbackRequest;`
- `export async function listLots(`
- `export async function listInactiveLotsWithFields(token: string): Promise<LotSummary[]> {`
- `export async function createLot(token: string, input: CreateLotRequest): Promise<LotSummary> {`
- `export async function updateLot(`
- `export async function setLotStatus(`
- `export async function deactivateLot(token: string, lotId: string): Promise<LotSummary> {`
- `export async function reactivateLotMain(token: string, lotId: string): Promise<LotSummary> {`
- `export async function reactivateLotFromDeactivated(token: string, lotId: string): Promise<LotSummary> {`
- `export const reactivateLot = reactivateLotFromDeactivated;`
- `export const LOTS_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_REQUEST_DTOS;`
- `export const LOTS_RESPONSE_SCHEMA_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_RESPONSE_SCHEMAS;`
