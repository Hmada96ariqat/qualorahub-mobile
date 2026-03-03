# Code Map: `src/api/modules/lots.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';`
- `import {`

## Exports
- `export type LotStatus = 'active' | 'inactive' | string;`
- `export type LotSummary = {`
- `export type CreateLotFallbackRequest = {`
- `export type UpdateLotFallbackRequest = Partial<CreateLotFallbackRequest>;`
- `export type CreateLotRequest = CreateLotRequestContract | CreateLotFallbackRequest;`
- `export type UpdateLotRequest = UpdateLotRequestContract | UpdateLotFallbackRequest;`
- `export async function listLots(token: string): Promise<LotSummary[]> {`
- `export async function listInactiveLotsWithFields(token: string): Promise<LotSummary[]> {`
- `export async function createLot(token: string, input: CreateLotRequest): Promise<LotSummary> {`
- `export async function updateLot(`
- `export async function deactivateLot(token: string, lotId: string): Promise<LotSummary> {`
- `export async function reactivateLot(token: string, lotId: string): Promise<LotSummary> {`
- `export const LOTS_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_REQUEST_DTOS;`
- `export const LOTS_RESPONSE_SCHEMA_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_RESPONSE_SCHEMAS;`
