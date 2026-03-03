import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listFields } from '../../api/modules/fields';
import { listLots } from '../../api/modules/lots';
import {
  createCrop,
  createProductionCycle,
  createProductionCycleOperation,
  deleteProductionCycleOperation,
  getLogbookPracticeCatalog,
  getLogbookSession,
  listProductionCycleOperations,
  listProductionCycles,
  submitLogbook,
  updateCrop,
  updateCropStatus,
  updateProductionCycleNotes,
  updateProductionCycleOperation,
  closeProductionCycle,
  type CloseProductionCycleRequest,
  type CreateCropRequest,
  type CreateProductionCycleOperationRequest,
  type CreateProductionCycleRequest,
  type CropSummary,
  type LogbookPracticeCatalogQuery,
  type LogbookSessionQuery,
  type LogbookSubmitRequest,
  type UpdateCropRequest,
  type UpdateCropStatusRequest,
  type UpdateProductionCycleNotesRequest,
  type UpdateProductionCycleOperationRequest,
} from '../../api/modules/crops';
import { useAuthSession } from '../../hooks/useAuthSession';

const PHASE11_FIELDS_KEY = ['phase11', 'fields'] as const;
const PHASE11_LOTS_KEY = ['phase11', 'lots'] as const;
const PHASE11_CYCLES_KEY = ['phase11', 'cycles'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function normalizeCropCollection(cyclesCrops: CropSummary[], manualCrops: CropSummary[]): CropSummary[] {
  const byId = new Map<string, CropSummary>();

  for (const crop of [...cyclesCrops, ...manualCrops]) {
    byId.set(crop.id, crop);
  }

  return Array.from(byId.values()).sort((left, right) => left.name.localeCompare(right.name));
}

type UseCropsModuleParams = {
  selectedCycleId: string | null;
  logbookSessionQuery?: LogbookSessionQuery;
  practiceCatalogQuery?: LogbookPracticeCatalogQuery | null;
};

export function useCropsModule({
  selectedCycleId,
  logbookSessionQuery,
  practiceCatalogQuery,
}: UseCropsModuleParams) {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();
  const [manualCrops, setManualCrops] = useState<CropSummary[]>([]);

  const fieldsQuery = useQuery({
    queryKey: [...PHASE11_FIELDS_KEY],
    queryFn: () => listFields(token ?? ''),
    enabled: Boolean(token),
  });

  const lotsQuery = useQuery({
    queryKey: [...PHASE11_LOTS_KEY],
    queryFn: () => listLots(token ?? ''),
    enabled: Boolean(token),
  });

  const cyclesQuery = useQuery({
    queryKey: [...PHASE11_CYCLES_KEY],
    queryFn: () => listProductionCycles(token ?? ''),
    enabled: Boolean(token),
  });

  const operationsQuery = useQuery({
    queryKey: ['phase11', 'cycle-operations', selectedCycleId],
    queryFn: () => listProductionCycleOperations(token ?? '', selectedCycleId ?? ''),
    enabled: Boolean(token && selectedCycleId),
  });

  const logbookSessionQueryResult = useQuery({
    queryKey: ['phase11', 'logbook-session', logbookSessionQuery?.fieldId ?? null, logbookSessionQuery?.date ?? null],
    queryFn: () => getLogbookSession(token ?? '', logbookSessionQuery),
    enabled: Boolean(token),
  });

  const practiceCatalogQueryResult = useQuery({
    queryKey: [
      'phase11',
      'practice-catalog',
      practiceCatalogQuery?.fieldId ?? null,
      practiceCatalogQuery?.date ?? null,
    ],
    queryFn: () => getLogbookPracticeCatalog(token ?? '', practiceCatalogQuery ?? { fieldId: '' }),
    enabled: Boolean(token && practiceCatalogQuery?.fieldId),
  });

  const createCropMutation = useMutation({
    mutationFn: (input: CreateCropRequest) => createCrop(token ?? '', input),
    onSuccess: (createdCrop) => {
      setManualCrops((current) => {
        const next = current.filter((crop) => crop.id !== createdCrop.id);
        return [...next, createdCrop];
      });
    },
  });

  const updateCropMutation = useMutation({
    mutationFn: (payload: { cropId: string; input: UpdateCropRequest }) =>
      updateCrop(token ?? '', payload.cropId, payload.input),
    onSuccess: (updatedCrop) => {
      setManualCrops((current) => {
        const next = current.filter((crop) => crop.id !== updatedCrop.id);
        return [...next, updatedCrop];
      });
      void queryClient.invalidateQueries({ queryKey: PHASE11_CYCLES_KEY });
    },
  });

  const updateCropStatusMutation = useMutation({
    mutationFn: (payload: { cropId: string; input: UpdateCropStatusRequest }) =>
      updateCropStatus(token ?? '', payload.cropId, payload.input),
    onSuccess: (updatedCrop) => {
      setManualCrops((current) => {
        const next = current.filter((crop) => crop.id !== updatedCrop.id);
        return [...next, updatedCrop];
      });
      void queryClient.invalidateQueries({ queryKey: PHASE11_CYCLES_KEY });
    },
  });

  const createCycleMutation = useMutation({
    mutationFn: (input: CreateProductionCycleRequest) => createProductionCycle(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE11_CYCLES_KEY });
      await queryClient.invalidateQueries({ queryKey: ['phase11', 'logbook-session'] });
    },
  });

  const closeCycleMutation = useMutation({
    mutationFn: (payload: { cycleId: string; input: CloseProductionCycleRequest }) =>
      closeProductionCycle(token ?? '', payload.cycleId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE11_CYCLES_KEY });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: (payload: { cycleId: string; input: UpdateProductionCycleNotesRequest }) =>
      updateProductionCycleNotes(token ?? '', payload.cycleId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE11_CYCLES_KEY });
    },
  });

  const createOperationMutation = useMutation({
    mutationFn: (payload: { cycleId: string; input: CreateProductionCycleOperationRequest }) =>
      createProductionCycleOperation(token ?? '', payload.cycleId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase11', 'cycle-operations', selectedCycleId] }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLES_KEY }),
      ]);
    },
  });

  const updateOperationMutation = useMutation({
    mutationFn: (payload: { operationId: string; input: UpdateProductionCycleOperationRequest }) =>
      updateProductionCycleOperation(token ?? '', payload.operationId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase11', 'cycle-operations', selectedCycleId] }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLES_KEY }),
      ]);
    },
  });

  const deleteOperationMutation = useMutation({
    mutationFn: (operationId: string) => deleteProductionCycleOperation(token ?? '', operationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase11', 'cycle-operations', selectedCycleId] }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLES_KEY }),
      ]);
    },
  });

  const submitLogbookMutation = useMutation({
    mutationFn: (input: LogbookSubmitRequest) => submitLogbook(token ?? '', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase11', 'logbook-session'] }),
        queryClient.invalidateQueries({ queryKey: ['phase11', 'practice-catalog'] }),
      ]);
    },
  });

  const cycles = useMemo(() => cyclesQuery.data ?? [], [cyclesQuery.data]);
  const cyclesCrops = useMemo<CropSummary[]>(
    () =>
      cycles.reduce<CropSummary[]>((accumulator, cycle) => {
        if (!cycle.cropId) return accumulator;
        accumulator.push({
          id: cycle.cropId,
          name: cycle.cropName ?? 'Unnamed crop',
          variety: null,
          status: cycle.status,
          notes: null,
          fieldId: cycle.fieldId,
          createdAt: cycle.createdAt,
          updatedAt: cycle.updatedAt,
        });
        return accumulator;
      }, []),
    [cycles],
  );

  const crops = useMemo(
    () => normalizeCropCollection(cyclesCrops, manualCrops),
    [cyclesCrops, manualCrops],
  );

  const isMutating =
    createCropMutation.isPending ||
    updateCropMutation.isPending ||
    updateCropStatusMutation.isPending ||
    createCycleMutation.isPending ||
    closeCycleMutation.isPending ||
    updateNotesMutation.isPending ||
    createOperationMutation.isPending ||
    updateOperationMutation.isPending ||
    deleteOperationMutation.isPending ||
    submitLogbookMutation.isPending;

  return {
    fields: fieldsQuery.data ?? [],
    lots: lotsQuery.data ?? [],
    cycles,
    crops,
    cycleOperations: operationsQuery.data ?? [],
    logbookSession: logbookSessionQueryResult.data ?? null,
    logbookPracticeCatalog: practiceCatalogQueryResult.data ?? null,
    isLoading:
      fieldsQuery.isLoading ||
      lotsQuery.isLoading ||
      cyclesQuery.isLoading ||
      logbookSessionQueryResult.isLoading,
    isRefreshing:
      fieldsQuery.isFetching ||
      lotsQuery.isFetching ||
      cyclesQuery.isFetching ||
      operationsQuery.isFetching ||
      logbookSessionQueryResult.isFetching ||
      practiceCatalogQueryResult.isFetching,
    isMutating,
    operationsLoading: operationsQuery.isLoading,
    logbookPracticeLoading: practiceCatalogQueryResult.isLoading,
    errorMessage: fieldsQuery.error
      ? toErrorMessage(fieldsQuery.error, 'Failed to load fields for Phase 11.')
      : lotsQuery.error
        ? toErrorMessage(lotsQuery.error, 'Failed to load lots for Phase 11.')
        : cyclesQuery.error
          ? toErrorMessage(cyclesQuery.error, 'Failed to load production cycles.')
          : logbookSessionQueryResult.error
            ? toErrorMessage(logbookSessionQueryResult.error, 'Failed to load logbook session.')
            : null,
    operationsErrorMessage: operationsQuery.error
      ? toErrorMessage(operationsQuery.error, 'Failed to load cycle operations.')
      : null,
    logbookPracticeErrorMessage: practiceCatalogQueryResult.error
      ? toErrorMessage(practiceCatalogQueryResult.error, 'Failed to load practice catalog.')
      : null,
    latestLogbookResult: submitLogbookMutation.data ?? null,
    refresh: async () => {
      await Promise.all([
        fieldsQuery.refetch(),
        lotsQuery.refetch(),
        cyclesQuery.refetch(),
        logbookSessionQueryResult.refetch(),
        practiceCatalogQueryResult.refetch(),
        selectedCycleId ? operationsQuery.refetch() : Promise.resolve(),
      ]);
    },
    refreshOperations: async () => {
      await operationsQuery.refetch();
    },
    refreshLogbook: async () => {
      await Promise.all([logbookSessionQueryResult.refetch(), practiceCatalogQueryResult.refetch()]);
    },
    createCrop: (input: CreateCropRequest) => createCropMutation.mutateAsync(input),
    updateCrop: (cropId: string, input: UpdateCropRequest) =>
      updateCropMutation.mutateAsync({ cropId, input }),
    updateCropStatus: (cropId: string, input: UpdateCropStatusRequest) =>
      updateCropStatusMutation.mutateAsync({ cropId, input }),
    createProductionCycle: (input: CreateProductionCycleRequest) =>
      createCycleMutation.mutateAsync(input),
    closeProductionCycle: (cycleId: string, input: CloseProductionCycleRequest) =>
      closeCycleMutation.mutateAsync({ cycleId, input }),
    updateProductionCycleNotes: (cycleId: string, input: UpdateProductionCycleNotesRequest) =>
      updateNotesMutation.mutateAsync({ cycleId, input }),
    createProductionCycleOperation: (
      cycleId: string,
      input: CreateProductionCycleOperationRequest,
    ) => createOperationMutation.mutateAsync({ cycleId, input }),
    updateProductionCycleOperation: (
      operationId: string,
      input: UpdateProductionCycleOperationRequest,
    ) => updateOperationMutation.mutateAsync({ operationId, input }),
    deleteProductionCycleOperation: (operationId: string) =>
      deleteOperationMutation.mutateAsync(operationId),
    submitLogbook: (input: LogbookSubmitRequest) => submitLogbookMutation.mutateAsync(input),
  };
}
