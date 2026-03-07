import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollView as ScrollViewRef,
} from 'react-native';
import { Icon, Text } from 'react-native-paper';
import type {
  CreateHarvestOperationRequest,
  CreateTreatmentOperationRequest,
  CropSummary,
  ProductionCycleOperationSummary,
  ProductionCycleSummary,
} from '../../../api/modules/crops';
import {
  ActionSheet,
  AlertStrip,
  AppButton,
  AppDatePicker,
  AppInput,
  AppScreen,
  AppSelect,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  DetailSectionCard,
  DotBadge,
  EmptyState,
  ErrorState,
  FormField,
  FormValidationProvider,
  HeaderIconButton,
  HeaderMenuButton,
  ModuleTabs,
  PillTabs,
  PullToRefreshContainer,
  SearchBar,
  SectionHeader,
  Skeleton,
  StatStrip,
  ListRow,
  SystemHeaderActions,
  useFormValidation,
  useToast,
  type QuickAction,
} from '../../../components';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { palette, radius, spacing, typography } from '../../../theme/tokens';
import {
  formatApiErrorMessage,
  isActiveLifecycleStatus,
  isInactiveLifecycleStatus,
} from '../../../utils/lifecycle';
import {
  CROP_LIST_MODE_OPTIONS,
  CYCLE_LIST_MODE_OPTIONS,
  OPERATION_TYPE_OPTIONS,
  normalizeCycleListMode,
  toCropFormValues,
  toCycleCloseFormValues,
  toCycleFormValues,
  toOperationFormValues,
  type CropFormMode,
  type CropFormValues,
  type CropListMode,
  type CycleCloseFormValues,
  type CycleFormValues,
  type CycleListMode,
  type OperationFormMode,
  type OperationFormValues,
} from '../contracts';
import {
  buildCropRowSubtitle,
  buildCycleRowSubtitle,
  formatCropStatusLabel,
  formatDomainAreaLabel,
  formatOperationFamilyLabel,
  groupCropPractices,
  matchesCropListMode,
  toCropRowIconVariant,
  toCropStatusBadgeVariant,
} from '../cropsPresentation';
import { useCropsModule } from '../useCropsModule.hook';
import { useAuthSession } from '../../../hooks/useAuthSession';
import { CropsCropDetailSheet } from './components/CropsCropDetailSheet.component';
import { CropsCycleDetailSheet } from './components/CropsCycleDetailSheet.component';
import { CropsFactRow } from './components/CropsFactRow.component';
import { HarvestOperationSheet } from './components/HarvestOperationSheet.component';
import { LogbookActivityForm } from './components/LogbookActivityForm.component';
import { TreatmentOperationSheet } from './components/TreatmentOperationSheet.component';

type Phase11Tab = 'crops' | 'cycles' | 'logbook';
type CropStatusAction = 'active' | 'inactive';

type Props = {
  initialTab?: Phase11Tab;
};

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function isCycleActionable(status: string): boolean {
  return normalizeCycleListMode(status) === 'active';
}

function SheetFooter({
  onCancel,
  onSubmit,
  label,
  loading,
  disabled,
  tone = 'primary',
}: {
  onCancel: () => void;
  onSubmit: () => void;
  label: string;
  loading: boolean;
  disabled: boolean;
  tone?: 'primary' | 'destructive';
}) {
  return (
    <View style={styles.sheetFooter}>
      <AppButton label="Cancel" mode="text" tone="neutral" onPress={onCancel} />
      <AppButton
        label={label}
        onPress={onSubmit}
        loading={loading}
        disabled={disabled}
        tone={tone}
      />
    </View>
  );
}

