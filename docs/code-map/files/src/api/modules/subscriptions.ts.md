# Code Map: `src/api/modules/subscriptions.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';`

## Exports
- `export type SubscriptionSnapshot = ExtractJsonResponse<`
- `export type EntitlementsSnapshot = ExtractJsonResponse<`
- `export type MenuAccessSnapshot = ExtractJsonResponse<`
- `export function normalizeMenuAccessKey(value: string): string | null {`
- `export async function getMySubscription(token: string): Promise<SubscriptionSnapshot> {`
- `export async function getMyEntitlements(token: string): Promise<EntitlementsSnapshot> {`
- `export async function getMyMenus(token: string): Promise<MenuAccessSnapshot> {`
- `export function extractMenuKeys(snapshot: MenuAccessSnapshot | null): Set<string> {`
- `export const SUBSCRIPTION_RESPONSE_BLOCKER_ID =`
