import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type {
  CreateManagedContactRequest,
  CreateManagedInviteRequest,
  CreateManagedNotificationRequest,
  CreateManagedRoleRequest,
  ManagedRole,
  CreateStorefrontSettingsRequest,
  UpdateManagedContactRequest,
  UpdateManagedNotificationRequest,
  UpdateManagedRoleRequest,
  UpdateStorefrontSettingsRequest,
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
      fullName: 'Admin User',
      nickName: 'Admin',
      mobileNumber: null,
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
      invites: [],
      contactsPage: {
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
      },
      notifications: [],
      farmStorefront: {
        farmId: 'farm-1',
        farmName: 'Farm One',
        previewDeliveryFee: 0,
        previewShareToken: null,
        hasSettings: false,
      },
      storefrontSettings: null,
      subscription: {
        farmId: 'farm-1',
        subscription: {
          id: 'sub-1',
          status: 'active',
        },
      },
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
      createContact: async (input: CreateManagedContactRequest) => {
        void input;
        return {
          id: 'contact-1',
          name: 'Supplier',
          type: 'supplier',
          contactTypes: ['supplier'],
          company: null,
          phone: null,
          email: null,
          address: null,
          notes: null,
          country: null,
          cityRegion: null,
          taxId: null,
          status: 'active',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      updateContact: async (contactId: string, input: UpdateManagedContactRequest) => {
        void contactId;
        void input;
        return {
          id: 'contact-1',
          name: 'Supplier',
          type: 'supplier',
          contactTypes: ['supplier'],
          company: null,
          phone: null,
          email: null,
          address: null,
          notes: null,
          country: null,
          cityRegion: null,
          taxId: null,
          status: 'active',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      createStorefrontSettings: async (input: CreateStorefrontSettingsRequest) => {
        void input;
        return {
          id: 'settings-1',
          farmId: 'farm-1',
          shareToken: null,
          deliveryFee: 0,
          includeDeliveryFee: true,
          isActive: true,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      updateStorefrontSettings: async (settingsId: string, input: UpdateStorefrontSettingsRequest) => {
        void settingsId;
        void input;
        return {
          id: 'settings-1',
          farmId: 'farm-1',
          shareToken: null,
          deliveryFee: 0,
          includeDeliveryFee: true,
          isActive: true,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      createNotification: async (input: CreateManagedNotificationRequest) => {
        void input;
        return {
          id: 'notification-1',
          type: 'task_due',
          title: 'Task Due',
          message: 'Check task',
          readAt: null,
          entityType: null,
          entityId: null,
          dedupeKey: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      updateNotification: async (notificationId: string, input: UpdateManagedNotificationRequest) => {
        void notificationId;
        void input;
        return {
          id: 'notification-1',
          type: 'task_due',
          title: 'Task Due',
          message: 'Check task',
          readAt: '2026-03-02T00:00:00.000Z',
          entityType: null,
          entityId: null,
          dedupeKey: null,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        };
      },
      deleteNotification: async (notificationId: string) => {
        void notificationId;
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
          role: 'admin',
          type: 'regular',
          farmId: 'farm-1',
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

  it('creates a role via form submit', async () => {
    const { getAllByText, getByPlaceholderText } = renderScreen();

    fireEvent.press(getAllByText('Create Role')[0]);

    await waitFor(() => expect(getByPlaceholderText('Role name')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Role name'), '  Supervisor  ');
    const submitButton = getAllByText('Create Role').slice(-1)[0];
    fireEvent.press(submitButton);

    await waitFor(() =>
      expect(createRoleMock).toHaveBeenCalledWith({
        name: 'Supervisor',
      }),
    );
  });

  it('updates a user via form submit', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = renderScreen();

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