export function CropsScreen({ initialTab = 'crops' }: Props) {
  const { t } = useAppI18n();
  const { showToast } = useToast();
  const { session } = useAuthSession();
  const cropFormScrollRef = useRef<ScrollViewRef | null>(null);
  const cropFormValidation = useFormValidation<'cropName'>(cropFormScrollRef);
  const cycleFormScrollRef = useRef<ScrollViewRef | null>(null);
  const cycleFormValidation = useFormValidation<'fieldId' | 'lotId' | 'cropId' | 'startDate'>(
    cycleFormScrollRef,
  );
  const cycleCloseFormScrollRef = useRef<ScrollViewRef | null>(null);
  const cycleCloseFormValidation = useFormValidation<'endDate'>(cycleCloseFormScrollRef);
  const operationFormScrollRef = useRef<ScrollViewRef | null>(null);
  const operationFormValidation = useFormValidation<'date' | 'type' | 'cost'>(
    operationFormScrollRef,
  );

  const [activeTab, setActiveTab] = useState<Phase11Tab>(initialTab);
  const [cropSearch, setCropSearch] = useState('');
  const [cycleSearch, setCycleSearch] = useState('');
  const [cropListMode, setCropListMode] = useState<CropListMode>('active');
  const [cycleListMode, setCycleListMode] = useState<CycleListMode>('active');

  const [selectedCrop, setSelectedCrop] = useState<CropSummary | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<ProductionCycleSummary | null>(null);

  const [cropFormVisible, setCropFormVisible] = useState(false);
  const [cropFormMode, setCropFormMode] = useState<CropFormMode>('create');
  const [editingCrop, setEditingCrop] = useState<CropSummary | null>(null);
  const [cropFormValues, setCropFormValues] = useState<CropFormValues>(toCropFormValues());

  const [cropActionTarget, setCropActionTarget] = useState<CropSummary | null>(null);
  const [pendingCropStatusAction, setPendingCropStatusAction] =
    useState<CropStatusAction | null>(null);
  const [cropOperationsVisible, setCropOperationsVisible] = useState(false);
  const [selectedPracticeIds, setSelectedPracticeIds] = useState<string[]>([]);
  const [cropPracticesInitializedForCropId, setCropPracticesInitializedForCropId] =
    useState<string | null>(null);

  const [cycleFormVisible, setCycleFormVisible] = useState(false);
  const [cycleFormValues, setCycleFormValues] = useState<CycleFormValues>(toCycleFormValues());
  const [cycleCloseVisible, setCycleCloseVisible] = useState(false);
  const [cycleCloseValues, setCycleCloseValues] = useState<CycleCloseFormValues>(
    toCycleCloseFormValues(),
  );
  const [cycleNotesVisible, setCycleNotesVisible] = useState(false);
  const [cycleNotesText, setCycleNotesText] = useState('');

  const [operationFormVisible, setOperationFormVisible] = useState(false);
  const [operationFormMode, setOperationFormMode] = useState<OperationFormMode>('create');
  const [editingOperation, setEditingOperation] =
    useState<ProductionCycleOperationSummary | null>(null);
  const [operationActionTarget, setOperationActionTarget] =
    useState<ProductionCycleOperationSummary | null>(null);
  const [deletingOperation, setDeletingOperation] =
    useState<ProductionCycleOperationSummary | null>(null);
  const [operationFormValues, setOperationFormValues] = useState<OperationFormValues>(
    toOperationFormValues(),
  );
  const [treatmentSheetVisible, setTreatmentSheetVisible] = useState(false);
  const [harvestSheetVisible, setHarvestSheetVisible] = useState(false);
  const [logbookRefreshKey, setLogbookRefreshKey] = useState(0);

  const {
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
    selectedCropPractices,
    isLoading,
    isRefreshing,
    isMutating,
    cropGroupsLoading,
    operationsLoading,
    cropPracticesLoading,
    errorMessage,
    cropGroupsErrorMessage,
    operationsErrorMessage,
    cropPracticesErrorMessage,
    refresh,
    refreshOperations,
    refreshCropPractices,
    createCrop,
    updateCrop,
    updateCropStatus,
    replaceCropPracticeMappings,
    createProductionCycle,
    closeProductionCycle,
    updateProductionCycleNotes,
    createProductionCycleOperation,
    updateProductionCycleOperation,
    deleteProductionCycleOperation,
    createTreatmentOperation,
    createHarvestOperation,
  } = useCropsModule({
    selectedCycleId: selectedCycle?.id ?? null,
    selectedCropId: selectedCrop?.id ?? selectedCycle?.cropId ?? null,
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!cropOperationsVisible) {
      setCropPracticesInitializedForCropId((current) => (current === null ? current : null));
      setSelectedPracticeIds((current) => (current.length === 0 ? current : []));
      return;
    }

    const cropId = selectedCrop?.id ?? null;
    if (!cropId || cropPracticesLoading) {
      return;
    }

    if (cropPracticesInitializedForCropId === cropId) {
      return;
    }

    setSelectedPracticeIds(
      selectedCropPractices.filter((practice) => practice.enabled).map((practice) => practice.id),
    );
    setCropPracticesInitializedForCropId(cropId);
  }, [
    cropOperationsVisible,
    cropPracticesInitializedForCropId,
    cropPracticesLoading,
    selectedCrop,
    selectedCropPractices,
  ]);

  const fieldLabelById = useMemo(
    () => new Map(fields.map((field) => [field.id, field.name])),
    [fields],
  );

  const cropGroupLabelById = useMemo(
    () => new Map(cropGroups.map((group) => [group.id, group.name])),
    [cropGroups],
  );

  const cropGroupOptions = useMemo(
    () => [
      { label: 'Standalone operations', value: '' },
      ...cropGroups.map((group) => ({ label: group.name, value: group.id })),
    ],
    [cropGroups],
  );

  const filteredCrops = useMemo(() => {
    const normalizedSearch = cropSearch.trim().toLowerCase();

    return crops.filter((crop) => {
      if (!matchesCropListMode(crop.status, cropListMode)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const fieldLabel = crop.fieldId ? fieldLabelById.get(crop.fieldId) ?? '' : '';
      const cropGroupLabel = crop.cropGroupId ? cropGroupLabelById.get(crop.cropGroupId) ?? '' : '';
      const haystack = [crop.name, crop.variety ?? '', crop.status, fieldLabel, cropGroupLabel]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [cropGroupLabelById, cropListMode, cropSearch, crops, fieldLabelById]);

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
  }, [cycleListMode, cycleSearch, cycles]);

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

  const cropOperationalCount = useMemo(
    () => crops.filter((crop) => !isInactiveLifecycleStatus(crop.status)).length,
    [crops],
  );

  const cropInactiveCount = useMemo(
    () => crops.filter((crop) => isInactiveLifecycleStatus(crop.status)).length,
    [crops],
  );

  const groupedCropCount = useMemo(
    () => crops.filter((crop) => Boolean(crop.cropGroupId)).length,
    [crops],
  );

  const activeCycleCount = useMemo(
    () => cycles.filter((cycle) => normalizeCycleListMode(cycle.status) === 'active').length,
    [cycles],
  );
  const closedCycleCount = useMemo(
    () => cycles.filter((cycle) => normalizeCycleListMode(cycle.status) === 'closed').length,
    [cycles],
  );
  const inactiveCycleCount = useMemo(
    () => cycles.filter((cycle) => normalizeCycleListMode(cycle.status) === 'inactive').length,
    [cycles],
  );

  const currentUserId = session?.user.id ?? null;
  const currentManagedUser = useMemo(
    () => managedUsers.find((user) => user.userId === currentUserId) ?? null,
    [currentUserId, managedUsers],
  );
  const currentUserName =
    currentManagedUser?.fullName?.trim() ||
    currentManagedUser?.nickName?.trim() ||
    session?.user.email?.split('@')[0] ||
    'Worker';

  const treatmentPracticeOptions = useMemo(
    () =>
      selectedCropPractices.filter(
        (practice) => practice.enabled && practice.operationFamily === 'TREATMENT',
      ),
    [selectedCropPractices],
  );

  const harvestPracticeOptions = useMemo(
    () =>
      selectedCropPractices.filter(
        (practice) =>
          practice.enabled &&
          practice.operationFamily === 'HARVEST' &&
          String(practice.code || '').toLowerCase() !== 'main_harvest_pick',
      ),
    [selectedCropPractices],
  );

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

  const selectedCropGroupLabel = useMemo(
    () =>
      selectedCrop?.cropGroupId
        ? cropGroupLabelById.get(selectedCrop.cropGroupId) ?? undefined
        : undefined,
    [cropGroupLabelById, selectedCrop],
  );

  const cropPracticeSections = useMemo(() => {
    const visiblePractices = selectedCrop?.cropGroupId
      ? selectedCropPractices.filter((practice) => practice.enabled)
      : selectedCropPractices;
    return groupCropPractices(visiblePractices);
  }, [selectedCrop, selectedCropPractices]);

  const selectedCropQuickActions: QuickAction[] = selectedCrop
    ? [
        {
          key: 'edit-crop',
          icon: 'pencil-outline',
          label: 'Edit',
          color: 'green',
          onPress: () => openCropEditSheet(selectedCrop),
        },
        {
          key: 'configure-operations',
          icon: 'tune-variant',
          label: 'Ops',
          color: 'blue',
          onPress: () => setCropOperationsVisible(true),
        },
        ...(!isActiveLifecycleStatus(selectedCrop.status) || !cropHasActiveCycle.has(selectedCrop.id)
          ? [
              {
                key: 'toggle-status',
                icon: isInactiveLifecycleStatus(selectedCrop.status)
                  ? 'play-circle-outline'
                  : 'pause-circle-outline',
                label: isInactiveLifecycleStatus(selectedCrop.status) ? 'Activate' : 'Deactivate',
                color: isInactiveLifecycleStatus(selectedCrop.status) ? 'green' : 'red',
                onPress: () => {
                  setCropActionTarget(selectedCrop);
                  setPendingCropStatusAction(
                    isInactiveLifecycleStatus(selectedCrop.status) ? 'active' : 'inactive',
                  );
                },
              } satisfies QuickAction,
            ]
          : []),
      ]
    : [];

  const selectedCycleQuickActions: QuickAction[] = selectedCycle
    ? [
        ...(isCycleActionable(selectedCycle.status)
          ? [
              {
                key: 'add-operation',
                icon: 'plus',
                label: 'Add Op',
                color: 'green',
                onPress: openOperationCreateSheet,
              } satisfies QuickAction,
              {
                key: 'add-treatment',
                icon: 'spray-bottle',
                label: 'Treatment',
                color: 'blue',
                onPress: () => setTreatmentSheetVisible(true),
              } satisfies QuickAction,
              {
                key: 'add-harvest',
                icon: 'basket-fill',
                label: 'Harvest',
                color: 'green',
                onPress: () => setHarvestSheetVisible(true),
              } satisfies QuickAction,
            ]
          : []),
        {
          key: 'cycle-notes',
          icon: 'note-edit-outline',
          label: 'Notes',
          color: 'blue',
          onPress: () => openCycleNotesSheet(selectedCycle),
        },
        ...(isCycleActionable(selectedCycle.status)
          ? [
              {
                key: 'close-cycle',
                icon: 'archive-outline',
                label: 'Close',
                color: 'red',
                onPress: () => openCycleCloseSheet(selectedCycle),
              } satisfies QuickAction,
            ]
          : []),
      ]
    : [];

  const searchValue = activeTab === 'crops' ? cropSearch : cycleSearch;

  const headerPrimaryAction = () => {
    if (activeTab === 'crops') {
      openCropCreateSheet();
      return;
    }

    if (activeTab === 'cycles') {
      openCycleCreateSheet();
      return;
    }
  };

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
        crop_group_id: cropFormValues.cropGroupId || null,
        notes: cropFormValues.notes.trim() || null,
      },
    };

    try {
      if (cropFormMode === 'create') {
        await createCrop(payload);
        showToast({ message: 'Crop created.', variant: 'success' });
      } else if (editingCrop) {
        const updatedCrop = await updateCrop(editingCrop.id, payload);
        setSelectedCrop((current) => (current?.id === updatedCrop.id ? updatedCrop : current));
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
      const updatedCrop = await updateCropStatus(cropActionTarget.id, { status: pendingCropStatusAction });
      setSelectedCrop((current) => (current?.id === updatedCrop.id ? updatedCrop : current));
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

  function closeCropDetails() {
    setSelectedCrop(null);
    setCropOperationsVisible(false);
    setCropActionTarget(null);
    setPendingCropStatusAction(null);
  }

  function togglePracticeSelection(practiceId: string) {
    if (selectedCrop?.cropGroupId) return;

    setSelectedPracticeIds((current) =>
      current.includes(practiceId)
        ? current.filter((value) => value !== practiceId)
        : [...current, practiceId],
    );
  }

  async function submitCropPracticeSelections() {
    if (!selectedCrop || selectedCrop.cropGroupId) {
      setCropOperationsVisible(false);
      return;
    }

    try {
      await replaceCropPracticeMappings(selectedCrop.id, { practiceIds: selectedPracticeIds });
      showToast({ message: 'Crop operations updated.', variant: 'success' });
      setCropOperationsVisible(false);
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Crop operations update failed.'),
        variant: 'error',
      });
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

    const selectedCropOption = activeCrops.find((crop) => crop.id === cycleFormValues.cropId) ?? null;
    if (!selectedCropOption) {
      showToast({ message: 'Select an active crop before creating a production cycle.', variant: 'error' });
      return;
    }

    if (selectedCropOption.fieldId && selectedCropOption.fieldId !== selectedField.id) {
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
    setSelectedCycle(cycle);
    setCycleNotesText(cycle.notes ?? '');
    setCycleNotesVisible(true);
  }

  function closeCycleNotesSheet() {
    setCycleNotesVisible(false);
    setCycleNotesText('');
  }

  async function submitCycleNotes() {
    if (!selectedCycle) return;

    try {
      const updatedCycle = await updateProductionCycleNotes(selectedCycle.id, {
        notes: cycleNotesText.trim() || null,
      });
      setSelectedCycle(updatedCycle);
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
    setSelectedCycle(cycle);
    setCycleCloseValues(toCycleCloseFormValues(cycle));
    setCycleCloseVisible(true);
  }

  function closeCycleCloseSheet() {
    setCycleCloseVisible(false);
    setCycleCloseValues(toCycleCloseFormValues());
    cycleCloseFormValidation.reset();
  }

  async function submitCycleClose() {
    if (!selectedCycle) return;
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
      const updatedCycle = await closeProductionCycle(selectedCycle.id, {
        end_date: cycleCloseValues.endDate,
        notes: cycleCloseValues.notes.trim() || null,
      });
      setSelectedCycle(updatedCycle);
      showToast({ message: 'Production cycle closed.', variant: 'success' });
      closeCycleCloseSheet();
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Production cycle close failed.'),
        variant: 'error',
      });
    }
  }

  function closeCycleDetails() {
    setSelectedCycle(null);
    setOperationActionTarget(null);
    setDeletingOperation(null);
    setTreatmentSheetVisible(false);
    setHarvestSheetVisible(false);
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
    if (!selectedCycle) return;

    const costNumber = parseOptionalNumber(operationFormValues.cost);
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
        isValid: costNumber !== null && costNumber >= 0,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    try {
      if (operationFormMode === 'create') {
        await createProductionCycleOperation(selectedCycle.id, {
          date: operationFormValues.date,
          type: operationFormValues.type,
          cost: costNumber ?? 0,
          notes: operationFormValues.notes.trim() || null,
        });
        showToast({ message: 'Operation created.', variant: 'success' });
      } else if (editingOperation) {
        await updateProductionCycleOperation(editingOperation.id, {
          date: operationFormValues.date,
          type: operationFormValues.type,
          cost: costNumber ?? 0,
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
      setOperationActionTarget(null);
    }
  }

  async function submitTreatmentSheet(input: CreateTreatmentOperationRequest) {
    if (!selectedCycle) {
      return;
    }

    try {
      await createTreatmentOperation(selectedCycle.id, input);
      await refreshOperations();
      showToast({ message: 'Treatment saved.', variant: 'success' });
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Treatment save failed.'),
        variant: 'error',
      });
      throw error;
    }
  }

  async function submitHarvestSheet(input: CreateHarvestOperationRequest) {
    if (!selectedCycle) {
      return;
    }

    try {
      await createHarvestOperation(selectedCycle.id, input);
      await refreshOperations();
      showToast({ message: 'Harvest saved.', variant: 'success' });
    } catch (error) {
      showToast({
        message: formatApiErrorMessage(error, 'Harvest save failed.'),
        variant: 'error',
      });
      throw error;
    }
  }

  const cropsTabContent = (
    <>
      <StatStrip
        items={[
          { value: cropOperationalCount, label: 'Operational', color: 'green' },
          { value: cropInactiveCount, label: 'Inactive', color: 'amber' },
          { value: groupedCropCount, label: 'Grouped', color: groupedCropCount > 0 ? 'green' : 'amber' },
        ]}
        testID="crops-stats"
      />

      <PillTabs
        value={cropListMode}
        onValueChange={(value) => setCropListMode(value as CropListMode)}
        tabs={CROP_LIST_MODE_OPTIONS.map((option) => ({
          value: option.value,
          label:
            option.value === 'all'
              ? `All (${crops.length})`
              : option.value === 'active'
                ? `Operational (${cropOperationalCount})`
                : `Inactive (${cropInactiveCount})`,
        }))}
        testID="crops-status-filter"
      />

      <SectionHeader title="Crops" trailing={`${filteredCrops.length} items`} />

      {isLoading ? (
        <>
          <Skeleton height={68} />
          <Skeleton height={68} />
          <Skeleton height={68} />
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
        filteredCrops.map((crop) => (
          <ListRow
            key={crop.id}
            icon="sprout"
            iconVariant={toCropRowIconVariant(crop.status)}
            title={crop.name}
            subtitle={buildCropRowSubtitle({
              crop,
              fieldLabel: crop.fieldId ? fieldLabelById.get(crop.fieldId) : undefined,
              cropGroupLabel: crop.cropGroupId ? cropGroupLabelById.get(crop.cropGroupId) : undefined,
            })}
            badge={
              <DotBadge
                label={formatCropStatusLabel(crop.status)}
                variant={toCropStatusBadgeVariant(crop.status)}
              />
            }
            onPress={() => setSelectedCrop(crop)}
            testID={`crops-row-${crop.id}`}
          />
        ))
      )}
    </>
  );

  const cyclesTabContent = (
    <>
      <StatStrip
        items={[
          { value: activeCycleCount, label: 'Active', color: 'green' },
          { value: closedCycleCount, label: 'Closed', color: 'amber' },
          { value: inactiveCycleCount, label: 'Inactive', color: 'amber' },
        ]}
        testID="production-cycles-stats"
      />

      <PillTabs
        value={cycleListMode}
        onValueChange={(value) => setCycleListMode(value as CycleListMode)}
        tabs={CYCLE_LIST_MODE_OPTIONS.map((option) => ({
          value: option.value,
          label:
            option.value === 'all'
              ? `All (${cycles.length})`
              : option.value === 'active'
                ? `Active (${activeCycleCount})`
                : option.value === 'closed'
                  ? `Closed (${closedCycleCount})`
                  : `Inactive (${inactiveCycleCount})`,
        }))}
        testID="production-cycles-status-filter"
      />

      <SectionHeader title="Production Cycles" trailing={`${filteredCycles.length} items`} />

      {isLoading ? (
        <>
          <Skeleton height={68} />
          <Skeleton height={68} />
          <Skeleton height={68} />
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
        filteredCycles.map((cycle) => (
          <ListRow
            key={cycle.id}
            icon="chart-timeline-variant"
            iconVariant={toCropRowIconVariant(cycle.status)}
            title={cycle.cropName ?? cycle.cropId}
            subtitle={buildCycleRowSubtitle(cycle)}
            badge={
              <DotBadge
                label={formatCropStatusLabel(cycle.status)}
                variant={toCropStatusBadgeVariant(cycle.status)}
              />
            }
            onPress={() => setSelectedCycle(cycle)}
            testID={`cycles-row-${cycle.id}`}
          />
        ))
      )}
    </>
  );

  const logbookTabContent = (
    <LogbookActivityForm
      token={session?.accessToken ?? ''}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      products={products}
      warehouses={warehouses}
      users={managedUsers}
      contacts={managedContacts}
      isSubmitting={isMutating}
      onRefresh={refresh}
      refreshKey={logbookRefreshKey}
    />
  );

  const handleRefresh = async () => {
    if (activeTab === 'logbook') {
      setLogbookRefreshKey((current) => current + 1);
    }

    await refresh();
  };

  return (
    <>
      <AppScreen padded={false}>
        <View style={styles.moduleHeader}>
          <View style={styles.moduleHeaderTop}>
            <View style={styles.headerLead}>
              <HeaderMenuButton testID="crops-header-menu" />
              <View style={styles.headerCopy}>
                <Text style={styles.moduleHeaderTitle}>
                  {t('system', 'headers.crops.title', 'Crops, Cycles, and Logbook')}
                </Text>
                <Text style={styles.moduleHeaderSubtitle}>
                  {t(
                    'system',
                    'headers.crops.subtitle',
                    'Crop planning, production cycles, and validated logbook activity in the dense shell.',
                  )}
                </Text>
              </View>
            </View>
            <SystemHeaderActions notificationTestID="crops-header-notifications">
              <HeaderIconButton
                icon="refresh"
                onPress={() => void handleRefresh()}
                testID="crops-refresh"
              />
              {activeTab === 'logbook' ? null : (
                <HeaderIconButton
                  icon="plus"
                  onPress={headerPrimaryAction}
                  filled
                  testID="crops-primary-action"
                />
              )}
            </SystemHeaderActions>
          </View>

          {activeTab === 'logbook' ? null : (
            <SearchBar
              value={searchValue}
              onChangeText={activeTab === 'crops' ? setCropSearch : setCycleSearch}
              placeholder={
                activeTab === 'crops'
                  ? 'Search crops by name, variety, field, or group...'
                  : 'Search cycles by crop, field, lot, or status...'
              }
            />
          )}

          <ModuleTabs
            tabs={[
              { value: 'crops', label: 'Crops' },
              { value: 'cycles', label: 'Cycles' },
              { value: 'logbook', label: 'Logbook' },
            ]}
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as Phase11Tab)}
            testID="crops-tabs"
          />
        </View>

        <PullToRefreshContainer
          refreshing={isRefreshing || isMutating}
          onRefresh={() => void handleRefresh()}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.main}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'crops' ? cropsTabContent : null}
            {activeTab === 'cycles' ? cyclesTabContent : null}
            {activeTab === 'logbook' ? logbookTabContent : null}
          </ScrollView>
        </PullToRefreshContainer>
      </AppScreen>

      <CropsCropDetailSheet
        crop={selectedCrop}
        fieldLabel={selectedCrop?.fieldId ? fieldLabelById.get(selectedCrop.fieldId) : undefined}
        cropGroupLabel={selectedCropGroupLabel}
        practices={selectedCropPractices}
        practicesLoading={cropPracticesLoading}
        practicesErrorMessage={cropPracticesErrorMessage}
        quickActions={selectedCropQuickActions}
        onDismiss={closeCropDetails}
        onRetryPractices={() => void refreshCropPractices()}
        onOpenOperations={() => setCropOperationsVisible(true)}
      />

      <CropsCycleDetailSheet
        cycle={selectedCycle}
        operations={cycleOperations}
        operationsLoading={operationsLoading}
        operationsErrorMessage={operationsErrorMessage}
        quickActions={selectedCycleQuickActions}
        onDismiss={closeCycleDetails}
        onRetryOperations={() => void refreshOperations()}
        canAddOperation={Boolean(selectedCycle && isCycleActionable(selectedCycle.status))}
        onAddOperation={openOperationCreateSheet}
        onPressOperation={setOperationActionTarget}
      />

      <BottomSheet
        visible={cropOperationsVisible}
        onDismiss={() => setCropOperationsVisible(false)}
        title={selectedCrop ? `Operations: ${selectedCrop.name}` : 'Crop operations'}
        footer={
          selectedCrop?.cropGroupId ? (
            <SheetFooter
              onCancel={() => setCropOperationsVisible(false)}
              onSubmit={() => setCropOperationsVisible(false)}
              label="Done"
              loading={false}
              disabled={false}
            />
          ) : (
            <SheetFooter
              onCancel={() => setCropOperationsVisible(false)}
              onSubmit={() => void submitCropPracticeSelections()}
              label="Save operations"
              loading={isMutating}
              disabled={isMutating || !selectedCrop}
            />
          )
        }
      >
        {!selectedCrop ? (
          <EmptyState title="No crop selected" message="Choose a crop before configuring operations." />
        ) : (
          <>
            <DetailSectionCard
              title="Operations Mode"
              description={
                selectedCrop.cropGroupId
                  ? 'This crop inherits operations from its crop group.'
                  : 'This crop manages its own operation mappings.'
              }
            >
              <CropsFactRow label="Crop" value={selectedCrop.name} />
              <CropsFactRow label="Group" value={selectedCropGroupLabel || 'Standalone'} />
              <CropsFactRow label="Editable" value={selectedCrop.cropGroupId ? 'No' : 'Yes'} />
            </DetailSectionCard>

            {selectedCrop.cropGroupId ? (
              <AlertStrip
                title={selectedCropGroupLabel ? `Read-only: ${selectedCropGroupLabel}` : 'Read-only crop group mapping'}
                subtitle="Grouped crops can only view effective operations here. Direct crop-level changes are blocked by the backend."
                icon="source-branch"
                borderColor="#136C22"
                iconColor="#136C22"
              />
            ) : null}

            {cropPracticesLoading ? (
              <>
                <Skeleton height={84} />
                <Skeleton height={84} />
              </>
            ) : cropPracticesErrorMessage ? (
              <ErrorState message={cropPracticesErrorMessage} onRetry={() => void refreshCropPractices()} />
            ) : cropPracticeSections.length === 0 ? (
              <EmptyState
                title="No crop operations available"
                message={
                  selectedCrop.cropGroupId
                    ? 'No enabled operations are defined on the linked crop group.'
                    : 'No operation practices are currently available for this crop.'
                }
              />
            ) : (
              cropPracticeSections.map((section) => (
                <DetailSectionCard
                  key={section.key}
                  title={section.label}
                  description={`${section.items.length} practices`}
                >
                  <View style={styles.practiceRows}>
                    {section.items.map((practice) => {
                      const selected = selectedPracticeIds.includes(practice.id);
                      const readonly = Boolean(selectedCrop.cropGroupId);

                      return (
                        <Pressable
                          key={practice.id}
                          onPress={() => togglePracticeSelection(practice.id)}
                          disabled={readonly}
                          style={({ pressed }) => [
                            styles.practiceRow,
                            selected && styles.practiceRowSelected,
                            readonly && styles.practiceRowReadonly,
                            pressed && !readonly ? styles.practiceRowPressed : null,
                          ]}
                        >
                          <View style={styles.practiceLeading}>
                            <View
                              style={[
                                styles.practiceToggle,
                                selected ? styles.practiceToggleOn : styles.practiceToggleOff,
                              ]}
                            >
                              <Icon
                                source={selected ? 'check' : 'plus'}
                                size={14}
                                color={selected ? '#FFFFFF' : palette.mutedForeground}
                              />
                            </View>
                            <View style={styles.practiceCopy}>
                              <Text style={styles.practiceTitle}>{practice.label}</Text>
                              {practice.description ? (
                                <Text style={styles.practiceDescription}>{practice.description}</Text>
                              ) : null}
                            </View>
                          </View>
                          <View style={styles.practiceMeta}>
                            <DotBadge
                              label={formatOperationFamilyLabel(practice.operationFamily)}
                              variant={selected ? 'success' : 'neutral'}
                            />
                            <Text style={styles.practiceDomain}>
                              {formatDomainAreaLabel(practice.domainArea)}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </DetailSectionCard>
              ))
            )}
          </>
        )}
      </BottomSheet>

      <BottomSheet
        visible={cropFormVisible}
        onDismiss={closeCropSheet}
        scrollViewRef={cropFormScrollRef}
        title={cropFormMode === 'create' ? 'Create Crop' : 'Edit Crop'}
        footer={
          <SheetFooter
            onCancel={closeCropSheet}
            onSubmit={() => void submitCropForm()}
            label={cropFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <DetailSectionCard title="Crop Record" description="Create or update a crop planning record.">
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

            <FormField label="Operations Group">
              {cropGroupsLoading ? <Skeleton height={44} /> : null}
              <AppSelect
                value={cropFormValues.cropGroupId}
                onChange={(value) =>
                  setCropFormValues((current) => ({
                    ...current,
                    cropGroupId: value,
                  }))
                }
                options={cropGroupOptions}
                label="Select operations group"
                testID="crop-form-group-select"
              />
            </FormField>

            {cropGroupsErrorMessage ? (
              <ErrorState
                title="Crop groups unavailable"
                message={cropGroupsErrorMessage}
                onRetry={() => void refresh()}
              />
            ) : null}

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
        </DetailSectionCard>
      </BottomSheet>

      <BottomSheet
        visible={cycleFormVisible}
        onDismiss={closeCycleCreateSheet}
        scrollViewRef={cycleFormScrollRef}
        title="Create Production Cycle"
        footer={
          <SheetFooter
            onCancel={closeCycleCreateSheet}
            onSubmit={() => void submitCycleCreate()}
            label="Create"
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <DetailSectionCard title="Cycle Setup" description="Choose active field, lot, and crop combinations only.">
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
        </DetailSectionCard>
      </BottomSheet>

      <BottomSheet
        visible={cycleCloseVisible}
        onDismiss={closeCycleCloseSheet}
        scrollViewRef={cycleCloseFormScrollRef}
        title={selectedCycle ? `Close Cycle: ${selectedCycle.cropName ?? selectedCycle.id}` : 'Close Cycle'}
        footer={
          <SheetFooter
            onCancel={closeCycleCloseSheet}
            onSubmit={() => void submitCycleClose()}
            label="Close cycle"
            loading={isMutating}
            disabled={isMutating}
            tone="destructive"
          />
        }
      >
        <DetailSectionCard title="Close Cycle" description="Set the cycle end date and optional closing notes.">
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
        </DetailSectionCard>
      </BottomSheet>

      <BottomSheet
        visible={cycleNotesVisible}
        onDismiss={closeCycleNotesSheet}
        title={selectedCycle ? `Update Notes: ${selectedCycle.cropName ?? selectedCycle.id}` : 'Update Notes'}
        footer={
          <SheetFooter
            onCancel={closeCycleNotesSheet}
            onSubmit={() => void submitCycleNotes()}
            label="Save notes"
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <DetailSectionCard title="Cycle Notes" description="Keep production-cycle notes in sync with backend state.">
          <FormField label="Notes">
            <AppTextArea
              value={cycleNotesText}
              onChangeText={setCycleNotesText}
              placeholder="Cycle notes"
              numberOfLines={6}
            />
          </FormField>
        </DetailSectionCard>
      </BottomSheet>

      <BottomSheet
        visible={operationFormVisible}
        onDismiss={closeOperationFormSheet}
        scrollViewRef={operationFormScrollRef}
        title={operationFormMode === 'create' ? 'Create Operation' : 'Edit Operation'}
        footer={
          <SheetFooter
            onCancel={closeOperationFormSheet}
            onSubmit={() => void submitOperationForm()}
            label={operationFormMode === 'create' ? 'Create' : 'Save'}
            loading={isMutating}
            disabled={isMutating}
          />
        }
      >
        <DetailSectionCard title="Operation Record" description="Capture dated operation activity for the selected cycle.">
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
        </DetailSectionCard>
      </BottomSheet>

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

      <TreatmentOperationSheet
        visible={treatmentSheetVisible}
        cycle={selectedCycle}
        token={session?.accessToken ?? ''}
        products={products}
        warehouses={warehouses}
        practices={treatmentPracticeOptions}
        isSubmitting={isMutating}
        onDismiss={() => setTreatmentSheetVisible(false)}
        onSubmit={submitTreatmentSheet}
      />

      <HarvestOperationSheet
        visible={harvestSheetVisible}
        cycle={selectedCycle}
        token={session?.accessToken ?? ''}
        practices={harvestPracticeOptions}
        users={managedUsers}
        contacts={managedContacts}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        isSubmitting={isMutating}
        onDismiss={() => setHarvestSheetVisible(false)}
        onSubmit={submitHarvestSheet}
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
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  practiceRows: {
    gap: spacing.sm,
  },
  practiceRow: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    padding: spacing.md,
  },
  practiceRowSelected: {
    borderColor: palette.primary,
    backgroundColor: '#F2FAF4',
  },
  practiceRowReadonly: {
    backgroundColor: palette.muted,
  },
  practiceRowPressed: {
    backgroundColor: '#EAF6ED',
  },
  practiceLeading: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  practiceToggle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  practiceToggleOn: {
    backgroundColor: palette.primary,
  },
  practiceToggleOff: {
    backgroundColor: palette.muted,
  },
  practiceCopy: {
    flex: 1,
    gap: 2,
  },
  practiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.foreground,
  },
  practiceDescription: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  practiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  practiceDomain: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
});
