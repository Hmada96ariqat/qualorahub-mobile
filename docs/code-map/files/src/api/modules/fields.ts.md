# Code Map: `src/api/modules/fields.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';`
- `import {`

## Exports
- `export type FieldStatus = 'active' | 'inactive' | string;`
- `export type FieldSummary = {`
- `export type InactiveFieldWithLots = FieldSummary & {`
- `export type CreateFieldFallbackRequest = {`
- `export type UpdateFieldFallbackRequest = Partial<CreateFieldFallbackRequest>;`
- `export type CreateFieldRequest = CreateFieldRequestContract | CreateFieldFallbackRequest;`
- `export type UpdateFieldRequest = UpdateFieldRequestContract | UpdateFieldFallbackRequest;`
- `export async function listFields(token: string): Promise<FieldSummary[]> {`
- `export async function listInactiveFieldsWithLots(token: string): Promise<InactiveFieldWithLots[]> {`
- `export async function getFieldById(token: string, fieldId: string): Promise<FieldSummary> {`
- `export async function createField(token: string, input: CreateFieldRequest): Promise<FieldSummary> {`
- `export async function updateField(`
- `export async function deactivateField(token: string, fieldId: string): Promise<FieldSummary> {`
- `export async function reactivateField(token: string, fieldId: string): Promise<FieldSummary> {`
- `export const FIELDS_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_REQUEST_DTOS;`
- `export const FIELDS_RESPONSE_SCHEMA_BLOCKER_ID = OPENAPI_BLOCKER_IDS.FIELDS_LOTS_RESPONSE_SCHEMAS;`
