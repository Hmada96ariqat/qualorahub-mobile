import React from 'react';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import { useAuth } from '../../../providers/AuthProvider';
import { useAccountModule } from '../../../hooks/useAccountModule.hook';
import { AccountScreen } from '../screens/AccountScreen';

jest.mock('../../../hooks/useAccountModule.hook', () => ({
  useAccountModule: jest.fn(),
}));

jest.mock('../../../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

describe('AccountScreen integration', () => {
  const useAccountModuleMock = jest.mocked(useAccountModule);
  const useAuthMock = jest.mocked(useAuth);

  beforeEach(() => {
    useAccountModuleMock.mockReturnValue({
      subscription: {
        subscription: {
          status: 'active',
        },
      },
      isLoading: false,
      isRefreshing: false,
      errorMessage: null,
      refresh: async () => undefined,
    });

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
          allowedModules: ['users', 'contacts', 'notifications'],
        },
        menus: [{ key: 'users' }, { key: 'contacts' }],
      },
      sessionNotice: null,
      signIn: async () => undefined,
      signOut: async () => undefined,
      clearSessionNotice: () => undefined,
      hasMenuAccess: () => true,
    });
  });

  it('renders account context and subscription details', () => {
    const { getByText } = renderWithProviders(<AccountScreen />);

    expect(getByText('admin@example.test')).toBeTruthy();
    expect(getByText('farm-1')).toBeTruthy();
    expect(getByText('active')).toBeTruthy();
    expect(getByText('Users')).toBeTruthy();
    expect(getByText('Contacts')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
  });
});
