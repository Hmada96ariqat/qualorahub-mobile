import { httpRequest } from '../../api/client/http';
import type { AuthSession, LoginRequest, RefreshRequest } from '../../types/auth';

type NestSessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_at?: string;
  expires_in?: number;
  user: {
    id: string;
    email: string;
    role?: string;
    type?: string;
  };
};

function toSession(payload: NestSessionPayload): AuthSession {
  const expiresAt = payload.expires_at
    ? Math.floor(new Date(payload.expires_at).getTime() / 1000)
    : Math.floor(Date.now() / 1000) + (payload.expires_in ?? 900);

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt,
    user: {
      id: payload.user.id,
      email: payload.user.email,
      role: payload.user.role,
      type: payload.user.type,
    },
  };
}

export async function login(input: LoginRequest): Promise<AuthSession> {
  const payload = await httpRequest<NestSessionPayload>('/auth/login', {
    method: 'POST',
    body: input,
  });
  return toSession(payload);
}

export async function refresh(input: RefreshRequest): Promise<AuthSession> {
  const payload = await httpRequest<NestSessionPayload>('/auth/refresh', {
    method: 'POST',
    body: input,
  });
  return toSession(payload);
}

export async function logout(refreshToken?: string): Promise<void> {
  await httpRequest('/auth/logout', {
    method: 'POST',
    body: refreshToken ? { refresh_token: refreshToken } : {},
  });
}
