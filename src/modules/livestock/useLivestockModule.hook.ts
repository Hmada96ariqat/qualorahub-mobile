import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listFields } from '../../api/modules/fields';
import {
  createAnimal,
  createAnimalHealthCheck,
  createAnimalYieldRecord,
  createHousingConsumptionLog,
  createHousingMaintenanceRecord,
  createHousingUnit,
  createWeatherAlertRule,
  deactivateAnimal,
  deactivateHousingUnit,
  deleteAnimalHealthCheck,
  deleteAnimalYieldRecord,
  deleteHousingConsumptionLog,
  deleteHousingMaintenanceRecord,
  deleteWeatherAlertRule,
  listAnimalHealthChecks,
  listAnimalYieldRecords,
  listAnimals,
  listHousingConsumptionLogs,
  listHousingMaintenanceRecords,
  listHousingUnits,
  listWeatherAlertRulesByLocation,
  listWeatherAlertRulesByLot,
  reactivateHousingUnit,
  updateAnimal,
  updateAnimalHealthCheck,
  updateAnimalYieldRecord,
  updateHousingConsumptionLog,
  updateHousingMaintenanceRecord,
  updateHousingUnit,
  updateWeatherAlertRule,
  type CreateAnimalHealthCheckRequest,
  type CreateAnimalRequest,
  type CreateAnimalYieldRecordRequest,
  type CreateHousingConsumptionLogRequest,
  type CreateHousingMaintenanceRecordRequest,
  type CreateHousingUnitRequest,
  type CreateWeatherAlertRuleRequest,
  type UpdateAnimalHealthCheckRequest,
  type UpdateAnimalRequest,
  type UpdateAnimalYieldRecordRequest,
  type UpdateHousingConsumptionLogRequest,
  type UpdateHousingMaintenanceRecordRequest,
  type UpdateHousingUnitRequest,
  type UpdateWeatherAlertRuleRequest,
} from '../../api/modules/livestock';
import { listLots } from '../../api/modules/lots';
import { useAuthSession } from '../../hooks/useAuthSession';

const PHASE12_FIELDS_QUERY_KEY = ['phase12', 'fields'] as const;
const PHASE12_LOTS_QUERY_KEY = ['phase12', 'lots'] as const;
const PHASE12_ANIMALS_QUERY_KEY = ['phase12', 'animals'] as const;
const PHASE12_HOUSING_UNITS_QUERY_KEY = ['phase12', 'housing-units'] as const;

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

type UseLivestockModuleParams = {
  selectedAnimalId: string | null;
  selectedHousingUnitId: string | null;
  selectedWeatherLotId: string | null;
  selectedWeatherLocationId: string | null;
};

