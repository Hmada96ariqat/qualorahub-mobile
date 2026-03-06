import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import { useAuth } from '../../../providers/AuthProvider';
import { ProtectedDrawerProvider } from '../../../providers/ProtectedDrawerProvider';
import { useDashboardSnapshot } from '../useDashboardSnapshot.hook';
import { DashboardShell } from '../screens/DashboardShell';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard',
  router: {
    push: mockPush,
  },
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

jest.mock('../../../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../useDashboardSnapshot.hook', () => ({
  useDashboardSnapshot: jest.fn(),
}));

describe('DashboardShell integration', () => {
  const useAuthMock = jest.mocked(useAuth);
  const useDashboardSnapshotMock = jest.mocked(useDashboardSnapshot);
  const refreshMock = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockPush.mockClear();
    refreshMock.mockClear();

    useAuthMock.mockReturnValue({
      session: null,
      loading: false,
      accessLoading: false,
      accessSnapshot: {
        context: {
          userId: 'user-1',
          email: 'admin@example.test',
          displayName: 'Admin User',
          role: 'admin',
          type: 'regular',
          farmId: 'farm-1',
          farmName: 'Green Valley Farm',
        },
        rbac: null,
        entitlements: {
          readOnly: false,
        },
        menus: [{ key: '*' }],
      },
      sessionNotice: null,
      signIn: async () => undefined,
      signOut: async () => undefined,
      clearSessionNotice: () => undefined,
      hasMenuAccess: () => true,
    });

    useDashboardSnapshotMock.mockReturnValue({
      snapshot: {
        fetchedAt: '2026-03-06T12:30:00.000Z',
        fieldsTotal: 8,
        fieldsActive: 6,
        fieldsInactive: 2,
        lotsTotal: 10,
        lotsActive: 7,
        lotsInactive: 3,
        cropsTotal: 4,
        productsTotal: 12,
        inventoryRowsTotal: 18,
        equipmentTotal: 5,
        tasksTotal: 9,
        contactsTotal: 11,
        ordersTotal: 3,
        productionCyclesTotal: 2,
        lowStockAlertsTotal: 1,
      },
      loading: false,
      refreshing: false,
      error: null,
      refresh: refreshMock,
    });
  });

  it('opens the drawer and navigates to a module before closing it', async () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <ProtectedDrawerProvider>
        <DashboardShell email="admin@example.test" />
      </ProtectedDrawerProvider>,
    );

    fireEvent.press(getByTestId('dashboard-header-menu'));

    expect(getByTestId('protected-navigation-drawer')).toBeTruthy();

    fireEvent.press(getByTestId('protected-navigation-drawer-row-fields'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/(protected)/fields');
    });

    await waitFor(() => {
      expect(queryByTestId('protected-navigation-drawer')).toBeNull();
    });
  });

  it('keeps the refresh and logbook quick actions working', async () => {
    const { getAllByText, getByText, queryByText } = renderWithProviders(
      <DashboardShell email="admin@example.test" />,
    );

    expect(getAllByText('Green Valley Farm').length).toBeGreaterThan(0);
    expect(queryByText('farm-1')).toBeNull();
    expect(getByText(/Good (morning|afternoon|evening), Admin User/)).toBeTruthy();

    fireEvent.press(getByText('Refresh'));
    fireEvent.press(getByText('Logbook'));

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(protected)/crops',
        params: { tab: 'logbook' },
      });
    });
  });
});
