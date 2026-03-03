import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createManagedContact,
  createManagedInvite,
  createManagedNotification,
  createManagedRole,
  deleteManagedInvite,
  deleteManagedNotification,
  deleteManagedRole,
  listManagedContacts,
  listManagedInvites,
  listManagedNotifications,
  listManagedRoleOptions,
  listManagedRoles,
  listManagedUsers,
  updateManagedContact,
  updateManagedNotification,
  updateManagedRole,
  updateManagedUser,
  type CreateManagedContactRequest,
  type CreateManagedInviteRequest,
  type CreateManagedNotificationRequest,
  type CreateManagedRoleRequest,
  type UpdateManagedContactRequest,
  type UpdateManagedNotificationRequest,
  type UpdateManagedRoleRequest,
  type UpdateManagedUserRequest,
} from '../../api/modules/management';
import { getMySubscription } from '../../api/modules/subscriptions';
import { useAuthSession } from '../../hooks/useAuthSession';

const PHASE13_QUERY_KEY = ['phase13'] as const;
const PHASE13_USERS_QUERY_KEY = ['phase13', 'users'] as const;
const PHASE13_ROLES_QUERY_KEY = ['phase13', 'roles'] as const;
const PHASE13_ROLE_OPTIONS_QUERY_KEY = ['phase13', 'role-options'] as const;
const PHASE13_INVITES_QUERY_KEY = ['phase13', 'invites'] as const;
const PHASE13_CONTACTS_QUERY_KEY = ['phase13', 'contacts'] as const;
const PHASE13_NOTIFICATIONS_QUERY_KEY = ['phase13', 'notifications'] as const;
const PHASE13_SUBSCRIPTION_QUERY_KEY = ['phase13', 'subscription'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

type UseManagementModuleParams = {
  contactsPage: number;
  contactsPageSize: number;
  contactsSearch: string;
};

export function useManagementModule({
  contactsPage,
  contactsPageSize,
  contactsSearch,
}: UseManagementModuleParams) {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: PHASE13_USERS_QUERY_KEY,
    queryFn: () => listManagedUsers(token ?? ''),
    enabled: Boolean(token),
  });

  const rolesQuery = useQuery({
    queryKey: PHASE13_ROLES_QUERY_KEY,
    queryFn: () => listManagedRoles(token ?? ''),
    enabled: Boolean(token),
  });

  const roleOptionsQuery = useQuery({
    queryKey: PHASE13_ROLE_OPTIONS_QUERY_KEY,
    queryFn: () => listManagedRoleOptions(token ?? ''),
    enabled: Boolean(token),
  });

  const invitesQuery = useQuery({
    queryKey: PHASE13_INVITES_QUERY_KEY,
    queryFn: () => listManagedInvites(token ?? ''),
    enabled: Boolean(token),
  });

  const contactsQuery = useQuery({
    queryKey: [PHASE13_CONTACTS_QUERY_KEY, contactsPage, contactsPageSize, contactsSearch],
    queryFn: () =>
      listManagedContacts(token ?? '', {
        limit: contactsPageSize,
        offset: (contactsPage - 1) * contactsPageSize,
        search: contactsSearch,
      }),
    enabled: Boolean(token),
  });

  const notificationsQuery = useQuery({
    queryKey: PHASE13_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => listManagedNotifications(token ?? ''),
    enabled: Boolean(token),
  });

  const subscriptionQuery = useQuery({
    queryKey: PHASE13_SUBSCRIPTION_QUERY_KEY,
    queryFn: () => getMySubscription(token ?? ''),
    enabled: Boolean(token),
  });

  async function invalidatePhase13Queries() {
    await queryClient.invalidateQueries({
      queryKey: PHASE13_QUERY_KEY,
    });
  }

  const updateUserMutation = useMutation({
    mutationFn: (payload: { profileId: string; input: UpdateManagedUserRequest }) =>
      updateManagedUser(token ?? '', payload.profileId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PHASE13_USERS_QUERY_KEY,
      });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (input: CreateManagedRoleRequest) => createManagedRole(token ?? '', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: PHASE13_ROLES_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: PHASE13_ROLE_OPTIONS_QUERY_KEY,
        }),
      ]);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: { roleId: string; input: UpdateManagedRoleRequest }) =>
      updateManagedRole(token ?? '', payload.roleId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PHASE13_ROLES_QUERY_KEY,
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => deleteManagedRole(token ?? '', roleId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: PHASE13_ROLES_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: PHASE13_ROLE_OPTIONS_QUERY_KEY,
        }),
      ]);
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: (input: CreateManagedInviteRequest) => createManagedInvite(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PHASE13_INVITES_QUERY_KEY,
      });
    },
  });

  const deleteInviteMutation = useMutation({
    mutationFn: (inviteId: string) => deleteManagedInvite(token ?? '', inviteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PHASE13_INVITES_QUERY_KEY,
      });
    },
  });

  const createContactMutation = useMutation({
    mutationFn: (input: CreateManagedContactRequest) => createManagedContact(token ?? '', input),
    onSuccess: invalidatePhase13Queries,
  });

  const updateContactMutation = useMutation({
    mutationFn: (payload: { contactId: string; input: UpdateManagedContactRequest }) =>
      updateManagedContact(token ?? '', payload.contactId, payload.input),
    onSuccess: invalidatePhase13Queries,
  });

  const createNotificationMutation = useMutation({
    mutationFn: (input: CreateManagedNotificationRequest) => createManagedNotification(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PHASE13_NOTIFICATIONS_QUERY_KEY,
      });
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: (payload: { notificationId: string; input: UpdateManagedNotificationRequest }) =>
      updateManagedNotification(token ?? '', payload.notificationId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PHASE13_NOTIFICATIONS_QUERY_KEY,
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => deleteManagedNotification(token ?? '', notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PHASE13_NOTIFICATIONS_QUERY_KEY,
      });
    },
  });

  const isMutating =
    updateUserMutation.isPending ||
    createRoleMutation.isPending ||
    updateRoleMutation.isPending ||
    deleteRoleMutation.isPending ||
    createInviteMutation.isPending ||
    deleteInviteMutation.isPending ||
    createContactMutation.isPending ||
    updateContactMutation.isPending ||
    createNotificationMutation.isPending ||
    updateNotificationMutation.isPending ||
    deleteNotificationMutation.isPending;

  return {
    users: useMemo(() => usersQuery.data ?? [], [usersQuery.data]),
    roles: useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]),
    roleOptions: useMemo(() => roleOptionsQuery.data ?? [], [roleOptionsQuery.data]),
    invites: useMemo(() => invitesQuery.data ?? [], [invitesQuery.data]),
    contactsPage: contactsQuery.data ?? {
      items: [],
      total: 0,
      limit: contactsPageSize,
      offset: (contactsPage - 1) * contactsPageSize,
    },
    notifications: useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]),
    subscription: subscriptionQuery.data ?? null,
    isLoading:
      usersQuery.isLoading ||
      rolesQuery.isLoading ||
      roleOptionsQuery.isLoading ||
      invitesQuery.isLoading ||
      contactsQuery.isLoading ||
      notificationsQuery.isLoading ||
      subscriptionQuery.isLoading,
    isRefreshing:
      usersQuery.isFetching ||
      rolesQuery.isFetching ||
      roleOptionsQuery.isFetching ||
      invitesQuery.isFetching ||
      contactsQuery.isFetching ||
      notificationsQuery.isFetching ||
      subscriptionQuery.isFetching,
    isMutating,
    errorMessage: usersQuery.error
      ? toErrorMessage(usersQuery.error, 'Failed to load users.')
      : rolesQuery.error
        ? toErrorMessage(rolesQuery.error, 'Failed to load roles.')
        : roleOptionsQuery.error
          ? toErrorMessage(roleOptionsQuery.error, 'Failed to load role options.')
          : invitesQuery.error
            ? toErrorMessage(invitesQuery.error, 'Failed to load invites.')
            : contactsQuery.error
              ? toErrorMessage(contactsQuery.error, 'Failed to load contacts.')
              : notificationsQuery.error
                ? toErrorMessage(notificationsQuery.error, 'Failed to load notifications.')
                : subscriptionQuery.error
                  ? toErrorMessage(subscriptionQuery.error, 'Failed to load subscription snapshot.')
                  : null,
    refresh: async () => {
      await invalidatePhase13Queries();
    },
    updateUser: async (profileId: string, input: UpdateManagedUserRequest) =>
      updateUserMutation.mutateAsync({ profileId, input }),
    createRole: async (input: CreateManagedRoleRequest) => createRoleMutation.mutateAsync(input),
    updateRole: async (roleId: string, input: UpdateManagedRoleRequest) =>
      updateRoleMutation.mutateAsync({ roleId, input }),
    deleteRole: async (roleId: string) => deleteRoleMutation.mutateAsync(roleId),
    createInvite: async (input: CreateManagedInviteRequest) => createInviteMutation.mutateAsync(input),
    deleteInvite: async (inviteId: string) => deleteInviteMutation.mutateAsync(inviteId),
    createContact: async (input: CreateManagedContactRequest) =>
      createContactMutation.mutateAsync(input),
    updateContact: async (contactId: string, input: UpdateManagedContactRequest) =>
      updateContactMutation.mutateAsync({ contactId, input }),
    createNotification: async (input: CreateManagedNotificationRequest) =>
      createNotificationMutation.mutateAsync(input),
    updateNotification: async (notificationId: string, input: UpdateManagedNotificationRequest) =>
      updateNotificationMutation.mutateAsync({ notificationId, input }),
    deleteNotification: async (notificationId: string) =>
      deleteNotificationMutation.mutateAsync(notificationId),
  };
}
