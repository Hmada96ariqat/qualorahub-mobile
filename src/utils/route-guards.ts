import type { AuthSession } from '../types/auth';

export type PublicRouteDecision = 'loading' | 'redirect-protected' | 'render';
export type ProtectedRouteDecision = 'loading' | 'redirect-public' | 'render';

export function resolvePublicRouteGuard(
  session: AuthSession | null,
  loading: boolean,
): PublicRouteDecision {
  if (loading) return 'loading';
  if (session) return 'redirect-protected';
  return 'render';
}

export function resolveProtectedRouteGuard(
  session: AuthSession | null,
  loading: boolean,
): ProtectedRouteDecision {
  if (loading) return 'loading';
  if (!session) return 'redirect-public';
  return 'render';
}
