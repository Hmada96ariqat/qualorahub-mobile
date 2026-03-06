import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import type {
  CropSummary,
  LogbookCategoryOption,
  LogbookEntityOption,
  LogbookSubmitRequest,
  ProductionCycleOperationSummary,
  ProductionCycleSummary,
} from '../../../api/modules/crops';
import {
  ActionSheet,
  AppBadge,
  AppButton,
  AppCard,
  AppDatePicker,
  AppHeader,
  HeaderActionGroup,
  AppInput,
  AppListItem,
  NotificationHeaderButton,
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
  FormValidationProvider,
  FormField,
  PaginationFooter,
  PullToRefreshContainer,
  Skeleton,
  useFormValidation,
  useToast,
} from '../../../components';
import { palette, spacing, typography } from '../../../theme/tokens';
import {
  formatApiErrorMessage,
  isActiveLifecycleStatus,
  isInactiveLifecycleStatus,
} from '../../../utils/lifecycle';
import {
  CYCLE_LIST_MODE_OPTIONS,
  LOGBOOK_CATEGORY_OPTIONS,
  LOGBOOK_ENTITY_TYPE_OPTIONS,
  LOGBOOK_FAMILY_OPTIONS,
  OPERATION_TYPE_OPTIONS,
  normalizeCycleListMode,
  toCropFormValues,
  toCycleCloseFormValues,
  toCycleFormValues,
  toLogbookFormValues,
  toOperationFormValues,
  type CropFormMode,
  type CropFormValues,
  type CycleCloseFormValues,
  type CycleFormValues,
  type CycleListMode,
  type LogbookFormValues,
  type OperationFormMode,
  type OperationFormValues,
} from '../contracts';
import { useCropsModule } from '../useCropsModule.hook';

type Phase11Tab = 'crops' | 'cycles' | 'logbook';

type Props = {
  initialTab?: Phase11Tab;
};

type CropStatusAction = 'active' | 'inactive';

function statusLabel(value: string): string {
  if (!value) return 'Unknown';
  const normalized = value.trim();
  if (!normalized) return 'Unknown';
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

function statusVariant(status: string): 'success' | 'warning' | 'accent' | 'neutral' {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'active') return 'success';
  if (normalized === 'closed' || normalized === 'inactive') return 'warning';
  if (normalized === 'planned' || normalized === 'draft') return 'accent';
  return 'neutral';
}

function formatCycleMeta(cycle: ProductionCycleSummary): string {
  const start = cycle.startDate.slice(0, 10) || 'n/a';
  const end = cycle.endDate?.slice(0, 10) ?? 'open';
  return `${cycle.fieldName ?? cycle.fieldId} • ${cycle.lotName ?? cycle.lotId} • ${start} → ${end}`;
}

function toEntityOptions(
  sessionCategory: LogbookCategoryOption | null,
  entitiesByCategory: Record<string, LogbookEntityOption[]>,
): Array<{ label: string; value: string }> {
  if (!sessionCategory) return [];

  return (entitiesByCategory[sessionCategory.key] ?? []).map((entity) => ({
    label: `${entity.name} (${entity.type})`,
    value: entity.id,
  }));
}

function toSubmitFamily(value: string): LogbookSubmitRequest['family'] | undefined {
  const normalized = value.trim();
  if (!normalized) return undefined;

  const allowed = new Set<string>(LOGBOOK_FAMILY_OPTIONS.map((option) => option.value));
  return allowed.has(normalized)
    ? (normalized as LogbookSubmitRequest['family'])
    : undefined;
}

