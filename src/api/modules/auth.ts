import { apiClient } from '../client';
import type { AuthSession } from '../../types/auth';
import type { operations } from '../generated/schema';
import { isRecord, readString } from './runtime-parsers';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  ResetPasswordRequest,
} from './auth-request-fallbacks';
export type {
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  ResetPasswordRequest,
} from './auth-request-fallbacks';

type JsonResponse<
  TOperation extends keyof operations,
  TStatus extends keyof operations[TOperation]['responses'],
> = operations[TOperation]['responses'][TStatus] extends {
  content: {
    'application/json': infer TPayload;
  };
}
  ? TPayload
  : unknown;

type AuthSessionResponse = JsonResponse<'AuthController_login_v1', 201>;
type AuthLogoutResponse = JsonResponse<'AuthController_logout_v1', 201>;
export type AuthRbacSnapshotResponse =
  JsonResponse<'AuthController_getRbacSnapshot_v1', 200>;
type AuthContextResponse = JsonResponse<'AuthController_getAuthContext_v1', 200>;

export type AuthContextSnapshot = {
  userId: string;
  email: string;
  role: string;
  type: string;
  farmId: string | null;
};

function toSession(payload: AuthSessionResponse): AuthSession {
  if (!isRecord(payload)) {
    throw new Error('Auth API returned an invalid login response payload.');
  }

  const user = isRecord(payload.user) ? payload.user : {};
  const accessToken = readString(payload, 'access_token');
  const refreshToken = readString(payload, 'refresh_token');
  const expiresAtRaw = readString(payload, 'expires_at');
  const expiresIn =
    typeof payload.expires_in === 'number' && Number.isFinite(payload.expires_in)
      ? payload.expires_in
      : 900;
  const expiresAt = expiresAtRaw
    ? Math.floor(new Date(expiresAtRaw).getTime() / 1000)
    : Math.floor(Date.now() / 1000) + expiresIn;

  if (!accessToken || !refreshToken) {
    throw new Error('Auth API response is missing required token fields.');
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    user: {
      id: readString(user, 'id'),
      email: readString(user, 'email'),
      role: readString(user, 'role'),
      type: readString(user, 'type'),
    },
  };
}

function parseAuthContextSnapshot(payload: AuthContextResponse): AuthContextSnapshot {
  if (!isRecord(payload)) {
    throw new Error('Auth API returned an invalid context response payload.');
  }

  const user = isRecord(payload.user) ? payload.user : {};
  const farm = isRecord(payload.farm) ? payload.farm : null;
  let farmId: string | null = null;
  if (farm && typeof farm.id === 'string') {
    farmId = farm.id;
  }

  return {
    userId: readString(user, 'id'),
    email: readString(user, 'email'),
    role: readString(user, 'role'),
    type: readString(user, 'type'),
    farmId,
  };
}

export async function login(input: LoginRequest): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthSessionResponse, LoginRequest>('/auth/login', {
    body: input,
  });
  return toSession(data);
}

export async function refresh(input: RefreshRequest): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthSessionResponse, RefreshRequest>('/auth/refresh', {
    body: input,
  });
  return toSession(data);
}

export async function logout(input?: LogoutRequest): Promise<void> {
  const body = input ?? {};
  await apiClient.post<AuthLogoutResponse, LogoutRequest | Record<string, never>>('/auth/logout', {
    body,
  });
}

export async function getAuthContext(token: string): Promise<AuthContextSnapshot> {
  const { data } = await apiClient.get<AuthContextResponse>('/auth/context', {
    token,
  });
  return parseAuthContextSnapshot(data);
}

export async function getRbacSnapshot(token: string): Promise<AuthRbacSnapshotResponse> {
  const { data } = await apiClient.get<AuthRbacSnapshotResponse>('/auth/rbac', {
    token,
  });
  return data;
}

export async function forgotPassword(input: ForgotPasswordRequest): Promise<void> {
  await apiClient.post<unknown, ForgotPasswordRequest>('/auth/forgot-password', {
    body: input,
  });
}

export async function resetPassword(input: ResetPasswordRequest): Promise<void> {
  await apiClient.post<unknown, ResetPasswordRequest>('/auth/reset-password', {
    body: input,
  });
}
