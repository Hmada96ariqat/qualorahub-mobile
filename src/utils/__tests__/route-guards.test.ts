import { resolveProtectedRouteGuard, resolvePublicRouteGuard } from '../route-guards';
import type { AuthSession } from '../../types/auth';

const session: AuthSession = {
  accessToken: 'token',
  refreshToken: 'refresh',
  expiresAt: Math.floor(Date.now() / 1000) + 600,
  user: {
    id: 'u1',
    email: 'user@example.com',
  },
};

describe('route guard helpers', () => {
  it('protects public routes for authenticated users', () => {
    expect(resolvePublicRouteGuard(session, false)).toBe('redirect-protected');
    expect(resolvePublicRouteGuard(null, false)).toBe('render');
    expect(resolvePublicRouteGuard(null, true)).toBe('loading');
  });

  it('protects private routes for unauthenticated users', () => {
    expect(resolveProtectedRouteGuard(null, false)).toBe('redirect-public');
    expect(resolveProtectedRouteGuard(session, false)).toBe('render');
    expect(resolveProtectedRouteGuard(null, true)).toBe('loading');
  });
});
