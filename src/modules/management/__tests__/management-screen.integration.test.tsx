import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type {
  CreateManagedInviteRequest,
  CreateManagedRoleRequest,
  ManagedRole,
  UpdateManagedRoleRequest,
} from '../../../api/modules/management';
import { useAuth } from '../../../providers/AuthProvider';
import { ManagementScreen } from '../screens/ManagementScreen';
import { useManagementModule } from '../useManagementModule.hook';

jest.mock('../useManagementModule.hook', () => ({
  useManagementModule: jest.fn(),
}));

jest.mock('../../../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <ManagementScreen />
    </ToastProvider>,
  );
}

describe('ManagementScreen integration', () => {
  const useManagementModuleMock = jest.mocked(useManagementModule);
  const useAuthMock = jest.mocked(useAuth);

  const createRoleMock = jest
    .fn<Promise<ManagedRole>, [CreateManagedRoleRequest]>()
    .mockResolvedValue({
      id: 'role-2',
      name: 'Supervisor',
      status: 'active',
      description: null,
      linkedFields: [],
      permissions: [],
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });
  const updateUserMock = jest
    .fn<
      ReturnType<ReturnType<typeof useManagementModule>['updateUser']>,
      Parameters<ReturnType<typeof useManagementModule>['updateUser']>
    >()
    .mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      email: 'admin@example.test',
      fullName: 'Updated Admin User',
      nickName: 'Ops',
      mobileNumber: '+1 555 100',
      status: 'active',
      roleId: 'role-1',
      roleName: 'Admin',
      userType: 'regular',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });

  function buildHookResult(): ReturnType<typeof useManagementModule> {
    return {
      users: [
        {
          id: 'profile-1',
          userId: 'user-1',
          email: 'admin@example.test',
          fullName: 'Admin User',
          nickName: 'Admin',
          mobileNumber: null,
          status: 'active',
          roleId: 'role-1',
          roleName: 'Admin',
          userType: 'regular',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
        {
          id: 'profile-2',
          userId: 'user-2',
          email: 'inactive@example.test',
          fullName: 'Inactive User',
          nickName: null,
          mobileNumber: null,
          status: 'inactive',
          roleId: 'role-1',
          roleName: 'Admin',
          userType: 'regular',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      roles: [
        {
          id: 'role-1',
          name: 'Admin',
          status: 'active',
          description: null,
          linkedFields: [],
          permissions: [],
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      roleOptions: [
        {
          id: 'role-1',
          name: 'Admin',
        },
      ],
      invites: [
        {
          id: 'invite-1',
          email: 'invite@example.test',
          status: 'pending',
          fullName: 'Invite User',
          roleId: 'role-1',
          expiresAt: '2026-03-03T00:00:00.000Z',
          createdAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      errorMessage: null,
      refresh: async () => undefined,
      updateUser: updateUserMock,
      createRole: createRoleMock,
      updateRole: async (roleId: string, input: UpdateManagedRoleRequest) => {
        void roleId;
        void input;
        return {
          id: 'role-1',
          name: 'Admin',
          status: 'active',
          description: null,
          linkedFields: [],
          permissions: [],
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      deleteRole: async (roleId: string) => {
        void roleId;
        return true;
      },
      createInvite: async (input: CreateManagedInviteRequest) => {
        void input;
        return {
          id: 'invite-1',
          email: 'invite@example.test',
          status: 'pending',
          fullName: 'Invite',
          roleId: 'role-1',
          expiresAt: '2026-03-03T00:00:00.000Z',
          createdAt: '2026-03-01T00:00:00.000Z',
        };
      },
      deleteInvite: async (inviteId: string) => {
        void inviteId;
        return true;
      },
    };
  }

  beforeEach(() => {
    createRoleMock.mockClear();
    updateUserMock.mockClear();

    useManagementModuleMock.mockReturnValue(buildHookResult());
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
        menus: [],
      },
      sessionNotice: null,
      signIn: async () => undefined,
      signOut: async () => undefined,
      clearSessionNotice: () => undefined,
      hasMenuAccess: () => true,
    });
  });

  it('uses inventory-style tabs and defaults to the active users view', async () => {
    const { getByTestId, getByText, queryByText } = renderScreen();

    expect(getByTestId('management-module-tabs')).toBeTruthy();
    expect(getByText('Admin User')).toBeTruthy();
    expect(queryByText('Inactive User')).toBeNull();
    expect(queryByText('Invite User')).toBeNull();

    fireEvent.press(getByText('Inactive (1)'));

    await waitFor(() => {
      expect(getByText('Inactive User')).toBeTruthy();
    });
  });

  it('creates a role via the roles tab', async () => {
    const { getAllByText, getByPlaceholderText, getByTestId } = renderScreen();

    fireEvent.press(getByTestId('management-module-tabs.roles'));

    fireEvent.press(getAllByText('Create Role')[0]);

    await waitFor(() => expect(getByPlaceholderText('Role name')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Role name'), '  Supervisor  ');
    fireEvent.press(getAllByText('Create Role').slice(-1)[0]);

    await waitFor(() =>
      expect(createRoleMock).toHaveBeenCalledWith({
        name: 'Supervisor',
      }),
    );
  });

  it('updates a user through the detail and edit flow', async () => {
    const { getByPlaceholderText, getByTestId, getByText, getAllByText } = renderScreen();

    fireEvent.press(getByTestId('management-user-row-profile-1'));

    await waitFor(() => expect(getByText('Edit User')).toBeTruthy());
    fireEvent.press(getByText('Edit User'));

    await waitFor(() => expect(getByPlaceholderText('Full name')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Full name'), '  Updated Admin User ');
    fireEvent.changeText(getByPlaceholderText('Nick name'), '  Ops ');
    fireEvent.changeText(getByPlaceholderText('+1...'), ' +1 555 100 ');
    fireEvent.changeText(getByPlaceholderText('active'), ' Active ');

    fireEvent.press(getAllByText('Update User').slice(-1)[0]);

    await waitFor(() =>
      expect(updateUserMock).toHaveBeenCalledWith('profile-1', {
        full_name: 'Updated Admin User',
        nick_name: 'Ops',
        mobile_number: '+1 555 100',
        role_id: 'role-1',
        status: 'active',
      }),
    );
  });
});
