# Code Map: `src/modules/auth/api.ts`

## Purpose
Feature module implementation.

## Imports
- `import {`
- `import type {`
- `import type { AuthSession } from '../../types/auth';`

## Exports
- `export async function login(input: LoginRequest): Promise<AuthSession> {`
- `export async function refresh(input: RefreshRequest): Promise<AuthSession> {`
- `export async function logout(refreshToken?: string): Promise<void> {`
- `export async function forgotPassword(input: ForgotPasswordRequest): Promise<void> {`
- `export async function resetPassword(input: ResetPasswordRequest): Promise<void> {`
