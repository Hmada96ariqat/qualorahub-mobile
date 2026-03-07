import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { AuthSession } from '../types/auth';
import type { AuthRbacSnapshotResponse, AuthContextSnapshot } from '../api/modules/auth';
import { login, logout, refresh } from '../modules/auth/api';
import { getAuthContext, getRbacSnapshot } from '../api/modules/auth';
import {
  extractMenuKeys,
  getMyEntitlements,
  getMyMenus,
  normalizeMenuAccessKey,
  type EntitlementsSnapshot,
  type MenuAccessSnapshot,
} from '../api/modules/subscriptions';
import { setUnauthorizedHandler, setForbiddenHandler } from '../api/client';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '../modules/auth/storage';
import { isExpired, willExpireSoon } from '../modules/auth/session';
import { ApiError } from '../api/client';

export type AuthAccessSnapshot = {
  context: AuthContextSnapshot | null;
  rbac: AuthRbacSnapshotResponse | null;
  entitlements: EntitlementsSnapshot | null;
  menus: MenuAccessSnapshot | null;
};

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  accessLoading: boolean;
  accessSnapshot: AuthAccessSnapshot;
  sessionNotice: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearSessionNotice: () => void;
  hasMenuAccess: (menuKey: string) => boolean;
  /** Manually trigger a refresh of RBAC, entitlements, and menus (e.g. pull-to-refresh). */
  refreshAccessSnapshot: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const EMPTY_ACCESS_SNAPSHOT: AuthAccessSnapshot = {
  context: null,
  rbac: null,
  entitlements: null,
  menus: null,
};

type AccessContractState = {
  entitlements: 'idle' | 'ready' | 'error';
  menus: 'idle' | 'ready' | 'error';
};

