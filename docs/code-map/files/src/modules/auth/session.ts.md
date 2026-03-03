# Code Map: `src/modules/auth/session.ts`

## Purpose
Feature module implementation.

## Imports
- `import { env } from '../../config/env';`
- `import type { AuthSession } from '../../types/auth';`

## Exports
- `export function isExpired(session: AuthSession): boolean {`
- `export function willExpireSoon(session: AuthSession): boolean {`
