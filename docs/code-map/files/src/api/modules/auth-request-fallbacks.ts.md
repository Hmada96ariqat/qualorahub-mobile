# Code Map: `src/api/modules/auth-request-fallbacks.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import type { operations } from '../generated/schema';`
- `import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';`

## Exports
- `export type AuthLoginFallbackRequest = {`
- `export type AuthRefreshFallbackRequest = {`
- `export type AuthForgotPasswordFallbackRequest = {`
- `export type AuthResetPasswordFallbackRequest = {`
- `export type LoginRequest = LoginRequestContract | AuthLoginFallbackRequest;`
- `export type RefreshRequest = RefreshRequestContract | AuthRefreshFallbackRequest;`
- `export type ForgotPasswordRequest =`
- `export type ResetPasswordRequest =`
- `export type LogoutRequest = LogoutRequestContract;`
- `export const AUTH_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.AUTH_REQUEST_DTOS;`
