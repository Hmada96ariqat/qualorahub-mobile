import {
  forgotPassword as forgotPasswordRequest,
  login as loginRequest,
  logout as logoutRequest,
  refresh as refreshRequest,
  resetPassword as resetPasswordRequest,
} from '../../api/modules/auth';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RefreshRequest,
  ResetPasswordRequest,
} from '../../api/modules/auth';
import type { AuthSession } from '../../types/auth';

export async function login(input: LoginRequest): Promise<AuthSession> {
  return loginRequest(input);
}

export async function refresh(input: RefreshRequest): Promise<AuthSession> {
  return refreshRequest(input);
}

export async function logout(refreshToken?: string): Promise<void> {
  await logoutRequest(refreshToken ? { refresh_token: refreshToken } : undefined);
}

export async function forgotPassword(input: ForgotPasswordRequest): Promise<void> {
  await forgotPasswordRequest(input);
}

export async function resetPassword(input: ResetPasswordRequest): Promise<void> {
  await resetPasswordRequest(input);
}