const EMPTY_ACCESS_CONTRACT_STATE: AccessContractState = {
  entitlements: 'idle',
  menus: 'idle',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessSnapshot, setAccessSnapshot] = useState<AuthAccessSnapshot>(EMPTY_ACCESS_SNAPSHOT);
  const [accessContractState, setAccessContractState] =
    useState<AccessContractState>(EMPTY_ACCESS_CONTRACT_STATE);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthSession | null> | null>(null);
  const unauthorizedLockRef = useRef(false);
  const sessionRef = useRef<AuthSession | null>(null);

  // Keep sessionRef in sync so AppState callback always has the latest session
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const hydrateAccessSnapshot = useCallback(async (accessToken: string): Promise<void> => {
    setAccessLoading(true);
    setAccessContractState(EMPTY_ACCESS_CONTRACT_STATE);

    try {
      const [context, rbac] = await Promise.all([
        getAuthContext(accessToken),
        getRbacSnapshot(accessToken),
      ]);

      const [entitlementsResult, menusResult] = await Promise.allSettled([
        getMyEntitlements(accessToken),
        getMyMenus(accessToken),
      ]);

      const entitlements = entitlementsResult.status === 'fulfilled' ? entitlementsResult.value : null;
      const menus = menusResult.status === 'fulfilled' ? menusResult.value : null;

      setAccessSnapshot({
        context,
        rbac,
        entitlements,
        menus,
      });

      setAccessContractState({
        entitlements: entitlementsResult.status === 'fulfilled' ? 'ready' : 'error',
        menus: menusResult.status === 'fulfilled' ? 'ready' : 'error',
      });
    } finally {
      setAccessLoading(false);
    }
  }, []);

  const forceSignOut = useCallback(async (reason?: string): Promise<void> => {
    setSession(null);
    setAccessSnapshot(EMPTY_ACCESS_SNAPSHOT);
    setAccessContractState(EMPTY_ACCESS_CONTRACT_STATE);
    if (reason) setSessionNotice(reason);
    await clearStoredSession();
  }, []);

  const refreshSessionIfNeeded = useCallback(
    async (current: AuthSession): Promise<AuthSession | null> => {
      if (!isExpired(current) && !willExpireSoon(current)) {
        return current;
      }

      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      refreshPromiseRef.current = (async () => {
        try {
          const next = await refresh({ refresh_token: current.refreshToken });
          setSession(next);
          await writeStoredSession(next);
          await hydrateAccessSnapshot(next.accessToken);
          return next;
        } catch (error) {
          // Phase 6: Handle session invalidation — AUTH_REFRESH_TOKEN_REVOKED
          if (error instanceof ApiError) {
            if (error.code === 'AUTH_REFRESH_TOKEN_REVOKED') {
              await forceSignOut(
                'Your permissions have been updated. Please log in again to continue.',
              );
              return null;
            }
            if (error.code === 'AUTH_PASSWORD_RESET_REQUIRED') {
              await forceSignOut(
                'A password reset is required. Please reset your password to continue.',
              );
              return null;
            }
          }
          await forceSignOut('Session expired. Please sign in again.');
          return null;
        } finally {
          refreshPromiseRef.current = null;
        }
      })();

      return refreshPromiseRef.current;
    },
    [forceSignOut, hydrateAccessSnapshot],
  );

  // Manually refresh access snapshot (for pull-to-refresh, after admin actions, etc.)
  const refreshAccessSnapshot = useCallback(async (): Promise<void> => {
    const current = sessionRef.current;
    if (!current) return;
    await hydrateAccessSnapshot(current.accessToken);
  }, [hydrateAccessSnapshot]);

  // Bootstrap: restore session from storage
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const stored = await readStoredSession();
        if (!stored) return;

        let resolved = stored;
        if (isExpired(stored) || willExpireSoon(stored)) {
          const refreshed = await refreshSessionIfNeeded(stored);
          if (!refreshed) return;
          resolved = refreshed;
        }

        if (!active) return;
        setSession(resolved);
        await hydrateAccessSnapshot(resolved.accessToken);
      } catch {
        await forceSignOut('Session expired. Please sign in again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [forceSignOut, hydrateAccessSnapshot, refreshSessionIfNeeded]);

  // Periodic token refresh (30s interval)
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      void refreshSessionIfNeeded(session);
    }, 30_000);

    return () => clearInterval(interval);
  }, [session, refreshSessionIfNeeded]);

  // Phase 3 (BUG 3): Refresh permissions when app comes to foreground
  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'active' && sessionRef.current) {
        void hydrateAccessSnapshot(sessionRef.current.accessToken);
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [hydrateAccessSnapshot]);

  // 401 handler — force sign out
  useEffect(() => {
    setUnauthorizedHandler((event) => {
      if (unauthorizedLockRef.current) return;
      unauthorizedLockRef.current = true;

      void forceSignOut('Session expired. Please sign in again.').finally(() => {
        unauthorizedLockRef.current = false;
      });
    });

    return () => {
      setUnauthorizedHandler(undefined);
    };
  }, [forceSignOut]);

  // Phase 3 (BUG 3): On 403, refresh RBAC & entitlements so stale permissions get updated
  useEffect(() => {
    setForbiddenHandler(() => {
      const current = sessionRef.current;
      if (current) {
        void hydrateAccessSnapshot(current.accessToken);
      }
    });

    return () => {
      setForbiddenHandler(undefined);
    };
  }, [hydrateAccessSnapshot]);

  async function signIn(email: string, password: string): Promise<void> {
    const next = await login({ email, password });
    setSession(next);
    await writeStoredSession(next);
    await hydrateAccessSnapshot(next.accessToken);
    setSessionNotice(null);
  }

  async function signOut(): Promise<void> {
    try {
      await logout(session?.refreshToken);
    } catch {
      // Clear local state even if API logout fails.
    } finally {
      setSession(null);
      setAccessSnapshot(EMPTY_ACCESS_SNAPSHOT);
      setAccessContractState(EMPTY_ACCESS_CONTRACT_STATE);
      await clearStoredSession();
    }
  }

  function clearSessionNotice() {
    setSessionNotice(null);
  }

  function hasMenuAccess(menuKey: string): boolean {
    if (accessLoading) return false;
    if (
      accessContractState.menus !== 'ready' ||
      accessContractState.entitlements !== 'ready'
    ) {
      return false;
    }

    const menuKeys = extractMenuKeys(accessSnapshot.menus);
    if (menuKeys.size === 0) return false;

    const normalizedMenuKey = normalizeMenuAccessKey(menuKey);
    if (!normalizedMenuKey) return false;

    return menuKeys.has(normalizedMenuKey) || menuKeys.has('*');
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      accessLoading,
      accessSnapshot,
      sessionNotice,
      signIn,
      signOut,
      clearSessionNotice,
      hasMenuAccess,
      refreshAccessSnapshot,
    }),
    [session, loading, accessLoading, accessSnapshot, accessContractState, sessionNotice, refreshAccessSnapshot],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
