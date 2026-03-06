import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { AppHeader } from '../../components';
import { renderWithProviders } from '../../components/__tests__/test-utils';
import { useAuth } from '../AuthProvider';
import { ProtectedDrawerProvider } from '../ProtectedDrawerProvider';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/contacts',
}));

jest.mock('../AuthProvider', () => ({
  useAuth: jest.fn(),
}));

describe('ProtectedDrawerProvider', () => {
  const useAuthMock = jest.mocked(useAuth);

  beforeEach(() => {
    mockPush.mockClear();

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
  });

  it('exposes the shared drawer through AppHeader on protected screens', async () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <ProtectedDrawerProvider>
        <AppHeader title="Contacts" subtitle="Standalone farm contact directory." />
      </ProtectedDrawerProvider>,
    );

    fireEvent.press(getByTestId('app-header.menu'));

    expect(getByTestId('protected-navigation-drawer')).toBeTruthy();

    fireEvent.press(getByTestId('protected-navigation-drawer-row-finance'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/(protected)/finance');
    });

    await waitFor(() => {
      expect(queryByTestId('protected-navigation-drawer')).toBeNull();
    });
  });
});
