# Code Map: `src/api/modules/dashboard.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';`
- `import { isRecord } from './runtime-parsers';`

## Exports
- `export type DashboardSnapshot = {`
- `export async function getDashboardSnapshot(token: string): Promise<DashboardSnapshot> {`
- `export const DASHBOARD_RESPONSE_SCHEMA_BLOCKER_ID =`
