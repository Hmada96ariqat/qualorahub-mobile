import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollView as ScrollViewRef,
} from 'react-native';
import { Text } from 'react-native-paper';
import type {
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
  AppButton,
  AppDatePicker,
  AppInput,
  AppPolygonMapEditor,
  AppScreen,
  AppSelect,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  DetailSectionCard,
  DotBadge,
  EmptyState,
  ErrorState,
  FormValidationProvider,
  FormField,
  HeaderIconButton,
  HeaderMenuButton,
  ListRow,
  ModuleTabs,
  PillTabs,
  PullToRefreshContainer,
  SearchBar,
  SectionHeader,
  Skeleton,
  StatStrip,
  SystemHeaderActions,
  useFormValidation,
  useToast,
  type QuickAction,
} from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
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
  toHealthCheckFormValues,
  toHousingConsumptionFormValues,
  toHousingMaintenanceFormValues,
  toHousingUnitFormValues,
  toWeatherRuleFormValues,
  toYieldRecordFormValues,
  type AnimalFormValues,
  type HealthCheckFormValues,
  type HousingConsumptionFormValues,
  type HousingMaintenanceFormValues,
  type HousingUnitFormValues,
  type LivestockTab,
  type WeatherRuleFormValues,
  type YieldRecordFormValues,
} from '../contracts';
import {
  buildAnimalRowSubtitle,
  buildHousingRowSubtitle,
  buildWeatherRowSubtitle,
  formatLivestockStatusLabel,
  toLivestockRowIconVariant,
  toLivestockStatusBadgeVariant,
} from '../livestockPresentation';
import { useLivestockModule } from '../useLivestockModule.hook';
import { LivestockAnimalDetailSheet } from './components/LivestockAnimalDetailSheet.component';
import { LivestockHousingDetailSheet } from './components/LivestockHousingDetailSheet.component';
import { LivestockWeatherDetailSheet } from './components/LivestockWeatherDetailSheet.component';

type FormMode = 'create' | 'edit';
type StatusFilter = 'all' | 'active' | 'inactive';
type WeatherStatusFilter = 'all' | 'enabled' | 'disabled';

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

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function isActiveStatus(value: string | null | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'active';
}

function matchesStatusFilter(value: string | null | undefined, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  return filter === 'active' ? isActiveStatus(value) : !isActiveStatus(value);
}

