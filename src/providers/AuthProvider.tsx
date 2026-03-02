import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthSession } from '../types/auth';
import { login, logout, refresh } from '../modules/auth/api';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '../modules/auth/storage';
import { isExpired, willExpireSoon } from '../modules/auth/session';

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const stored = await readStoredSession();
        if (!stored) return;

        if (isExpired(stored) || willExpireSoon(stored)) {
          const next = await refresh({ refresh_token: stored.refreshToken });
          if (!active) return;
          setSession(next);
          await writeStoredSession(next);
          return;
        }

        if (!active) return;
        setSession(stored);
      } catch {
        await clearStoredSession();
        if (active) setSession(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  async function signIn(email: string, password: string): Promise<void> {
    const next = await login({ email, password });
    setSession(next);
    await writeStoredSession(next);
  }

  async function signOut(): Promise<void> {
    try {
      await logout(session?.refreshToken);
    } catch {
      // Clear local state even if API logout fails.
    } finally {
      setSession(null);
      await clearStoredSession();
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signIn,
      signOut,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
