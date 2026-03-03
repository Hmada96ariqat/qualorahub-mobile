import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listFields, type FieldStatusFilter, type FieldSummary } from '../../api/modules/fields';
import {
  createLot,
  deactivateLot,
  listInactiveLotsWithFields,
  listLots,
  reactivateLotFromDeactivated,
  reactivateLotMain,
  updateLot,
  type CreateLotRequest,
  type LotStatusFilter,
  type LotSummary,
  type UpdateLotRequest,
} from '../../api/modules/lots';
import { useAuthSession } from '../../hooks/useAuthSession';

type UseLotsModuleOptions = {
  statusFilter: LotStatusFilter;
  fieldContextStatusFilter: FieldStatusFilter;
  fieldSearchText: string;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Failed to load lots.';
}

function lotsQueryKey(status: LotStatusFilter) {
  return ['lots', 'list', status] as const;
}

function fieldsContextQueryKey(status: FieldStatusFilter) {
  return ['lots', 'field-context', status] as const;
}

const LOTS_INACTIVE_QUERY_KEY = ['lots', 'inactive-with-fields'] as const;

function buildFieldSearchText(field: FieldSummary): string {
  return [field.name, field.location, field.soilType]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

export function useLotsModule(options: UseLotsModuleOptions) {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const lotsQuery = useQuery({
    queryKey: lotsQueryKey(options.statusFilter),
    queryFn: () => listLots(token ?? '', { status: options.statusFilter }),
    enabled: Boolean(token),
  });

  const inactiveLotsQuery = useQuery({
    queryKey: LOTS_INACTIVE_QUERY_KEY,
    queryFn: () => listInactiveLotsWithFields(token ?? ''),
    enabled: Boolean(token),
  });

  const fieldsContextQuery = useQuery({
    queryKey: fieldsContextQueryKey(options.fieldContextStatusFilter),
    queryFn: () => listFields(token ?? '', { status: options.fieldContextStatusFilter }),
    enabled: Boolean(token),
  });

  async function invalidateLotCaches() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['fields'] }),
      queryClient.invalidateQueries({ queryKey: ['lots'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'snapshot'] }),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateLotRequest) => createLot(token ?? '', input),
    onSuccess: invalidateLotCaches,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { lotId: string; input: UpdateLotRequest }) =>
      updateLot(token ?? '', payload.lotId, payload.input),
    onSuccess: invalidateLotCaches,
  });

  const deactivateMutation = useMutation({
    mutationFn: (lotId: string) => deactivateLot(token ?? '', lotId),
    onSuccess: invalidateLotCaches,
  });

  const reactivateMainMutation = useMutation({
    mutationFn: (lotId: string) => reactivateLotMain(token ?? '', lotId),
    onSuccess: invalidateLotCaches,
  });

  const reactivateDeactivatedMutation = useMutation({
    mutationFn: (lotId: string) => reactivateLotFromDeactivated(token ?? '', lotId),
    onSuccess: invalidateLotCaches,
  });

  const lots = useMemo<LotSummary[]>(() => lotsQuery.data ?? [], [lotsQuery.data]);
  const inactiveLots = useMemo<LotSummary[]>(() => inactiveLotsQuery.data ?? [], [inactiveLotsQuery.data]);

  const fieldContextFields = useMemo<FieldSummary[]>(() => {
    const source = fieldsContextQuery.data ?? [];
    const search = options.fieldSearchText.trim().toLowerCase();
    if (!search) {
      return source;
    }

    return source.filter((field) => buildFieldSearchText(field).includes(search));
  }, [fieldsContextQuery.data, options.fieldSearchText]);

  const fieldOptions = useMemo(
    () =>
      fieldContextFields.map((field) => ({
        label: field.name,
        value: field.id,
      })),
    [fieldContextFields],
  );

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMainMutation.isPending ||
    reactivateDeactivatedMutation.isPending;

  const listLotsByField = useCallback(
    async (fieldId: string): Promise<LotSummary[]> =>
      queryClient.fetchQuery({
        queryKey: ['lots', 'field', fieldId],
        queryFn: () => listLots(token ?? '', { fieldId, status: 'all' }),
      }),
    [queryClient, token],
  );

  return {
    lots,
    inactiveLots,
    fieldContextFields,
    fieldOptions,
    isLoading: lotsQuery.isLoading || inactiveLotsQuery.isLoading || fieldsContextQuery.isLoading,
    isRefreshing: lotsQuery.isFetching || inactiveLotsQuery.isFetching || fieldsContextQuery.isFetching,
    isMutating,
    errorMessage: lotsQuery.error
      ? toErrorMessage(lotsQuery.error)
      : inactiveLotsQuery.error
        ? toErrorMessage(inactiveLotsQuery.error)
        : fieldsContextQuery.error
          ? toErrorMessage(fieldsContextQuery.error)
          : null,
    refresh: async () => {
      await Promise.all([lotsQuery.refetch(), inactiveLotsQuery.refetch(), fieldsContextQuery.refetch()]);
    },
    listLotsByField,
    createLot: (input: CreateLotRequest) => createMutation.mutateAsync(input),
    updateLot: (lotId: string, input: UpdateLotRequest) => updateMutation.mutateAsync({ lotId, input }),
    deactivateLot: (lotId: string) => deactivateMutation.mutateAsync(lotId),
    reactivateLotMain: (lotId: string) => reactivateMainMutation.mutateAsync(lotId),
    reactivateLotFromDeactivated: (lotId: string) => reactivateDeactivatedMutation.mutateAsync(lotId),
  };
}
