import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createManagedInvite,
  createManagedRole,
  deleteManagedRole,
  deleteManagedInvite,
  listManagedInvites,
  listManagedRoleOptions,
  listManagedRoles,
  listManagedUsers,
  updateManagedRole,
  updateManagedUser,
  type CreateManagedInviteRequest,
  type CreateManagedRoleRequest,
  type UpdateManagedRoleRequest,
  type UpdateManagedUserRequest,
} from '../../api/modules/management';
import { useAuthSession } from '../../hooks/useAuthSession';

const PHASE13_QUERY_KEY = ['phase13'] as const;
const PHASE13_USERS_QUERY_KEY = ['phase13', 'users'] as const;
const PHASE13_ROLES_QUERY_KEY = ['phase13', 'roles'] as const;
const PHASE13_ROLE_OPTIONS_QUERY_KEY = ['phase13', 'role-options'] as const;
const PHASE13_INVITES_QUERY_KEY = ['phase13', 'invites'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useManagementModule() {
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

  const isMutating =
    updateUserMutation.isPending ||
    createRoleMutation.isPending ||
    updateRoleMutation.isPending ||
    deleteRoleMutation.isPending ||
    createInviteMutation.isPending ||
    deleteInviteMutation.isPending;

  return {
    users: useMemo(() => usersQuery.data ?? [], [usersQuery.data]),
    roles: useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]),
    roleOptions: useMemo(() => roleOptionsQuery.data ?? [], [roleOptionsQuery.data]),
    invites: useMemo(() => invitesQuery.data ?? [], [invitesQuery.data]),
    isLoading:
      usersQuery.isLoading ||
      rolesQuery.isLoading ||
      roleOptionsQuery.isLoading ||
      invitesQuery.isLoading,
    isRefreshing:
      usersQuery.isFetching ||
      rolesQuery.isFetching ||
      roleOptionsQuery.isFetching ||
      invitesQuery.isFetching,
    isMutating,
    errorMessage: usersQuery.error
      ? toErrorMessage(usersQuery.error, 'Failed to load users.')
      : rolesQuery.error
        ? toErrorMessage(rolesQuery.error, 'Failed to load roles.')
        : roleOptionsQuery.error
          ? toErrorMessage(roleOptionsQuery.error, 'Failed to load role options.')
          : invitesQuery.error
            ? toErrorMessage(invitesQuery.error, 'Failed to load invites.')
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
  };
}
