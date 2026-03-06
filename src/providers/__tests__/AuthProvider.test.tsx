import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthProvider';
import { login, logout, refresh } from '../../modules/auth/api';
import { getAuthContext, getRbacSnapshot } from '../../api/modules/auth';
import {
  getMyEntitlements,
  getMyMenus,
  type EntitlementsSnapshot,
  type MenuAccessSnapshot,
} from '../../api/modules/subscriptions';
import { setUnauthorizedHandler, type UnauthorizedEvent } from '../../api/client';
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '../../modules/auth/storage';
import type { AuthSession } from '../../types/auth';

jest.mock('../../modules/auth/api', () => ({
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('../../modules/auth/storage', () => ({
  readStoredSession: jest.fn(),
  writeStoredSession: jest.fn(),
  clearStoredSession: jest.fn(),
}));

jest.mock('../../api/modules/auth', () => ({
  getAuthContext: jest.fn(),
  getRbacSnapshot: jest.fn(),
}));

jest.mock('../../api/modules/subscriptions', () => {
  const actual = jest.requireActual('../../api/modules/subscriptions');
  return {
    ...actual,
    getMyEntitlements: jest.fn(),
    getMyMenus: jest.fn(),
  };
});

jest.mock('../../api/client', () => ({
  setUnauthorizedHandler: jest.fn(),
}));

function makeSession(offsetSeconds: number): AuthSession {
  return {
    accessToken: `token-${offsetSeconds}`,
    refreshToken: `refresh-${offsetSeconds}`,
    expiresAt: Math.floor(Date.now() / 1000) + offsetSeconds,
    user: {
      id: 'u1',
      email: `user${offsetSeconds}@example.com`,
    },
  };
}

function Harness() {
  const { session, loading, signIn, signOut, sessionNotice, accessSnapshot, hasMenuAccess } = useAuth();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="email">{session?.user.email ?? 'none'}</Text>
      <Text testID="notice">{sessionNotice ?? 'none'}</Text>
      <Text testID="role">{accessSnapshot.context?.role ?? 'none'}</Text>
      <Text testID="menu-dashboard">{String(hasMenuAccess('dashboard'))}</Text>
      <Text testID="menu-finance">{String(hasMenuAccess('finance'))}</Text>
      <Pressable testID="signin" onPress={() => void signIn('seed@example.com', 'pass')}>
        <Text>signin</Text>
      </Pressable>
      <Pressable testID="signout" onPress={() => void signOut()}>
        <Text>signout</Text>
      </Pressable>
    </>
  );
}

function asEntitlementsSnapshot(value: unknown): EntitlementsSnapshot {
  return value as EntitlementsSnapshot;
}

function asMenuAccessSnapshot(value: unknown): MenuAccessSnapshot {
  return value as MenuAccessSnapshot;
}

describe('AuthProvider', () => {
  const readStoredSessionMock = jest.mocked(readStoredSession);
  const writeStoredSessionMock = jest.mocked(writeStoredSession);
  const clearStoredSessionMock = jest.mocked(clearStoredSession);
  const loginMock = jest.mocked(login);
  const refreshMock = jest.mocked(refresh);
  const logoutMock = jest.mocked(logout);
  const getAuthContextMock = jest.mocked(getAuthContext);
  const getRbacSnapshotMock = jest.mocked(getRbacSnapshot);
  const getMyEntitlementsMock = jest.mocked(getMyEntitlements);
  const getMyMenusMock = jest.mocked(getMyMenus);
  const setUnauthorizedHandlerMock = jest.mocked(setUnauthorizedHandler);
  let unauthorizedHandler: ((event: UnauthorizedEvent) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    unauthorizedHandler = undefined;
    setUnauthorizedHandlerMock.mockImplementation((handler) => {
      unauthorizedHandler = handler;
    });
    getAuthContextMock.mockResolvedValue({
      userId: 'u1',
      email: 'user@example.com',
      displayName: 'User Example',
      role: 'admin',
      type: 'super_admin',
      farmId: 'farm-1',
      farmName: 'Green Valley Farm',
    });
    getRbacSnapshotMock.mockResolvedValue({
      roleId: null,
      roleName: null,
      type: 'super_admin',
      permissions: [],
    });
    getMyEntitlementsMock.mockResolvedValue(asEntitlementsSnapshot([{ module: 'dashboard' }]));
    getMyMenusMock.mockResolvedValue(asMenuAccessSnapshot(['dashboard']));
  });

  it('refreshes near-expiry stored session on bootstrap', async () => {
    const staleSession = makeSession(10);
    const refreshedSession = makeSession(600);
    readStoredSessionMock.mockResolvedValue(staleSession);
    refreshMock.mockResolvedValue(refreshedSession);

    const { getByTestId } = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    await waitFor(() =>
      expect(refreshMock).toHaveBeenCalledWith({ refresh_token: staleSession.refreshToken }),
    );
    await waitFor(() => expect(getAuthContextMock).toHaveBeenCalled());
    await waitFor(() => expect(getRbacSnapshotMock).toHaveBeenCalled());
    await waitFor(() => expect(writeStoredSessionMock).toHaveBeenCalledWith(refreshedSession));
    await waitFor(() => expect(getByTestId('email').props.children).toBe(refreshedSession.user.email));
    await waitFor(() => expect(getByTestId('role').props.children).toBe('admin'));
    await waitFor(() => expect(getByTestId('menu-dashboard').props.children).toBe('true'));
  });

  it('supports sign in and sign out lifecycle', async () => {
    const signedInSession = makeSession(1200);
    readStoredSessionMock.mockResolvedValue(null);
    loginMock.mockResolvedValue(signedInSession);
    logoutMock.mockResolvedValue(undefined);

    const { getByTestId } = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    fireEvent.press(getByTestId('signin'));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({ email: 'seed@example.com', password: 'pass' }),
    );
    await waitFor(() => expect(getAuthContextMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getMyMenusMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(writeStoredSessionMock).toHaveBeenCalledWith(signedInSession));
    await waitFor(() => expect(getByTestId('email').props.children).toBe(signedInSession.user.email));
    await waitFor(() => expect(getByTestId('menu-dashboard').props.children).toBe('true'));
    await waitFor(() => expect(getByTestId('menu-finance').props.children).toBe('false'));

    fireEvent.press(getByTestId('signout'));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledWith(signedInSession.refreshToken));
    await waitFor(() => expect(clearStoredSessionMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByTestId('email').props.children).toBe('none'));
  });

  it('restores valid stored session on relaunch without forced refresh', async () => {
    const storedSession = makeSession(1200);
    readStoredSessionMock.mockResolvedValue(storedSession);

    const { getByTestId } = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    await waitFor(() => expect(getByTestId('email').props.children).toBe(storedSession.user.email));
    await waitFor(() => expect(getAuthContextMock).toHaveBeenCalledWith(storedSession.accessToken));
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('clears stale stored session when refresh fails during relaunch', async () => {
    const staleSession = makeSession(-20);
    readStoredSessionMock.mockResolvedValue(staleSession);
    refreshMock.mockRejectedValue(new Error('refresh failed'));

    const { getByTestId } = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    await waitFor(() => expect(clearStoredSessionMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByTestId('email').props.children).toBe('none'));
    await waitFor(() =>
      expect(getByTestId('notice').props.children).toBe('Session expired. Please sign in again.'),
    );
  });

  it('clears session and shows notice when unauthorized handler is triggered', async () => {
    const activeSession = makeSession(1200);
    readStoredSessionMock.mockResolvedValue(activeSession);

    const { getByTestId } = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    expect(unauthorizedHandler).toBeDefined();

    await act(async () => {
      unauthorizedHandler?.({
        path: '/dashboard',
        traceId: 'trace-unauth',
        status: 401,
      });
    });

    await waitFor(() => expect(clearStoredSessionMock).toHaveBeenCalled());
    await waitFor(() => expect(getByTestId('email').props.children).toBe('none'));
    await waitFor(() =>
      expect(getByTestId('notice').props.children).toBe('Session expired. Please sign in again.'),
    );
  });

  it('denies dashboard menu access when menu snapshot excludes dashboard', async () => {
    const activeSession = makeSession(1200);
    readStoredSessionMock.mockResolvedValue(activeSession);
    getMyMenusMock.mockResolvedValue(asMenuAccessSnapshot(['finance']));

    const { getByTestId } = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    await waitFor(() => expect(getByTestId('menu-dashboard').props.children).toBe('false'));
    await waitFor(() => expect(getByTestId('menu-finance').props.children).toBe('true'));
  });

  it('allows dashboard access for mixed-case menu name and slash path keys', async () => {
    const activeSession = makeSession(1200);
    readStoredSessionMock.mockResolvedValue(activeSession);
    getMyMenusMock.mockResolvedValue(
      asMenuAccessSnapshot([
        {
          menu_name: 'Dashboard',
          menu_path: '/dashboard',
        },
      ]),
    );

    const { getByTestId } = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    await waitFor(() => expect(getByTestId('menu-dashboard').props.children).toBe('true'));
  });

  it('fails closed when menu snapshot cannot be fetched', async () => {
    const activeSession = makeSession(1200);
    readStoredSessionMock.mockResolvedValue(activeSession);
    getMyMenusMock.mockRejectedValue(new Error('menus unavailable'));

    const { getByTestId } = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    await waitFor(() => expect(getByTestId('menu-dashboard').props.children).toBe('false'));
    await waitFor(() => expect(getByTestId('menu-finance').props.children).toBe('false'));
  });

  it('fails closed when entitlements snapshot cannot be fetched', async () => {
    const activeSession = makeSession(1200);
    readStoredSessionMock.mockResolvedValue(activeSession);
    getMyMenusMock.mockResolvedValue(asMenuAccessSnapshot(['dashboard']));
    getMyEntitlementsMock.mockRejectedValue(new Error('entitlements unavailable'));

    const { getByTestId } = render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(getByTestId('loading').props.children).toBe('false'));
    await waitFor(() => expect(getByTestId('menu-dashboard').props.children).toBe('false'));
  });
});
