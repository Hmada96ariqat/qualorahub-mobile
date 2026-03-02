import { env } from '../../config/env';
import type { AuthSession } from '../../types/auth';

const safeSkew = Number.isFinite(env.refreshSkewSeconds) ? env.refreshSkewSeconds : 60;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function isExpired(session: AuthSession): boolean {
  return session.expiresAt <= nowSeconds();
}

export function willExpireSoon(session: AuthSession): boolean {
  return session.expiresAt <= nowSeconds() + safeSkew;
}
