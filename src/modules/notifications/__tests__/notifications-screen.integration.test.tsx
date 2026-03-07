import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { ToastProvider } from '../../../components';
import { renderWithProviders } from '../../../components/__tests__/test-utils';
import type {
  CreateManagedNotificationRequest,
  ManagedNotification,
} from '../../../api/modules/management';
import { useAuth } from '../../../providers/AuthProvider';
import { useManagedNotifications } from '../../../hooks/useManagedNotifications.hook';
import { NotificationsScreen } from '../screens/NotificationsScreen';

jest.mock('../../../hooks/useManagedNotifications.hook', () => ({
  useManagedNotifications: jest.fn(),
}));

jest.mock('../../../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

function renderScreen() {
  return renderWithProviders(
    <ToastProvider>
      <NotificationsScreen />
    </ToastProvider>,
  );
}

describe('NotificationsScreen integration', () => {
  const useManagedNotificationsMock = jest.mocked(useManagedNotifications);
  const useAuthMock = jest.mocked(useAuth);

  const createNotificationMock = jest
    .fn<Promise<ManagedNotification>, [CreateManagedNotificationRequest]>()
    .mockResolvedValue({
      id: 'notification-1',
      type: 'task_due',
      title: 'Task due',
      message: 'Check irrigation',
      readAt: null,
      entityType: null,
      entityId: null,
      dedupeKey: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    });

  beforeEach(() => {
    createNotificationMock.mockClear();

    useManagedNotificationsMock.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isRefreshing: false,
      isMutating: false,
      errorMessage: null,
      refresh: async () => undefined,
      createNotification: createNotificationMock,
      updateNotification: async () => ({
        id: 'notification-1',
        type: 'task_due',
        title: 'Task due',
        message: 'Check irrigation',
        readAt: '2026-03-02T00:00:00.000Z',
        entityType: null,
        entityId: null,
        dedupeKey: null,
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      }),
      deleteNotification: async () => true,
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
        },
        menus: [],
      },
      sessionNotice: null,
      signIn: async () => undefined,
      signOut: async () => undefined,
      clearSessionNotice: () => undefined,
      hasMenuAccess: () => true,
      refreshAccessSnapshot: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('creates a notification from the standalone notifications module', async () => {
    const { getAllByText, getByPlaceholderText } = renderScreen();

    fireEvent.press(getAllByText('Create Notification')[0]);

    fireEvent.changeText(getByPlaceholderText('Notification title'), ' Task due ');
    fireEvent.changeText(getByPlaceholderText('Notification message'), ' Check irrigation ');

    fireEvent.press(getAllByText('Create Notification').slice(-1)[0]);

    await waitFor(() =>
      expect(createNotificationMock).toHaveBeenCalledWith({
        title: 'Task due',
        message: 'Check irrigation',
        type: 'task_due',
      }),
    );
  });
});
