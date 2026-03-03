import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listFields } from '../../api/modules/fields';
import {
  createEquipment,
  createMaintenanceRecord,
  createUsageLog,
  deactivateEquipment,
  deleteEquipment,
  deleteMaintenanceRecord,
  deleteUsageLog,
  getEquipmentById,
  listEquipment,
  listEquipmentOperators,
  listMaintenanceRecords,
  listUpcomingMaintenance,
  listUsageLogs,
  reactivateEquipment,
  updateEquipment,
  updateMaintenanceRecord,
  updateUsageLog,
  type CreateEquipmentRequest,
  type CreateMaintenanceRecordRequest,
  type CreateUsageLogRequest,
  type EquipmentSummary,
  type UpdateEquipmentRequest,
  type UpdateMaintenanceRecordRequest,
  type UpdateUsageLogRequest,
} from '../../api/modules/equipment';
import { useAuthSession } from '../../hooks/useAuthSession';

const EQUIPMENT_LIST_QUERY_KEY = ['equipment', 'list'] as const;
const EQUIPMENT_UPCOMING_QUERY_KEY = ['equipment', 'upcoming'] as const;
const EQUIPMENT_OPERATORS_QUERY_KEY = ['equipment', 'operators'] as const;
const EQUIPMENT_FIELD_OPTIONS_QUERY_KEY = ['equipment', 'field-options'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function useEquipmentModule(selectedEquipmentId: string | null) {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: EQUIPMENT_LIST_QUERY_KEY,
    queryFn: () => listEquipment(token ?? ''),
    enabled: Boolean(token),
  });

  const upcomingQuery = useQuery({
    queryKey: EQUIPMENT_UPCOMING_QUERY_KEY,
    queryFn: () => listUpcomingMaintenance(token ?? ''),
    enabled: Boolean(token),
  });

  const operatorsQuery = useQuery({
    queryKey: EQUIPMENT_OPERATORS_QUERY_KEY,
    queryFn: () => listEquipmentOperators(token ?? ''),
    enabled: Boolean(token),
  });

  const fieldOptionsQuery = useQuery({
    queryKey: EQUIPMENT_FIELD_OPTIONS_QUERY_KEY,
    queryFn: async () => {
      const fields = await listFields(token ?? '');
      return fields
        .filter((field) => field.status !== 'inactive')
        .map((field) => ({
          label: field.name,
          value: field.id,
        }));
    },
    enabled: Boolean(token),
  });

  const detailQuery = useQuery({
    queryKey: ['equipment', 'detail', selectedEquipmentId],
    queryFn: () => getEquipmentById(token ?? '', selectedEquipmentId ?? ''),
    enabled: Boolean(token && selectedEquipmentId),
  });

  const usageLogsQuery = useQuery({
    queryKey: ['equipment', 'usage-logs', selectedEquipmentId],
    queryFn: () => listUsageLogs(token ?? '', selectedEquipmentId ?? ''),
    enabled: Boolean(token && selectedEquipmentId),
  });

  const maintenanceQuery = useQuery({
    queryKey: ['equipment', 'maintenance-records', selectedEquipmentId],
    queryFn: () => listMaintenanceRecords(token ?? '', selectedEquipmentId ?? ''),
    enabled: Boolean(token && selectedEquipmentId),
  });

  const createEquipmentMutation = useMutation({
    mutationFn: (input: CreateEquipmentRequest) => createEquipment(token ?? '', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_LIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_UPCOMING_QUERY_KEY }),
      ]);
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: (payload: { equipmentId: string; input: UpdateEquipmentRequest }) =>
      updateEquipment(token ?? '', payload.equipmentId, payload.input),
    onSuccess: async (_, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_LIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_UPCOMING_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['equipment', 'detail', payload.equipmentId] }),
      ]);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (equipmentId: string) => deactivateEquipment(token ?? '', equipmentId),
    onSuccess: async (_, equipmentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_LIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_UPCOMING_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['equipment', 'detail', equipmentId] }),
      ]);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (equipmentId: string) => reactivateEquipment(token ?? '', equipmentId),
    onSuccess: async (_, equipmentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_LIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_UPCOMING_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['equipment', 'detail', equipmentId] }),
      ]);
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: (equipmentId: string) => deleteEquipment(token ?? '', equipmentId),
    onSuccess: async (_, equipmentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_LIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_UPCOMING_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['equipment', 'detail', equipmentId] }),
        queryClient.invalidateQueries({ queryKey: ['equipment', 'usage-logs', equipmentId] }),
        queryClient.invalidateQueries({ queryKey: ['equipment', 'maintenance-records', equipmentId] }),
      ]);
    },
  });

  const createUsageMutation = useMutation({
    mutationFn: (payload: { equipmentId: string; input: CreateUsageLogRequest }) =>
      createUsageLog(token ?? '', payload.equipmentId, payload.input),
    onSuccess: async (_, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['equipment', 'usage-logs', payload.equipmentId] }),
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_LIST_QUERY_KEY }),
      ]);
    },
  });

  const updateUsageMutation = useMutation({
    mutationFn: (payload: { usageLogId: string; input: UpdateUsageLogRequest }) =>
      updateUsageLog(token ?? '', payload.usageLogId, payload.input),
    onSuccess: async () => {
      if (!selectedEquipmentId) return;
      await queryClient.invalidateQueries({
        queryKey: ['equipment', 'usage-logs', selectedEquipmentId],
      });
    },
  });

  const deleteUsageMutation = useMutation({
    mutationFn: (usageLogId: string) => deleteUsageLog(token ?? '', usageLogId),
    onSuccess: async () => {
      if (!selectedEquipmentId) return;
      await queryClient.invalidateQueries({
        queryKey: ['equipment', 'usage-logs', selectedEquipmentId],
      });
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: (payload: { equipmentId: string; input: CreateMaintenanceRecordRequest }) =>
      createMaintenanceRecord(token ?? '', payload.equipmentId, payload.input),
    onSuccess: async (_, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['equipment', 'maintenance-records', payload.equipmentId],
        }),
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_UPCOMING_QUERY_KEY }),
      ]);
    },
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: (payload: { recordId: string; input: UpdateMaintenanceRecordRequest }) =>
      updateMaintenanceRecord(token ?? '', payload.recordId, payload.input),
    onSuccess: async () => {
      if (!selectedEquipmentId) return;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['equipment', 'maintenance-records', selectedEquipmentId],
        }),
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_UPCOMING_QUERY_KEY }),
      ]);
    },
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: (recordId: string) => deleteMaintenanceRecord(token ?? '', recordId),
    onSuccess: async () => {
      if (!selectedEquipmentId) return;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['equipment', 'maintenance-records', selectedEquipmentId],
        }),
        queryClient.invalidateQueries({ queryKey: EQUIPMENT_UPCOMING_QUERY_KEY }),
      ]);
    },
  });

  const equipment = useMemo<EquipmentSummary[]>(() => listQuery.data ?? [], [listQuery.data]);
  const upcomingMaintenance = useMemo(() => upcomingQuery.data ?? [], [upcomingQuery.data]);
  const operatorOptions = useMemo(() => operatorsQuery.data ?? [], [operatorsQuery.data]);
  const fieldOptions = useMemo(() => fieldOptionsQuery.data ?? [], [fieldOptionsQuery.data]);
  const usageLogs = useMemo(() => usageLogsQuery.data ?? [], [usageLogsQuery.data]);
  const maintenanceRecords = useMemo(() => maintenanceQuery.data ?? [], [maintenanceQuery.data]);

  const isMutating =
    createEquipmentMutation.isPending ||
    updateEquipmentMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending ||
    deleteEquipmentMutation.isPending ||
    createUsageMutation.isPending ||
    updateUsageMutation.isPending ||
    deleteUsageMutation.isPending ||
    createMaintenanceMutation.isPending ||
    updateMaintenanceMutation.isPending ||
    deleteMaintenanceMutation.isPending;

  return {
    equipment,
    upcomingMaintenance,
    operatorOptions,
    fieldOptions,
    equipmentDetail: detailQuery.data ?? null,
    usageLogs,
    maintenanceRecords,
    isLoading: listQuery.isLoading,
    isRefreshing: listQuery.isFetching || upcomingQuery.isFetching,
    isMutating,
    detailsLoading: detailQuery.isLoading || usageLogsQuery.isLoading || maintenanceQuery.isLoading,
    detailsRefreshing:
      detailQuery.isFetching || usageLogsQuery.isFetching || maintenanceQuery.isFetching,
    errorMessage: listQuery.error
      ? toErrorMessage(listQuery.error, 'Failed to load equipment.')
      : upcomingQuery.error
        ? toErrorMessage(upcomingQuery.error, 'Failed to load upcoming maintenance.')
        : null,
    detailsErrorMessage: detailQuery.error
      ? toErrorMessage(detailQuery.error, 'Failed to load equipment detail.')
      : usageLogsQuery.error
        ? toErrorMessage(usageLogsQuery.error, 'Failed to load usage logs.')
        : maintenanceQuery.error
          ? toErrorMessage(maintenanceQuery.error, 'Failed to load maintenance records.')
          : null,
    refresh: async () => {
      await Promise.all([listQuery.refetch(), upcomingQuery.refetch()]);
    },
    refreshDetails: async () => {
      await Promise.all([detailQuery.refetch(), usageLogsQuery.refetch(), maintenanceQuery.refetch()]);
    },
    createEquipment: (input: CreateEquipmentRequest) => createEquipmentMutation.mutateAsync(input),
    updateEquipment: (equipmentId: string, input: UpdateEquipmentRequest) =>
      updateEquipmentMutation.mutateAsync({ equipmentId, input }),
    deactivateEquipment: (equipmentId: string) => deactivateMutation.mutateAsync(equipmentId),
    reactivateEquipment: (equipmentId: string) => reactivateMutation.mutateAsync(equipmentId),
    deleteEquipment: (equipmentId: string) => deleteEquipmentMutation.mutateAsync(equipmentId),
    createUsageLog: (equipmentId: string, input: CreateUsageLogRequest) =>
      createUsageMutation.mutateAsync({ equipmentId, input }),
    updateUsageLog: (usageLogId: string, input: UpdateUsageLogRequest) =>
      updateUsageMutation.mutateAsync({ usageLogId, input }),
    deleteUsageLog: (usageLogId: string) => deleteUsageMutation.mutateAsync(usageLogId),
    createMaintenanceRecord: (equipmentId: string, input: CreateMaintenanceRecordRequest) =>
      createMaintenanceMutation.mutateAsync({ equipmentId, input }),
    updateMaintenanceRecord: (recordId: string, input: UpdateMaintenanceRecordRequest) =>
      updateMaintenanceMutation.mutateAsync({ recordId, input }),
    deleteMaintenanceRecord: (recordId: string) => deleteMaintenanceMutation.mutateAsync(recordId),
  };
}
