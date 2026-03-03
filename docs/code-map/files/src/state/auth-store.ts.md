# Code Map: `src/state/auth-store.ts`

## Purpose
Global state container.

## Imports
- `import { create } from 'zustand';`
- `import type { AuthSession } from '../types/auth';`

## Exports
- `export const useAuthStore = create<AuthState>((set) => ({`