export function useLivestockModule({
  selectedAnimalId,
  selectedHousingUnitId,
  selectedWeatherLotId,
  selectedWeatherLocationId,
}: UseLivestockModuleParams) {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const fieldsQuery = useQuery({
    queryKey: PHASE12_FIELDS_QUERY_KEY,
    queryFn: () => listFields(token ?? ''),
    enabled: Boolean(token),
  });

  const lotsQuery = useQuery({
    queryKey: PHASE12_LOTS_QUERY_KEY,
    queryFn: () => listLots(token ?? ''),
    enabled: Boolean(token),
  });

  const animalsQuery = useQuery({
    queryKey: PHASE12_ANIMALS_QUERY_KEY,
    queryFn: () => listAnimals(token ?? ''),
    enabled: Boolean(token),
  });

  const housingUnitsQuery = useQuery({
    queryKey: PHASE12_HOUSING_UNITS_QUERY_KEY,
    queryFn: () => listHousingUnits(token ?? ''),
    enabled: Boolean(token),
  });

  const weatherRulesQuery = useQuery({
    queryKey: ['phase12', 'weather-rules', selectedWeatherLotId],
    queryFn: () => listWeatherAlertRulesByLot(token ?? '', selectedWeatherLotId ?? ''),
    enabled: Boolean(token && selectedWeatherLotId),
  });

  const weatherLocationRulesQuery = useQuery({
    queryKey: ['phase12', 'weather-rules-location', selectedWeatherLocationId],
    queryFn: () => listWeatherAlertRulesByLocation(token ?? '', selectedWeatherLocationId ?? ''),
    enabled: Boolean(token && selectedWeatherLocationId),
  });

  const healthChecksQuery = useQuery({
    queryKey: ['phase12', 'animal-health-checks', selectedAnimalId],
    queryFn: () => listAnimalHealthChecks(token ?? '', selectedAnimalId ?? ''),
    enabled: Boolean(token && selectedAnimalId),
  });

  const yieldRecordsQuery = useQuery({
    queryKey: ['phase12', 'animal-yield-records', selectedAnimalId],
    queryFn: () => listAnimalYieldRecords(token ?? '', selectedAnimalId ?? ''),
    enabled: Boolean(token && selectedAnimalId),
  });

  const housingMaintenanceQuery = useQuery({
    queryKey: ['phase12', 'housing-maintenance-records', selectedHousingUnitId],
    queryFn: () => listHousingMaintenanceRecords(token ?? '', selectedHousingUnitId ?? ''),
    enabled: Boolean(token && selectedHousingUnitId),
  });

  const housingConsumptionQuery = useQuery({
    queryKey: ['phase12', 'housing-consumption-logs', selectedHousingUnitId],
    queryFn: () => listHousingConsumptionLogs(token ?? '', selectedHousingUnitId ?? ''),
    enabled: Boolean(token && selectedHousingUnitId),
  });

  const createAnimalMutation = useMutation({
    mutationFn: (input: CreateAnimalRequest) => createAnimal(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE12_ANIMALS_QUERY_KEY });
    },
  });

  const updateAnimalMutation = useMutation({
    mutationFn: (payload: { animalId: string; input: UpdateAnimalRequest }) =>
      updateAnimal(token ?? '', payload.animalId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE12_ANIMALS_QUERY_KEY });
    },
  });

  const deactivateAnimalMutation = useMutation({
    mutationFn: (animalId: string) => deactivateAnimal(token ?? '', animalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE12_ANIMALS_QUERY_KEY });
    },
  });

  const createHealthCheckMutation = useMutation({
    mutationFn: (payload: { animalId: string; input: CreateAnimalHealthCheckRequest }) =>
      createAnimalHealthCheck(token ?? '', payload.animalId, payload.input),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'animal-health-checks', payload.animalId],
      });
    },
  });

  const updateHealthCheckMutation = useMutation({
    mutationFn: (payload: { healthCheckId: string; input: UpdateAnimalHealthCheckRequest }) =>
      updateAnimalHealthCheck(token ?? '', payload.healthCheckId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'animal-health-checks', selectedAnimalId],
      });
    },
  });

  const deleteHealthCheckMutation = useMutation({
    mutationFn: (healthCheckId: string) => deleteAnimalHealthCheck(token ?? '', healthCheckId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'animal-health-checks', selectedAnimalId],
      });
    },
  });

  const createYieldRecordMutation = useMutation({
    mutationFn: (payload: { animalId: string; input: CreateAnimalYieldRecordRequest }) =>
      createAnimalYieldRecord(token ?? '', payload.animalId, payload.input),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'animal-yield-records', payload.animalId],
      });
    },
  });

  const updateYieldRecordMutation = useMutation({
    mutationFn: (payload: { yieldRecordId: string; input: UpdateAnimalYieldRecordRequest }) =>
      updateAnimalYieldRecord(token ?? '', payload.yieldRecordId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'animal-yield-records', selectedAnimalId],
      });
    },
  });

  const deleteYieldRecordMutation = useMutation({
    mutationFn: (yieldRecordId: string) => deleteAnimalYieldRecord(token ?? '', yieldRecordId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'animal-yield-records', selectedAnimalId],
      });
    },
  });

  const createHousingUnitMutation = useMutation({
    mutationFn: (input: CreateHousingUnitRequest) => createHousingUnit(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE12_HOUSING_UNITS_QUERY_KEY });
    },
  });

  const updateHousingUnitMutation = useMutation({
    mutationFn: (payload: { housingUnitId: string; input: UpdateHousingUnitRequest }) =>
      updateHousingUnit(token ?? '', payload.housingUnitId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE12_HOUSING_UNITS_QUERY_KEY });
    },
  });

  const deactivateHousingUnitMutation = useMutation({
    mutationFn: (housingUnitId: string) => deactivateHousingUnit(token ?? '', housingUnitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE12_HOUSING_UNITS_QUERY_KEY });
    },
  });

  const reactivateHousingUnitMutation = useMutation({
    mutationFn: (housingUnitId: string) => reactivateHousingUnit(token ?? '', housingUnitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PHASE12_HOUSING_UNITS_QUERY_KEY });
    },
  });

  const createHousingMaintenanceMutation = useMutation({
    mutationFn: (payload: { housingUnitId: string; input: CreateHousingMaintenanceRecordRequest }) =>
      createHousingMaintenanceRecord(token ?? '', payload.housingUnitId, payload.input),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'housing-maintenance-records', payload.housingUnitId],
      });
    },
  });

  const updateHousingMaintenanceMutation = useMutation({
    mutationFn: (payload: {
      maintenanceRecordId: string;
      input: UpdateHousingMaintenanceRecordRequest;
    }) => updateHousingMaintenanceRecord(token ?? '', payload.maintenanceRecordId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'housing-maintenance-records', selectedHousingUnitId],
      });
    },
  });

  const deleteHousingMaintenanceMutation = useMutation({
    mutationFn: (maintenanceRecordId: string) => deleteHousingMaintenanceRecord(token ?? '', maintenanceRecordId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'housing-maintenance-records', selectedHousingUnitId],
      });
    },
  });

  const createHousingConsumptionMutation = useMutation({
    mutationFn: (payload: { housingUnitId: string; input: CreateHousingConsumptionLogRequest }) =>
      createHousingConsumptionLog(token ?? '', payload.housingUnitId, payload.input),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'housing-consumption-logs', payload.housingUnitId],
      });
    },
  });

  const updateHousingConsumptionMutation = useMutation({
    mutationFn: (payload: { consumptionLogId: string; input: UpdateHousingConsumptionLogRequest }) =>
      updateHousingConsumptionLog(token ?? '', payload.consumptionLogId, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'housing-consumption-logs', selectedHousingUnitId],
      });
    },
  });

  const deleteHousingConsumptionMutation = useMutation({
    mutationFn: (consumptionLogId: string) => deleteHousingConsumptionLog(token ?? '', consumptionLogId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['phase12', 'housing-consumption-logs', selectedHousingUnitId],
      });
    },
  });

  const createWeatherRuleMutation = useMutation({
    mutationFn: (input: CreateWeatherAlertRuleRequest) => createWeatherAlertRule(token ?? '', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase12', 'weather-rules'] }),
        queryClient.invalidateQueries({ queryKey: ['phase12', 'weather-rules-location'] }),
      ]);
    },
  });

  const updateWeatherRuleMutation = useMutation({
    mutationFn: (payload: { weatherAlertRuleId: string; input: UpdateWeatherAlertRuleRequest }) =>
      updateWeatherAlertRule(token ?? '', payload.weatherAlertRuleId, payload.input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase12', 'weather-rules'] }),
        queryClient.invalidateQueries({ queryKey: ['phase12', 'weather-rules-location'] }),
      ]);
    },
  });

  const deleteWeatherRuleMutation = useMutation({
    mutationFn: (weatherAlertRuleId: string) => deleteWeatherAlertRule(token ?? '', weatherAlertRuleId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase12', 'weather-rules'] }),
        queryClient.invalidateQueries({ queryKey: ['phase12', 'weather-rules-location'] }),
      ]);
    },
  });

  const animals = useMemo(() => animalsQuery.data ?? [], [animalsQuery.data]);
  const housingUnits = useMemo(() => housingUnitsQuery.data ?? [], [housingUnitsQuery.data]);
  const weatherRules = useMemo(() => weatherRulesQuery.data ?? [], [weatherRulesQuery.data]);

  const isMutating =
    createAnimalMutation.isPending ||
    updateAnimalMutation.isPending ||
    deactivateAnimalMutation.isPending ||
    createHealthCheckMutation.isPending ||
    updateHealthCheckMutation.isPending ||
    deleteHealthCheckMutation.isPending ||
    createYieldRecordMutation.isPending ||
    updateYieldRecordMutation.isPending ||
    deleteYieldRecordMutation.isPending ||
    createHousingUnitMutation.isPending ||
    updateHousingUnitMutation.isPending ||
    deactivateHousingUnitMutation.isPending ||
    reactivateHousingUnitMutation.isPending ||
    createHousingMaintenanceMutation.isPending ||
    updateHousingMaintenanceMutation.isPending ||
    deleteHousingMaintenanceMutation.isPending ||
    createHousingConsumptionMutation.isPending ||
    updateHousingConsumptionMutation.isPending ||
    deleteHousingConsumptionMutation.isPending ||
    createWeatherRuleMutation.isPending ||
    updateWeatherRuleMutation.isPending ||
    deleteWeatherRuleMutation.isPending;

  return {
    fields: fieldsQuery.data ?? [],
    lots: lotsQuery.data ?? [],
    animals,
    housingUnits,
    weatherRules,
    weatherLocationRules: weatherLocationRulesQuery.data ?? [],
    healthChecks: healthChecksQuery.data ?? [],
    yieldRecords: yieldRecordsQuery.data ?? [],
    housingMaintenanceRecords: housingMaintenanceQuery.data ?? [],
    housingConsumptionLogs: housingConsumptionQuery.data ?? [],
    isLoading:
      fieldsQuery.isLoading ||
      lotsQuery.isLoading ||
      animalsQuery.isLoading ||
      housingUnitsQuery.isLoading ||
      weatherRulesQuery.isLoading,
    isRefreshing:
      fieldsQuery.isFetching ||
      lotsQuery.isFetching ||
      animalsQuery.isFetching ||
      housingUnitsQuery.isFetching ||
      weatherRulesQuery.isFetching ||
      weatherLocationRulesQuery.isFetching,
    detailsLoading:
      healthChecksQuery.isLoading ||
      yieldRecordsQuery.isLoading ||
      housingMaintenanceQuery.isLoading ||
      housingConsumptionQuery.isLoading,
    detailsRefreshing:
      healthChecksQuery.isFetching ||
      yieldRecordsQuery.isFetching ||
      housingMaintenanceQuery.isFetching ||
      housingConsumptionQuery.isFetching,
    isMutating,
    errorMessage: fieldsQuery.error
      ? toErrorMessage(fieldsQuery.error, 'Failed to load fields for Phase 12.')
      : lotsQuery.error
        ? toErrorMessage(lotsQuery.error, 'Failed to load lots for Phase 12.')
        : animalsQuery.error
          ? toErrorMessage(animalsQuery.error, 'Failed to load animals.')
          : housingUnitsQuery.error
            ? toErrorMessage(housingUnitsQuery.error, 'Failed to load housing units.')
            : weatherRulesQuery.error
              ? toErrorMessage(weatherRulesQuery.error, 'Failed to load weather alert rules.')
              : null,
    detailsErrorMessage: healthChecksQuery.error
      ? toErrorMessage(healthChecksQuery.error, 'Failed to load animal health checks.')
      : yieldRecordsQuery.error
        ? toErrorMessage(yieldRecordsQuery.error, 'Failed to load animal yield records.')
        : housingMaintenanceQuery.error
          ? toErrorMessage(housingMaintenanceQuery.error, 'Failed to load maintenance records.')
          : housingConsumptionQuery.error
            ? toErrorMessage(housingConsumptionQuery.error, 'Failed to load consumption logs.')
            : weatherLocationRulesQuery.error
              ? toErrorMessage(weatherLocationRulesQuery.error, 'Failed to load location weather rules.')
              : null,
    refresh: async () => {
      await Promise.all([
        fieldsQuery.refetch(),
        lotsQuery.refetch(),
        animalsQuery.refetch(),
        housingUnitsQuery.refetch(),
        weatherRulesQuery.refetch(),
        selectedWeatherLocationId ? weatherLocationRulesQuery.refetch() : Promise.resolve(),
      ]);
    },
    refreshDetails: async () => {
      await Promise.all([
        selectedAnimalId ? healthChecksQuery.refetch() : Promise.resolve(),
        selectedAnimalId ? yieldRecordsQuery.refetch() : Promise.resolve(),
        selectedHousingUnitId ? housingMaintenanceQuery.refetch() : Promise.resolve(),
        selectedHousingUnitId ? housingConsumptionQuery.refetch() : Promise.resolve(),
      ]);
    },
    createAnimal: (input: CreateAnimalRequest) => createAnimalMutation.mutateAsync(input),
    updateAnimal: (animalId: string, input: UpdateAnimalRequest) =>
      updateAnimalMutation.mutateAsync({ animalId, input }),
    deactivateAnimal: (animalId: string) => deactivateAnimalMutation.mutateAsync(animalId),
    createAnimalHealthCheck: (animalId: string, input: CreateAnimalHealthCheckRequest) =>
      createHealthCheckMutation.mutateAsync({ animalId, input }),
    updateAnimalHealthCheck: (healthCheckId: string, input: UpdateAnimalHealthCheckRequest) =>
      updateHealthCheckMutation.mutateAsync({ healthCheckId, input }),
    deleteAnimalHealthCheck: (healthCheckId: string) => deleteHealthCheckMutation.mutateAsync(healthCheckId),
    createAnimalYieldRecord: (animalId: string, input: CreateAnimalYieldRecordRequest) =>
      createYieldRecordMutation.mutateAsync({ animalId, input }),
    updateAnimalYieldRecord: (yieldRecordId: string, input: UpdateAnimalYieldRecordRequest) =>
      updateYieldRecordMutation.mutateAsync({ yieldRecordId, input }),
    deleteAnimalYieldRecord: (yieldRecordId: string) => deleteYieldRecordMutation.mutateAsync(yieldRecordId),
    createHousingUnit: (input: CreateHousingUnitRequest) => createHousingUnitMutation.mutateAsync(input),
    updateHousingUnit: (housingUnitId: string, input: UpdateHousingUnitRequest) =>
      updateHousingUnitMutation.mutateAsync({ housingUnitId, input }),
    deactivateHousingUnit: (housingUnitId: string) => deactivateHousingUnitMutation.mutateAsync(housingUnitId),
    reactivateHousingUnit: (housingUnitId: string) => reactivateHousingUnitMutation.mutateAsync(housingUnitId),
    createHousingMaintenanceRecord: (housingUnitId: string, input: CreateHousingMaintenanceRecordRequest) =>
      createHousingMaintenanceMutation.mutateAsync({ housingUnitId, input }),
    updateHousingMaintenanceRecord: (
      maintenanceRecordId: string,
      input: UpdateHousingMaintenanceRecordRequest,
    ) => updateHousingMaintenanceMutation.mutateAsync({ maintenanceRecordId, input }),
    deleteHousingMaintenanceRecord: (maintenanceRecordId: string) =>
      deleteHousingMaintenanceMutation.mutateAsync(maintenanceRecordId),
    createHousingConsumptionLog: (housingUnitId: string, input: CreateHousingConsumptionLogRequest) =>
      createHousingConsumptionMutation.mutateAsync({ housingUnitId, input }),
    updateHousingConsumptionLog: (consumptionLogId: string, input: UpdateHousingConsumptionLogRequest) =>
      updateHousingConsumptionMutation.mutateAsync({ consumptionLogId, input }),
    deleteHousingConsumptionLog: (consumptionLogId: string) =>
      deleteHousingConsumptionMutation.mutateAsync(consumptionLogId),
    createWeatherAlertRule: (input: CreateWeatherAlertRuleRequest) =>
      createWeatherRuleMutation.mutateAsync(input),
    updateWeatherAlertRule: (weatherAlertRuleId: string, input: UpdateWeatherAlertRuleRequest) =>
      updateWeatherRuleMutation.mutateAsync({ weatherAlertRuleId, input }),
    deleteWeatherAlertRule: (weatherAlertRuleId: string) => deleteWeatherRuleMutation.mutateAsync(weatherAlertRuleId),
  };
}
