# Code Map: `src/utils/route-guards.ts`

## Purpose
Pure utility or guard helper.

## Imports
- `import type { AuthSession } from '../types/auth';`

## Exports
- `export type PublicRouteDecision = 'loading' | 'redirect-protected' | 'render';`
- `export type ProtectedRouteDecision = 'loading' | 'redirect-public' | 'render';`
- `export function resolvePublicRouteGuard(`
- `export function resolveProtectedRouteGuard(`
