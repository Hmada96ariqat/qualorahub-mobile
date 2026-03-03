# Code Map: `src/providers/AuthProvider.tsx`

## Purpose
App-level provider and dependency wiring.

## Imports
- `import React, {`
- `import type { AuthSession } from '../types/auth';`
- `import type { AuthRbacSnapshotResponse, AuthContextSnapshot } from '../api/modules/auth';`
- `import { login, logout, refresh } from '../modules/auth/api';`
- `import { getAuthContext, getRbacSnapshot } from '../api/modules/auth';`
- `import {`
- `import { setUnauthorizedHandler } from '../api/client';`
- `import {`
- `import { isExpired, willExpireSoon } from '../modules/auth/session';`

## Exports
- `export type AuthAccessSnapshot = {`
- `export function AuthProvider({ children }: { children: React.ReactNode }) {`
- `export function useAuth(): AuthContextValue {`
