import type { operations } from '../generated/schema';
import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';

type LoginRequestContract =
  operations['AuthController_login_v1']['requestBody']['content']['application/json'];
type RefreshRequestContract =
  operations['AuthController_refresh_v1']['requestBody']['content']['application/json'];
type LogoutRequestContract =
  operations['AuthController_logout_v1']['requestBody']['content']['application/json'];
type ForgotPasswordRequestContract =
  operations['AuthController_forgotPassword_v1']['requestBody']['content']['application/json'];
type ResetPasswordRequestContract =
  operations['AuthController_resetPassword_v1']['requestBody']['content']['application/json'];

export type AuthLoginFallbackRequest = {
  email: string;
  password: string;
};

export type AuthRefreshFallbackRequest = {
  refresh_token: string;
};

export type AuthForgotPasswordFallbackRequest = {
  email: string;
};

export type AuthResetPasswordFallbackRequest = {
  token: string;
  password: string;
};

// TODO(openapi-blocker: QH-OAPI-001): Remove fallback union once backend emits typed request DTOs.
export type LoginRequest = LoginRequestContract | AuthLoginFallbackRequest;

// TODO(openapi-blocker: QH-OAPI-001): Remove fallback union once backend emits typed request DTOs.
export type RefreshRequest = RefreshRequestContract | AuthRefreshFallbackRequest;

// TODO(openapi-blocker: QH-OAPI-001): Remove fallback union once backend emits typed request DTOs.
export type ForgotPasswordRequest =
  ForgotPasswordRequestContract | AuthForgotPasswordFallbackRequest;

// TODO(openapi-blocker: QH-OAPI-001): Remove fallback union once backend emits typed request DTOs.
export type ResetPasswordRequest =
  ResetPasswordRequestContract | AuthResetPasswordFallbackRequest;

export type LogoutRequest = LogoutRequestContract;

export const AUTH_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.AUTH_REQUEST_DTOS;
