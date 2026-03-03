# Code Map: `src/api/modules/auth.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { AuthSession } from '../../types/auth';`
- `import type { operations } from '../generated/schema';`
- `import { isRecord, readString } from './runtime-parsers';`
- `import type {`

## Exports
- `export type {`
- `export type AuthRbacSnapshotResponse =`
- `export type AuthContextSnapshot = {`
- `export async function login(input: LoginRequest): Promise<AuthSession> {`
- `export async function refresh(input: RefreshRequest): Promise<AuthSession> {`
- `export async function logout(input?: LogoutRequest): Promise<void> {`
- `export async function getAuthContext(token: string): Promise<AuthContextSnapshot> {`
- `export async function getRbacSnapshot(token: string): Promise<AuthRbacSnapshotResponse> {`
- `export async function forgotPassword(input: ForgotPasswordRequest): Promise<void> {`
- `export async function resetPassword(input: ResetPasswordRequest): Promise<void> {`
