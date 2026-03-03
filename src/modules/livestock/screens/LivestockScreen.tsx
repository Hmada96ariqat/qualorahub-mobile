import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type {
  AnimalGroup,
  AnimalHealthCheck,
  AnimalRecord,
  AnimalYieldRecord,
  HousingConsumptionLog,
  HousingMaintenanceRecord,
  HousingUnit,
  WeatherAlertRule,
} from '../../../api/modules/livestock';
import {
  ActionSheet,
  AppBadge,
  AppButton,
  AppCard,
  AppDatePicker,
  AppHeader,
  AppInput,
  AppListItem,
  AppPolygonMapEditor,
  AppScreen,
  AppSection,
  AppSelect,
  AppTabs,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  FormField,
  PaginationFooter,
  PullToRefreshContainer,
  Skeleton,
  useToast,
} from '../../../components';
import { palette, spacing, typography } from '../../../theme/tokens';
import { toGeoJsonPolygon } from '../../../utils/geojson';
import {
  ANIMAL_STATUS_OPTIONS,
  LIVESTOCK_TAB_OPTIONS,
  WEATHER_CONDITION_OPTIONS,
  WEATHER_OPERATOR_OPTIONS,
  WEATHER_SEVERITY_OPTIONS,
  parseCsvValues,
  toAnimalFormValues,
  toAnimalGroupFormValues,
  toHealthCheckFormValues,
  toHousingConsumptionFormValues,
  toHousingMaintenanceFormValues,
  toHousingUnitFormValues,
  toWeatherRuleFormValues,
  toYieldRecordFormValues,
  type AnimalFormValues,
  type AnimalGroupFormValues,
  type HealthCheckFormValues,
  type HousingConsumptionFormValues,
  type HousingMaintenanceFormValues,
  type HousingUnitFormValues,
  type LivestockTab,
  type WeatherRuleFormValues,
  type YieldRecordFormValues,
} from '../contracts';
import { useLivestockModule } from '../useLivestockModule.hook';

type FormMode = 'create' | 'edit';

function normalizeApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    const traceId =
      typeof (error as { traceId?: unknown }).traceId === 'string'
        ? (error as { traceId?: string }).traceId
        : null;

    return traceId ? `${error.message} (trace: ${traceId})` : error.message;
  }

  return fallback;
}

function statusLabel(value: string | null): string {
  if (!value) return 'unknown';
  return value.replaceAll('_', ' ');
}

function badgeVariant(
  value: string | null | undefined,
): 'neutral' | 'warning' | 'accent' | 'success' | 'destructive' {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'active' || normalized === 'enabled' || normalized === 'ok') return 'success';
  if (normalized === 'inactive' || normalized === 'disabled') return 'warning';
  if (normalized === 'high') return 'destructive';
  if (normalized === 'medium' || normalized === 'in_progress') return 'accent';
  return 'neutral';
}

function formatAnimalMeta(animal: AnimalRecord): string {
  const species = animal.species ?? 'unknown species';
  const tag = animal.tagNumber ? `Tag ${animal.tagNumber}` : 'No tag';
  return `${species} • ${tag}`;
}

function formatHousingMeta(unit: HousingUnit): string {
  const code = unit.unitCode ? `Code ${unit.unitCode}` : 'No code';
  const field = unit.fieldId ? `Field ${unit.fieldId}` : 'No field';
  return `${code} • ${field}`;
}

