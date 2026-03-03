import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listFields } from '../../api/modules/fields';
import {
  createLot,
  deactivateLot,
  listInactiveLotsWithFields,
  listLots,
  reactivateLot,
  updateLot,
  type CreateLotRequest,
  type LotSummary,
  type UpdateLotRequest,
} from '../../api/modules/lots';
import { useAuthSession } from '../../hooks/useAuthSession';

const LOTS_QUERY_KEY = ['lots', 'active'] as const;
const LOTS_INACTIVE_QUERY_KEY = ['lots', 'inactive-with-fields'] as const;
const LOT_FIELD_OPTIONS_QUERY_KEY = ['lots', 'field-options'] as const;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Failed to load lots.';
}

export function useLotsModule() {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const activeQuery = useQuery({
    queryKey: LOTS_QUERY_KEY,
    queryFn: () => listLots(token ?? ''),
    enabled: Boolean(token),
  });

  const inactiveQuery = useQuery({
    queryKey: LOTS_INACTIVE_QUERY_KEY,
    queryFn: () => listInactiveLotsWithFields(token ?? ''),
    enabled: Boolean(token),
  });

  const fieldOptionsQuery = useQuery({
    queryKey: LOT_FIELD_OPTIONS_QUERY_KEY,
    queryFn: async () => {
      const fields = await listFields(token ?? '');
      return fields
        .filter((field) => field.status === 'active')
        .map((field) => ({
          label: field.name,
          value: field.id,
        }));
    },
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateLotRequest) => createLot(token ?? '', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: LOTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: LOTS_INACTIVE_QUERY_KEY }),
      ]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { lotId: string; input: UpdateLotRequest }) =>
      updateLot(token ?? '', payload.lotId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: LOTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: LOTS_INACTIVE_QUERY_KEY }),
      ]);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (lotId: string) => deactivateLot(token ?? '', lotId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: LOTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: LOTS_INACTIVE_QUERY_KEY }),
      ]);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (lotId: string) => reactivateLot(token ?? '', lotId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: LOTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: LOTS_INACTIVE_QUERY_KEY }),
      ]);
    },
  });

  const lots = useMemo<LotSummary[]>(() => activeQuery.data ?? [], [activeQuery.data]);
  const inactiveLots = useMemo<LotSummary[]>(() => inactiveQuery.data ?? [], [inactiveQuery.data]);
  const fieldOptions = useMemo(() => fieldOptionsQuery.data ?? [], [fieldOptionsQuery.data]);

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending;

  return {
    lots,
    inactiveLots,
    fieldOptions,
    isLoading: activeQuery.isLoading || inactiveQuery.isLoading,
    isRefreshing: activeQuery.isFetching || inactiveQuery.isFetching,
    isMutating,
    errorMessage: activeQuery.error
      ? toErrorMessage(activeQuery.error)
      : inactiveQuery.error
        ? toErrorMessage(inactiveQuery.error)
        : null,
    refresh: async () => {
      await Promise.all([activeQuery.refetch(), inactiveQuery.refetch(), fieldOptionsQuery.refetch()]);
    },
    createLot: (input: CreateLotRequest) => createMutation.mutateAsync(input),
    updateLot: (lotId: string, input: UpdateLotRequest) => updateMutation.mutateAsync({ lotId, input }),
    deactivateLot: (lotId: string) => deactivateMutation.mutateAsync(lotId),
    reactivateLot: (lotId: string) => reactivateMutation.mutateAsync(lotId),
  };
}
