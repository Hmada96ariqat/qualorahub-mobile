import { isExpired, willExpireSoon } from '../session';
import type { AuthSession } from '../../../types/auth';

function makeSession(expiresAt: number): AuthSession {
  return {
    accessToken: 'a',
    refreshToken: 'r',
    expiresAt,
    user: {
      id: 'u1',
      email: 'user@example.com',
    },
  };
}

describe('auth session helpers', () => {
  it('detects expired sessions', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isExpired(makeSession(now - 1))).toBe(true);
    expect(isExpired(makeSession(now + 60))).toBe(false);
  });

  it('flags sessions that will expire soon based on skew', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(willExpireSoon(makeSession(now + 30))).toBe(true);
    expect(willExpireSoon(makeSession(now + 3600))).toBe(false);
  });
});
