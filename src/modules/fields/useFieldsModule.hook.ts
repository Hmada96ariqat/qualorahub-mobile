import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createField,
  deactivateField,
  listFields,
  listInactiveFieldsWithLots,
  reactivateField,
  updateField,
  type CreateFieldRequest,
  type FieldSummary,
  type UpdateFieldRequest,
} from '../../api/modules/fields';
import { useAuthSession } from '../../hooks/useAuthSession';

const FIELDS_QUERY_KEY = ['fields', 'active'] as const;
const FIELDS_INACTIVE_QUERY_KEY = ['fields', 'inactive-with-lots'] as const;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Failed to load fields.';
}

export function useFieldsModule() {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const activeQuery = useQuery({
    queryKey: FIELDS_QUERY_KEY,
    queryFn: () => listFields(token ?? ''),
    enabled: Boolean(token),
  });

  const inactiveQuery = useQuery({
    queryKey: FIELDS_INACTIVE_QUERY_KEY,
    queryFn: () => listInactiveFieldsWithLots(token ?? ''),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateFieldRequest) => createField(token ?? '', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FIELDS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: FIELDS_INACTIVE_QUERY_KEY }),
      ]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { fieldId: string; input: UpdateFieldRequest }) =>
      updateField(token ?? '', payload.fieldId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FIELDS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: FIELDS_INACTIVE_QUERY_KEY }),
      ]);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (fieldId: string) => deactivateField(token ?? '', fieldId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FIELDS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: FIELDS_INACTIVE_QUERY_KEY }),
      ]);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (fieldId: string) => reactivateField(token ?? '', fieldId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FIELDS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: FIELDS_INACTIVE_QUERY_KEY }),
      ]);
    },
  });

  const fields = useMemo<FieldSummary[]>(() => activeQuery.data ?? [], [activeQuery.data]);
  const inactiveFields = useMemo(() => inactiveQuery.data ?? [], [inactiveQuery.data]);

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending;

  return {
    fields,
    inactiveFields,
    isLoading: activeQuery.isLoading || inactiveQuery.isLoading,
    isRefreshing: activeQuery.isFetching || inactiveQuery.isFetching,
    isMutating,
    errorMessage: activeQuery.error
      ? toErrorMessage(activeQuery.error)
      : inactiveQuery.error
        ? toErrorMessage(inactiveQuery.error)
        : null,
    refresh: async () => {
      await Promise.all([activeQuery.refetch(), inactiveQuery.refetch()]);
    },
    createField: (input: CreateFieldRequest) => createMutation.mutateAsync(input),
    updateField: (fieldId: string, input: UpdateFieldRequest) =>
      updateMutation.mutateAsync({ fieldId, input }),
    deactivateField: (fieldId: string) => deactivateMutation.mutateAsync(fieldId),
    reactivateField: (fieldId: string) => reactivateMutation.mutateAsync(fieldId),
  };
}