function formatWeatherMeta(rule: WeatherAlertRule): string {
  const metric = rule.condition ?? 'condition';
  const operator = rule.operator ?? '>=';
  const threshold = rule.value === null ? 'n/a' : String(rule.value);
  return `${metric} ${operator} ${threshold} ${rule.unit ?? ''}`.trim();
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function LivestockScreen() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<LivestockTab>('animals');
  const [animalSearch, setAnimalSearch] = useState('');
  const [housingSearch, setHousingSearch] = useState('');
  const [weatherSearch, setWeatherSearch] = useState('');

  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [selectedHousingUnitId, setSelectedHousingUnitId] = useState<string | null>(null);
  const [weatherLotId, setWeatherLotId] = useState<string>('');
  const [weatherLocationInput, setWeatherLocationInput] = useState('');
  const [selectedWeatherLocationId, setSelectedWeatherLocationId] = useState<string | null>(null);

  const [animalFormVisible, setAnimalFormVisible] = useState(false);
  const [animalFormMode, setAnimalFormMode] = useState<FormMode>('create');
  const [editingAnimal, setEditingAnimal] = useState<AnimalRecord | null>(null);
  const [animalFormValues, setAnimalFormValues] = useState<AnimalFormValues>(toAnimalFormValues());

  const [animalGroupFormVisible, setAnimalGroupFormVisible] = useState(false);
  const [animalGroupFormMode, setAnimalGroupFormMode] = useState<FormMode>('create');
  const [editingAnimalGroup, setEditingAnimalGroup] = useState<AnimalGroup | null>(null);
  const [animalGroupFormValues, setAnimalGroupFormValues] = useState<AnimalGroupFormValues>(
    toAnimalGroupFormValues(),
  );

  const [healthCheckFormVisible, setHealthCheckFormVisible] = useState(false);
  const [healthCheckFormMode, setHealthCheckFormMode] = useState<FormMode>('create');
  const [editingHealthCheck, setEditingHealthCheck] = useState<AnimalHealthCheck | null>(null);
  const [healthCheckFormValues, setHealthCheckFormValues] = useState<HealthCheckFormValues>(
    toHealthCheckFormValues(),
  );

  const [yieldFormVisible, setYieldFormVisible] = useState(false);
  const [yieldFormMode, setYieldFormMode] = useState<FormMode>('create');
  const [editingYieldRecord, setEditingYieldRecord] = useState<AnimalYieldRecord | null>(null);
  const [yieldFormValues, setYieldFormValues] = useState<YieldRecordFormValues>(
    toYieldRecordFormValues(),
  );

  const [housingFormVisible, setHousingFormVisible] = useState(false);
  const [housingFormMode, setHousingFormMode] = useState<FormMode>('create');
  const [editingHousingUnit, setEditingHousingUnit] = useState<HousingUnit | null>(null);
  const [housingFormValues, setHousingFormValues] = useState<HousingUnitFormValues>(
    toHousingUnitFormValues(),
  );

  const [maintenanceFormVisible, setMaintenanceFormVisible] = useState(false);
  const [maintenanceFormMode, setMaintenanceFormMode] = useState<FormMode>('create');
  const [editingMaintenanceRecord, setEditingMaintenanceRecord] =
    useState<HousingMaintenanceRecord | null>(null);
  const [maintenanceFormValues, setMaintenanceFormValues] =
    useState<HousingMaintenanceFormValues>(toHousingMaintenanceFormValues());

  const [consumptionFormVisible, setConsumptionFormVisible] = useState(false);
  const [consumptionFormMode, setConsumptionFormMode] = useState<FormMode>('create');
  const [editingConsumptionLog, setEditingConsumptionLog] = useState<HousingConsumptionLog | null>(null);
  const [consumptionFormValues, setConsumptionFormValues] = useState<HousingConsumptionFormValues>(
    toHousingConsumptionFormValues(),
  );

  const [weatherRuleFormVisible, setWeatherRuleFormVisible] = useState(false);
  const [weatherRuleFormMode, setWeatherRuleFormMode] = useState<FormMode>('create');
  const [editingWeatherRule, setEditingWeatherRule] = useState<WeatherAlertRule | null>(null);
  const [weatherRuleFormValues, setWeatherRuleFormValues] = useState<WeatherRuleFormValues>(
    toWeatherRuleFormValues(),
  );

  const [animalActionTarget, setAnimalActionTarget] = useState<AnimalRecord | null>(null);
  const [animalGroupActionTarget, setAnimalGroupActionTarget] = useState<AnimalGroup | null>(null);
  const [healthCheckActionTarget, setHealthCheckActionTarget] = useState<AnimalHealthCheck | null>(null);
  const [yieldRecordActionTarget, setYieldRecordActionTarget] = useState<AnimalYieldRecord | null>(null);
  const [housingActionTarget, setHousingActionTarget] = useState<HousingUnit | null>(null);
  const [maintenanceActionTarget, setMaintenanceActionTarget] =
    useState<HousingMaintenanceRecord | null>(null);
  const [consumptionActionTarget, setConsumptionActionTarget] = useState<HousingConsumptionLog | null>(null);
  const [weatherRuleActionTarget, setWeatherRuleActionTarget] = useState<WeatherAlertRule | null>(null);

  const [animalDeactivateTarget, setAnimalDeactivateTarget] = useState<AnimalRecord | null>(null);
  const [groupDeactivateTarget, setGroupDeactivateTarget] = useState<AnimalGroup | null>(null);
  const [healthCheckDeleteTarget, setHealthCheckDeleteTarget] = useState<AnimalHealthCheck | null>(null);
  const [yieldRecordDeleteTarget, setYieldRecordDeleteTarget] = useState<AnimalYieldRecord | null>(null);
  const [housingDeactivateTarget, setHousingDeactivateTarget] = useState<HousingUnit | null>(null);
  const [maintenanceDeleteTarget, setMaintenanceDeleteTarget] =
    useState<HousingMaintenanceRecord | null>(null);
  const [consumptionDeleteTarget, setConsumptionDeleteTarget] =
    useState<HousingConsumptionLog | null>(null);
  const [weatherRuleDeleteTarget, setWeatherRuleDeleteTarget] = useState<WeatherAlertRule | null>(null);

  const {
    fields,
    lots,
    animals,
    animalGroups,
    housingUnits,
    weatherRules,
    weatherLocationRules,
    healthChecks,
    yieldRecords,
    housingMaintenanceRecords,
    housingConsumptionLogs,
    isLoading,
    isRefreshing,
    detailsLoading,
    detailsRefreshing,
    isMutating,
    errorMessage,
    detailsErrorMessage,
    refresh,
    refreshDetails,
    createAnimal,
    updateAnimal,
    deactivateAnimal,
    createAnimalGroup,
    updateAnimalGroup,
    deactivateAnimalGroup,
    createAnimalHealthCheck,
    updateAnimalHealthCheck,
    deleteAnimalHealthCheck,
    createAnimalYieldRecord,
    updateAnimalYieldRecord,
    deleteAnimalYieldRecord,
    createHousingUnit,
    updateHousingUnit,
    deactivateHousingUnit,
    reactivateHousingUnit,
    createHousingMaintenanceRecord,
    updateHousingMaintenanceRecord,
    deleteHousingMaintenanceRecord,
    createHousingConsumptionLog,
    updateHousingConsumptionLog,
    deleteHousingConsumptionLog,
    createWeatherAlertRule,
    updateWeatherAlertRule,
    deleteWeatherAlertRule,
  } = useLivestockModule({
    selectedAnimalId,
    selectedHousingUnitId,
    selectedWeatherLotId: weatherLotId || null,
    selectedWeatherLocationId,
  });

  const selectedAnimal = useMemo(
    () => animals.find((animal) => animal.id === selectedAnimalId) ?? null,
    [animals, selectedAnimalId],
  );

  const selectedHousingUnit = useMemo(
    () => housingUnits.find((unit) => unit.id === selectedHousingUnitId) ?? null,
    [housingUnits, selectedHousingUnitId],
  );

  const filteredAnimals = useMemo(() => {
    const normalized = animalSearch.trim().toLowerCase();
    if (!normalized) return animals;

    return animals.filter((animal) =>
      [
        animal.name,
        animal.species ?? '',
        animal.tagNumber ?? '',
        animal.activeStatus ?? '',
        animal.healthStatus ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [animalSearch, animals]);

  const filteredAnimalGroups = useMemo(() => {
    const normalized = animalSearch.trim().toLowerCase();
    if (!normalized) return animalGroups;

    return animalGroups.filter((group) =>
      [group.name, group.species ?? '', group.status ?? '', group.notes ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [animalSearch, animalGroups]);

  const filteredHousingUnits = useMemo(() => {
    const normalized = housingSearch.trim().toLowerCase();
    if (!normalized) return housingUnits;

    return housingUnits.filter((unit) =>
      [
        unit.barnName,
        unit.unitCode ?? '',
        unit.fieldId ?? '',
        unit.currentStatus ?? '',
        unit.notes ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [housingSearch, housingUnits]);

  const filteredWeatherRules = useMemo(() => {
    const normalized = weatherSearch.trim().toLowerCase();
    if (!normalized) return weatherRules;

    return weatherRules.filter((rule) =>
      [
        rule.name,
        rule.condition ?? '',
        rule.operator ?? '',
        rule.severity ?? '',
        rule.customMessage ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [weatherRules, weatherSearch]);

  function closeAnimalForm() {
    setAnimalFormVisible(false);
    setEditingAnimal(null);
    setAnimalFormValues(toAnimalFormValues());
  }

  function openAnimalCreateForm() {
    setAnimalFormMode('create');
    setEditingAnimal(null);
    setAnimalFormValues(toAnimalFormValues());
    setAnimalFormVisible(true);
  }

  function openAnimalEditForm(animal: AnimalRecord) {
    setAnimalFormMode('edit');
    setEditingAnimal(animal);
    setAnimalFormValues(toAnimalFormValues(animal));
    setAnimalFormVisible(true);
  }

  async function submitAnimalForm() {
    const name = animalFormValues.name.trim();
    const species = animalFormValues.species.trim();

    if (!name || !species) {
      showToast({
        message: 'Animal name and species are required.',
        variant: 'error',
      });
      return;
    }

    const quantity = parseOptionalNumber(animalFormValues.quantity);
    const payload = {
      name,
      species,
      breed: animalFormValues.breed.trim() || null,
      tag_number: animalFormValues.tagNumber.trim() || null,
      health_status: animalFormValues.healthStatus.trim() || null,
      active_status: animalFormValues.activeStatus.trim() || null,
      quantity,
      group_id: animalFormValues.groupId || null,
      current_housing_unit_id: animalFormValues.housingUnitId || null,
      last_vet_visit: animalFormValues.lastVetVisit || null,
      health_notes: animalFormValues.notes.trim() || null,
    };

    try {
      if (animalFormMode === 'create') {
        const created = await createAnimal(payload);
        setSelectedAnimalId(created.id);
        showToast({ message: 'Animal created.', variant: 'success' });
      } else if (editingAnimal) {
        await updateAnimal(editingAnimal.id, payload);
        showToast({ message: 'Animal updated.', variant: 'success' });
      }

      closeAnimalForm();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Animal save failed.'),
        variant: 'error',
      });
    }
  }

  function closeAnimalGroupForm() {
    setAnimalGroupFormVisible(false);
    setEditingAnimalGroup(null);
    setAnimalGroupFormValues(toAnimalGroupFormValues());
  }

  function openAnimalGroupCreateForm() {
    setAnimalGroupFormMode('create');
    setEditingAnimalGroup(null);
    setAnimalGroupFormValues(toAnimalGroupFormValues());
    setAnimalGroupFormVisible(true);
  }

  function openAnimalGroupEditForm(group: AnimalGroup) {
    setAnimalGroupFormMode('edit');
    setEditingAnimalGroup(group);
    setAnimalGroupFormValues(toAnimalGroupFormValues(group));
    setAnimalGroupFormVisible(true);
  }

  async function submitAnimalGroupForm() {
    const name = animalGroupFormValues.name.trim();
    if (!name) {
      showToast({ message: 'Group name is required.', variant: 'error' });
      return;
    }

    const payload = {
      name,
      species: animalGroupFormValues.species.trim() || null,
      status: animalGroupFormValues.status.trim() || null,
      notes: animalGroupFormValues.notes.trim() || null,
    };

    try {
      if (animalGroupFormMode === 'create') {
        await createAnimalGroup(payload);
        showToast({ message: 'Animal group created.', variant: 'success' });
      } else if (editingAnimalGroup) {
        await updateAnimalGroup(editingAnimalGroup.id, payload);
        showToast({ message: 'Animal group updated.', variant: 'success' });
      }

      closeAnimalGroupForm();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Animal group save failed.'),
        variant: 'error',
      });
    }
  }

  function closeHealthCheckForm() {
    setHealthCheckFormVisible(false);
    setEditingHealthCheck(null);
    setHealthCheckFormValues(toHealthCheckFormValues());
  }

  function openHealthCheckCreateForm() {
    setHealthCheckFormMode('create');
    setEditingHealthCheck(null);
    setHealthCheckFormValues(toHealthCheckFormValues());
    setHealthCheckFormVisible(true);
  }

  function openHealthCheckEditForm(record: AnimalHealthCheck) {
    setHealthCheckFormMode('edit');
    setEditingHealthCheck(record);
    setHealthCheckFormValues(toHealthCheckFormValues(record));
    setHealthCheckFormVisible(true);
  }

  async function submitHealthCheckForm() {
    if (!selectedAnimal) {
      showToast({ message: 'Select an animal first.', variant: 'error' });
      return;
    }

    const payload = {
      animal_id: selectedAnimal.id,
      check_date: healthCheckFormValues.date || null,
      status: healthCheckFormValues.status.trim() || null,
      notes: healthCheckFormValues.notes.trim() || null,
      performed_by: healthCheckFormValues.performedBy.trim() || null,
      vet_name: healthCheckFormValues.performedBy.trim() || null,
    };

    try {
      if (healthCheckFormMode === 'create') {
        await createAnimalHealthCheck(selectedAnimal.id, payload);
        showToast({ message: 'Health check saved.', variant: 'success' });
      } else if (editingHealthCheck) {
        await updateAnimalHealthCheck(editingHealthCheck.id, payload);
        showToast({ message: 'Health check updated.', variant: 'success' });
      }

      closeHealthCheckForm();
      await refreshDetails();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Health check save failed.'),
        variant: 'error',
      });
    }
  }

  function closeYieldForm() {
    setYieldFormVisible(false);
    setEditingYieldRecord(null);
    setYieldFormValues(toYieldRecordFormValues());
  }

  function openYieldCreateForm() {
    setYieldFormMode('create');
    setEditingYieldRecord(null);
    setYieldFormValues(toYieldRecordFormValues());
    setYieldFormVisible(true);
  }

  function openYieldEditForm(record: AnimalYieldRecord) {
    setYieldFormMode('edit');
    setEditingYieldRecord(record);
    setYieldFormValues(toYieldRecordFormValues(record));
    setYieldFormVisible(true);
  }

  async function submitYieldForm() {
    if (!selectedAnimal) {
      showToast({ message: 'Select an animal first.', variant: 'error' });
      return;
    }

    const amount = parseOptionalNumber(yieldFormValues.amount);

    const payload = {
      animal_id: selectedAnimal.id,
      record_date: yieldFormValues.date || null,
      date: yieldFormValues.date || null,
      yield_type: yieldFormValues.yieldType.trim() || null,
      amount,
      unit: yieldFormValues.unit.trim() || null,
      notes: yieldFormValues.notes.trim() || null,
    };

    try {
      if (yieldFormMode === 'create') {
        await createAnimalYieldRecord(selectedAnimal.id, payload);
        showToast({ message: 'Yield record saved.', variant: 'success' });
      } else if (editingYieldRecord) {
        await updateAnimalYieldRecord(editingYieldRecord.id, payload);
        showToast({ message: 'Yield record updated.', variant: 'success' });
      }

      closeYieldForm();
      await refreshDetails();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Yield record save failed.'),
        variant: 'error',
      });
    }
  }

  function closeHousingForm() {
    setHousingFormVisible(false);
    setEditingHousingUnit(null);
    setHousingFormValues(toHousingUnitFormValues());
  }

  function openHousingCreateForm() {
    setHousingFormMode('create');
    setEditingHousingUnit(null);
    setHousingFormValues(toHousingUnitFormValues());
    setHousingFormVisible(true);
  }

  function openHousingEditForm(unit: HousingUnit) {
    setHousingFormMode('edit');
    setEditingHousingUnit(unit);
    setHousingFormValues(toHousingUnitFormValues(unit));
    setHousingFormVisible(true);
  }

  async function submitHousingForm() {
    const barnName = housingFormValues.barnName.trim();
    if (!barnName) {
      showToast({ message: 'Housing unit name is required.', variant: 'error' });
      return;
    }

    const payload = {
      barn_name: barnName,
      unit_code: housingFormValues.unitCode.trim() || null,
      field_id: housingFormValues.fieldId || null,
      capacity: parseOptionalNumber(housingFormValues.capacity),
      current_status: housingFormValues.currentStatus.trim() || null,
      animal_types: parseCsvValues(housingFormValues.animalTypesCsv),
      shape_polygon: toGeoJsonPolygon(housingFormValues.boundaryPoints),
      notes: housingFormValues.notes.trim() || null,
    };

    try {
      if (housingFormMode === 'create') {
        const created = await createHousingUnit(payload);
        setSelectedHousingUnitId(created.id);
        showToast({ message: 'Housing unit created.', variant: 'success' });
      } else if (editingHousingUnit) {
        await updateHousingUnit(editingHousingUnit.id, payload);
        showToast({ message: 'Housing unit updated.', variant: 'success' });
      }

      closeHousingForm();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Housing unit save failed.'),
        variant: 'error',
      });
    }
  }

  function closeMaintenanceForm() {
    setMaintenanceFormVisible(false);
    setEditingMaintenanceRecord(null);
    setMaintenanceFormValues(toHousingMaintenanceFormValues());
  }

  function openMaintenanceCreateForm() {
    setMaintenanceFormMode('create');
    setEditingMaintenanceRecord(null);
    setMaintenanceFormValues(toHousingMaintenanceFormValues());
    setMaintenanceFormVisible(true);
  }

  function openMaintenanceEditForm(record: HousingMaintenanceRecord) {
    setMaintenanceFormMode('edit');
    setEditingMaintenanceRecord(record);
    setMaintenanceFormValues(toHousingMaintenanceFormValues(record));
    setMaintenanceFormVisible(true);
  }

  async function submitMaintenanceForm() {
    if (!selectedHousingUnit) {
      showToast({ message: 'Select a housing unit first.', variant: 'error' });
      return;
    }

    const payload = {
      housing_unit_id: selectedHousingUnit.id,
      date: maintenanceFormValues.date || null,
      maintenance_type: maintenanceFormValues.maintenanceType.trim() || null,
      status: maintenanceFormValues.status.trim() || null,
      cost: parseOptionalNumber(maintenanceFormValues.cost),
      notes: maintenanceFormValues.notes.trim() || null,
    };

    try {
      if (maintenanceFormMode === 'create') {
        await createHousingMaintenanceRecord(selectedHousingUnit.id, payload);
        showToast({ message: 'Maintenance record saved.', variant: 'success' });
      } else if (editingMaintenanceRecord) {
        await updateHousingMaintenanceRecord(editingMaintenanceRecord.id, payload);
        showToast({ message: 'Maintenance record updated.', variant: 'success' });
      }

      closeMaintenanceForm();
      await refreshDetails();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Maintenance record save failed.'),
        variant: 'error',
      });
    }
  }

  function closeConsumptionForm() {
    setConsumptionFormVisible(false);
    setEditingConsumptionLog(null);
    setConsumptionFormValues(toHousingConsumptionFormValues());
  }

  function openConsumptionCreateForm() {
    setConsumptionFormMode('create');
    setEditingConsumptionLog(null);
    setConsumptionFormValues(toHousingConsumptionFormValues());
    setConsumptionFormVisible(true);
  }

  function openConsumptionEditForm(record: HousingConsumptionLog) {
    setConsumptionFormMode('edit');
    setEditingConsumptionLog(record);
    setConsumptionFormValues(toHousingConsumptionFormValues(record));
    setConsumptionFormVisible(true);
  }

  async function submitConsumptionForm() {
    if (!selectedHousingUnit) {
      showToast({ message: 'Select a housing unit first.', variant: 'error' });
      return;
    }

    const payload = {
      housing_unit_id: selectedHousingUnit.id,
      date: consumptionFormValues.date || null,
      feed_amount: parseOptionalNumber(consumptionFormValues.feedAmount),
      water_amount: parseOptionalNumber(consumptionFormValues.waterAmount),
      unit: consumptionFormValues.unit.trim() || null,
      notes: consumptionFormValues.notes.trim() || null,
    };

    try {
      if (consumptionFormMode === 'create') {
        await createHousingConsumptionLog(selectedHousingUnit.id, payload);
        showToast({ message: 'Consumption log saved.', variant: 'success' });
      } else if (editingConsumptionLog) {
        await updateHousingConsumptionLog(editingConsumptionLog.id, payload);
        showToast({ message: 'Consumption log updated.', variant: 'success' });
      }

      closeConsumptionForm();
      await refreshDetails();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Consumption log save failed.'),
        variant: 'error',
      });
    }
  }

  function closeWeatherRuleForm() {
    setWeatherRuleFormVisible(false);
    setEditingWeatherRule(null);
    setWeatherRuleFormValues(toWeatherRuleFormValues());
  }

  function openWeatherRuleCreateForm() {
    setWeatherRuleFormMode('create');
    setEditingWeatherRule(null);
    setWeatherRuleFormValues(toWeatherRuleFormValues());
    setWeatherRuleFormVisible(true);
  }

  function openWeatherRuleEditForm(rule: WeatherAlertRule) {
    setWeatherRuleFormMode('edit');
    setEditingWeatherRule(rule);
    setWeatherRuleFormValues(toWeatherRuleFormValues(rule));
    setWeatherRuleFormVisible(true);
  }

  async function submitWeatherRuleForm() {
    const name = weatherRuleFormValues.name.trim();
    if (!name) {
      showToast({ message: 'Rule name is required.', variant: 'error' });
      return;
    }

    const payload = {
      lot_id: weatherRuleFormValues.lotId || null,
      field_id: weatherRuleFormValues.fieldId || null,
      name,
      condition: weatherRuleFormValues.condition,
      operator: weatherRuleFormValues.operator,
      value: parseOptionalNumber(weatherRuleFormValues.value),
      unit: weatherRuleFormValues.unit.trim() || null,
      enabled: weatherRuleFormValues.enabled,
      severity: weatherRuleFormValues.severity,
      custom_message: weatherRuleFormValues.customMessage.trim() || null,
      notify_in_app: weatherRuleFormValues.notifyInApp,
      notify_email: weatherRuleFormValues.notifyEmail,
      notify_sms: weatherRuleFormValues.notifySms,
    };

    try {
      if (weatherRuleFormMode === 'create') {
        await createWeatherAlertRule(payload);
        showToast({ message: 'Weather rule created.', variant: 'success' });
      } else if (editingWeatherRule) {
        await updateWeatherAlertRule(editingWeatherRule.id, payload);
        showToast({ message: 'Weather rule updated.', variant: 'success' });
      }

      closeWeatherRuleForm();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Weather rule save failed.'),
        variant: 'error',
      });
    }
  }

  async function confirmAnimalDeactivate() {
    if (!animalDeactivateTarget) return;

    try {
      await deactivateAnimal(animalDeactivateTarget.id);
      showToast({ message: 'Animal deactivated.', variant: 'success' });
      if (selectedAnimalId === animalDeactivateTarget.id) {
        setSelectedAnimalId(null);
      }
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Animal deactivation failed.'),
        variant: 'error',
      });
    } finally {
      setAnimalDeactivateTarget(null);
    }
  }

  async function confirmGroupDeactivate() {
    if (!groupDeactivateTarget) return;

    try {
      await deactivateAnimalGroup(groupDeactivateTarget.id);
      showToast({ message: 'Group deactivated.', variant: 'success' });
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Group deactivation failed.'),
        variant: 'error',
      });
    } finally {
      setGroupDeactivateTarget(null);
    }
  }

  async function confirmHealthCheckDelete() {
    if (!healthCheckDeleteTarget) return;

    try {
      await deleteAnimalHealthCheck(healthCheckDeleteTarget.id);
      showToast({ message: 'Health check deleted.', variant: 'success' });
      await refreshDetails();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Health check delete failed.'),
        variant: 'error',
      });
    } finally {
      setHealthCheckDeleteTarget(null);
    }
  }

  async function confirmYieldDelete() {
    if (!yieldRecordDeleteTarget) return;

    try {
      await deleteAnimalYieldRecord(yieldRecordDeleteTarget.id);
      showToast({ message: 'Yield record deleted.', variant: 'success' });
      await refreshDetails();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Yield record delete failed.'),
        variant: 'error',
      });
    } finally {
      setYieldRecordDeleteTarget(null);
    }
  }

  async function confirmHousingDeactivate() {
    if (!housingDeactivateTarget) return;

    try {
      await deactivateHousingUnit(housingDeactivateTarget.id);
      showToast({ message: 'Housing unit deactivated.', variant: 'success' });
      if (selectedHousingUnitId === housingDeactivateTarget.id) {
        setSelectedHousingUnitId(null);
      }
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Housing unit deactivation failed.'),
        variant: 'error',
      });
    } finally {
      setHousingDeactivateTarget(null);
    }
  }

  async function confirmMaintenanceDelete() {
    if (!maintenanceDeleteTarget) return;

    try {
      await deleteHousingMaintenanceRecord(maintenanceDeleteTarget.id);
      showToast({ message: 'Maintenance record deleted.', variant: 'success' });
      await refreshDetails();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Maintenance delete failed.'),
        variant: 'error',
      });
    } finally {
      setMaintenanceDeleteTarget(null);
    }
  }

  async function confirmConsumptionDelete() {
    if (!consumptionDeleteTarget) return;

    try {
      await deleteHousingConsumptionLog(consumptionDeleteTarget.id);
      showToast({ message: 'Consumption log deleted.', variant: 'success' });
      await refreshDetails();
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Consumption log delete failed.'),
        variant: 'error',
      });
    } finally {
      setConsumptionDeleteTarget(null);
    }
  }

  async function confirmWeatherRuleDelete() {
    if (!weatherRuleDeleteTarget) return;

    try {
      await deleteWeatherAlertRule(weatherRuleDeleteTarget.id);
      showToast({ message: 'Weather rule deleted.', variant: 'success' });
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Weather rule delete failed.'),
        variant: 'error',
      });
    } finally {
      setWeatherRuleDeleteTarget(null);
    }
  }

  async function reactivateSelectedHousing(unit: HousingUnit) {
    try {
      await reactivateHousingUnit(unit.id);
      showToast({ message: 'Housing unit reactivated.', variant: 'success' });
    } catch (error) {
      showToast({
        message: normalizeApiErrorMessage(error, 'Housing reactivation failed.'),
        variant: 'error',
      });
    }
  }

  function renderAnimalsTab() {
    return (
      <>
        <AppCard>
          <FilterBar
            searchValue={animalSearch}
            onSearchChange={setAnimalSearch}
            searchPlaceholder="Search animals and groups"
          >
            <View style={styles.inlineActions}>
              <AppButton
                label="Create Animal"
                onPress={openAnimalCreateForm}
              />
              <AppButton
                label="Create Group"
                mode="outlined"
                tone="neutral"
                onPress={openAnimalGroupCreateForm}
              />
            </View>
          </FilterBar>
        </AppCard>

        <AppCard>
          <AppSection
            title="Animals"
            description="Animal registry with group/housing assignment."
          >
            {isLoading ? (
              <>
                <Skeleton height={56} />
                <Skeleton height={56} />
                <Skeleton height={56} />
              </>
            ) : errorMessage ? (
              <ErrorState message={errorMessage} onRetry={() => void refresh()} />
            ) : filteredAnimals.length === 0 ? (
              <EmptyState
                title="No animals found"
                message="Create your first animal record."
                actionLabel="Create animal"
                onAction={openAnimalCreateForm}
              />
            ) : (
              <PullToRefreshContainer
                refreshing={isRefreshing || isMutating}
                onRefresh={() => void refresh()}
              >
                <View style={styles.rows}>
                  {filteredAnimals.map((animal) => (
                    <AppCard key={animal.id}>
                      <AppListItem
                        title={animal.name}
                        description={formatAnimalMeta(animal)}
                        leftIcon="cow"
                        onPress={() => {
                          setSelectedAnimalId(animal.id);
                          setAnimalActionTarget(animal);
                        }}
                      />
                      <View style={styles.rowMeta}>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaLabel}>Status</Text>
                          <AppBadge
                            value={statusLabel(animal.activeStatus)}
                            variant={badgeVariant(animal.activeStatus)}
                          />
                        </View>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaLabel}>Health</Text>
                          <AppBadge
                            value={statusLabel(animal.healthStatus)}
                            variant={badgeVariant(animal.healthStatus)}
                          />
                        </View>
                      </View>
                    </AppCard>
                  ))}
                </View>
              </PullToRefreshContainer>
            )}
          </AppSection>
        </AppCard>

        <PaginationFooter
          page={1}
          pageSize={Math.max(filteredAnimals.length, 1)}
          totalItems={filteredAnimals.length}
          onPageChange={() => undefined}
        />

        <AppCard>
          <AppSection
            title="Animal Groups"
            description="Reusable group records for batch assignment."
          >
            {filteredAnimalGroups.length === 0 ? (
              <EmptyState
                title="No groups found"
                message="Create a group to organize livestock records."
                actionLabel="Create group"
                onAction={openAnimalGroupCreateForm}
              />
            ) : (
              <View style={styles.rows}>
                {filteredAnimalGroups.map((group) => (
                  <AppCard key={group.id}>
                    <AppListItem
                      title={group.name}
                      description={group.species ?? 'Mixed species'}
                      leftIcon="account-group-outline"
                      onPress={() => setAnimalGroupActionTarget(group)}
                    />
                    <View style={styles.rowMeta}>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaLabel}>Status</Text>
                        <AppBadge value={statusLabel(group.status)} variant={badgeVariant(group.status)} />
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            )}
          </AppSection>
        </AppCard>

        {selectedAnimal ? (
          <>
            <AppCard>
              <AppSection
                title={`Health Checks — ${selectedAnimal.name}`}
                description="Record and track ongoing animal health checks."
              >
                <View style={styles.inlineActions}>
                  <AppButton
                    label="Add Health Check"
                    mode="outlined"
                    tone="neutral"
                    onPress={openHealthCheckCreateForm}
                  />
                </View>

                {detailsLoading ? (
                  <>
                    <Skeleton height={52} />
                    <Skeleton height={52} />
                  </>
                ) : detailsErrorMessage ? (
                  <ErrorState message={detailsErrorMessage} onRetry={() => void refreshDetails()} />
                ) : healthChecks.length === 0 ? (
                  <EmptyState
                    title="No health checks"
                    message="Add the first health check for this animal."
                    actionLabel="Add health check"
                    onAction={openHealthCheckCreateForm}
                  />
                ) : (
                  <PullToRefreshContainer
                    refreshing={detailsRefreshing || isMutating}
                    onRefresh={() => void refreshDetails()}
                  >
                    <View style={styles.rows}>
                      {healthChecks.map((record) => (
                        <AppCard key={record.id}>
                          <AppListItem
                            title={record.status ?? 'Health check'}
                            description={record.date?.slice(0, 10) ?? 'No date'}
                            leftIcon="stethoscope"
                            onPress={() => setHealthCheckActionTarget(record)}
                          />
                          <View style={styles.rowMeta}>
                            <View style={styles.metaGroup}>
                              <Text style={styles.metaLabel}>Performed By</Text>
                              <AppBadge
                                value={record.performedBy ?? 'n/a'}
                                variant="neutral"
                              />
                            </View>
                          </View>
                        </AppCard>
                      ))}
                    </View>
                  </PullToRefreshContainer>
                )}
              </AppSection>
            </AppCard>

            <AppCard>
              <AppSection
                title={`Yield Records — ${selectedAnimal.name}`}
                description="Track output and yield trend by animal."
              >
                <View style={styles.inlineActions}>
                  <AppButton
                    label="Add Yield Record"
                    mode="outlined"
                    tone="neutral"
                    onPress={openYieldCreateForm}
                  />
                </View>

                {detailsLoading ? (
                  <>
                    <Skeleton height={52} />
                    <Skeleton height={52} />
                  </>
                ) : detailsErrorMessage ? (
                  <ErrorState message={detailsErrorMessage} onRetry={() => void refreshDetails()} />
                ) : yieldRecords.length === 0 ? (
                  <EmptyState
                    title="No yield records"
                    message="Add yield records for this animal."
                    actionLabel="Add yield record"
                    onAction={openYieldCreateForm}
                  />
                ) : (
                  <PullToRefreshContainer
                    refreshing={detailsRefreshing || isMutating}
                    onRefresh={() => void refreshDetails()}
                  >
                    <View style={styles.rows}>
                      {yieldRecords.map((record) => (
                        <AppCard key={record.id}>
                          <AppListItem
                            title={record.yieldType ?? 'Yield record'}
                            description={record.date?.slice(0, 10) ?? 'No date'}
                            leftIcon="chart-line"
                            onPress={() => setYieldRecordActionTarget(record)}
                          />
                          <View style={styles.rowMeta}>
                            <View style={styles.metaGroup}>
                              <Text style={styles.metaLabel}>Amount</Text>
                              <AppBadge
                                value={
                                  record.amount === null
                                    ? 'n/a'
                                    : `${record.amount} ${record.unit ?? ''}`.trim()
                                }
                                variant="accent"
                              />
                            </View>
                          </View>
                        </AppCard>
                      ))}
                    </View>
                  </PullToRefreshContainer>
                )}
              </AppSection>
            </AppCard>
          </>
        ) : null}
      </>
    );
  }

  function renderHousingTab() {
    return (
      <>
        <AppCard>
          <FilterBar
            searchValue={housingSearch}
            onSearchChange={setHousingSearch}
            searchPlaceholder="Search housing units"
          >
            <View style={styles.inlineActions}>
              <AppButton label="Create Housing Unit" onPress={openHousingCreateForm} />
            </View>
          </FilterBar>
        </AppCard>

        <AppCard>
          <AppSection
            title="Housing Units"
            description="Manage housing inventory, maintenance, and consumption."
          >
            {isLoading ? (
              <>
                <Skeleton height={56} />
                <Skeleton height={56} />
              </>
            ) : errorMessage ? (
              <ErrorState message={errorMessage} onRetry={() => void refresh()} />
            ) : filteredHousingUnits.length === 0 ? (
              <EmptyState
                title="No housing units found"
                message="Create your first housing unit."
                actionLabel="Create housing unit"
                onAction={openHousingCreateForm}
              />
            ) : (
              <PullToRefreshContainer
                refreshing={isRefreshing || isMutating}
                onRefresh={() => void refresh()}
              >
                <View style={styles.rows}>
                  {filteredHousingUnits.map((unit) => (
                    <AppCard key={unit.id}>
                      <AppListItem
                        title={unit.barnName}
                        description={formatHousingMeta(unit)}
                        leftIcon="home-group"
                        onPress={() => {
                          setSelectedHousingUnitId(unit.id);
                          setHousingActionTarget(unit);
                        }}
                      />
                      <View style={styles.rowMeta}>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaLabel}>Status</Text>
                          <AppBadge
                            value={statusLabel(unit.currentStatus)}
                            variant={badgeVariant(unit.currentStatus)}
                          />
                        </View>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaLabel}>Capacity</Text>
                          <AppBadge value={unit.capacity === null ? 'n/a' : String(unit.capacity)} variant="neutral" />
                        </View>
                      </View>
                    </AppCard>
                  ))}
                </View>
              </PullToRefreshContainer>
            )}
          </AppSection>
        </AppCard>

        <PaginationFooter
          page={1}
          pageSize={Math.max(filteredHousingUnits.length, 1)}
          totalItems={filteredHousingUnits.length}
          onPageChange={() => undefined}
        />

        {selectedHousingUnit ? (
          <>
            <AppCard>
              <AppSection
                title={`Maintenance — ${selectedHousingUnit.barnName}`}
                description="Log maintenance tasks and updates for selected unit."
              >
                <View style={styles.inlineActions}>
                  <AppButton
                    label="Add Maintenance"
                    mode="outlined"
                    tone="neutral"
                    onPress={openMaintenanceCreateForm}
                  />
                </View>

                {detailsLoading ? (
                  <>
                    <Skeleton height={52} />
                    <Skeleton height={52} />
                  </>
                ) : detailsErrorMessage ? (
                  <ErrorState message={detailsErrorMessage} onRetry={() => void refreshDetails()} />
                ) : housingMaintenanceRecords.length === 0 ? (
                  <EmptyState
                    title="No maintenance records"
                    message="Start by adding the first maintenance record."
                    actionLabel="Add maintenance"
                    onAction={openMaintenanceCreateForm}
                  />
                ) : (
                  <PullToRefreshContainer
                    refreshing={detailsRefreshing || isMutating}
                    onRefresh={() => void refreshDetails()}
                  >
                    <View style={styles.rows}>
                      {housingMaintenanceRecords.map((record) => (
                        <AppCard key={record.id}>
                          <AppListItem
                            title={record.maintenanceType ?? 'Maintenance'}
                            description={record.date?.slice(0, 10) ?? 'No date'}
                            leftIcon="wrench-outline"
                            onPress={() => setMaintenanceActionTarget(record)}
                          />
                          <View style={styles.rowMeta}>
                            <View style={styles.metaGroup}>
                              <Text style={styles.metaLabel}>Status</Text>
                              <AppBadge value={statusLabel(record.status)} variant={badgeVariant(record.status)} />
                            </View>
                            <View style={styles.metaGroup}>
                              <Text style={styles.metaLabel}>Cost</Text>
                              <AppBadge
                                value={record.cost === null ? 'n/a' : String(record.cost)}
                                variant="accent"
                              />
                            </View>
                          </View>
                        </AppCard>
                      ))}
                    </View>
                  </PullToRefreshContainer>
                )}
              </AppSection>
            </AppCard>

            <AppCard>
              <AppSection
                title={`Consumption — ${selectedHousingUnit.barnName}`}
                description="Feed and water consumption logs for selected unit."
              >
                <View style={styles.inlineActions}>
                  <AppButton
                    label="Add Consumption Log"
                    mode="outlined"
                    tone="neutral"
                    onPress={openConsumptionCreateForm}
                  />
                </View>

                {detailsLoading ? (
                  <>
                    <Skeleton height={52} />
                    <Skeleton height={52} />
                  </>
                ) : detailsErrorMessage ? (
                  <ErrorState message={detailsErrorMessage} onRetry={() => void refreshDetails()} />
                ) : housingConsumptionLogs.length === 0 ? (
                  <EmptyState
                    title="No consumption logs"
                    message="Add consumption logs to monitor usage."
                    actionLabel="Add consumption log"
                    onAction={openConsumptionCreateForm}
                  />
                ) : (
                  <PullToRefreshContainer
                    refreshing={detailsRefreshing || isMutating}
                    onRefresh={() => void refreshDetails()}
                  >
                    <View style={styles.rows}>
                      {housingConsumptionLogs.map((record) => (
                        <AppCard key={record.id}>
                          <AppListItem
                            title={record.date?.slice(0, 10) ?? 'Consumption log'}
                            description={record.notes ?? 'No notes'}
                            leftIcon="water-outline"
                            onPress={() => setConsumptionActionTarget(record)}
                          />
                          <View style={styles.rowMeta}>
                            <View style={styles.metaGroup}>
                              <Text style={styles.metaLabel}>Feed</Text>
                              <AppBadge
                                value={record.feedAmount === null ? 'n/a' : String(record.feedAmount)}
                                variant="accent"
                              />
                            </View>
                            <View style={styles.metaGroup}>
                              <Text style={styles.metaLabel}>Water</Text>
                              <AppBadge
                                value={record.waterAmount === null ? 'n/a' : String(record.waterAmount)}
                                variant="neutral"
                              />
                            </View>
                          </View>
                        </AppCard>
                      ))}
                    </View>
                  </PullToRefreshContainer>
                )}
              </AppSection>
            </AppCard>
          </>
        ) : null}
      </>
    );
  }

  function renderWeatherTab() {
    return (
      <>
        <AppCard>
          <FilterBar
            searchValue={weatherSearch}
            onSearchChange={setWeatherSearch}
            searchPlaceholder="Search weather rules"
          >
            <FormField label="Filter by lot">
              <AppSelect
                value={weatherLotId}
                onChange={setWeatherLotId}
                options={[
                  { label: 'All lots', value: '' },
                  ...lots.map((lot) => ({ label: lot.name, value: lot.id })),
                ]}
              />
            </FormField>
            <View style={styles.inlineActions}>
              <AppButton label="Create Weather Rule" onPress={openWeatherRuleCreateForm} />
            </View>
          </FilterBar>
        </AppCard>

        <AppCard>
          <AppSection
            title="Weather Alert Rules"
            description="Rule-based weather thresholds and notification settings."
          >
            {isLoading ? (
              <>
                <Skeleton height={56} />
                <Skeleton height={56} />
              </>
            ) : errorMessage ? (
              <ErrorState message={errorMessage} onRetry={() => void refresh()} />
            ) : !weatherLotId ? (
              <EmptyState
                title="Select a lot"
                message="Choose a lot filter to load weather alert rules."
              />
            ) : filteredWeatherRules.length === 0 ? (
              <EmptyState
                title="No weather rules found"
                message="Create your first weather alert rule."
                actionLabel="Create weather rule"
                onAction={openWeatherRuleCreateForm}
              />
            ) : (
              <PullToRefreshContainer
                refreshing={isRefreshing || isMutating}
                onRefresh={() => void refresh()}
              >
                <View style={styles.rows}>
                  {filteredWeatherRules.map((rule) => (
                    <AppCard key={rule.id}>
                      <AppListItem
                        title={rule.name}
                        description={formatWeatherMeta(rule)}
                        leftIcon="weather-partly-cloudy"
                        onPress={() => setWeatherRuleActionTarget(rule)}
                      />
                      <View style={styles.rowMeta}>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaLabel}>Severity</Text>
                          <AppBadge value={statusLabel(rule.severity)} variant={badgeVariant(rule.severity)} />
                        </View>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaLabel}>Enabled</Text>
                          <AppBadge value={rule.enabled ? 'yes' : 'no'} variant={rule.enabled ? 'success' : 'warning'} />
                        </View>
                      </View>
                    </AppCard>
                  ))}
                </View>
              </PullToRefreshContainer>
            )}
          </AppSection>
        </AppCard>

        <PaginationFooter
          page={1}
          pageSize={Math.max(filteredWeatherRules.length, 1)}
          totalItems={filteredWeatherRules.length}
          onPageChange={() => undefined}
        />

        <AppCard>
          <AppSection
            title="Location Weather View"
            description="Load rules currently applicable to a location id."
          >
            <FormField label="Location ID">
              <AppInput
                value={weatherLocationInput}
                onChangeText={setWeatherLocationInput}
                placeholder="Enter location id"
              />
            </FormField>
            <View style={styles.inlineActions}>
              <AppButton
                label="Load Location Rules"
                mode="outlined"
                tone="neutral"
                onPress={() => setSelectedWeatherLocationId(weatherLocationInput.trim() || null)}
              />
            </View>

            {detailsErrorMessage ? (
              <ErrorState message={detailsErrorMessage} onRetry={() => void refresh()} />
            ) : weatherLocationRules.length === 0 ? (
              <EmptyState
                title="No location rules loaded"
                message="Provide a location id and load applicable rules."
              />
            ) : (
              <View style={styles.rows}>
                {weatherLocationRules.map((rule) => (
                  <AppCard key={`${rule.id}-location`}>
                    <AppListItem
                      title={rule.name}
                      description={formatWeatherMeta(rule)}
                      leftIcon="map-marker-outline"
                      onPress={() => setWeatherRuleActionTarget(rule)}
                    />
                  </AppCard>
                ))}
              </View>
            )}
          </AppSection>
        </AppCard>
      </>
    );
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="Livestock, Housing, and Weather"
        subtitle="Phase 12 operational module: animals, housing lifecycle, and weather alert rules."
      />

      <View style={styles.topActions}>
        <View style={styles.primaryAction}>
          <AppButton
            label={
              activeTab === 'animals'
                ? 'Create Animal'
                : activeTab === 'housing'
                  ? 'Create Housing Unit'
                  : 'Create Weather Rule'
            }
            onPress={
              activeTab === 'animals'
                ? openAnimalCreateForm
                : activeTab === 'housing'
                  ? openHousingCreateForm
                  : openWeatherRuleCreateForm
            }
          />
        </View>
        <View style={styles.secondaryAction}>
          <AppButton
            label="Refresh"
            mode="outlined"
            tone="neutral"
            onPress={() => void refresh()}
            loading={isRefreshing || isMutating}
          />
        </View>
      </View>

      <AppCard>
        <AppTabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as LivestockTab)}
          tabs={LIVESTOCK_TAB_OPTIONS.map((item) => ({
            value: item.value,
            label: item.label,
          }))}
        />
      </AppCard>

      {activeTab === 'animals' ? renderAnimalsTab() : null}
      {activeTab === 'housing' ? renderHousingTab() : null}
      {activeTab === 'weather' ? renderWeatherTab() : null}

      <BottomSheet
        visible={animalFormVisible}
        onDismiss={closeAnimalForm}
        title={animalFormMode === 'create' ? 'Create Animal' : 'Edit Animal'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeAnimalForm} />
            <AppButton
              label={animalFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitAnimalForm()}
              loading={isMutating}
              disabled={isMutating || !animalFormValues.name.trim() || !animalFormValues.species.trim()}
            />
          </View>
        }
      >
        <FormField label="Name" required>
          <AppInput
            value={animalFormValues.name}
            onChangeText={(value) => setAnimalFormValues((current) => ({ ...current, name: value }))}
            placeholder="Animal name"
          />
        </FormField>

        <FormField label="Species" required>
          <AppInput
            value={animalFormValues.species}
            onChangeText={(value) => setAnimalFormValues((current) => ({ ...current, species: value }))}
            placeholder="Species"
          />
        </FormField>

        <FormField label="Breed">
          <AppInput
            value={animalFormValues.breed}
            onChangeText={(value) => setAnimalFormValues((current) => ({ ...current, breed: value }))}
            placeholder="Breed"
          />
        </FormField>

        <FormField label="Tag Number">
          <AppInput
            value={animalFormValues.tagNumber}
            onChangeText={(value) => setAnimalFormValues((current) => ({ ...current, tagNumber: value }))}
            placeholder="Tag number"
          />
        </FormField>

        <FormField label="Status">
          <AppSelect
            value={animalFormValues.activeStatus}
            onChange={(value) => setAnimalFormValues((current) => ({ ...current, activeStatus: value }))}
            options={ANIMAL_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>

        <FormField label="Health Status">
          <AppInput
            value={animalFormValues.healthStatus}
            onChangeText={(value) => setAnimalFormValues((current) => ({ ...current, healthStatus: value }))}
            placeholder="healthy / observation / treatment"
          />
        </FormField>

        <FormField label="Quantity">
          <AppInput
            value={animalFormValues.quantity}
            onChangeText={(value) => setAnimalFormValues((current) => ({ ...current, quantity: value }))}
            placeholder="1"
          />
        </FormField>

        <FormField label="Group">
          <AppSelect
            value={animalFormValues.groupId}
            onChange={(value) => setAnimalFormValues((current) => ({ ...current, groupId: value }))}
            options={[
              { label: 'No group', value: '' },
              ...animalGroups.map((group) => ({ label: group.name, value: group.id })),
            ]}
          />
        </FormField>

        <FormField label="Housing Unit">
          <AppSelect
            value={animalFormValues.housingUnitId}
            onChange={(value) => setAnimalFormValues((current) => ({ ...current, housingUnitId: value }))}
            options={[
              { label: 'No housing unit', value: '' },
              ...housingUnits.map((unit) => ({ label: unit.barnName, value: unit.id })),
            ]}
          />
        </FormField>

        <FormField label="Last Vet Visit">
          <AppDatePicker
            value={animalFormValues.lastVetVisit || null}
            onChange={(value) =>
              setAnimalFormValues((current) => ({
                ...current,
                lastVetVisit: value ?? '',
              }))
            }
          />
        </FormField>

        <FormField label="Notes">
          <AppTextArea
            value={animalFormValues.notes}
            onChangeText={(value) => setAnimalFormValues((current) => ({ ...current, notes: value }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={animalGroupFormVisible}
        onDismiss={closeAnimalGroupForm}
        title={animalGroupFormMode === 'create' ? 'Create Animal Group' : 'Edit Animal Group'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeAnimalGroupForm} />
            <AppButton
              label={animalGroupFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitAnimalGroupForm()}
              loading={isMutating}
              disabled={isMutating || !animalGroupFormValues.name.trim()}
            />
          </View>
        }
      >
        <FormField label="Group Name" required>
          <AppInput
            value={animalGroupFormValues.name}
            onChangeText={(value) =>
              setAnimalGroupFormValues((current) => ({ ...current, name: value }))
            }
            placeholder="Group name"
          />
        </FormField>

        <FormField label="Species">
          <AppInput
            value={animalGroupFormValues.species}
            onChangeText={(value) =>
              setAnimalGroupFormValues((current) => ({ ...current, species: value }))
            }
            placeholder="Species"
          />
        </FormField>

        <FormField label="Status">
          <AppSelect
            value={animalGroupFormValues.status}
            onChange={(value) => setAnimalGroupFormValues((current) => ({ ...current, status: value }))}
            options={ANIMAL_STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>

        <FormField label="Notes">
          <AppTextArea
            value={animalGroupFormValues.notes}
            onChangeText={(value) =>
              setAnimalGroupFormValues((current) => ({ ...current, notes: value }))
            }
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={healthCheckFormVisible}
        onDismiss={closeHealthCheckForm}
        title={healthCheckFormMode === 'create' ? 'Create Health Check' : 'Edit Health Check'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeHealthCheckForm} />
            <AppButton
              label={healthCheckFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitHealthCheckForm()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormField label="Check Date">
          <AppDatePicker
            value={healthCheckFormValues.date || null}
            onChange={(value) =>
              setHealthCheckFormValues((current) => ({ ...current, date: value ?? '' }))
            }
          />
        </FormField>

        <FormField label="Status">
          <AppInput
            value={healthCheckFormValues.status}
            onChangeText={(value) => setHealthCheckFormValues((current) => ({ ...current, status: value }))}
            placeholder="healthy / monitor / treatment"
          />
        </FormField>

        <FormField label="Performed By">
          <AppInput
            value={healthCheckFormValues.performedBy}
            onChangeText={(value) =>
              setHealthCheckFormValues((current) => ({ ...current, performedBy: value }))
            }
            placeholder="Vet or operator"
          />
        </FormField>

        <FormField label="Notes">
          <AppTextArea
            value={healthCheckFormValues.notes}
            onChangeText={(value) => setHealthCheckFormValues((current) => ({ ...current, notes: value }))}
            placeholder="Health check notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={yieldFormVisible}
        onDismiss={closeYieldForm}
        title={yieldFormMode === 'create' ? 'Create Yield Record' : 'Edit Yield Record'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeYieldForm} />
            <AppButton
              label={yieldFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitYieldForm()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormField label="Date">
          <AppDatePicker
            value={yieldFormValues.date || null}
            onChange={(value) => setYieldFormValues((current) => ({ ...current, date: value ?? '' }))}
          />
        </FormField>

        <FormField label="Yield Type">
          <AppInput
            value={yieldFormValues.yieldType}
            onChangeText={(value) => setYieldFormValues((current) => ({ ...current, yieldType: value }))}
            placeholder="milk / eggs / weight gain"
          />
        </FormField>

        <FormField label="Amount">
          <AppInput
            value={yieldFormValues.amount}
            onChangeText={(value) => setYieldFormValues((current) => ({ ...current, amount: value }))}
            placeholder="0"
          />
        </FormField>

        <FormField label="Unit">
          <AppInput
            value={yieldFormValues.unit}
            onChangeText={(value) => setYieldFormValues((current) => ({ ...current, unit: value }))}
            placeholder="L / kg / count"
          />
        </FormField>

        <FormField label="Notes">
          <AppTextArea
            value={yieldFormValues.notes}
            onChangeText={(value) => setYieldFormValues((current) => ({ ...current, notes: value }))}
            placeholder="Yield notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={housingFormVisible}
        onDismiss={closeHousingForm}
        title={housingFormMode === 'create' ? 'Create Housing Unit' : 'Edit Housing Unit'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeHousingForm} />
            <AppButton
              label={housingFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitHousingForm()}
              loading={isMutating}
              disabled={isMutating || !housingFormValues.barnName.trim()}
            />
          </View>
        }
      >
        <FormField label="Barn Name" required>
          <AppInput
            value={housingFormValues.barnName}
            onChangeText={(value) => setHousingFormValues((current) => ({ ...current, barnName: value }))}
            placeholder="Barn name"
          />
        </FormField>

        <FormField label="Unit Code">
          <AppInput
            value={housingFormValues.unitCode}
            onChangeText={(value) => setHousingFormValues((current) => ({ ...current, unitCode: value }))}
            placeholder="Optional unit code"
          />
        </FormField>

        <FormField label="Field">
          <AppSelect
            value={housingFormValues.fieldId}
            onChange={(value) => setHousingFormValues((current) => ({ ...current, fieldId: value }))}
            options={[
              { label: 'No field', value: '' },
              ...fields.map((field) => ({ label: field.name, value: field.id })),
            ]}
          />
        </FormField>

        <FormField label="Capacity">
          <AppInput
            value={housingFormValues.capacity}
            onChangeText={(value) => setHousingFormValues((current) => ({ ...current, capacity: value }))}
            placeholder="Capacity"
          />
        </FormField>

        <FormField label="Current Status">
          <AppInput
            value={housingFormValues.currentStatus}
            onChangeText={(value) =>
              setHousingFormValues((current) => ({ ...current, currentStatus: value }))
            }
            placeholder="active / under_maintenance"
          />
        </FormField>

        <FormField label="Animal Types (comma separated)">
          <AppInput
            value={housingFormValues.animalTypesCsv}
            onChangeText={(value) =>
              setHousingFormValues((current) => ({ ...current, animalTypesCsv: value }))
            }
            placeholder="cattle, poultry"
          />
        </FormField>

        <FormField label="Boundary Map">
          <AppPolygonMapEditor
            points={housingFormValues.boundaryPoints}
            onChangePoints={(nextPoints) =>
              setHousingFormValues((current) => ({ ...current, boundaryPoints: nextPoints }))
            }
            testID="housing-boundary-map"
          />
        </FormField>

        <FormField label="Notes">
          <AppTextArea
            value={housingFormValues.notes}
            onChangeText={(value) => setHousingFormValues((current) => ({ ...current, notes: value }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={maintenanceFormVisible}
        onDismiss={closeMaintenanceForm}
        title={maintenanceFormMode === 'create' ? 'Create Maintenance' : 'Edit Maintenance'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeMaintenanceForm} />
            <AppButton
              label={maintenanceFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitMaintenanceForm()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormField label="Date">
          <AppDatePicker
            value={maintenanceFormValues.date || null}
            onChange={(value) =>
              setMaintenanceFormValues((current) => ({ ...current, date: value ?? '' }))
            }
          />
        </FormField>

        <FormField label="Maintenance Type">
          <AppInput
            value={maintenanceFormValues.maintenanceType}
            onChangeText={(value) =>
              setMaintenanceFormValues((current) => ({ ...current, maintenanceType: value }))
            }
            placeholder="cleaning / repair / inspection"
          />
        </FormField>

        <FormField label="Status">
          <AppInput
            value={maintenanceFormValues.status}
            onChangeText={(value) => setMaintenanceFormValues((current) => ({ ...current, status: value }))}
            placeholder="scheduled / done / canceled"
          />
        </FormField>

        <FormField label="Cost">
          <AppInput
            value={maintenanceFormValues.cost}
            onChangeText={(value) => setMaintenanceFormValues((current) => ({ ...current, cost: value }))}
            placeholder="0"
          />
        </FormField>

        <FormField label="Notes">
          <AppTextArea
            value={maintenanceFormValues.notes}
            onChangeText={(value) => setMaintenanceFormValues((current) => ({ ...current, notes: value }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={consumptionFormVisible}
        onDismiss={closeConsumptionForm}
        title={consumptionFormMode === 'create' ? 'Create Consumption Log' : 'Edit Consumption Log'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeConsumptionForm} />
            <AppButton
              label={consumptionFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitConsumptionForm()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormField label="Date">
          <AppDatePicker
            value={consumptionFormValues.date || null}
            onChange={(value) =>
              setConsumptionFormValues((current) => ({ ...current, date: value ?? '' }))
            }
          />
        </FormField>

        <FormField label="Feed Amount">
          <AppInput
            value={consumptionFormValues.feedAmount}
            onChangeText={(value) =>
              setConsumptionFormValues((current) => ({ ...current, feedAmount: value }))
            }
            placeholder="0"
          />
        </FormField>

        <FormField label="Water Amount">
          <AppInput
            value={consumptionFormValues.waterAmount}
            onChangeText={(value) =>
              setConsumptionFormValues((current) => ({ ...current, waterAmount: value }))
            }
            placeholder="0"
          />
        </FormField>

        <FormField label="Unit">
          <AppInput
            value={consumptionFormValues.unit}
            onChangeText={(value) => setConsumptionFormValues((current) => ({ ...current, unit: value }))}
            placeholder="kg / L"
          />
        </FormField>

        <FormField label="Notes">
          <AppTextArea
            value={consumptionFormValues.notes}
            onChangeText={(value) => setConsumptionFormValues((current) => ({ ...current, notes: value }))}
            placeholder="Optional notes"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={weatherRuleFormVisible}
        onDismiss={closeWeatherRuleForm}
        title={weatherRuleFormMode === 'create' ? 'Create Weather Rule' : 'Edit Weather Rule'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeWeatherRuleForm} />
            <AppButton
              label={weatherRuleFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitWeatherRuleForm()}
              loading={isMutating}
              disabled={isMutating || !weatherRuleFormValues.name.trim()}
            />
          </View>
        }
      >
        <FormField label="Rule Name" required>
          <AppInput
            value={weatherRuleFormValues.name}
            onChangeText={(value) => setWeatherRuleFormValues((current) => ({ ...current, name: value }))}
            placeholder="Rule name"
          />
        </FormField>

        <FormField label="Lot">
          <AppSelect
            value={weatherRuleFormValues.lotId}
            onChange={(value) => setWeatherRuleFormValues((current) => ({ ...current, lotId: value }))}
            options={[{ label: 'No lot', value: '' }, ...lots.map((lot) => ({ label: lot.name, value: lot.id }))]}
          />
        </FormField>

        <FormField label="Field">
          <AppSelect
            value={weatherRuleFormValues.fieldId}
            onChange={(value) => setWeatherRuleFormValues((current) => ({ ...current, fieldId: value }))}
            options={[
              { label: 'No field', value: '' },
              ...fields.map((field) => ({ label: field.name, value: field.id })),
            ]}
          />
        </FormField>

        <FormField label="Condition">
          <AppSelect
            value={weatherRuleFormValues.condition}
            onChange={(value) =>
              setWeatherRuleFormValues((current) => ({ ...current, condition: value }))
            }
            options={WEATHER_CONDITION_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>

        <FormField label="Operator">
          <AppSelect
            value={weatherRuleFormValues.operator}
            onChange={(value) => setWeatherRuleFormValues((current) => ({ ...current, operator: value }))}
            options={WEATHER_OPERATOR_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>

        <FormField label="Value">
          <AppInput
            value={weatherRuleFormValues.value}
            onChangeText={(value) => setWeatherRuleFormValues((current) => ({ ...current, value }))}
            placeholder="Threshold value"
          />
        </FormField>

        <FormField label="Unit">
          <AppInput
            value={weatherRuleFormValues.unit}
            onChangeText={(value) => setWeatherRuleFormValues((current) => ({ ...current, unit: value }))}
            placeholder="C / % / mm"
          />
        </FormField>

        <FormField label="Severity">
          <AppSelect
            value={weatherRuleFormValues.severity}
            onChange={(value) => setWeatherRuleFormValues((current) => ({ ...current, severity: value }))}
            options={WEATHER_SEVERITY_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
          />
        </FormField>

        <FormField label="Enabled">
          <AppSelect
            value={weatherRuleFormValues.enabled ? 'yes' : 'no'}
            onChange={(value) =>
              setWeatherRuleFormValues((current) => ({
                ...current,
                enabled: value === 'yes',
              }))
            }
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
          />
        </FormField>

        <FormField label="Notify In App">
          <AppSelect
            value={weatherRuleFormValues.notifyInApp ? 'yes' : 'no'}
            onChange={(value) =>
              setWeatherRuleFormValues((current) => ({
                ...current,
                notifyInApp: value === 'yes',
              }))
            }
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
          />
        </FormField>

        <FormField label="Notify Email">
          <AppSelect
            value={weatherRuleFormValues.notifyEmail ? 'yes' : 'no'}
            onChange={(value) =>
              setWeatherRuleFormValues((current) => ({
                ...current,
                notifyEmail: value === 'yes',
              }))
            }
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
          />
        </FormField>

        <FormField label="Notify SMS">
          <AppSelect
            value={weatherRuleFormValues.notifySms ? 'yes' : 'no'}
            onChange={(value) =>
              setWeatherRuleFormValues((current) => ({
                ...current,
                notifySms: value === 'yes',
              }))
            }
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
          />
        </FormField>

        <FormField label="Custom Message">
          <AppTextArea
            value={weatherRuleFormValues.customMessage}
            onChangeText={(value) =>
              setWeatherRuleFormValues((current) => ({ ...current, customMessage: value }))
            }
            placeholder="Optional notification text"
          />
        </FormField>
      </BottomSheet>

      <ActionSheet
        visible={Boolean(animalActionTarget)}
        onDismiss={() => setAnimalActionTarget(null)}
        title={animalActionTarget?.name}
        message="Manage animal record actions."
        actions={[
          {
            key: 'edit-animal',
            label: 'Edit',
            onPress: () => {
              if (animalActionTarget) {
                openAnimalEditForm(animalActionTarget);
              }
            },
          },
          {
            key: 'deactivate-animal',
            label: 'Deactivate',
            destructive: true,
            onPress: () => {
              if (animalActionTarget) {
                setAnimalDeactivateTarget(animalActionTarget);
              }
            },
          },
        ]}
      />

      <ActionSheet
        visible={Boolean(animalGroupActionTarget)}
        onDismiss={() => setAnimalGroupActionTarget(null)}
        title={animalGroupActionTarget?.name}
        message="Manage animal group actions."
        actions={[
          {
            key: 'edit-group',
            label: 'Edit',
            onPress: () => {
              if (animalGroupActionTarget) {
                openAnimalGroupEditForm(animalGroupActionTarget);
              }
            },
          },
          {
            key: 'deactivate-group',
            label: 'Deactivate',
            destructive: true,
            onPress: () => {
              if (animalGroupActionTarget) {
                setGroupDeactivateTarget(animalGroupActionTarget);
              }
            },
          },
        ]}
      />

      <ActionSheet
        visible={Boolean(healthCheckActionTarget)}
        onDismiss={() => setHealthCheckActionTarget(null)}
        title="Health Check"
        message="Manage health check actions."
        actions={[
          {
            key: 'edit-health-check',
            label: 'Edit',
            onPress: () => {
              if (healthCheckActionTarget) {
                openHealthCheckEditForm(healthCheckActionTarget);
              }
            },
          },
          {
            key: 'delete-health-check',
            label: 'Delete',
            destructive: true,
            onPress: () => {
              if (healthCheckActionTarget) {
                setHealthCheckDeleteTarget(healthCheckActionTarget);
              }
            },
          },
        ]}
      />

      <ActionSheet
        visible={Boolean(yieldRecordActionTarget)}
        onDismiss={() => setYieldRecordActionTarget(null)}
        title="Yield Record"
        message="Manage yield record actions."
        actions={[
          {
            key: 'edit-yield',
            label: 'Edit',
            onPress: () => {
              if (yieldRecordActionTarget) {
                openYieldEditForm(yieldRecordActionTarget);
              }
            },
          },
          {
            key: 'delete-yield',
            label: 'Delete',
            destructive: true,
            onPress: () => {
              if (yieldRecordActionTarget) {
                setYieldRecordDeleteTarget(yieldRecordActionTarget);
              }
            },
          },
        ]}
      />

      <ActionSheet
        visible={Boolean(housingActionTarget)}
        onDismiss={() => setHousingActionTarget(null)}
        title={housingActionTarget?.barnName}
        message="Manage housing unit actions."
        actions={[
          {
            key: 'edit-housing',
            label: 'Edit',
            onPress: () => {
              if (housingActionTarget) {
                openHousingEditForm(housingActionTarget);
              }
            },
          },
          {
            key: 'reactivate-housing',
            label: 'Reactivate',
            onPress: () => {
              if (housingActionTarget) {
                void reactivateSelectedHousing(housingActionTarget);
              }
            },
          },
          {
            key: 'deactivate-housing',
            label: 'Deactivate',
            destructive: true,
            onPress: () => {
              if (housingActionTarget) {
                setHousingDeactivateTarget(housingActionTarget);
              }
            },
          },
        ]}
      />

      <ActionSheet
        visible={Boolean(maintenanceActionTarget)}
        onDismiss={() => setMaintenanceActionTarget(null)}
        title="Maintenance Record"
        message="Manage maintenance record actions."
        actions={[
          {
            key: 'edit-maintenance',
            label: 'Edit',
            onPress: () => {
              if (maintenanceActionTarget) {
                openMaintenanceEditForm(maintenanceActionTarget);
              }
            },
          },
          {
            key: 'delete-maintenance',
            label: 'Delete',
            destructive: true,
            onPress: () => {
              if (maintenanceActionTarget) {
                setMaintenanceDeleteTarget(maintenanceActionTarget);
              }
            },
          },
        ]}
      />

      <ActionSheet
        visible={Boolean(consumptionActionTarget)}
        onDismiss={() => setConsumptionActionTarget(null)}
        title="Consumption Log"
        message="Manage consumption log actions."
        actions={[
          {
            key: 'edit-consumption',
            label: 'Edit',
            onPress: () => {
              if (consumptionActionTarget) {
                openConsumptionEditForm(consumptionActionTarget);
              }
            },
          },
          {
            key: 'delete-consumption',
            label: 'Delete',
            destructive: true,
            onPress: () => {
              if (consumptionActionTarget) {
                setConsumptionDeleteTarget(consumptionActionTarget);
              }
            },
          },
        ]}
      />

      <ActionSheet
        visible={Boolean(weatherRuleActionTarget)}
        onDismiss={() => setWeatherRuleActionTarget(null)}
        title={weatherRuleActionTarget?.name}
        message="Manage weather alert rule actions."
        actions={[
          {
            key: 'edit-rule',
            label: 'Edit',
            onPress: () => {
              if (weatherRuleActionTarget) {
                openWeatherRuleEditForm(weatherRuleActionTarget);
              }
            },
          },
          {
            key: 'delete-rule',
            label: 'Delete',
            destructive: true,
            onPress: () => {
              if (weatherRuleActionTarget) {
                setWeatherRuleDeleteTarget(weatherRuleActionTarget);
              }
            },
          },
        ]}
      />

      <ConfirmDialog
        visible={Boolean(animalDeactivateTarget)}
        title="Deactivate Animal"
        message={`Deactivate ${animalDeactivateTarget?.name ?? 'this animal'}?`}
        confirmLabel="Deactivate"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void confirmAnimalDeactivate()}
        onCancel={() => setAnimalDeactivateTarget(null)}
      />

      <ConfirmDialog
        visible={Boolean(groupDeactivateTarget)}
        title="Deactivate Group"
        message={`Deactivate ${groupDeactivateTarget?.name ?? 'this group'}?`}
        confirmLabel="Deactivate"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void confirmGroupDeactivate()}
        onCancel={() => setGroupDeactivateTarget(null)}
      />

      <ConfirmDialog
        visible={Boolean(healthCheckDeleteTarget)}
        title="Delete Health Check"
        message="Delete this health check record?"
        confirmLabel="Delete"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void confirmHealthCheckDelete()}
        onCancel={() => setHealthCheckDeleteTarget(null)}
      />

      <ConfirmDialog
        visible={Boolean(yieldRecordDeleteTarget)}
        title="Delete Yield Record"
        message="Delete this yield record?"
        confirmLabel="Delete"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void confirmYieldDelete()}
        onCancel={() => setYieldRecordDeleteTarget(null)}
      />

      <ConfirmDialog
        visible={Boolean(housingDeactivateTarget)}
        title="Deactivate Housing Unit"
        message={`Deactivate ${housingDeactivateTarget?.barnName ?? 'this unit'}?`}
        confirmLabel="Deactivate"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void confirmHousingDeactivate()}
        onCancel={() => setHousingDeactivateTarget(null)}
      />

      <ConfirmDialog
        visible={Boolean(maintenanceDeleteTarget)}
        title="Delete Maintenance Record"
        message="Delete this maintenance record?"
        confirmLabel="Delete"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void confirmMaintenanceDelete()}
        onCancel={() => setMaintenanceDeleteTarget(null)}
      />

      <ConfirmDialog
        visible={Boolean(consumptionDeleteTarget)}
        title="Delete Consumption Log"
        message="Delete this consumption log?"
        confirmLabel="Delete"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void confirmConsumptionDelete()}
        onCancel={() => setConsumptionDeleteTarget(null)}
      />

      <ConfirmDialog
        visible={Boolean(weatherRuleDeleteTarget)}
        title="Delete Weather Rule"
        message="Delete this weather alert rule?"
        confirmLabel="Delete"
        confirmTone="destructive"
        confirmLoading={isMutating}
        onConfirm={() => void confirmWeatherRuleDelete()}
        onCancel={() => setWeatherRuleDeleteTarget(null)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    minWidth: 130,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rows: {
    gap: spacing.sm,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
