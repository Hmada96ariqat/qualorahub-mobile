import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createManagedContact,
  listManagedContacts,
  type ManagedContactsPage,
  updateManagedContact,
  type CreateManagedContactRequest,
  type UpdateManagedContactRequest,
} from '../api/modules/management';
import { useAuthSession } from './useAuthSession';

const MANAGED_CONTACTS_QUERY_KEY = ['managed-contacts'] as const;
const CONTACT_COUNT_QUERY_LIMIT = 1;

export type ManagedContactStatusFilter = 'all' | 'active' | 'inactive';

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

type UseManagedContactsParams = {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: ManagedContactStatusFilter;
};

function toStatusQuery(statusFilter: ManagedContactStatusFilter): string[] | undefined {
  if (statusFilter === 'active') return ['active'];
  if (statusFilter === 'inactive') return ['inactive'];
  return undefined;
}

function buildEmptyPage(page: number, pageSize: number): ManagedContactsPage {
  return {
    items: [],
    total: 0,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

export function useManagedContacts({
  page,
  pageSize,
  search,
  statusFilter,
}: UseManagedContactsParams) {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();
  const status = toStatusQuery(statusFilter);

  const contactsQuery = useQuery({
    queryKey: [...MANAGED_CONTACTS_QUERY_KEY, page, pageSize, search, statusFilter],
    queryFn: () =>
      listManagedContacts(token ?? '', {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search,
        status,
      }),
    enabled: Boolean(token),
  });

  const totalCountQuery = useQuery({
    queryKey: [...MANAGED_CONTACTS_QUERY_KEY, 'summary', 'all'],
    queryFn: () =>
      listManagedContacts(token ?? '', {
        limit: CONTACT_COUNT_QUERY_LIMIT,
        offset: 0,
      }),
    enabled: Boolean(token),
  });

  const activeCountQuery = useQuery({
    queryKey: [...MANAGED_CONTACTS_QUERY_KEY, 'summary', 'active'],
    queryFn: () =>
      listManagedContacts(token ?? '', {
        limit: CONTACT_COUNT_QUERY_LIMIT,
        offset: 0,
        status: ['active'],
      }),
    enabled: Boolean(token),
  });

  const inactiveCountQuery = useQuery({
    queryKey: [...MANAGED_CONTACTS_QUERY_KEY, 'summary', 'inactive'],
    queryFn: () =>
      listManagedContacts(token ?? '', {
        limit: CONTACT_COUNT_QUERY_LIMIT,
        offset: 0,
        status: ['inactive'],
      }),
    enabled: Boolean(token),
  });

  const createContactMutation = useMutation({
    mutationFn: (input: CreateManagedContactRequest) => createManagedContact(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: MANAGED_CONTACTS_QUERY_KEY,
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: (payload: { contactId: string; input: UpdateManagedContactRequest }) =>
      updateManagedContact(token ?? '', payload.contactId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: MANAGED_CONTACTS_QUERY_KEY,
      });
    },
  });

  return {
    contactsPage: contactsQuery.data ?? buildEmptyPage(page, pageSize),
    summaryCounts: {
      all: totalCountQuery.data?.total ?? 0,
      active: activeCountQuery.data?.total ?? 0,
      inactive: inactiveCountQuery.data?.total ?? 0,
    },
    isLoading: contactsQuery.isLoading,
    isRefreshing:
      contactsQuery.isFetching ||
      totalCountQuery.isFetching ||
      activeCountQuery.isFetching ||
      inactiveCountQuery.isFetching,
    isMutating: createContactMutation.isPending || updateContactMutation.isPending,
    errorMessage: contactsQuery.error
      ? toErrorMessage(contactsQuery.error, 'Failed to load contacts.')
      : null,
    refresh: async () => {
      await queryClient.invalidateQueries({
        queryKey: MANAGED_CONTACTS_QUERY_KEY,
      });
    },
    createContact: async (input: CreateManagedContactRequest) =>
      createContactMutation.mutateAsync(input),
    updateContact: async (contactId: string, input: UpdateManagedContactRequest) =>
      updateContactMutation.mutateAsync({ contactId, input }),
  };
}
