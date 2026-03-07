import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listFields } from '../../api/modules/fields';
import { listProducts, listWarehouses } from '../../api/modules/inventory';
import { listLots } from '../../api/modules/lots';
import { listManagedContacts, listManagedUsers } from '../../api/modules/management';
import {
  closeProductionCycle,
  createCrop,
  createHarvestOperation,
  createProductionCycle,
  createProductionCycleOperation,
  createTreatmentOperation,
  deleteProductionCycleOperation,
  listHarvestOperations,
  listCropGroups,
  listCropPracticeMappings,
  listCrops,
  listProductionCycleOperations,
  listProductionCycles,
  listTreatmentOperations,
  replaceCropPracticeMappings,
  updateCrop,
  updateCropStatus,
  updateHarvestOperation,
  updateProductionCycleNotes,
  updateProductionCycleOperation,
  updateTreatmentOperation,
  type CloseProductionCycleRequest,
  type CreateCropRequest,
  type CreateHarvestOperationRequest,
  type CreateProductionCycleOperationRequest,
  type CreateProductionCycleRequest,
  type CreateTreatmentOperationRequest,
  type ReplaceCropPracticeMappingsRequest,
  type UpdateCropRequest,
  type UpdateCropStatusRequest,
  type UpdateHarvestOperationRequest,
  type UpdateProductionCycleNotesRequest,
  type UpdateProductionCycleOperationRequest,
  type UpdateTreatmentOperationRequest,
} from '../../api/modules/crops';
import { useAuthSession } from '../../hooks/useAuthSession';