function needsAnimalAttention(animal: AnimalRecord): boolean {
  const normalized = (animal.healthStatus ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return normalized !== 'healthy' && normalized !== 'ok';
}

function isHousingUnderMaintenance(unit: HousingUnit): boolean {
  return (unit.currentStatus ?? '').trim().toLowerCase() === 'under_maintenance';
}

function matchesWeatherStatusFilter(
  rule: WeatherAlertRule,
  filter: WeatherStatusFilter,
): boolean {
  if (filter === 'all') return true;
  return filter === 'enabled' ? rule.enabled : !rule.enabled;
}

function SheetFooter({
  onCancel,
  onSubmit,
  label,
  loading,
  disabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  label: string;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <View style={styles.sheetFooter}>
      <AppButton label="Cancel" mode="text" tone="neutral" onPress={onCancel} />
      <AppButton
        label={label}
        onPress={onSubmit}
        loading={loading}
        disabled={disabled}
      />
    </View>
  );
}

export function LivestockScreen() {
  const { t } = useAppI18n();
  const { showToast } = useToast();
  const animalFormScrollRef = useRef<ScrollViewRef | null>(null);
  const animalFormValidation = useFormValidation<'name' | 'species'>(animalFormScrollRef);
  const housingFormScrollRef = useRef<ScrollViewRef | null>(null);
  const housingFormValidation = useFormValidation<'barnName'>(housingFormScrollRef);
  const weatherRuleFormScrollRef = useRef<ScrollViewRef | null>(null);
  const weatherRuleFormValidation = useFormValidation<'name'>(weatherRuleFormScrollRef);

  const [activeTab, setActiveTab] = useState<LivestockTab>('animals');
  const [animalSearch, setAnimalSearch] = useState('');
  const [housingSearch, setHousingSearch] = useState('');
  const [weatherSearch, setWeatherSearch] = useState('');
  const [animalStatusFilter, setAnimalStatusFilter] = useState<StatusFilter>('active');
  const [housingStatusFilter, setHousingStatusFilter] = useState<StatusFilter>('active');
  const [weatherStatusFilter, setWeatherStatusFilter] = useState<WeatherStatusFilter>('all');

  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [selectedHousingUnitId, setSelectedHousingUnitId] = useState<string | null>(null);
  const [selectedWeatherRule, setSelectedWeatherRule] = useState<WeatherAlertRule | null>(null);
  const [weatherLotId, setWeatherLotId] = useState('');
  const [weatherLocationInput, setWeatherLocationInput] = useState('');
  const [selectedWeatherLocationId, setSelectedWeatherLocationId] = useState<string | null>(null);

  const [animalFormVisible, setAnimalFormVisible] = useState(false);
  const [animalFormMode, setAnimalFormMode] = useState<FormMode>('create');
  const [editingAnimal, setEditingAnimal] = useState<AnimalRecord | null>(null);
  const [animalFormValues, setAnimalFormValues] = useState<AnimalFormValues>(toAnimalFormValues());

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
  const [editingConsumptionLog, setEditingConsumptionLog] =
    useState<HousingConsumptionLog | null>(null);
  const [consumptionFormValues, setConsumptionFormValues] =
    useState<HousingConsumptionFormValues>(toHousingConsumptionFormValues());

  const [weatherRuleFormVisible, setWeatherRuleFormVisible] = useState(false);
  const [weatherRuleFormMode, setWeatherRuleFormMode] = useState<FormMode>('create');
  const [editingWeatherRule, setEditingWeatherRule] = useState<WeatherAlertRule | null>(null);
  const [weatherRuleFormValues, setWeatherRuleFormValues] = useState<WeatherRuleFormValues>(
    toWeatherRuleFormValues(),
  );

  const [healthCheckActionTarget, setHealthCheckActionTarget] = useState<AnimalHealthCheck | null>(
    null,
  );
  const [yieldRecordActionTarget, setYieldRecordActionTarget] = useState<AnimalYieldRecord | null>(
    null,
  );
  const [maintenanceActionTarget, setMaintenanceActionTarget] =
    useState<HousingMaintenanceRecord | null>(null);
  const [consumptionActionTarget, setConsumptionActionTarget] =
    useState<HousingConsumptionLog | null>(null);

  const [animalDeactivateTarget, setAnimalDeactivateTarget] = useState<AnimalRecord | null>(null);
  const [healthCheckDeleteTarget, setHealthCheckDeleteTarget] =
    useState<AnimalHealthCheck | null>(null);
  const [yieldRecordDeleteTarget, setYieldRecordDeleteTarget] =
    useState<AnimalYieldRecord | null>(null);
  const [housingDeactivateTarget, setHousingDeactivateTarget] = useState<HousingUnit | null>(null);
  const [maintenanceDeleteTarget, setMaintenanceDeleteTarget] =
    useState<HousingMaintenanceRecord | null>(null);
  const [consumptionDeleteTarget, setConsumptionDeleteTarget] =
    useState<HousingConsumptionLog | null>(null);
  const [weatherRuleDeleteTarget, setWeatherRuleDeleteTarget] =
    useState<WeatherAlertRule | null>(null);

  const {
    fields,
    lots,
    animals,
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
    isMutating,
    errorMessage,
    detailsErrorMessage,
    refresh,
    refreshDetails,
    createAnimal,
    updateAnimal,
    deactivateAnimal,
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
  const fieldLabelById = useMemo(
    () => new Map(fields.map((field) => [field.id, field.name])),
    [fields],
  );
  const lotLabelById = useMemo(() => new Map(lots.map((lot) => [lot.id, lot.name])), [lots]);
  const housingLabelById = useMemo(
    () => new Map(housingUnits.map((unit) => [unit.id, unit.barnName])),
    [housingUnits],
  );

  useEffect(() => {
    if (activeTab !== 'animals') {
      setSelectedAnimalId(null);
    }
    if (activeTab !== 'housing') {
      setSelectedHousingUnitId(null);
    }
    if (activeTab !== 'weather') {
      setSelectedWeatherRule(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!selectedWeatherRule) return;
    const next =
      [...weatherRules, ...weatherLocationRules].find((rule) => rule.id === selectedWeatherRule.id) ??
      null;

    if (!next) {
      setSelectedWeatherRule(null);
      return;
    }

    if (next !== selectedWeatherRule) {
      setSelectedWeatherRule(next);
    }
  }, [selectedWeatherRule, weatherLocationRules, weatherRules]);

  const filteredAnimals = useMemo(() => {
    const normalized = animalSearch.trim().toLowerCase();
    return animals
      .filter((animal) =>
        normalized
          ? [
              animal.name,
              animal.species ?? '',
              animal.tagNumber ?? '',
              animal.activeStatus ?? '',
              animal.healthStatus ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalized)
          : true,
      )
      .filter((animal) => matchesStatusFilter(animal.activeStatus, animalStatusFilter));
  }, [animalSearch, animalStatusFilter, animals]);

  const filteredHousingUnits = useMemo(() => {
    const normalized = housingSearch.trim().toLowerCase();
    return housingUnits
      .filter((unit) =>
        normalized
          ? [
              unit.barnName,
              unit.unitCode ?? '',
              unit.fieldId ?? '',
              unit.currentStatus ?? '',
              unit.notes ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalized)
          : true,
      )
      .filter((unit) => matchesStatusFilter(unit.currentStatus, housingStatusFilter));
  }, [housingSearch, housingStatusFilter, housingUnits]);

  const filteredWeatherRules = useMemo(() => {
    const normalized = weatherSearch.trim().toLowerCase();
    return weatherRules
      .filter((rule) =>
        normalized
          ? [
              rule.name,
              rule.condition ?? '',
              rule.operator ?? '',
              rule.severity ?? '',
              rule.customMessage ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalized)
          : true,
      )
      .filter((rule) => matchesWeatherStatusFilter(rule, weatherStatusFilter));
  }, [weatherRules, weatherSearch, weatherStatusFilter]);

  const activeAnimalsCount = useMemo(
    () => animals.filter((animal) => isActiveStatus(animal.activeStatus)).length,
    [animals],
  );
  const inactiveAnimalsCount = animals.length - activeAnimalsCount;
  const animalsNeedingCareCount = useMemo(
    () => animals.filter((animal) => needsAnimalAttention(animal)).length,
    [animals],
  );

  const activeHousingCount = useMemo(
    () => housingUnits.filter((unit) => isActiveStatus(unit.currentStatus)).length,
    [housingUnits],
  );
  const inactiveHousingCount = housingUnits.length - activeHousingCount;
  const housingMaintenanceCount = useMemo(
    () => housingUnits.filter((unit) => isHousingUnderMaintenance(unit)).length,
    [housingUnits],
  );

  const enabledWeatherCount = useMemo(
    () => weatherRules.filter((rule) => rule.enabled).length,
    [weatherRules],
  );
  const disabledWeatherCount = weatherRules.length - enabledWeatherCount;
  const highSeverityWeatherCount = useMemo(
    () =>
      weatherRules.filter(
        (rule) => (rule.severity ?? '').trim().toLowerCase() === 'high',
      ).length,
    [weatherRules],
  );

  function closeAnimalForm() {
    setAnimalFormVisible(false);
    setEditingAnimal(null);
    setAnimalFormValues(toAnimalFormValues());
    animalFormValidation.reset();
  }

  function openAnimalCreateForm() {
    setAnimalFormMode('create');
    setEditingAnimal(null);
    setAnimalFormValues(toAnimalFormValues());
    animalFormValidation.reset();
    setAnimalFormVisible(true);
  }

  function openAnimalEditForm(animal: AnimalRecord) {
    setAnimalFormMode('edit');
    setEditingAnimal(animal);
    setAnimalFormValues(toAnimalFormValues(animal));
    animalFormValidation.reset();
    setAnimalFormVisible(true);
  }

  async function submitAnimalForm() {
    const name = animalFormValues.name.trim();
    const species = animalFormValues.species.trim();

    const valid = animalFormValidation.validate([
      {
        field: 'name',
        message: 'Animal name is required.',
        isValid: name.length > 0,
      },
      {
        field: 'species',
        message: 'Species is required.',
        isValid: species.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const payload = {
      name,
      species,
      breed: animalFormValues.breed.trim() || null,
      tag_number: animalFormValues.tagNumber.trim() || null,
      health_status: animalFormValues.healthStatus.trim() || null,
      active_status: animalFormValues.activeStatus.trim() || null,
      quantity: parseOptionalNumber(animalFormValues.quantity),
      group_id: editingAnimal?.groupId ?? null,
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

    const payload = {
      animal_id: selectedAnimal.id,
      record_date: yieldFormValues.date || null,
      date: yieldFormValues.date || null,
      yield_type: yieldFormValues.yieldType.trim() || null,
      amount: parseOptionalNumber(yieldFormValues.amount),
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
    housingFormValidation.reset();
  }

  function openHousingCreateForm() {
    setHousingFormMode('create');
    setEditingHousingUnit(null);
    setHousingFormValues(toHousingUnitFormValues());
    housingFormValidation.reset();
    setHousingFormVisible(true);
  }

  function openHousingEditForm(unit: HousingUnit) {
    setHousingFormMode('edit');
    setEditingHousingUnit(unit);
    setHousingFormValues(toHousingUnitFormValues(unit));
    housingFormValidation.reset();
    setHousingFormVisible(true);
  }

  async function submitHousingForm() {
    const barnName = housingFormValues.barnName.trim();
    const valid = housingFormValidation.validate([
      {
        field: 'barnName',
        message: 'Housing unit name is required.',
        isValid: barnName.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
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
    weatherRuleFormValidation.reset();
  }

  function openWeatherRuleCreateForm() {
    setWeatherRuleFormMode('create');
    setEditingWeatherRule(null);
    setWeatherRuleFormValues(toWeatherRuleFormValues());
    weatherRuleFormValidation.reset();
    setWeatherRuleFormVisible(true);
  }

  function openWeatherRuleEditForm(rule: WeatherAlertRule) {
    setWeatherRuleFormMode('edit');
    setEditingWeatherRule(rule);
    setWeatherRuleFormValues(toWeatherRuleFormValues(rule));
    weatherRuleFormValidation.reset();
    setWeatherRuleFormVisible(true);
  }

  async function submitWeatherRuleForm() {
    const name = weatherRuleFormValues.name.trim();
    const valid = weatherRuleFormValidation.validate([
      {
        field: 'name',
        message: 'Rule name is required.',
        isValid: name.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
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
      if (selectedWeatherRule?.id === weatherRuleDeleteTarget.id) {
        setSelectedWeatherRule(null);
      }
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

  function openAnimalDetails(animal: AnimalRecord) {
    setSelectedAnimalId(animal.id);
  }

  function closeAnimalDetails() {
    setSelectedAnimalId(null);
  }

  function openHousingDetails(unit: HousingUnit) {
    setSelectedHousingUnitId(unit.id);
  }

  function closeHousingDetails() {
    setSelectedHousingUnitId(null);
  }

  function openWeatherDetails(rule: WeatherAlertRule) {
    setSelectedWeatherRule(rule);
  }

  function closeWeatherDetails() {
    setSelectedWeatherRule(null);
  }

  const animalQuickActions = useMemo<QuickAction[]>(
    () =>
      !selectedAnimal
        ? []
        : [
            {
              key: 'edit-animal',
              icon: 'pencil',
              label: 'Edit',
              color: 'blue',
              onPress: () => {
                closeAnimalDetails();
                openAnimalEditForm(selectedAnimal);
              },
            },
            {
              key: 'animal-health',
              icon: 'stethoscope',
              label: 'Health',
              color: 'green',
              onPress: openHealthCheckCreateForm,
            },
            {
              key: 'animal-yield',
              icon: 'chart-line',
              label: 'Yield',
              color: 'amber',
              onPress: openYieldCreateForm,
            },
            ...(isActiveStatus(selectedAnimal.activeStatus)
              ? [
                  {
                    key: 'deactivate-animal',
                    icon: 'archive-outline',
                    label: 'Deactivate',
                    color: 'red' as const,
                    onPress: () => setAnimalDeactivateTarget(selectedAnimal),
                  },
                ]
              : []),
          ],
    [selectedAnimal],
  );

  const housingQuickActions = useMemo<QuickAction[]>(
    () =>
      !selectedHousingUnit
        ? []
        : [
            {
              key: 'edit-housing',
              icon: 'pencil',
              label: 'Edit',
              color: 'blue',
              onPress: () => {
                closeHousingDetails();
                openHousingEditForm(selectedHousingUnit);
              },
            },
            {
              key: 'housing-maintenance',
              icon: 'wrench-outline',
              label: 'Maintain',
              color: 'amber',
              onPress: openMaintenanceCreateForm,
            },
            {
              key: 'housing-consumption',
              icon: 'water-outline',
              label: 'Usage',
              color: 'green',
              onPress: openConsumptionCreateForm,
            },
            ...(isActiveStatus(selectedHousingUnit.currentStatus)
              ? [
                  {
                    key: 'deactivate-housing',
                    icon: 'archive-outline',
                    label: 'Deactivate',
                    color: 'red' as const,
                    onPress: () => setHousingDeactivateTarget(selectedHousingUnit),
                  },
                ]
              : [
                  {
                    key: 'reactivate-housing',
                    icon: 'restore',
                    label: 'Reactivate',
                    color: 'green' as const,
                    onPress: () => void reactivateSelectedHousing(selectedHousingUnit),
                  },
                ]),
          ],
    [selectedHousingUnit],
  );

  const weatherQuickActions = useMemo<QuickAction[]>(
    () =>
      !selectedWeatherRule
        ? []
        : [
            {
              key: 'edit-weather',
              icon: 'pencil',
              label: 'Edit',
              color: 'blue',
              onPress: () => {
                closeWeatherDetails();
                openWeatherRuleEditForm(selectedWeatherRule);
              },
            },
            {
              key: 'delete-weather',
              icon: 'delete-outline',
              label: 'Delete',
              color: 'red',
              onPress: () => {
                closeWeatherDetails();
                setWeatherRuleDeleteTarget(selectedWeatherRule);
              },
            },
          ],
    [selectedWeatherRule],
  );

  const searchValue =
    activeTab === 'animals'
      ? animalSearch
      : activeTab === 'housing'
        ? housingSearch
        : weatherSearch;

  const createAction =
    activeTab === 'animals'
      ? openAnimalCreateForm
      : activeTab === 'housing'
        ? openHousingCreateForm
        : openWeatherRuleCreateForm;

  const tabContent =
    activeTab === 'animals' ? (
      <>
        <StatStrip
          items={[
            { value: activeAnimalsCount, label: 'Active', color: 'green' },
            { value: inactiveAnimalsCount, label: 'Inactive', color: 'amber' },
            {
              value: animalsNeedingCareCount,
              label: 'Needs Care',
              color: animalsNeedingCareCount > 0 ? 'red' : 'green',
            },
          ]}
          testID="livestock-animals-stats"
        />

        <PillTabs
          value={animalStatusFilter}
          onValueChange={(value) => setAnimalStatusFilter(value as StatusFilter)}
          tabs={[
            { value: 'all', label: `All (${animals.length})` },
            { value: 'active', label: `Active (${activeAnimalsCount})` },
            { value: 'inactive', label: `Inactive (${inactiveAnimalsCount})` },
          ]}
          testID="livestock-animals-status-filter"
        />

        <SectionHeader title="Animals" trailing={`${filteredAnimals.length} items`} />

        {isLoading ? (
          <>
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
          </>
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => void refresh()} />
        ) : filteredAnimals.length === 0 ? (
          <EmptyState
            title="No animals found"
            message="Try another search or create a new animal record."
            actionLabel="Create animal"
            onAction={openAnimalCreateForm}
          />
        ) : (
          filteredAnimals.map((animal) => (
            <ListRow
              key={animal.id}
              icon="cow"
              iconVariant={toLivestockRowIconVariant(animal.activeStatus)}
              title={animal.name}
              subtitle={buildAnimalRowSubtitle({
                animal,
                housingLabel: animal.currentHousingUnitId
                  ? housingLabelById.get(animal.currentHousingUnitId)
                  : undefined,
              })}
              badge={
                <DotBadge
                  label={formatLivestockStatusLabel(animal.activeStatus)}
                  variant={toLivestockStatusBadgeVariant(animal.activeStatus)}
                />
              }
              onPress={() => openAnimalDetails(animal)}
              testID={`livestock-animal-row-${animal.id}`}
            />
          ))
        )}
      </>
    ) : activeTab === 'housing' ? (
      <>
        <StatStrip
          items={[
            { value: activeHousingCount, label: 'Active', color: 'green' },
            { value: inactiveHousingCount, label: 'Inactive', color: 'amber' },
            {
              value: housingMaintenanceCount,
              label: 'Maintenance',
              color: housingMaintenanceCount > 0 ? 'red' : 'green',
            },
          ]}
          testID="livestock-housing-stats"
        />

        <PillTabs
          value={housingStatusFilter}
          onValueChange={(value) => setHousingStatusFilter(value as StatusFilter)}
          tabs={[
            { value: 'all', label: `All (${housingUnits.length})` },
            { value: 'active', label: `Active (${activeHousingCount})` },
            { value: 'inactive', label: `Inactive (${inactiveHousingCount})` },
          ]}
          testID="livestock-housing-status-filter"
        />

        <SectionHeader title="Housing Units" trailing={`${filteredHousingUnits.length} items`} />

        {isLoading ? (
          <>
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
          </>
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => void refresh()} />
        ) : filteredHousingUnits.length === 0 ? (
          <EmptyState
            title="No housing units found"
            message="Try another search or create a new housing record."
            actionLabel="Create housing unit"
            onAction={openHousingCreateForm}
          />
        ) : (
          filteredHousingUnits.map((unit) => (
            <ListRow
              key={unit.id}
              icon="home-group"
              iconVariant={toLivestockRowIconVariant(unit.currentStatus)}
              title={unit.barnName}
              subtitle={buildHousingRowSubtitle({
                housingUnit: unit,
                fieldLabel: unit.fieldId ? fieldLabelById.get(unit.fieldId) : undefined,
              })}
              badge={
                <DotBadge
                  label={formatLivestockStatusLabel(unit.currentStatus)}
                  variant={toLivestockStatusBadgeVariant(unit.currentStatus)}
                />
              }
              onPress={() => openHousingDetails(unit)}
              testID={`livestock-housing-row-${unit.id}`}
            />
          ))
        )}
      </>
    ) : (
      <>
        <StatStrip
          items={[
            { value: enabledWeatherCount, label: 'Enabled', color: 'green' },
            { value: disabledWeatherCount, label: 'Disabled', color: 'amber' },
            {
              value: highSeverityWeatherCount,
              label: 'High Severity',
              color: highSeverityWeatherCount > 0 ? 'red' : 'green',
            },
          ]}
          testID="livestock-weather-stats"
        />

        <PillTabs
          value={weatherStatusFilter}
          onValueChange={(value) => setWeatherStatusFilter(value as WeatherStatusFilter)}
          tabs={[
            { value: 'all', label: `All (${weatherRules.length})` },
            { value: 'enabled', label: `Enabled (${enabledWeatherCount})` },
            { value: 'disabled', label: `Disabled (${disabledWeatherCount})` },
          ]}
          testID="livestock-weather-status-filter"
        />

        <DetailSectionCard
          title="Weather Scope"
          description="Keep the existing lot-based weather rule behavior while using the dense shell."
        >
          <AppSelect
            label="Lot filter"
            value={weatherLotId}
            onChange={setWeatherLotId}
            options={[
              { label: 'All lots', value: '' },
              ...lots.map((lot) => ({ label: lot.name, value: lot.id })),
            ]}
            testID="livestock-weather-lot-filter"
          />
        </DetailSectionCard>

        <SectionHeader title="Weather Rules" trailing={`${filteredWeatherRules.length} items`} />

        {isLoading ? (
          <>
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
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
            message="Try another search or create a weather rule."
            actionLabel="Create weather rule"
            onAction={openWeatherRuleCreateForm}
          />
        ) : (
          filteredWeatherRules.map((rule) => (
            <ListRow
              key={rule.id}
              icon="weather-partly-cloudy"
              iconVariant={rule.enabled ? 'green' : 'amber'}
              title={rule.name}
              subtitle={buildWeatherRowSubtitle({
                weatherRule: rule,
                lotLabel: rule.lotId ? lotLabelById.get(rule.lotId) : undefined,
                fieldLabel: rule.fieldId ? fieldLabelById.get(rule.fieldId) : undefined,
              })}
              badge={
                <DotBadge
                  label={formatLivestockStatusLabel(rule.severity)}
                  variant={toLivestockStatusBadgeVariant(rule.severity)}
                />
              }
              onPress={() => openWeatherDetails(rule)}
              testID={`livestock-weather-row-${rule.id}`}
            />
          ))
        )}

        <DetailSectionCard
          title="Location Weather View"
          description="Load rules currently applicable to a location id."
          trailing={
            <AppButton
              label="Load"
              mode="outlined"
              tone="neutral"
              onPress={() => setSelectedWeatherLocationId(weatherLocationInput.trim() || null)}
            />
          }
        >
          <AppInput
            value={weatherLocationInput}
            onChangeText={setWeatherLocationInput}
            placeholder="Enter location id"
          />

          {detailsErrorMessage ? (
            <ErrorState message={detailsErrorMessage} onRetry={() => void refresh()} />
          ) : weatherLocationRules.length === 0 ? (
            <EmptyState
              title="No location rules loaded"
              message="Provide a location id and load applicable rules."
            />
          ) : (
            <View style={styles.sectionRows}>
              {weatherLocationRules.map((rule) => (
                <ListRow
                  key={`${rule.id}-location`}
                  icon="map-marker-outline"
                  iconVariant={rule.enabled ? 'green' : 'amber'}
                  title={rule.name}
                  subtitle={buildWeatherRowSubtitle({
                    weatherRule: rule,
                    lotLabel: rule.lotId ? lotLabelById.get(rule.lotId) : undefined,
                    fieldLabel: rule.fieldId ? fieldLabelById.get(rule.fieldId) : undefined,
                  })}
                  badge={
                    <DotBadge
                      label={formatLivestockStatusLabel(rule.severity)}
                      variant={toLivestockStatusBadgeVariant(rule.severity)}
                    />
                  }
                  onPress={() => openWeatherDetails(rule)}
                />
              ))}
            </View>
          )}
        </DetailSectionCard>
      </>
    );

  return (
    <>
      <AppScreen padded={false}>
        <View style={styles.moduleHeader}>
          <View style={styles.moduleHeaderTop}>
            <View style={styles.headerLead}>
              <HeaderMenuButton testID="livestock-header-menu" />
              <View style={styles.headerCopy}>
                <Text style={styles.moduleHeaderTitle}>
                  {t('system', 'headers.livestock.title', 'Livestock, Housing, and Weather')}
                </Text>
                <Text style={styles.moduleHeaderSubtitle}>
                  {t(
                    'system',
                    'headers.livestock.subtitle',
                    'Dense module shell for animals, housing lifecycle, and weather alert rules.',
                  )}
                </Text>
              </View>
            </View>
            <SystemHeaderActions notificationTestID="livestock-header-notifications">
              <HeaderIconButton
                icon="refresh"
                onPress={() => void refresh()}
                testID="livestock-refresh"
              />
              <HeaderIconButton
                icon="plus"
                onPress={createAction}
                filled
                testID={`livestock-${activeTab}-create`}
              />
            </SystemHeaderActions>
          </View>

          <SearchBar
            value={searchValue}
            onChangeText={
              activeTab === 'animals'
                ? setAnimalSearch
                : activeTab === 'housing'
                  ? setHousingSearch
                  : setWeatherSearch
            }
            placeholder={
              activeTab === 'animals'
                ? 'Search animals by name, tag, or status...'
                : activeTab === 'housing'
                  ? 'Search housing by name, field, or status...'
                  : 'Search weather rules by name, condition, or severity...'
            }
          />

          <ModuleTabs
            tabs={LIVESTOCK_TAB_OPTIONS}
            value={activeTab}
            onValueChange={setActiveTab}
            testID="livestock-tabs"
          />
        </View>

        <PullToRefreshContainer
          refreshing={isRefreshing || isMutating}
          onRefresh={() => void refresh()}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.main}
            showsVerticalScrollIndicator={false}
          >
            {tabContent}
          </ScrollView>
        </PullToRefreshContainer>
      </AppScreen>

      <LivestockAnimalDetailSheet
        animal={selectedAnimal}
        housingLabel={
          selectedAnimal?.currentHousingUnitId
            ? housingLabelById.get(selectedAnimal.currentHousingUnitId)
            : undefined
        }
        healthChecks={healthChecks}
        yieldRecords={yieldRecords}
        detailsLoading={detailsLoading}
        detailsErrorMessage={detailsErrorMessage}
        quickActions={animalQuickActions}
        onDismiss={closeAnimalDetails}
        onRetry={() => void refreshDetails()}
        onAddHealthCheck={openHealthCheckCreateForm}
        onAddYieldRecord={openYieldCreateForm}
        onPressHealthCheck={setHealthCheckActionTarget}
        onPressYieldRecord={setYieldRecordActionTarget}
      />

      <LivestockHousingDetailSheet
        housingUnit={selectedHousingUnit}
        fieldLabel={
          selectedHousingUnit?.fieldId
            ? fieldLabelById.get(selectedHousingUnit.fieldId)
            : undefined
        }
        maintenanceRecords={housingMaintenanceRecords}
        consumptionLogs={housingConsumptionLogs}
        detailsLoading={detailsLoading}
        detailsErrorMessage={detailsErrorMessage}
        quickActions={housingQuickActions}
        onDismiss={closeHousingDetails}
        onRetry={() => void refreshDetails()}
        onAddMaintenance={openMaintenanceCreateForm}
        onAddConsumption={openConsumptionCreateForm}
        onPressMaintenance={setMaintenanceActionTarget}
        onPressConsumption={setConsumptionActionTarget}
      />

      <LivestockWeatherDetailSheet
        weatherRule={selectedWeatherRule}
        lotLabel={
          selectedWeatherRule?.lotId ? lotLabelById.get(selectedWeatherRule.lotId) : undefined
        }
        fieldLabel={
          selectedWeatherRule?.fieldId
            ? fieldLabelById.get(selectedWeatherRule.fieldId)
            : undefined
        }
        quickActions={weatherQuickActions}
        onDismiss={closeWeatherDetails}
      />

      <BottomSheet
        visible={animalFormVisible}
        onDismiss={closeAnimalForm}
        scrollViewRef={animalFormScrollRef}
        title={animalFormMode === 'create' ? 'Create Animal' : 'Edit Animal'}
        footer={
          <SheetFooter
            onCancel={closeAnimalForm}
            onSubmit={() => void submitAnimalForm()}
            label={animalFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormValidationProvider value={animalFormValidation.providerValue}>
          <DetailSectionCard
            title="Animal Details"
            description="Core animal identity, health, housing assignment, and notes."
            testID="livestock-animal-form"
          >
            <FormField label="Name" name="name" required>
              <AppInput
                value={animalFormValues.name}
                onChangeText={(value) => {
                  animalFormValidation.clearFieldError('name');
                  setAnimalFormValues((current) => ({ ...current, name: value }));
                }}
                placeholder="Animal name"
              />
            </FormField>

            <FormField label="Species" name="species" required>
              <AppInput
                value={animalFormValues.species}
                onChangeText={(value) => {
                  animalFormValidation.clearFieldError('species');
                  setAnimalFormValues((current) => ({ ...current, species: value }));
                }}
                placeholder="Species"
              />
            </FormField>

            <FormField label="Breed">
              <AppInput
                value={animalFormValues.breed}
                onChangeText={(value) =>
                  setAnimalFormValues((current) => ({ ...current, breed: value }))
                }
                placeholder="Breed"
              />
            </FormField>

            <FormField label="Tag Number">
              <AppInput
                value={animalFormValues.tagNumber}
                onChangeText={(value) =>
                  setAnimalFormValues((current) => ({ ...current, tagNumber: value }))
                }
                placeholder="Tag number"
              />
            </FormField>

            <FormField label="Status">
              <AppSelect
                value={animalFormValues.activeStatus}
                onChange={(value) =>
                  setAnimalFormValues((current) => ({ ...current, activeStatus: value }))
                }
                options={ANIMAL_STATUS_OPTIONS.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
              />
            </FormField>

            <FormField label="Health Status">
              <AppInput
                value={animalFormValues.healthStatus}
                onChangeText={(value) =>
                  setAnimalFormValues((current) => ({ ...current, healthStatus: value }))
                }
                placeholder="healthy / observation / treatment"
              />
            </FormField>

            <FormField label="Quantity">
              <AppInput
                value={animalFormValues.quantity}
                onChangeText={(value) =>
                  setAnimalFormValues((current) => ({ ...current, quantity: value }))
                }
                placeholder="1"
              />
            </FormField>

            <FormField label="Housing Unit">
              <AppSelect
                value={animalFormValues.housingUnitId}
                onChange={(value) =>
                  setAnimalFormValues((current) => ({ ...current, housingUnitId: value }))
                }
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
                onChangeText={(value) =>
                  setAnimalFormValues((current) => ({ ...current, notes: value }))
                }
                placeholder="Optional notes"
              />
            </FormField>
          </DetailSectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={healthCheckFormVisible}
        onDismiss={closeHealthCheckForm}
        title={healthCheckFormMode === 'create' ? 'Create Health Check' : 'Edit Health Check'}
        footer={
          <SheetFooter
            onCancel={closeHealthCheckForm}
            onSubmit={() => void submitHealthCheckForm()}
            label={healthCheckFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <DetailSectionCard
          title="Health Check Details"
          description="Date, outcome, performer, and notes for the selected animal."
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
              onChangeText={(value) =>
                setHealthCheckFormValues((current) => ({ ...current, status: value }))
              }
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
              onChangeText={(value) =>
                setHealthCheckFormValues((current) => ({ ...current, notes: value }))
              }
              placeholder="Health check notes"
            />
          </FormField>
        </DetailSectionCard>
      </BottomSheet>

      <BottomSheet
        visible={yieldFormVisible}
        onDismiss={closeYieldForm}
        title={yieldFormMode === 'create' ? 'Create Yield Record' : 'Edit Yield Record'}
        footer={
          <SheetFooter
            onCancel={closeYieldForm}
            onSubmit={() => void submitYieldForm()}
            label={yieldFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <DetailSectionCard
          title="Yield Record Details"
          description="Track yield type, date, amount, and notes for the selected animal."
        >
          <FormField label="Date">
            <AppDatePicker
              value={yieldFormValues.date || null}
              onChange={(value) =>
                setYieldFormValues((current) => ({ ...current, date: value ?? '' }))
              }
            />
          </FormField>

          <FormField label="Yield Type">
            <AppInput
              value={yieldFormValues.yieldType}
              onChangeText={(value) =>
                setYieldFormValues((current) => ({ ...current, yieldType: value }))
              }
              placeholder="milk / eggs / weight gain"
            />
          </FormField>

          <FormField label="Amount">
            <AppInput
              value={yieldFormValues.amount}
              onChangeText={(value) =>
                setYieldFormValues((current) => ({ ...current, amount: value }))
              }
              placeholder="0"
            />
          </FormField>

          <FormField label="Unit">
            <AppInput
              value={yieldFormValues.unit}
              onChangeText={(value) =>
                setYieldFormValues((current) => ({ ...current, unit: value }))
              }
              placeholder="L / kg / count"
            />
          </FormField>

          <FormField label="Notes">
            <AppTextArea
              value={yieldFormValues.notes}
              onChangeText={(value) =>
                setYieldFormValues((current) => ({ ...current, notes: value }))
              }
              placeholder="Yield notes"
            />
          </FormField>
        </DetailSectionCard>
      </BottomSheet>

      <BottomSheet
        visible={housingFormVisible}
        onDismiss={closeHousingForm}
        scrollViewRef={housingFormScrollRef}
        title={housingFormMode === 'create' ? 'Create Housing Unit' : 'Edit Housing Unit'}
        footer={
          <SheetFooter
            onCancel={closeHousingForm}
            onSubmit={() => void submitHousingForm()}
            label={housingFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormValidationProvider value={housingFormValidation.providerValue}>
          <DetailSectionCard
            title="Housing Details"
            description="Housing identity, field assignment, capacity, status, and notes."
          >
            <FormField label="Barn Name" name="barnName" required>
              <AppInput
                value={housingFormValues.barnName}
                onChangeText={(value) => {
                  housingFormValidation.clearFieldError('barnName');
                  setHousingFormValues((current) => ({ ...current, barnName: value }));
                }}
                placeholder="Barn name"
              />
            </FormField>

            <FormField label="Unit Code">
              <AppInput
                value={housingFormValues.unitCode}
                onChangeText={(value) =>
                  setHousingFormValues((current) => ({ ...current, unitCode: value }))
                }
                placeholder="Optional unit code"
              />
            </FormField>

            <FormField label="Field">
              <AppSelect
                value={housingFormValues.fieldId}
                onChange={(value) =>
                  setHousingFormValues((current) => ({ ...current, fieldId: value }))
                }
                options={[
                  { label: 'No field', value: '' },
                  ...fields.map((field) => ({ label: field.name, value: field.id })),
                ]}
              />
            </FormField>

            <FormField label="Capacity">
              <AppInput
                value={housingFormValues.capacity}
                onChangeText={(value) =>
                  setHousingFormValues((current) => ({ ...current, capacity: value }))
                }
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
                  setHousingFormValues((current) => ({
                    ...current,
                    boundaryPoints: nextPoints,
                  }))
                }
                testID="housing-boundary-map"
              />
            </FormField>

            <FormField label="Notes">
              <AppTextArea
                value={housingFormValues.notes}
                onChangeText={(value) =>
                  setHousingFormValues((current) => ({ ...current, notes: value }))
                }
                placeholder="Optional notes"
              />
            </FormField>
          </DetailSectionCard>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={maintenanceFormVisible}
        onDismiss={closeMaintenanceForm}
        title={maintenanceFormMode === 'create' ? 'Create Maintenance' : 'Edit Maintenance'}
        footer={
          <SheetFooter
            onCancel={closeMaintenanceForm}
            onSubmit={() => void submitMaintenanceForm()}
            label={maintenanceFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <DetailSectionCard
          title="Maintenance Details"
          description="Date, maintenance type, status, cost, and notes for the selected unit."
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
              onChangeText={(value) =>
                setMaintenanceFormValues((current) => ({ ...current, status: value }))
              }
              placeholder="scheduled / done / canceled"
            />
          </FormField>

          <FormField label="Cost">
            <AppInput
              value={maintenanceFormValues.cost}
              onChangeText={(value) =>
                setMaintenanceFormValues((current) => ({ ...current, cost: value }))
              }
              placeholder="0"
            />
          </FormField>

          <FormField label="Notes">
            <AppTextArea
              value={maintenanceFormValues.notes}
              onChangeText={(value) =>
                setMaintenanceFormValues((current) => ({ ...current, notes: value }))
              }
              placeholder="Optional notes"
            />
          </FormField>
        </DetailSectionCard>
      </BottomSheet>

      <BottomSheet
        visible={consumptionFormVisible}
        onDismiss={closeConsumptionForm}
        title={consumptionFormMode === 'create' ? 'Create Consumption Log' : 'Edit Consumption Log'}
        footer={
          <SheetFooter
            onCancel={closeConsumptionForm}
            onSubmit={() => void submitConsumptionForm()}
            label={consumptionFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <DetailSectionCard
          title="Consumption Details"
          description="Feed, water, unit, and notes for the selected housing unit."
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
              onChangeText={(value) =>
                setConsumptionFormValues((current) => ({ ...current, unit: value }))
              }
              placeholder="kg / L"
            />
          </FormField>

          <FormField label="Notes">
            <AppTextArea
              value={consumptionFormValues.notes}
              onChangeText={(value) =>
                setConsumptionFormValues((current) => ({ ...current, notes: value }))
              }
              placeholder="Optional notes"
            />
          </FormField>
        </DetailSectionCard>
      </BottomSheet>

      <BottomSheet
        visible={weatherRuleFormVisible}
        onDismiss={closeWeatherRuleForm}
        scrollViewRef={weatherRuleFormScrollRef}
        title={weatherRuleFormMode === 'create' ? 'Create Weather Rule' : 'Edit Weather Rule'}
        footer={
          <SheetFooter
            onCancel={closeWeatherRuleForm}
            onSubmit={() => void submitWeatherRuleForm()}
            label={weatherRuleFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <FormValidationProvider value={weatherRuleFormValidation.providerValue}>
          <DetailSectionCard
            title="Weather Rule Details"
            description="Rule scope, condition, threshold, severity, and notification settings."
          >
            <FormField label="Rule Name" name="name" required>
              <AppInput
                value={weatherRuleFormValues.name}
                onChangeText={(value) => {
                  weatherRuleFormValidation.clearFieldError('name');
                  setWeatherRuleFormValues((current) => ({ ...current, name: value }));
                }}
                placeholder="Rule name"
              />
            </FormField>

            <FormField label="Lot">
              <AppSelect
                value={weatherRuleFormValues.lotId}
                onChange={(value) =>
                  setWeatherRuleFormValues((current) => ({ ...current, lotId: value }))
                }
                options={[
                  { label: 'No lot', value: '' },
                  ...lots.map((lot) => ({ label: lot.name, value: lot.id })),
                ]}
              />
            </FormField>

            <FormField label="Field">
              <AppSelect
                value={weatherRuleFormValues.fieldId}
                onChange={(value) =>
                  setWeatherRuleFormValues((current) => ({ ...current, fieldId: value }))
                }
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
                options={WEATHER_CONDITION_OPTIONS.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
              />
            </FormField>

            <FormField label="Operator">
              <AppSelect
                value={weatherRuleFormValues.operator}
                onChange={(value) =>
                  setWeatherRuleFormValues((current) => ({ ...current, operator: value }))
                }
                options={WEATHER_OPERATOR_OPTIONS.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
              />
            </FormField>

            <FormField label="Value">
              <AppInput
                value={weatherRuleFormValues.value}
                onChangeText={(value) =>
                  setWeatherRuleFormValues((current) => ({ ...current, value }))
                }
                placeholder="Threshold value"
              />
            </FormField>

            <FormField label="Unit">
              <AppInput
                value={weatherRuleFormValues.unit}
                onChangeText={(value) =>
                  setWeatherRuleFormValues((current) => ({ ...current, unit: value }))
                }
                placeholder="C / % / mm"
              />
            </FormField>

            <FormField label="Severity">
              <AppSelect
                value={weatherRuleFormValues.severity}
                onChange={(value) =>
                  setWeatherRuleFormValues((current) => ({ ...current, severity: value }))
                }
                options={WEATHER_SEVERITY_OPTIONS.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
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
                  setWeatherRuleFormValues((current) => ({
                    ...current,
                    customMessage: value,
                  }))
                }
                placeholder="Optional notification text"
              />
            </FormField>
          </DetailSectionCard>
        </FormValidationProvider>
      </BottomSheet>

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
    </>
  );
}

const styles = StyleSheet.create({
  moduleHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  moduleHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerLead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  moduleHeaderTitle: {
    ...typography.title,
    color: palette.foreground,
  },
  moduleHeaderSubtitle: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  main: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionRows: {
    gap: spacing.sm,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
