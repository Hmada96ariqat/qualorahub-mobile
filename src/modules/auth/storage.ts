import * as SecureStore from 'expo-secure-store';
import type { AuthSession } from '../../types/auth';

const AUTH_SESSION_KEY = 'auth.session.v1';

function isValidSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;
  const v = value as AuthSession;
  return Boolean(
    typeof v.accessToken === 'string' &&
      typeof v.refreshToken === 'string' &&
      typeof v.expiresAt === 'number' &&
      v.user &&
      typeof v.user.id === 'string' &&
      typeof v.user.email === 'string',
  );
}

export async function readStoredSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return isValidSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeStoredSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function clearStoredSession(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}