export function CropsScreen({ initialTab = 'crops' }: Props) {
  const { showToast } = useToast();
  const cropFormScrollRef = useRef<ScrollView | null>(null);
  const cropFormValidation = useFormValidation<'cropName'>(cropFormScrollRef);
  const cycleFormScrollRef = useRef<ScrollView | null>(null);
  const cycleFormValidation = useFormValidation<'fieldId' | 'lotId' | 'cropId' | 'startDate'>(
    cycleFormScrollRef,
  );
  const cycleCloseFormScrollRef = useRef<ScrollView | null>(null);
  const cycleCloseFormValidation = useFormValidation<'endDate'>(cycleCloseFormScrollRef);
  const operationFormScrollRef = useRef<ScrollView | null>(null);
  const operationFormValidation = useFormValidation<'date' | 'type' | 'cost'>(
    operationFormScrollRef,
  );

  const [activeTab, setActiveTab] = useState<Phase11Tab>(initialTab);
  const [cropSearch, setCropSearch] = useState('');
  const [cycleSearch, setCycleSearch] = useState('');
  const [cycleListMode, setCycleListMode] = useState<CycleListMode>('active');

  const [cropFormVisible, setCropFormVisible] = useState(false);
  const [cropFormMode, setCropFormMode] = useState<CropFormMode>('create');
  const [editingCrop, setEditingCrop] = useState<CropSummary | null>(null);
  const [cropFormValues, setCropFormValues] = useState<CropFormValues>(toCropFormValues());

  const [cropActionTarget, setCropActionTarget] = useState<CropSummary | null>(null);
  const [pendingCropStatusAction, setPendingCropStatusAction] = useState<CropStatusAction | null>(null);

  const [cycleFormVisible, setCycleFormVisible] = useState(false);
  const [cycleFormValues, setCycleFormValues] = useState<CycleFormValues>(toCycleFormValues());
  const [cycleActionTarget, setCycleActionTarget] = useState<ProductionCycleSummary | null>(null);

  const [cycleCloseVisible, setCycleCloseVisible] = useState(false);
  const [cycleCloseValues, setCycleCloseValues] = useState<CycleCloseFormValues>(toCycleCloseFormValues());

  const [cycleNotesVisible, setCycleNotesVisible] = useState(false);
  const [cycleNotesText, setCycleNotesText] = useState('');

  const [operationsVisible, setOperationsVisible] = useState(false);
  const [operationsCycle, setOperationsCycle] = useState<ProductionCycleSummary | null>(null);
  const [operationFormVisible, setOperationFormVisible] = useState(false);
  const [operationFormMode, setOperationFormMode] = useState<OperationFormMode>('create');
  const [editingOperation, setEditingOperation] = useState<ProductionCycleOperationSummary | null>(null);
  const [operationActionTarget, setOperationActionTarget] =
    useState<ProductionCycleOperationSummary | null>(null);
  const [deletingOperation, setDeletingOperation] = useState<ProductionCycleOperationSummary | null>(null);
  const [operationFormValues, setOperationFormValues] = useState<OperationFormValues>(
    toOperationFormValues(),
  );

  const [logbookFormValues, setLogbookFormValues] = useState<LogbookFormValues>(
    toLogbookFormValues(),
  );

  const {
    fields,
    lots,
    cycles,
    crops,
    cycleOperations,
    logbookSession,
    logbookPracticeCatalog,
    isLoading,
    isRefreshing,
    isMutating,
    operationsLoading,
    logbookPracticeLoading,
    errorMessage,
    operationsErrorMessage,
    logbookPracticeErrorMessage,
    latestLogbookResult,
    refresh,
    refreshOperations,
    refreshLogbook,
    createCrop,
    updateCrop,
    updateCropStatus,
    createProductionCycle,
    closeProductionCycle,
    updateProductionCycleNotes,
    createProductionCycleOperation,
    updateProductionCycleOperation,
    deleteProductionCycleOperation,
    submitLogbook,
  } = useCropsModule({
    selectedCycleId: operationsCycle?.id ?? null,
    logbookSessionQuery: {
      fieldId: logbookFormValues.fieldId || undefined,
      date: logbookFormValues.date || undefined,
    },
    practiceCatalogQuery: logbookFormValues.fieldId
      ? {
          fieldId: logbookFormValues.fieldId,
          date: logbookFormValues.date || undefined,
        }
      : null,
  });

  useEffect(() => {
    if (!logbookSession) return;
    if (logbookFormValues.fieldId) return;

    const defaultFieldId =
      logbookSession.selectedFieldId ?? logbookSession.fields[0]?.id ?? logbookFormValues.fieldId;

    if (defaultFieldId) {
      setLogbookFormValues((current) => ({ ...current, fieldId: defaultFieldId }));
    }
  }, [logbookSession, logbookFormValues.fieldId]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const filteredCrops = useMemo(() => {
    const normalizedSearch = cropSearch.trim().toLowerCase();
    if (!normalizedSearch) return crops;

    return crops.filter((crop) => {
      const nameMatch = crop.name.toLowerCase().includes(normalizedSearch);
      const statusMatch = crop.status.toLowerCase().includes(normalizedSearch);
      return nameMatch || statusMatch;
    });
  }, [crops, cropSearch]);

  const filteredCycles = useMemo(() => {
    const normalizedSearch = cycleSearch.trim().toLowerCase();

    return cycles.filter((cycle) => {
      const mode = normalizeCycleListMode(cycle.status);
      const modeMatch = cycleListMode === 'all' || mode === cycleListMode;
      if (!modeMatch) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        cycle.fieldName ?? '',
        cycle.lotName ?? '',
        cycle.cropName ?? '',
        cycle.status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [cycles, cycleListMode, cycleSearch]);

  const activeFields = useMemo(
    () => fields.filter((field) => isActiveLifecycleStatus(field.status)),
    [fields],
  );

  const activeFieldIds = useMemo(
    () => new Set(activeFields.map((field) => field.id)),
    [activeFields],
  );

  const activeLots = useMemo(
    () =>
      lots.filter((lot) => isActiveLifecycleStatus(lot.status) && activeFieldIds.has(lot.fieldId)),
    [activeFieldIds, lots],
  );

  const activeCrops = useMemo(
    () => crops.filter((crop) => isActiveLifecycleStatus(crop.status)),
    [crops],
  );

  const cropHasActiveCycle = useMemo(() => {
    const cropIds = new Set<string>();
    for (const cycle of cycles) {
      if (!cycle.cropId) continue;
      if (!isActiveLifecycleStatus(cycle.status)) continue;
      cropIds.add(cycle.cropId);
    }
    return cropIds;
  }, [cycles]);

  const categoryOptions = useMemo(() => {
    if (!logbookSession?.categories.length) {
      return LOGBOOK_CATEGORY_OPTIONS.map((option) => ({ label: option.label, value: option.value }));
    }

    return logbookSession.categories.map((category) => ({
      label: category.label,
      value: category.key,
    }));
  }, [logbookSession]);

  const currentCategory = useMemo(() => {
    if (!logbookSession?.categories.length) {
      return null;
    }

    return (
      logbookSession.categories.find((category) => category.key === logbookFormValues.category) ?? null
    );
  }, [logbookSession, logbookFormValues.category]);

  const entityOptions = useMemo(
    () =>
      toEntityOptions(
        currentCategory,
        logbookSession?.entitiesByCategory ?? {},
      ),
    [currentCategory, logbookSession],
  );

  const familyOptions = useMemo(() => {
    const fromCategory = currentCategory?.families ?? [];
    if (fromCategory.length > 0) {
      return fromCategory.map((item) => ({ label: item.label, value: item.key }));
    }

    if (!logbookPracticeCatalog) {
      return LOGBOOK_FAMILY_OPTIONS.map((item) => ({ label: item.label, value: item.value }));
    }

    return Object.keys(logbookPracticeCatalog.practicesByFamily).map((family) => ({
      label: family.replaceAll('_', ' '),
      value: family,
    }));
  }, [currentCategory, logbookPracticeCatalog]);

  const practiceOptions = useMemo(() => {
    if (!logbookPracticeCatalog || !logbookFormValues.family) return [];

    return (logbookPracticeCatalog.practicesByFamily[logbookFormValues.family] ?? []).map((practice) => ({
      label: practice.label,
      value: practice.id,
    }));
  }, [logbookPracticeCatalog, logbookFormValues.family]);

  const cycleFieldOptions = useMemo(
    () =>
      activeFields.map((field) => ({
        label: field.name,
        value: field.id,
      })),
    [activeFields],
  );

  const lotOptions = useMemo(() => {
    if (!cycleFormValues.fieldId) {
      return activeLots.map((lot) => ({
        label: `${lot.name} (${lot.fieldName ?? lot.fieldId})`,
        value: lot.id,
      }));
    }

    return activeLots
      .filter((lot) => lot.fieldId === cycleFormValues.fieldId)
      .map((lot) => ({ label: lot.name, value: lot.id }));
  }, [activeLots, cycleFormValues.fieldId]);

  const cropOptions = useMemo(
    () =>
      activeCrops
        .filter((crop) => !cycleFormValues.fieldId || !crop.fieldId || crop.fieldId === cycleFormValues.fieldId)
        .map((crop) => ({
          label: crop.name,
          value: crop.id,
        })),
    [activeCrops, cycleFormValues.fieldId],
  );

  useEffect(() => {
    if (!cycleFormValues.lotId) return;
    if (lotOptions.some((option) => option.value === cycleFormValues.lotId)) return;

    setCycleFormValues((current) => ({
      ...current,
      lotId: '',
    }));
  }, [cycleFormValues.lotId, lotOptions]);

  useEffect(() => {
    if (!cycleFormValues.cropId) return;
    if (cropOptions.some((option) => option.value === cycleFormValues.cropId)) return;

    setCycleFormValues((current) => ({
      ...current,
      cropId: '',
    }));
  }, [cropOptions, cycleFormValues.cropId]);

  function openCropCreateSheet() {
    setCropFormMode('create');
    setEditingCrop(null);
    setCropFormValues(toCropFormValues());
    cropFormValidation.reset();
    setCropFormVisible(true);
  }

  function openCropEditSheet(crop: CropSummary) {
    setCropFormMode('edit');
    setEditingCrop(crop);
    setCropFormValues(toCropFormValues(crop));
    cropFormValidation.reset();
    setCropFormVisible(true);
  }

  function closeCropSheet() {
    setCropFormVisible(false);
    setEditingCrop(null);
    setCropFormValues(toCropFormValues());
    cropFormValidation.reset();
  }

  async function submitCropForm() {
    const cropName = cropFormValues.cropName.trim();
    const valid = cropFormValidation.validate([
      {
        field: 'cropName',
        message: 'Crop name is required.',
        isValid: cropName.length > 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const payload = {
      payload: {
        crop_name: cropName,
        crop_variety: cropFormValues.cropVariety.trim() || null,
        notes: cropFormValues.notes.trim() || null,
      },
    };

    try {
      if (cropFormMode === 'create') {
        await createCrop(payload);
        showToast({ message: 'Crop created.', variant: 'success' });
      } else if (editingCrop) {
        await updateCrop(editingCrop.id, payload);
        showToast({ message: 'Crop updated.', variant: 'success' });
      }

      closeCropSheet();
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Crop mutation failed.'),
        variant: 'error',
      });
    }
  }

  async function submitCropStatusAction() {
    if (!cropActionTarget || !pendingCropStatusAction) return;

    try {
      await updateCropStatus(cropActionTarget.id, { status: pendingCropStatusAction });
      showToast({
        message:
          pendingCropStatusAction === 'inactive' ? 'Crop marked inactive.' : 'Crop marked active.',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Crop status update failed.'),
        variant: 'error',
      });
    } finally {
      setPendingCropStatusAction(null);
      setCropActionTarget(null);
    }
  }

  function openCycleCreateSheet() {
    setCycleFormValues(toCycleFormValues());
    cycleFormValidation.reset();
    setCycleFormVisible(true);
  }

  function closeCycleCreateSheet() {
    setCycleFormVisible(false);
    setCycleFormValues(toCycleFormValues());
    cycleFormValidation.reset();
  }

  async function submitCycleCreate() {
    const valid = cycleFormValidation.validate([
      {
        field: 'fieldId',
        message: 'Field is required.',
        isValid: Boolean(cycleFormValues.fieldId),
      },
      {
        field: 'lotId',
        message: 'Lot is required.',
        isValid: Boolean(cycleFormValues.lotId),
      },
      {
        field: 'cropId',
        message: 'Crop is required.',
        isValid: Boolean(cycleFormValues.cropId),
      },
      {
        field: 'startDate',
        message: 'Start date is required.',
        isValid: Boolean(cycleFormValues.startDate),
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const selectedField = activeFields.find((field) => field.id === cycleFormValues.fieldId) ?? null;
    if (!selectedField) {
      showToast({ message: 'Select an active field before creating a production cycle.', variant: 'error' });
      return;
    }

    const selectedLot = activeLots.find((lot) => lot.id === cycleFormValues.lotId) ?? null;
    if (!selectedLot) {
      showToast({ message: 'Select an active lot before creating a production cycle.', variant: 'error' });
      return;
    }

    if (selectedLot.fieldId !== selectedField.id) {
      showToast({
        message: 'Selected lot does not belong to the selected field',
        variant: 'error',
      });
      return;
    }

    const selectedCrop = activeCrops.find((crop) => crop.id === cycleFormValues.cropId) ?? null;
    if (!selectedCrop) {
      showToast({ message: 'Select an active crop before creating a production cycle.', variant: 'error' });
      return;
    }

    if (selectedCrop.fieldId && selectedCrop.fieldId !== selectedField.id) {
      showToast({
        message: 'Selected crop does not belong to the selected field',
        variant: 'error',
      });
      return;
    }

    try {
      await createProductionCycle({
        field_id: cycleFormValues.fieldId,
        lot_id: cycleFormValues.lotId,
        crop_id: cycleFormValues.cropId,
        start_date: cycleFormValues.startDate,
        notes: cycleFormValues.notes.trim() || null,
      });
      showToast({ message: 'Production cycle created.', variant: 'success' });
      closeCycleCreateSheet();
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Production cycle create failed.'),
        variant: 'error',
      });
    }
  }

  function openCycleNotesSheet(cycle: ProductionCycleSummary) {
    setCycleActionTarget(cycle);
    setCycleNotesText(cycle.notes ?? '');
    setCycleNotesVisible(true);
  }

  function closeCycleNotesSheet() {
    setCycleNotesVisible(false);
    setCycleNotesText('');
    setCycleActionTarget(null);
  }

  async function submitCycleNotes() {
    if (!cycleActionTarget) return;

    try {
      await updateProductionCycleNotes(cycleActionTarget.id, {
        notes: cycleNotesText.trim() || null,
      });
      showToast({ message: 'Cycle notes updated.', variant: 'success' });
      closeCycleNotesSheet();
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Cycle notes update failed.'),
        variant: 'error',
      });
    }
  }

  function openCycleCloseSheet(cycle: ProductionCycleSummary) {
    setCycleActionTarget(cycle);
    setCycleCloseValues(toCycleCloseFormValues(cycle));
    setCycleCloseVisible(true);
  }

  function closeCycleCloseSheet() {
    setCycleCloseVisible(false);
    setCycleCloseValues(toCycleCloseFormValues());
    setCycleActionTarget(null);
    cycleCloseFormValidation.reset();
  }

  async function submitCycleClose() {
    if (!cycleActionTarget) return;
    const valid = cycleCloseFormValidation.validate([
      {
        field: 'endDate',
        message: 'End date is required.',
        isValid: Boolean(cycleCloseValues.endDate),
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    try {
      await closeProductionCycle(cycleActionTarget.id, {
        end_date: cycleCloseValues.endDate,
        notes: cycleCloseValues.notes.trim() || null,
      });
      showToast({ message: 'Production cycle closed.', variant: 'success' });
      closeCycleCloseSheet();
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Production cycle close failed.'),
        variant: 'error',
      });
    }
  }

  function openCycleOperations(cycle: ProductionCycleSummary) {
    setOperationsCycle(cycle);
    setOperationsVisible(true);
  }

  function closeCycleOperations() {
    setOperationsVisible(false);
    setOperationsCycle(null);
    setOperationActionTarget(null);
  }

  function openOperationCreateSheet() {
    setOperationFormMode('create');
    setEditingOperation(null);
    setOperationFormValues(toOperationFormValues());
    operationFormValidation.reset();
    setOperationFormVisible(true);
  }

  function openOperationEditSheet(operation: ProductionCycleOperationSummary) {
    setOperationFormMode('edit');
    setEditingOperation(operation);
    setOperationFormValues(toOperationFormValues(operation));
    operationFormValidation.reset();
    setOperationFormVisible(true);
  }

  function closeOperationFormSheet() {
    setOperationFormVisible(false);
    setEditingOperation(null);
    setOperationFormValues(toOperationFormValues());
    operationFormValidation.reset();
  }

  async function submitOperationForm() {
    if (!operationsCycle) return;

    const costNumber = Number.parseFloat(operationFormValues.cost);
    const valid = operationFormValidation.validate([
      {
        field: 'date',
        message: 'Operation date is required.',
        isValid: Boolean(operationFormValues.date),
      },
      {
        field: 'type',
        message: 'Operation type is required.',
        isValid: Boolean(operationFormValues.type),
      },
      {
        field: 'cost',
        message: 'Operation cost must be a valid non-negative number.',
        isValid: Number.isFinite(costNumber) && costNumber >= 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    try {
      if (operationFormMode === 'create') {
        await createProductionCycleOperation(operationsCycle.id, {
          date: operationFormValues.date,
          type: operationFormValues.type,
          cost: costNumber,
          notes: operationFormValues.notes.trim() || null,
        });
        showToast({ message: 'Operation created.', variant: 'success' });
      } else if (editingOperation) {
        await updateProductionCycleOperation(editingOperation.id, {
          date: operationFormValues.date,
          type: operationFormValues.type,
          cost: costNumber,
          notes: operationFormValues.notes.trim() || null,
        });
        showToast({ message: 'Operation updated.', variant: 'success' });
      }

      closeOperationFormSheet();
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Operation mutation failed.'),
        variant: 'error',
      });
    }
  }

  async function confirmDeleteOperation() {
    if (!deletingOperation) return;

    try {
      const deleted = await deleteProductionCycleOperation(deletingOperation.id);
      if (!deleted) {
        showToast({ message: 'Operation was not deleted by backend.', variant: 'info' });
      } else {
        showToast({ message: 'Operation deleted.', variant: 'success' });
      }
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Operation delete failed.'),
        variant: 'error',
      });
    } finally {
      setDeletingOperation(null);
    }
  }

  async function submitLogbookForm() {
    if (!logbookFormValues.fieldId || !logbookFormValues.entityId || !logbookFormValues.date) {
      showToast({ message: 'Field, entity, and date are required for logbook submit.', variant: 'error' });
      return;
    }

    let payloadObject: Record<string, unknown>;
    try {
      const parsed = JSON.parse(logbookFormValues.payloadText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Payload must be a JSON object.');
      }
      payloadObject = parsed as Record<string, unknown>;
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Payload must be valid JSON.'),
        variant: 'error',
      });
      return;
    }

    try {
      await submitLogbook({
        fieldId: logbookFormValues.fieldId,
        date: logbookFormValues.date,
        category: logbookFormValues.category,
        entityType: logbookFormValues.entityType,
        entityId: logbookFormValues.entityId,
        family: toSubmitFamily(logbookFormValues.family),
        practiceId: logbookFormValues.practiceId || undefined,
        clientSessionId: 'mobile-phase11',
        payload: payloadObject,
      });

      showToast({ message: 'Logbook record submitted.', variant: 'success' });
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Logbook submit failed.'),
        variant: 'error',
      });
    }
  }

  function onPressPrimaryAction() {
    if (activeTab === 'crops') {
      openCropCreateSheet();
      return;
    }

    if (activeTab === 'cycles') {
      openCycleCreateSheet();
      return;
    }

    void submitLogbookForm();
  }

  function renderCropsTab() {
    return (
      <>
        <AppCard>
          <FilterBar
            searchValue={cropSearch}
            onSearchChange={setCropSearch}
            searchPlaceholder="Search crops"
          />
        </AppCard>

        <AppCard>
          <AppSection
            title="Crop records"
            description="Create, update, and status-manage crop planning records."
          >
            {isLoading ? (
              <>
                <Skeleton height={56} />
                <Skeleton height={56} />
                <Skeleton height={56} />
              </>
            ) : errorMessage ? (
              <ErrorState message={errorMessage} onRetry={() => void refresh()} />
            ) : filteredCrops.length === 0 ? (
              <EmptyState
                title="No crops yet"
                message="Create your first crop planning record to continue."
                actionLabel="Create crop"
                onAction={openCropCreateSheet}
              />
            ) : (
              <PullToRefreshContainer
                refreshing={isRefreshing}
                onRefresh={() => void refresh()}
              >
                <View style={styles.rows}>
                  {filteredCrops.map((crop) => (
                    <AppCard key={crop.id}>
                      <AppListItem
                        title={crop.name}
                        description={crop.variety ?? 'No variety set'}
                        leftIcon="sprout"
                        onPress={() => setCropActionTarget(crop)}
                      />
                      <View style={styles.rowMeta}>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaText}>Status</Text>
                          <AppBadge value={statusLabel(crop.status)} variant={statusVariant(crop.status)} />
                        </View>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaText}>Updated</Text>
                          <AppBadge value={crop.updatedAt.slice(0, 10)} variant="neutral" />
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
          pageSize={Math.max(filteredCrops.length, 1)}
          totalItems={filteredCrops.length}
          onPageChange={() => undefined}
        />
      </>
    );
  }

  function renderCyclesTab() {
    return (
      <>
        <AppCard>
          <FilterBar
            searchValue={cycleSearch}
            onSearchChange={setCycleSearch}
            searchPlaceholder="Search cycles"
          >
            <AppTabs
              value={cycleListMode}
              onValueChange={(value) => setCycleListMode(value as CycleListMode)}
              tabs={CYCLE_LIST_MODE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </FilterBar>
        </AppCard>

        <AppCard>
          <AppSection
            title="Production cycles"
            description="Create cycles, manage notes, close lifecycles, and track operations."
          >
            {isLoading ? (
              <>
                <Skeleton height={56} />
                <Skeleton height={56} />
                <Skeleton height={56} />
              </>
            ) : errorMessage ? (
              <ErrorState message={errorMessage} onRetry={() => void refresh()} />
            ) : filteredCycles.length === 0 ? (
              <EmptyState
                title="No production cycles"
                message="Create a cycle to start operation tracking."
                actionLabel="Create cycle"
                onAction={openCycleCreateSheet}
              />
            ) : (
              <PullToRefreshContainer
                refreshing={isRefreshing}
                onRefresh={() => void refresh()}
              >
                <View style={styles.rows}>
                  {filteredCycles.map((cycle) => (
                    <AppCard key={cycle.id}>
                      <AppListItem
                        title={cycle.cropName ?? cycle.cropId}
                        description={formatCycleMeta(cycle)}
                        leftIcon="chart-timeline-variant"
                        onPress={() => setCycleActionTarget(cycle)}
                      />
                      <View style={styles.rowMeta}>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaText}>Status</Text>
                          <AppBadge value={statusLabel(cycle.status)} variant={statusVariant(cycle.status)} />
                        </View>
                        <View style={styles.metaGroup}>
                          <Text style={styles.metaText}>Cost</Text>
                          <AppBadge value={cycle.actualCost ?? cycle.estimatedCost ?? 0} variant="accent" />
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
          pageSize={Math.max(filteredCycles.length, 1)}
          totalItems={filteredCycles.length}
          onPageChange={() => undefined}
        />
      </>
    );
  }

  function renderLogbookTab() {
    const fieldsCount = logbookSession?.fields.length ?? 0;
    const categoriesCount = logbookSession?.categories.length ?? 0;
    const practicesCount = logbookPracticeCatalog?.totalPractices ?? 0;

    return (
      <>
        <AppCard>
          <AppSection
            title="Logbook context"
            description="Session categories, entities, and practice catalog for validated activity submit."
          >
            {isLoading ? (
              <>
                <Skeleton height={56} />
                <Skeleton height={56} />
              </>
            ) : errorMessage ? (
              <ErrorState message={errorMessage} onRetry={() => void refreshLogbook()} />
            ) : !logbookSession ? (
              <EmptyState
                title="Logbook session missing"
                message="Unable to load logbook session context from backend."
                actionLabel="Retry"
                onAction={() => void refreshLogbook()}
              />
            ) : (
              <View style={styles.logbookMetrics}>
                <AppBadge value={`Fields ${fieldsCount}`} variant="neutral" />
                <AppBadge value={`Categories ${categoriesCount}`} variant="neutral" />
                <AppBadge value={`Practices ${practicesCount}`} variant="accent" />
              </View>
            )}
          </AppSection>
        </AppCard>

        <AppCard>
          <AppSection title="Logbook submit" description="Submit validated logbook activity payloads.">
            <FormField label="Field" required>
              <AppSelect
                value={logbookFormValues.fieldId}
                onChange={(value) =>
                  setLogbookFormValues((current) => ({
                    ...current,
                    fieldId: value,
                    entityId: '',
                    practiceId: '',
                  }))
                }
                options={(logbookSession?.fields ?? []).map((field) => ({
                  label: field.name,
                  value: field.id,
                }))}
                label="Select field"
              />
            </FormField>

            <FormField label="Date" required>
              <AppDatePicker
                value={logbookFormValues.date}
                onChange={(value) =>
                  setLogbookFormValues((current) => ({
                    ...current,
                    date: value ?? new Date().toISOString().slice(0, 10),
                    practiceId: '',
                  }))
                }
                label="Logbook date"
              />
            </FormField>

            <FormField label="Category" required>
              <AppSelect
                value={logbookFormValues.category}
                onChange={(value) => {
                  const nextCategory = value;
                  const sessionCategory =
                    logbookSession?.categories.find((category) => category.key === nextCategory) ?? null;
                  const entityType = sessionCategory?.entityType ?? logbookFormValues.entityType;

                  setLogbookFormValues((current) => ({
                    ...current,
                    category: nextCategory as LogbookFormValues['category'],
                    entityType: entityType as LogbookFormValues['entityType'],
                    family: sessionCategory?.families[0]?.key ?? '',
                    entityId: '',
                    practiceId: '',
                  }));
                }}
                options={categoryOptions}
                label="Select category"
              />
            </FormField>

            <FormField label="Entity type" required>
              <AppSelect
                value={logbookFormValues.entityType}
                onChange={(value) =>
                  setLogbookFormValues((current) => ({
                    ...current,
                    entityType: value as LogbookFormValues['entityType'],
                  }))
                }
                options={LOGBOOK_ENTITY_TYPE_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                label="Entity type"
              />
            </FormField>

            <FormField label="Entity" required>
              <AppSelect
                value={logbookFormValues.entityId}
                onChange={(value) =>
                  setLogbookFormValues((current) => ({
                    ...current,
                    entityId: value,
                  }))
                }
                options={entityOptions}
                label="Select entity"
              />
            </FormField>

            <FormField label="Family">
              <AppSelect
                value={logbookFormValues.family}
                onChange={(value) =>
                  setLogbookFormValues((current) => ({
                    ...current,
                    family: value,
                    practiceId: '',
                  }))
                }
                options={familyOptions}
                label="Select family"
              />
            </FormField>

            <FormField label="Practice">
              <AppSelect
                value={logbookFormValues.practiceId}
                onChange={(value) =>
                  setLogbookFormValues((current) => ({
                    ...current,
                    practiceId: value,
                  }))
                }
                options={practiceOptions}
                label="Select practice"
              />
            </FormField>

            <FormField label="Payload JSON" required>
              <AppTextArea
                value={logbookFormValues.payloadText}
                onChangeText={(value) =>
                  setLogbookFormValues((current) => ({
                    ...current,
                    payloadText: value,
                  }))
                }
                placeholder={"{\n  \"notes\": \"\"\n}"}
                numberOfLines={8}
              />
            </FormField>

            {logbookPracticeLoading ? <Skeleton height={40} /> : null}
            {logbookPracticeErrorMessage ? (
              <ErrorState
                title="Practice catalog unavailable"
                message={logbookPracticeErrorMessage}
                onRetry={() => void refreshLogbook()}
              />
            ) : null}

            {latestLogbookResult ? (
              <AppCard>
                <AppListItem
                  title={`Last submit: ${latestLogbookResult.status}`}
                  description={`Record ${latestLogbookResult.recordId ?? 'n/a'} • ${latestLogbookResult.category ?? 'n/a'}`}
                  leftIcon="check-decagram-outline"
                />
              </AppCard>
            ) : null}
          </AppSection>
        </AppCard>
      </>
    );
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="Crops, Cycles, and Logbook"
        subtitle="Phase 11 operations scope for crop planning and production lifecycle tracking."
        rightAction={
          <HeaderActionGroup>
            <NotificationHeaderButton testID="crops-header-notifications" />
          </HeaderActionGroup>
        }
      />

      <AppTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Phase11Tab)}
        tabs={[
          { value: 'crops', label: 'Crops' },
          { value: 'cycles', label: 'Cycles' },
          { value: 'logbook', label: 'Logbook' },
        ]}
      />

      <View style={styles.topActions}>
        <View style={styles.primaryAction}>
          <AppButton
            label={
              activeTab === 'crops'
                ? 'Create Crop'
                : activeTab === 'cycles'
                  ? 'Create Cycle'
                  : 'Submit Logbook'
            }
            onPress={onPressPrimaryAction}
            loading={isMutating}
            disabled={isMutating}
          />
        </View>
        <View style={styles.secondaryAction}>
          <AppButton
            label="Refresh"
            mode="outlined"
            tone="neutral"
            onPress={() => void refresh()}
            loading={isRefreshing}
          />
        </View>
      </View>

      {activeTab === 'crops' ? renderCropsTab() : null}
      {activeTab === 'cycles' ? renderCyclesTab() : null}
      {activeTab === 'logbook' ? renderLogbookTab() : null}

      <BottomSheet
        visible={cropFormVisible}
        onDismiss={closeCropSheet}
        scrollViewRef={cropFormScrollRef}
        title={cropFormMode === 'create' ? 'Create Crop' : 'Edit Crop'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeCropSheet} />
            <AppButton
              label={cropFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitCropForm()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormValidationProvider value={cropFormValidation.providerValue}>
          <FormField label="Crop name" name="cropName" required>
            <AppInput
              value={cropFormValues.cropName}
              onChangeText={(value) => {
                cropFormValidation.clearFieldError('cropName');
                setCropFormValues((current) => ({
                  ...current,
                  cropName: value,
                }));
              }}
              placeholder="Crop name"
            />
          </FormField>

          <FormField label="Variety">
            <AppInput
              value={cropFormValues.cropVariety}
              onChangeText={(value) =>
                setCropFormValues((current) => ({
                  ...current,
                  cropVariety: value,
                }))
              }
              placeholder="Optional variety"
            />
          </FormField>

          <FormField label="Notes">
            <AppTextArea
              value={cropFormValues.notes}
              onChangeText={(value) =>
                setCropFormValues((current) => ({
                  ...current,
                  notes: value,
                }))
              }
              placeholder="Optional notes"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={cycleFormVisible}
        onDismiss={closeCycleCreateSheet}
        scrollViewRef={cycleFormScrollRef}
        title="Create Production Cycle"
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeCycleCreateSheet} />
            <AppButton
              label="Create"
              onPress={() => void submitCycleCreate()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormValidationProvider value={cycleFormValidation.providerValue}>
          <FormField label="Field" name="fieldId" required>
            <AppSelect
              testID="cycle-form-field-select"
              value={cycleFormValues.fieldId}
              onChange={(value) => {
                cycleFormValidation.clearFieldError('fieldId');
                setCycleFormValues((current) => ({
                  ...current,
                  fieldId: value,
                  lotId: '',
                  cropId: '',
                }));
              }}
              options={cycleFieldOptions}
              label="Select field"
            />
          </FormField>

          <FormField label="Lot" name="lotId" required>
            <AppSelect
              testID="cycle-form-lot-select"
              value={cycleFormValues.lotId}
              onChange={(value) => {
                cycleFormValidation.clearFieldError('lotId');
                setCycleFormValues((current) => ({
                  ...current,
                  lotId: value,
                }));
              }}
              options={lotOptions}
              label="Select lot"
            />
          </FormField>

          <FormField label="Crop" name="cropId" required>
            <AppSelect
              testID="cycle-form-crop-select"
              value={cycleFormValues.cropId}
              onChange={(value) => {
                cycleFormValidation.clearFieldError('cropId');
                setCycleFormValues((current) => ({
                  ...current,
                  cropId: value,
                }));
              }}
              options={cropOptions}
              label="Select crop"
            />
          </FormField>

          <FormField label="Start date" name="startDate" required>
            <AppDatePicker
              value={cycleFormValues.startDate}
              onChange={(value) => {
                cycleFormValidation.clearFieldError('startDate');
                setCycleFormValues((current) => ({
                  ...current,
                  startDate: value ?? '',
                }));
              }}
              label="Cycle start date"
            />
          </FormField>

          <FormField label="Notes">
            <AppTextArea
              value={cycleFormValues.notes}
              onChangeText={(value) =>
                setCycleFormValues((current) => ({
                  ...current,
                  notes: value,
                }))
              }
              placeholder="Optional cycle notes"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={cycleCloseVisible}
        onDismiss={closeCycleCloseSheet}
        scrollViewRef={cycleCloseFormScrollRef}
        title={cycleActionTarget ? `Close Cycle: ${cycleActionTarget.cropName ?? cycleActionTarget.id}` : 'Close Cycle'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeCycleCloseSheet} />
            <AppButton
              label="Close cycle"
              tone="destructive"
              onPress={() => void submitCycleClose()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormValidationProvider value={cycleCloseFormValidation.providerValue}>
          <FormField label="End date" name="endDate" required>
            <AppDatePicker
              value={cycleCloseValues.endDate}
              onChange={(value) => {
                cycleCloseFormValidation.clearFieldError('endDate');
                setCycleCloseValues((current) => ({
                  ...current,
                  endDate: value ?? '',
                }));
              }}
              label="Cycle end date"
            />
          </FormField>

          <FormField label="Close notes">
            <AppTextArea
              value={cycleCloseValues.notes}
              onChangeText={(value) =>
                setCycleCloseValues((current) => ({
                  ...current,
                  notes: value,
                }))
              }
              placeholder="Optional close notes"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      <BottomSheet
        visible={cycleNotesVisible}
        onDismiss={closeCycleNotesSheet}
        title={cycleActionTarget ? `Update Notes: ${cycleActionTarget.cropName ?? cycleActionTarget.id}` : 'Update Notes'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeCycleNotesSheet} />
            <AppButton
              label="Save notes"
              onPress={() => void submitCycleNotes()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormField label="Notes">
          <AppTextArea
            value={cycleNotesText}
            onChangeText={setCycleNotesText}
            placeholder="Cycle notes"
            numberOfLines={6}
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={operationsVisible}
        onDismiss={closeCycleOperations}
        title={operationsCycle ? `Cycle operations: ${operationsCycle.cropName ?? operationsCycle.id}` : 'Cycle operations'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Refresh" mode="outlined" tone="neutral" onPress={() => void refreshOperations()} />
            <AppButton label="Add operation" onPress={openOperationCreateSheet} />
          </View>
        }
      >
        {operationsLoading ? (
          <>
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={48} />
          </>
        ) : operationsErrorMessage ? (
          <ErrorState message={operationsErrorMessage} onRetry={() => void refreshOperations()} />
        ) : cycleOperations.length === 0 ? (
          <EmptyState
            title="No operations"
            message="Create an operation to start recording cycle activity."
            actionLabel="Add operation"
            onAction={openOperationCreateSheet}
          />
        ) : (
          <View style={styles.rows}>
            {cycleOperations.map((operation) => (
              <AppCard key={operation.id}>
                <AppListItem
                  title={operation.type}
                  description={`${operation.date.slice(0, 10)} • Cost ${operation.cost}`}
                  leftIcon="hammer-wrench"
                  onPress={() => setOperationActionTarget(operation)}
                />
                <View style={styles.rowMeta}>
                  <View style={styles.metaGroup}>
                    <Text style={styles.metaText}>Status</Text>
                    <AppBadge value={statusLabel(operation.status)} variant={statusVariant(operation.status)} />
                  </View>
                  <View style={styles.metaGroup}>
                    <Text style={styles.metaText}>Updated</Text>
                    <AppBadge value={operation.updatedAt.slice(0, 10)} variant="neutral" />
                  </View>
                </View>
              </AppCard>
            ))}
          </View>
        )}
      </BottomSheet>

      <BottomSheet
        visible={operationFormVisible}
        onDismiss={closeOperationFormSheet}
        scrollViewRef={operationFormScrollRef}
        title={operationFormMode === 'create' ? 'Create operation' : 'Edit operation'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeOperationFormSheet} />
            <AppButton
              label={operationFormMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitOperationForm()}
              loading={isMutating}
              disabled={isMutating}
            />
          </View>
        }
      >
        <FormValidationProvider value={operationFormValidation.providerValue}>
          <FormField label="Operation date" name="date" required>
            <AppDatePicker
              value={operationFormValues.date}
              onChange={(value) => {
                operationFormValidation.clearFieldError('date');
                setOperationFormValues((current) => ({
                  ...current,
                  date: value ?? '',
                }));
              }}
              label="Operation date"
            />
          </FormField>

          <FormField label="Operation type" name="type" required>
            <AppSelect
              value={operationFormValues.type}
              onChange={(value) => {
                operationFormValidation.clearFieldError('type');
                setOperationFormValues((current) => ({
                  ...current,
                  type: value === 'PLANTING' ? 'PLANTING' : 'LAND_PREP',
                }));
              }}
              options={OPERATION_TYPE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              label="Operation type"
            />
          </FormField>

          <FormField label="Cost" name="cost" required>
            <AppInput
              value={operationFormValues.cost}
              onChangeText={(value) => {
                operationFormValidation.clearFieldError('cost');
                setOperationFormValues((current) => ({
                  ...current,
                  cost: value,
                }));
              }}
              placeholder="0"
            />
          </FormField>

          <FormField label="Notes">
            <AppTextArea
              value={operationFormValues.notes}
              onChangeText={(value) =>
                setOperationFormValues((current) => ({
                  ...current,
                  notes: value,
                }))
              }
              placeholder="Optional operation notes"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      <ActionSheet
        visible={Boolean(cropActionTarget) && !pendingCropStatusAction}
        onDismiss={() => setCropActionTarget(null)}
        title={cropActionTarget?.name}
        message="Choose an action for this crop."
        actions={
          cropActionTarget
            ? [
                {
                  key: 'edit',
                  label: 'Edit crop',
                  onPress: () => openCropEditSheet(cropActionTarget),
                },
                ...(!isActiveLifecycleStatus(cropActionTarget.status) ||
                !cropHasActiveCycle.has(cropActionTarget.id)
                  ? [
                      {
                        key: 'status',
                        label: isInactiveLifecycleStatus(cropActionTarget.status)
                          ? 'Mark active'
                          : 'Mark inactive',
                        destructive: !isInactiveLifecycleStatus(cropActionTarget.status),
                        onPress: () =>
                          setPendingCropStatusAction(
                            isInactiveLifecycleStatus(cropActionTarget.status) ? 'active' : 'inactive',
                          ),
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(cropActionTarget) && Boolean(pendingCropStatusAction)}
        title={pendingCropStatusAction === 'inactive' ? 'Mark crop inactive?' : 'Mark crop active?'}
        message={
          pendingCropStatusAction === 'inactive'
            ? 'The crop will be marked inactive for planning access.'
            : 'The crop will be marked active for planning access.'
        }
        confirmLabel={pendingCropStatusAction === 'inactive' ? 'Mark inactive' : 'Mark active'}
        confirmTone={pendingCropStatusAction === 'inactive' ? 'destructive' : 'primary'}
        onCancel={() => setPendingCropStatusAction(null)}
        onConfirm={() => void submitCropStatusAction()}
        confirmLoading={isMutating}
      />

      <ActionSheet
        visible={Boolean(cycleActionTarget) && !cycleCloseVisible && !cycleNotesVisible}
        onDismiss={() => setCycleActionTarget(null)}
        title={cycleActionTarget?.cropName ?? cycleActionTarget?.id}
        message="Choose an action for this cycle."
        actions={
          cycleActionTarget
            ? [
                {
                  key: 'operations',
                  label: 'View operations',
                  onPress: () => openCycleOperations(cycleActionTarget),
                },
                {
                  key: 'notes',
                  label: 'Update notes',
                  onPress: () => openCycleNotesSheet(cycleActionTarget),
                },
                {
                  key: 'close',
                  label: 'Close cycle',
                  destructive: true,
                  onPress: () => openCycleCloseSheet(cycleActionTarget),
                },
              ]
            : []
        }
      />

      <ActionSheet
        visible={Boolean(operationActionTarget)}
        onDismiss={() => setOperationActionTarget(null)}
        title={operationActionTarget?.type}
        message="Choose an action for this operation."
        actions={
          operationActionTarget
            ? [
                {
                  key: 'edit',
                  label: 'Edit operation',
                  onPress: () => openOperationEditSheet(operationActionTarget),
                },
                {
                  key: 'delete',
                  label: 'Delete operation',
                  destructive: true,
                  onPress: () => setDeletingOperation(operationActionTarget),
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        visible={Boolean(deletingOperation)}
        title="Delete operation?"
        message="This operation record will be removed permanently."
        confirmLabel="Delete"
        confirmTone="destructive"
        onCancel={() => setDeletingOperation(null)}
        onConfirm={() => void confirmDeleteOperation()}
        confirmLoading={isMutating}
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
    minWidth: 120,
  },
  rows: {
    gap: spacing.sm,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: palette.mutedForeground,
    fontWeight: '600',
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  logbookMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
