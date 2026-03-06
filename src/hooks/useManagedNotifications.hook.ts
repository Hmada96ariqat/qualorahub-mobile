import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createManagedNotification,
  deleteManagedNotification,
  listManagedNotifications,
  updateManagedNotification,
  type CreateManagedNotificationRequest,
  type UpdateManagedNotificationRequest,
} from '../api/modules/management';
import { useAuthSession } from './useAuthSession';

const MANAGED_NOTIFICATIONS_QUERY_KEY = ['managed-notifications'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useManagedNotifications() {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: MANAGED_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => listManagedNotifications(token ?? ''),
    enabled: Boolean(token),
    staleTime: 30_000,
  });

  const createNotificationMutation = useMutation({
    mutationFn: (input: CreateManagedNotificationRequest) => createManagedNotification(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: MANAGED_NOTIFICATIONS_QUERY_KEY,
      });
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: (payload: { notificationId: string; input: UpdateManagedNotificationRequest }) =>
      updateManagedNotification(token ?? '', payload.notificationId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: MANAGED_NOTIFICATIONS_QUERY_KEY,
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => deleteManagedNotification(token ?? '', notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: MANAGED_NOTIFICATIONS_QUERY_KEY,
      });
    },
  });

  const notifications = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    isRefreshing: notificationsQuery.isFetching,
    isMutating:
      createNotificationMutation.isPending ||
      updateNotificationMutation.isPending ||
      deleteNotificationMutation.isPending,
    errorMessage: notificationsQuery.error
      ? toErrorMessage(notificationsQuery.error, 'Failed to load notifications.')
      : null,
    refresh: async () => {
      await queryClient.invalidateQueries({
        queryKey: MANAGED_NOTIFICATIONS_QUERY_KEY,
      });
    },
    createNotification: async (input: CreateManagedNotificationRequest) =>
      createNotificationMutation.mutateAsync(input),
    updateNotification: async (notificationId: string, input: UpdateManagedNotificationRequest) =>
      updateNotificationMutation.mutateAsync({ notificationId, input }),
    deleteNotification: async (notificationId: string) =>
      deleteNotificationMutation.mutateAsync(notificationId),
  };
}