const PHASE11_FIELDS_KEY = ['phase11', 'fields'] as const;
const PHASE11_LOTS_KEY = ['phase11', 'lots'] as const;
const PHASE11_CROPS_KEY = ['phase11', 'crops'] as const;
const PHASE11_CYCLE_KEY = ['phase11', 'cycles'] as const;
const PHASE11_CROP_GROUPS_KEY = ['phase11', 'crop-groups'] as const;
const PHASE11_CROP_PRACTICES_KEY = ['phase11', 'crop-practices'] as const;
const PHASE11_PRODUCTS_KEY = ['phase11', 'products'] as const;
const PHASE11_WAREHOUSES_KEY = ['phase11', 'warehouses'] as const;
const PHASE11_MANAGED_USERS_KEY = ['phase11', 'managed-users'] as const;
const PHASE11_MANAGED_CONTACTS_KEY = ['phase11', 'managed-contacts'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

type UseCropsModuleParams = {
  selectedCycleId: string | null;
  selectedCropId: string | null;
};

export function useCropsModule({ selectedCycleId, selectedCropId }: UseCropsModuleParams) {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

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

  const cropsQuery = useQuery({
    queryKey: [...PHASE11_CROPS_KEY],
    queryFn: () => listCrops(token ?? ''),
    enabled: Boolean(token),
  });

  const cropGroupsQuery = useQuery({
    queryKey: [...PHASE11_CROP_GROUPS_KEY],
    queryFn: () => listCropGroups(token ?? ''),
    enabled: Boolean(token),
  });

  const productsQuery = useQuery({
    queryKey: [...PHASE11_PRODUCTS_KEY],
    queryFn: async () => {
      const page = await listProducts(token ?? '', {
        status: 'active',
        limit: 200,
        offset: 0,
      });
      return page.items;
    },
    enabled: Boolean(token),
  });

  const warehousesQuery = useQuery({
    queryKey: [...PHASE11_WAREHOUSES_KEY],
    queryFn: async () => {
      const page = await listWarehouses(token ?? '', {
        status: 'active',
        limit: 200,
        offset: 0,
      });
      return page.items;
    },
    enabled: Boolean(token),
  });

  const managedUsersQuery = useQuery({
    queryKey: [...PHASE11_MANAGED_USERS_KEY],
    queryFn: () => listManagedUsers(token ?? ''),
    enabled: Boolean(token),
  });

  const managedContactsQuery = useQuery({
    queryKey: [...PHASE11_MANAGED_CONTACTS_KEY],
    queryFn: async () => {
      const page = await listManagedContacts(token ?? '', {
        limit: 200,
        offset: 0,
        status: ['active'],
      });
      return page.items;
    },
    enabled: Boolean(token),
  });

  const cyclesQuery = useQuery({
    queryKey: [...PHASE11_CYCLE_KEY],
    queryFn: () => listProductionCycles(token ?? ''),
    enabled: Boolean(token),
  });

  const operationsQuery = useQuery({
    queryKey: ['phase11', 'cycle-operations', selectedCycleId],
    queryFn: () => listProductionCycleOperations(token ?? '', selectedCycleId ?? ''),
    enabled: Boolean(token && selectedCycleId),
  });

  const harvestOperationsQuery = useQuery({
    queryKey: ['phase11', 'harvest-operations', selectedCycleId],
    queryFn: () => listHarvestOperations(token ?? '', selectedCycleId ?? ''),
    enabled: Boolean(token && selectedCycleId),
  });

  const treatmentOperationsQuery = useQuery({
    queryKey: ['phase11', 'treatment-operations', selectedCycleId],
    queryFn: () => listTreatmentOperations(token ?? '', selectedCycleId ?? ''),
    enabled: Boolean(token && selectedCycleId),
  });

  const cropPracticesQuery = useQuery({
    queryKey: [...PHASE11_CROP_PRACTICES_KEY, selectedCropId],
    queryFn: () => listCropPracticeMappings(token ?? '', selectedCropId ?? ''),
    enabled: Boolean(token && selectedCropId),
  });

  const createCropMutation = useMutation({
    mutationFn: (input: CreateCropRequest) => createCrop(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE11_CROPS_KEY });
    },
  });

  const updateCropMutation = useMutation({
    mutationFn: (payload: { cropId: string; input: UpdateCropRequest }) =>
      updateCrop(token ?? '', payload.cropId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PHASE11_CROPS_KEY }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY }),
      ]);
    },
  });

  const updateCropStatusMutation = useMutation({
    mutationFn: (payload: { cropId: string; input: UpdateCropStatusRequest }) =>
      updateCropStatus(token ?? '', payload.cropId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PHASE11_CROPS_KEY }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY }),
      ]);
    },
  });

  const replaceCropPracticesMutation = useMutation({
    mutationFn: (payload: { cropId: string; input: ReplaceCropPracticeMappingsRequest }) =>
      replaceCropPracticeMappings(token ?? '', payload.cropId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE11_CROP_PRACTICES_KEY });
    },
  });

  const createCycleMutation = useMutation({
    mutationFn: (input: CreateProductionCycleRequest) => createProductionCycle(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY });
      await queryClient.invalidateQueries({ queryKey: ['phase11', 'logbook-session'] });
    },
  });

  const closeCycleMutation = useMutation({
    mutationFn: (payload: { cycleId: string; input: CloseProductionCycleRequest }) =>
      closeProductionCycle(token ?? '', payload.cycleId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: (payload: { cycleId: string; input: UpdateProductionCycleNotesRequest }) =>
      updateProductionCycleNotes(token ?? '', payload.cycleId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY });
    },
  });

  const createOperationMutation = useMutation({
    mutationFn: (payload: { cycleId: string; input: CreateProductionCycleOperationRequest }) =>
      createProductionCycleOperation(token ?? '', payload.cycleId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase11', 'cycle-operations', selectedCycleId] }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY }),
      ]);
    },
  });

  const updateOperationMutation = useMutation({
    mutationFn: (payload: { operationId: string; input: UpdateProductionCycleOperationRequest }) =>
      updateProductionCycleOperation(token ?? '', payload.operationId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase11', 'cycle-operations', selectedCycleId] }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY }),
      ]);
    },
  });

  const deleteOperationMutation = useMutation({
    mutationFn: (operationId: string) => deleteProductionCycleOperation(token ?? '', operationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase11', 'cycle-operations', selectedCycleId] }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY }),
      ]);
    },
  });

  const createTreatmentOperationMutation = useMutation({
    mutationFn: (payload: { cycleId: string; input: CreateTreatmentOperationRequest }) =>
      createTreatmentOperation(token ?? '', payload.cycleId, payload.input),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['phase11', 'treatment-operations', variables.cycleId],
        }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY }),
      ]);
    },
  });

  const updateTreatmentOperationMutation = useMutation({
    mutationFn: (payload: { operationId: string; input: UpdateTreatmentOperationRequest }) =>
      updateTreatmentOperation(token ?? '', payload.operationId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['phase11', 'treatment-operations', selectedCycleId],
        }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY }),
      ]);
    },
  });

  const createHarvestOperationMutation = useMutation({
    mutationFn: (payload: { cycleId: string; input: CreateHarvestOperationRequest }) =>
      createHarvestOperation(token ?? '', payload.cycleId, payload.input),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['phase11', 'harvest-operations', variables.cycleId],
        }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY }),
      ]);
    },
  });

  const updateHarvestOperationMutation = useMutation({
    mutationFn: (payload: { operationId: string; input: UpdateHarvestOperationRequest }) =>
      updateHarvestOperation(token ?? '', payload.operationId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['phase11', 'harvest-operations', selectedCycleId],
        }),
        queryClient.invalidateQueries({ queryKey: PHASE11_CYCLE_KEY }),
      ]);
    },
  });

  const fields = useMemo(() => fieldsQuery.data ?? [], [fieldsQuery.data]);
  const lots = useMemo(() => lotsQuery.data ?? [], [lotsQuery.data]);
  const crops = useMemo(() => cropsQuery.data ?? [], [cropsQuery.data]);
  const cropGroups = useMemo(() => cropGroupsQuery.data ?? [], [cropGroupsQuery.data]);
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);
  const managedUsers = useMemo(() => managedUsersQuery.data ?? [], [managedUsersQuery.data]);
  const managedContacts = useMemo(
    () => managedContactsQuery.data ?? [],
    [managedContactsQuery.data],
  );
  const cycles = useMemo(() => cyclesQuery.data ?? [], [cyclesQuery.data]);
  const cycleOperations = useMemo(() => operationsQuery.data ?? [], [operationsQuery.data]);
  const harvestOperations = useMemo(
    () => harvestOperationsQuery.data ?? [],
    [harvestOperationsQuery.data],
  );
  const treatmentOperations = useMemo(
    () => treatmentOperationsQuery.data ?? [],
    [treatmentOperationsQuery.data],
  );
  const selectedCropPractices = useMemo(
    () => cropPracticesQuery.data ?? [],
    [cropPracticesQuery.data],
  );

  const isMutating =
    createCropMutation.isPending ||
    updateCropMutation.isPending ||
    updateCropStatusMutation.isPending ||
    replaceCropPracticesMutation.isPending ||
    createCycleMutation.isPending ||
    closeCycleMutation.isPending ||
    updateNotesMutation.isPending ||
    createOperationMutation.isPending ||
    updateOperationMutation.isPending ||
    deleteOperationMutation.isPending ||
    createTreatmentOperationMutation.isPending ||
    updateTreatmentOperationMutation.isPending ||
    createHarvestOperationMutation.isPending ||
    updateHarvestOperationMutation.isPending;

  return {
    fields,
    lots,
    cycles,
    crops,
    cropGroups,
    products,
    warehouses,
    managedUsers,
    managedContacts,
    cycleOperations,
    harvestOperations,
    treatmentOperations,
    selectedCropPractices,
    isLoading:
      fieldsQuery.isLoading ||
      lotsQuery.isLoading ||
      cropsQuery.isLoading ||
      productsQuery.isLoading ||
      warehousesQuery.isLoading ||
      managedUsersQuery.isLoading ||
      managedContactsQuery.isLoading ||
      cyclesQuery.isLoading,
    isRefreshing:
      fieldsQuery.isFetching ||
      lotsQuery.isFetching ||
      cropsQuery.isFetching ||
      cropGroupsQuery.isFetching ||
      productsQuery.isFetching ||
      warehousesQuery.isFetching ||
      managedUsersQuery.isFetching ||
      managedContactsQuery.isFetching ||
      cyclesQuery.isFetching ||
      operationsQuery.isFetching ||
      harvestOperationsQuery.isFetching ||
      treatmentOperationsQuery.isFetching ||
      cropPracticesQuery.isFetching,
    isMutating,
    cropGroupsLoading: cropGroupsQuery.isLoading,
    operationsLoading: operationsQuery.isLoading,
    cropPracticesLoading: cropPracticesQuery.isLoading,
    errorMessage: fieldsQuery.error
      ? toErrorMessage(fieldsQuery.error, 'Failed to load fields for crop planning.')
      : lotsQuery.error
        ? toErrorMessage(lotsQuery.error, 'Failed to load lots for crop planning.')
        : cropsQuery.error
          ? toErrorMessage(cropsQuery.error, 'Failed to load crops for crop planning.')
          : productsQuery.error
            ? toErrorMessage(productsQuery.error, 'Failed to load products for crop planning.')
            : warehousesQuery.error
              ? toErrorMessage(
                  warehousesQuery.error,
                  'Failed to load warehouses for crop planning.',
                )
              : managedUsersQuery.error
                ? toErrorMessage(managedUsersQuery.error, 'Failed to load worker records.')
                : managedContactsQuery.error
                  ? toErrorMessage(managedContactsQuery.error, 'Failed to load contact records.')
                  : cyclesQuery.error
                    ? toErrorMessage(cyclesQuery.error, 'Failed to load production cycles.')
                    : null,
    cropGroupsErrorMessage: cropGroupsQuery.error
      ? toErrorMessage(cropGroupsQuery.error, 'Failed to load crop groups.')
      : null,
    operationsErrorMessage: operationsQuery.error
      ? toErrorMessage(operationsQuery.error, 'Failed to load cycle operations.')
      : null,
    cropPracticesErrorMessage: cropPracticesQuery.error
      ? toErrorMessage(cropPracticesQuery.error, 'Failed to load crop operations.')
      : null,
    refresh: async () => {
      await Promise.all([
        fieldsQuery.refetch(),
        lotsQuery.refetch(),
        cropsQuery.refetch(),
        cropGroupsQuery.refetch(),
        productsQuery.refetch(),
        warehousesQuery.refetch(),
        managedUsersQuery.refetch(),
        managedContactsQuery.refetch(),
        cyclesQuery.refetch(),
        selectedCycleId ? operationsQuery.refetch() : Promise.resolve(),
        selectedCycleId ? harvestOperationsQuery.refetch() : Promise.resolve(),
        selectedCycleId ? treatmentOperationsQuery.refetch() : Promise.resolve(),
        selectedCropId ? cropPracticesQuery.refetch() : Promise.resolve(),
      ]);
    },
    refreshOperations: async () => {
      await Promise.all([
        operationsQuery.refetch(),
        harvestOperationsQuery.refetch(),
        treatmentOperationsQuery.refetch(),
      ]);
    },
    refreshCropPractices: async () => {
      await cropPracticesQuery.refetch();
    },
    createCrop: (input: CreateCropRequest) => createCropMutation.mutateAsync(input),
    updateCrop: (cropId: string, input: UpdateCropRequest) =>
      updateCropMutation.mutateAsync({ cropId, input }),
    updateCropStatus: (cropId: string, input: UpdateCropStatusRequest) =>
      updateCropStatusMutation.mutateAsync({ cropId, input }),
    replaceCropPracticeMappings: (cropId: string, input: ReplaceCropPracticeMappingsRequest) =>
      replaceCropPracticesMutation.mutateAsync({ cropId, input }),
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
    createTreatmentOperation: (cycleId: string, input: CreateTreatmentOperationRequest) =>
      createTreatmentOperationMutation.mutateAsync({ cycleId, input }),
    updateTreatmentOperation: (operationId: string, input: UpdateTreatmentOperationRequest) =>
      updateTreatmentOperationMutation.mutateAsync({ operationId, input }),
    createHarvestOperation: (cycleId: string, input: CreateHarvestOperationRequest) =>
      createHarvestOperationMutation.mutateAsync({ cycleId, input }),
    updateHarvestOperation: (operationId: string, input: UpdateHarvestOperationRequest) =>
      updateHarvestOperationMutation.mutateAsync({ operationId, input }),
  };
}
