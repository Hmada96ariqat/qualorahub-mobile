import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createField,
  deactivateField,
  getFieldById,
  listFields,
  listInactiveFieldsWithLots,
  reactivateFieldFromDeactivated,
  reactivateFieldMain,
  updateField,
  type CreateFieldRequest,
  type FieldDetail,
  type FieldStatusFilter,
  type FieldSummary,
  type InactiveFieldWithLots,
  type UpdateFieldRequest,
} from '../../api/modules/fields';
import { listLots, type LotSummary } from '../../api/modules/lots';
import { useAuthSession } from '../../hooks/useAuthSession';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Failed to load fields.';
}

function fieldsQueryKey(status: FieldStatusFilter) {
  return ['fields', 'list', status] as const;
}

const FIELDS_INACTIVE_WITH_LOTS_QUERY_KEY = ['fields', 'inactive-with-lots'] as const;
const FIELD_LOTS_QUERY_PREFIX = ['fields', 'detail-lots'] as const;

export function useFieldsModule(statusFilter: FieldStatusFilter) {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const fieldsQuery = useQuery({
    queryKey: fieldsQueryKey(statusFilter),
    queryFn: () => listFields(token ?? '', { status: statusFilter }),
    enabled: Boolean(token),
  });

  const inactiveWithLotsQuery = useQuery({
    queryKey: FIELDS_INACTIVE_WITH_LOTS_QUERY_KEY,
    queryFn: () => listInactiveFieldsWithLots(token ?? ''),
    enabled: Boolean(token),
  });

  async function invalidateFieldCaches() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['fields'] }),
      queryClient.invalidateQueries({ queryKey: ['lots'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'snapshot'] }),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateFieldRequest) => createField(token ?? '', input),
    onSuccess: invalidateFieldCaches,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { fieldId: string; input: UpdateFieldRequest }) =>
      updateField(token ?? '', payload.fieldId, payload.input),
    onSuccess: invalidateFieldCaches,
  });

  const deactivateMutation = useMutation({
    mutationFn: (fieldId: string) => deactivateField(token ?? '', fieldId),
    onSuccess: invalidateFieldCaches,
  });

  const reactivateMainMutation = useMutation({
    mutationFn: (fieldId: string) => reactivateFieldMain(token ?? '', fieldId),
    onSuccess: invalidateFieldCaches,
  });

  const reactivateDeactivatedMutation = useMutation({
    mutationFn: (fieldId: string) => reactivateFieldFromDeactivated(token ?? '', fieldId),
    onSuccess: invalidateFieldCaches,
  });

  const fields = useMemo<FieldSummary[]>(() => fieldsQuery.data ?? [], [fieldsQuery.data]);
  const inactiveFieldsWithLots = useMemo<InactiveFieldWithLots[]>(
    () => inactiveWithLotsQuery.data ?? [],
    [inactiveWithLotsQuery.data],
  );

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMainMutation.isPending ||
    reactivateDeactivatedMutation.isPending;

  return {
    fields,
    inactiveFieldsWithLots,
    isLoading: fieldsQuery.isLoading || inactiveWithLotsQuery.isLoading,
    isRefreshing: fieldsQuery.isFetching || inactiveWithLotsQuery.isFetching,
    isMutating,
    errorMessage: fieldsQuery.error
      ? toErrorMessage(fieldsQuery.error)
      : inactiveWithLotsQuery.error
        ? toErrorMessage(inactiveWithLotsQuery.error)
        : null,
    refresh: async () => {
      await Promise.all([fieldsQuery.refetch(), inactiveWithLotsQuery.refetch()]);
    },
    loadFieldDetail: async (fieldId: string): Promise<FieldDetail> =>
      queryClient.fetchQuery({
        queryKey: ['fields', 'detail', fieldId],
        queryFn: () => getFieldById(token ?? '', fieldId),
      }),
    loadFieldLots: useCallback(
      (fieldId: string): Promise<LotSummary[]> =>
        queryClient.fetchQuery({
          queryKey: [...FIELD_LOTS_QUERY_PREFIX, fieldId] as const,
          queryFn: () => listLots(token ?? '', { fieldId, status: 'all' }),
        }),
      [queryClient, token],
    ),
    createField: (input: CreateFieldRequest) => createMutation.mutateAsync(input),
    updateField: (fieldId: string, input: UpdateFieldRequest) =>
      updateMutation.mutateAsync({ fieldId, input }),
    deactivateField: (fieldId: string) => deactivateMutation.mutateAsync(fieldId),
    reactivateFieldMain: (fieldId: string) => reactivateMainMutation.mutateAsync(fieldId),
    reactivateFieldFromDeactivated: (fieldId: string) =>
      reactivateDeactivatedMutation.mutateAsync(fieldId),
  };
}
