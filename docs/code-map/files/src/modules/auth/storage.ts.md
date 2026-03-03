# Code Map: `src/modules/auth/storage.ts`

## Purpose
Feature module implementation.

## Imports
- `import * as SecureStore from 'expo-secure-store';`
- `import type { AuthSession } from '../../types/auth';`

## Exports
- `export async function readStoredSession(): Promise<AuthSession | null> {`
- `export async function writeStoredSession(session: AuthSession): Promise<void> {`
- `export async function clearStoredSession(): Promise<void> {`
