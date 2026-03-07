import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Checkbox, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import {
  AlertStrip,
  AppButton,
  AppDatePicker,
  AppInput,
  AppSelect,
  AppTextArea,
  DetailSectionCard,
  EmptyState,
  ErrorState,
  FormField,
  Skeleton,
} from '../../../../components';
import {
  listTreatmentOperations,
  getLogbookPracticeCatalog,
  getLogbookSession,
  submitLogbook,
  type LogbookCategoryOption,
  type LogbookEntityOption,
  type LogbookSessionSnapshot,
} from '../../../../api/modules/crops';
import type { InventoryProduct, InventoryWarehouse } from '../../../../api/modules/inventory';
import { listProductTypeMetaByIds } from '../../../../api/modules/inventory';
import type { ManagedContact, ManagedUser } from '../../../../api/modules/management';
import { ApiError } from '../../../../api/client';
import { useLogbookQueue } from '../../../../providers/LogbookQueueProvider';
import { bindProductsEditorPayload, toSubmitPayload } from '../../logbook/payload';
import {
  buildDetailsPayload,
  buildPracticeValidationFields,
  getPracticeRequirement,
  resolvePracticeCode,
} from '../../logbook/practiceConfig';
import { getFormTemplate } from '../../logbook/templates';
import {
  buildHarvestValidationFields,
  resolveApiFieldError,
  validateHarvestWorkerRows,
  validatePracticeRequirementFields,
  validateRequiredFields,
} from '../../logbook/validation';
import {
  collectPhiProductIds,
  computePhiRestrictionsForDate,
  getMostRestrictivePhiDate,
  summarizePhiRestrictionsByProduct,
  type PhiRestrictionSummary,
} from '../../logbook/phiRestrictions';
import {
  clearLogbookDraft,
  readLogbookDraft,
  writeLogbookDraft,
} from '../../logbook/draftStorage';
import {
  enqueueQueuedLogbookSubmit,
  isRetryableLogbookSubmitError,
} from '../../logbook/offlineQueue';
import { findLogbookProductStockIssues } from '../../logbook/stockValidation';
import {
  dedupeStrings,
  findProductsEditorField,
  getAutoCostFieldKey,
  isCropCategory,
  parseInitialFormData,
  readMetaText,
  summarizeHarvestWorkers,
  toNullableText,
  withOptionalSubmitDefaults,
} from '../../logbook/helpers';
import type {
  HarvestWorkerRow,
  LogbookCategoryKey,
  LogbookEntityType,
  LogbookOperationFamily,
  LogbookSubmitCommand,
} from '../../logbook/types';
import { LogbookHarvestWorkersEditor } from './LogbookHarvestWorkersEditor.component';
import { LogbookProductsEditor } from './LogbookProductsEditor.component';
import { PhiWarningDialog } from './PhiWarningDialog.component';
import { PracticeDynamicFieldsSection } from './PracticeDynamicFieldsSection.component';
import { palette, radius, spacing, typography } from '../../../../theme/tokens';

const DEFAULT_PRACTICE_ID_PREFIX = '__default_operation__:';
const LOGBOOK_SUBMIT_TIMEOUT_MS = 15_000;

type LatestSubmitResult = {
  status: 'saved' | 'saved_draft' | 'queued' | string;
  recordId: string | null;
  category: string | null;
  family: string | null;
  entityId: string | null;
  requiresFollowup: boolean;
  warning?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type LogbookActivityFormProps = {
  token: string;
  currentUserId?: string | null;
  currentUserName: string;
  products: InventoryProduct[];
  warehouses: InventoryWarehouse[];
  users: ManagedUser[];
  contacts: ManagedContact[];
  isSubmitting: boolean;
  onRefresh: () => Promise<void>;
  refreshKey?: number;
};

function createIdempotencyKey(): string {
  return `logbook-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildDefaultPractice(
  family: LogbookOperationFamily,
  label: string,
): {
  id: string;
  code: string;
  label: string;
} {
  return {
    id: `${DEFAULT_PRACTICE_ID_PREFIX}${family}`,
    code: `default_${family.toLowerCase()}`,
    label,
  };
}

function isSyntheticDefaultPractice(practiceId: string): boolean {
  return practiceId.startsWith(DEFAULT_PRACTICE_ID_PREFIX);
}

function coerceCategory(
  session: LogbookSessionSnapshot | null,
  currentCategory: LogbookCategoryKey,
): LogbookCategoryKey {
  const available = session?.categories ?? [];
  if (available.some((category) => category.key === currentCategory)) {
    return currentCategory;
  }

  if (available.some((category) => category.key === 'CROP_OPERATION')) {
    return 'CROP_OPERATION';
  }

  return (available[0]?.key ?? 'CROP_OPERATION') as LogbookCategoryKey;
}

function normalizeEntityType(value: string | null | undefined): LogbookEntityType {
  switch (value) {
    case 'CROP':
    case 'EQUIPMENT':
    case 'HOUSING_UNIT':
    case 'ANIMAL':
    case 'LOT':
      return value;
    default:
      return 'CROP';
  }
}

function normalizeSubmitResult(result: {
  status: string;
  recordId: string | null;
  category: string | null;
  family: string | null;
  entityId: string | null;
  requiresFollowup?: boolean;
  requires_followup?: boolean;
  warning?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}): LatestSubmitResult {
  return {
    status: result.status,
    recordId: result.recordId,
    category: result.category,
    family: result.family,
    entityId: result.entityId,
    requiresFollowup: Boolean(result.requiresFollowup ?? result.requires_followup),
    warning: result.warning,
  };
}

function buildQueuedResult(args: {
  recordId: string;
  category: string;
  family: string | null;
  entityId: string;
  message?: string;
}): LatestSubmitResult {
  return {
    status: 'queued',
    recordId: args.recordId,
    category: args.category,
    family: args.family,
    entityId: args.entityId,
    requiresFollowup: true,
    warning: {
      code: 'QUEUED_OFFLINE',
      message:
        args.message ??
        'Saved locally and queued for sync. Final validation will run when you are back online.',
    },
  };
}

export function LogbookActivityForm({
  token,
  currentUserId = null,
  currentUserName,
  products,
  warehouses,
  users,
  contacts,
  isSubmitting,
  onRefresh,
  refreshKey = 0,
}: LogbookActivityFormProps) {
  const { pendingCount, recentSyncErrors, isOnline, syncNow, refreshQueueState } = useLogbookQueue();
  const sessionKeyRef = useRef(`mobile-logbook-${Date.now()}`);
  const previousDateRef = useRef<string | null>(null);
  const draftHydratedRef = useRef(false);
  const previousRefreshKeyRef = useRef(refreshKey);

  const [fieldId, setFieldId] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [category, setCategory] = useState<LogbookCategoryKey>('CROP_OPERATION');
  const [entityId, setEntityId] = useState('');
  const [family, setFamily] = useState('');
  const [practiceId, setPracticeId] = useState('');
  const [formData, setFormData] = useState<Record<string, unknown>>(
    parseInitialFormData(date, fieldId || null, currentUserId, currentUserName),
  );
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [practiceFieldErrors, setPracticeFieldErrors] = useState<Record<string, string>>({});
  const [practiceSectionError, setPracticeSectionError] = useState<string | null>(null);
  const [harvestWorkersError, setHarvestWorkersError] = useState<string | null>(null);
  const [productRowErrors, setProductRowErrors] = useState<Record<string, string[]>>({});
  const [computedCost, setComputedCost] = useState<number | null>(null);
  const [isCostManuallyOverridden, setIsCostManuallyOverridden] = useState(false);
  const [latestSubmitResult, setLatestSubmitResult] = useState<LatestSubmitResult | null>(null);
  const [generalSubmitError, setGeneralSubmitError] = useState<string | null>(null);
  const [phiRestrictions, setPhiRestrictions] = useState<PhiRestrictionSummary[]>([]);
  const [phiMostRestrictiveDate, setPhiMostRestrictiveDate] = useState<Date | null>(null);
  const [phiWarningVisible, setPhiWarningVisible] = useState(false);
  const [phiOverrideAcknowledged, setPhiOverrideAcknowledged] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ['phase11', 'logbook-session', fieldId || null, date || null],
    queryFn: () =>
      getLogbookSession(token, {
        fieldId: fieldId || undefined,
        date: date || undefined,
      }),
    enabled: Boolean(token),
  });

  const practiceCatalogQuery = useQuery({
    queryKey: ['phase11', 'practice-catalog', fieldId || null, date || null],
    queryFn: () =>
      getLogbookPracticeCatalog(token, {
        fieldId,
        date: date || undefined,
      }),
    enabled: Boolean(token && fieldId),
  });

  const session = sessionQuery.data ?? null;
  const practiceCatalog = practiceCatalogQuery.data ?? null;
  const isLoading = sessionQuery.isLoading;
  const errorMessage = sessionQuery.error instanceof Error ? sessionQuery.error.message : null;
  const practiceCatalogLoading = practiceCatalogQuery.isLoading;
  const practiceCatalogErrorMessage =
    practiceCatalogQuery.error instanceof Error ? practiceCatalogQuery.error.message : null;

  async function refreshContext() {
    await Promise.all([
      sessionQuery.refetch(),
      fieldId ? practiceCatalogQuery.refetch() : Promise.resolve(),
      onRefresh(),
    ]);
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrateDraft() {
      const draft = await readLogbookDraft();
      if (!draft || cancelled) {
        draftHydratedRef.current = true;
        return;
      }

      setFieldId(draft.fieldId);
      setDate(draft.date);
      setCategory(draft.category);
      setEntityId(draft.entityId);
      setFamily(draft.family);
      setPracticeId(draft.practiceId);
      setFormData(draft.formData);
      setDetailValues(draft.detailValues);
      setComputedCost(draft.computedCost);
      setIsCostManuallyOverridden(draft.isCostManuallyOverridden);
      draftHydratedRef.current = true;
      previousDateRef.current = draft.date;
    }

    void hydrateDraft();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftHydratedRef.current) {
      return;
    }

    void writeLogbookDraft({
      fieldId,
      date,
      category,
      entityType: normalizeEntityType(
        session?.categories.find((entry) => entry.key === category)?.entityType,
      ),
      entityId,
      family,
      practiceId,
      formData,
      detailValues,
      isCostManuallyOverridden,
      computedCost,
      updatedAt: new Date().toISOString(),
    });
  }, [
    category,
    computedCost,
    date,
    detailValues,
    entityId,
    family,
    fieldId,
    formData,
    isCostManuallyOverridden,
    practiceId,
  ]);

  useEffect(() => {
    if (previousRefreshKeyRef.current === refreshKey) {
      return;
    }

    previousRefreshKeyRef.current = refreshKey;
    void refreshContext();
  }, [refreshKey]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const nextCategory = coerceCategory(session, category);
    if (nextCategory !== category) {
      setCategory(nextCategory);
    }

    if (!fieldId) {
      const nextFieldId = session.selectedFieldId ?? session.fields[0]?.id ?? '';
      if (nextFieldId) {
        setFieldId(nextFieldId);
      }
    }
  }, [category, fieldId, session]);

  const selectedCategory = useMemo<LogbookCategoryOption | null>(
    () => session?.categories.find((entry) => entry.key === category) ?? null,
    [category, session],
  );

  const entityOptions = useMemo<LogbookEntityOption[]>(
    () => session?.entitiesByCategory[category] ?? [],
    [category, session],
  );

  const selectedEntity = useMemo<LogbookEntityOption | null>(
    () => entityOptions.find((entry) => entry.id === entityId) ?? null,
    [entityId, entityOptions],
  );

  const cropFamilyOptions = useMemo(
    () =>
      selectedCategory?.families.map((entry) => ({
        label: entry.label,
        value: entry.key,
      })) ?? [],
    [selectedCategory],
  );

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    if (isCropCategory(category)) {
      const availableFamilyKeys = new Set(selectedCategory.families.map((entry) => entry.key));
      if (!family || !availableFamilyKeys.has(family as LogbookOperationFamily)) {
        setFamily(selectedCategory.families[0]?.key ?? '');
      }
    } else if (family) {
      setFamily('');
      setPracticeId('');
    }
  }, [category, family, selectedCategory]);

  useEffect(() => {
    if (!selectedEntity && entityId) {
      setEntityId('');
    }
  }, [entityId, selectedEntity]);

  const selectedCropId = useMemo(() => {
    if (selectedEntity?.type !== 'CROP') {
      return null;
    }

    return readMetaText(selectedEntity, 'cropId') ?? selectedEntity.id;
  }, [selectedEntity]);

  const selectedCycleId = useMemo(() => {
    if (category !== 'CROP_OPERATION' || selectedEntity?.type !== 'CROP') {
      return null;
    }

    return readMetaText(selectedEntity, 'cycleId') ?? selectedEntity.id;
  }, [category, selectedEntity]);

  const practiceOptions = useMemo(() => {
    if (!isCropCategory(category) || !family) {
      return [];
    }

    const configured =
      (selectedCropId
        ? practiceCatalog?.practicesByCrop[selectedCropId]?.[family]
        : undefined) ??
      practiceCatalog?.practicesByFamily[family] ??
      [];

    const defaultLabel = `${family.replace(/_/g, ' ')} Operation`
      .toLowerCase()
      .replace(/\b\w/g, (match) => match.toUpperCase());

    return [
      buildDefaultPractice(family as LogbookOperationFamily, defaultLabel),
      ...configured.map((practice) => ({
        id: practice.id,
        code: practice.code,
        label: practice.label,
      })),
    ];
  }, [category, family, practiceCatalog, selectedCropId]);

  useEffect(() => {
    if (!isCropCategory(category) || !family) {
      return;
    }

    if (!practiceId || !practiceOptions.some((practice) => practice.id === practiceId)) {
      setPracticeId(`${DEFAULT_PRACTICE_ID_PREFIX}${family}`);
    }
  }, [category, family, practiceId, practiceOptions]);

  const selectedPractice = useMemo(
    () => practiceOptions.find((entry) => entry.id === practiceId) ?? null,
    [practiceId, practiceOptions],
  );

  const resolvedSubmitPracticeId = useMemo(() => {
    if (!isCropCategory(category) || !family || !selectedPractice) {
      return practiceId || undefined;
    }

    if (!isSyntheticDefaultPractice(selectedPractice.id)) {
      return selectedPractice.id;
    }

    const configured = practiceOptions.filter(
      (practice) => !isSyntheticDefaultPractice(practice.id),
    );
    return configured[0]?.id;
  }, [category, family, practiceId, practiceOptions, selectedPractice]);

  const resolvedSubmitPractice = useMemo(() => {
    if (!selectedPractice) {
      return null;
    }

    if (!isSyntheticDefaultPractice(selectedPractice.id)) {
      return selectedPractice;
    }

    return (
      practiceOptions.find((practice) => !isSyntheticDefaultPractice(practice.id)) ?? selectedPractice
    );
  }, [practiceOptions, selectedPractice]);

  const selectedPracticeCode = useMemo(
    () => resolvePracticeCode(resolvedSubmitPractice),
    [resolvedSubmitPractice],
  );

  const formTemplate = useMemo(
    () => getFormTemplate(category, family ? (family as LogbookOperationFamily) : null),
    [category, family],
  );

  const extraValidationFields = useMemo(() => {
    const fields = [...buildPracticeValidationFields(selectedPracticeCode)];
    if (family === 'HARVEST') {
      fields.push(...buildHarvestValidationFields());
    }
    return fields;
  }, [family, selectedPracticeCode]);

  const formFieldsForApiErrors = useMemo(
    () => [...(formTemplate?.fields ?? []), ...extraValidationFields],
    [extraValidationFields, formTemplate?.fields],
  );

  const autoCostFieldKey = useMemo(
    () => getAutoCostFieldKey(formTemplate?.fields),
    [formTemplate?.fields],
  );

  const productsEditorField = useMemo(
    () => findProductsEditorField(formTemplate?.fields),
    [formTemplate?.fields],
  );

  const practiceRequirement = useMemo(
    () =>
      getPracticeRequirement(
        family ? (family as LogbookOperationFamily) : null,
        selectedPracticeCode,
      ),
    [family, selectedPracticeCode],
  );

  const practiceRequiredKeys = useMemo(
    () => practiceRequirement?.requiredDetailFields ?? [],
    [practiceRequirement],
  );

  useEffect(() => {
    const previousDate = previousDateRef.current;
    previousDateRef.current = date;
    if (!previousDate || previousDate === date) {
      return;
    }

    const dateFields = new Set(
      dedupeStrings([
        'date',
        'date_used',
        'date_performed',
        'plantingDate',
        'harvestDate',
        'operationDate',
        'dateApplied',
        'treatment_date',
      ]),
    );

    setFormData((current) => {
      const next = { ...current };
      let changed = false;

      dateFields.forEach((key) => {
        if (typeof current[key] === 'string' && current[key] === previousDate) {
          next[key] = date;
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [date]);

  useEffect(() => {
    setFormData((current) => {
      const currentField = toNullableText(current.field_id);
      if (fieldId && currentField !== fieldId) {
        return {
          ...current,
          field_id: fieldId,
        };
      }

      return current;
    });
  }, [fieldId]);

  function resetFormState(args?: {
    nextDate?: string;
    nextFieldId?: string;
  }) {
    const nextDate = args?.nextDate ?? date;
    const nextFieldId = args?.nextFieldId ?? fieldId;
    setFormData(parseInitialFormData(nextDate, nextFieldId || null, currentUserId, currentUserName));
    setDetailValues({});
    setFieldErrors({});
    setPracticeFieldErrors({});
    setPracticeSectionError(null);
    setHarvestWorkersError(null);
    setProductRowErrors({});
    setComputedCost(null);
    setIsCostManuallyOverridden(false);
    setGeneralSubmitError(null);
    setPhiRestrictions([]);
    setPhiMostRestrictiveDate(null);
    setPhiWarningVisible(false);
    setPhiOverrideAcknowledged(false);
  }

  function updateFormField(
    key: string,
    value: unknown,
    options?: { isAutoCostUpdate?: boolean },
  ) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });

    if (productsEditorField?.key === key) {
      setProductRowErrors((current) => {
        if (!current[key]) {
          return current;
        }
        const next = { ...current };
        delete next[key];
        return next;
      });
    }

    if (key === 'workers') {
      setHarvestWorkersError(null);
    }

    if (key === 'details') {
      setPracticeFieldErrors({});
      setPracticeSectionError(null);
    }

    if (autoCostFieldKey && key === autoCostFieldKey && !options?.isAutoCostUpdate) {
      setIsCostManuallyOverridden(true);
    }

    if (family === 'HARVEST' && key === 'harvestDate') {
      setPhiRestrictions([]);
      setPhiMostRestrictiveDate(null);
      setPhiWarningVisible(false);
      setPhiOverrideAcknowledged(false);
    }
  }

  async function handleSubmit(options?: { skipPhiPrecheck?: boolean }) {
    if (!session || !selectedCategory || !selectedEntity) {
      setGeneralSubmitError('Select a category and entity before saving.');
      return;
    }

    const submitFieldId = fieldId || selectedEntity.fieldId || session.selectedFieldId || '';
    if (!submitFieldId) {
      setGeneralSubmitError('Field is required before saving this log.');
      return;
    }

    if (isCropCategory(category) && (!family || !practiceId)) {
      setGeneralSubmitError('Select operation family and practice before saving.');
      return;
    }

    if (
      category === 'CROP_OPERATION' &&
      family === 'CULTURAL' &&
      practiceId &&
      isSyntheticDefaultPractice(practiceId) &&
      !resolvedSubmitPracticeId
    ) {
      setGeneralSubmitError(
        'Please enable at least one Cultural Operations practice for this crop before saving.',
      );
      return;
    }

    const detailsPayload = buildDetailsPayload(selectedPracticeCode, detailValues);
    const nextFormData: Record<string, unknown> = {
      ...formData,
      details: detailsPayload,
      attachments: [],
    };

    if (family === 'HARVEST') {
      const summary = summarizeHarvestWorkers(formData.workers, 'kg');
      nextFormData.workers = summary.rows;
      nextFormData.totalHarvestedQuantity =
        summary.totalQuantity > 0 ? Number(summary.totalQuantity.toFixed(2)) : '';
      nextFormData.totalHarvestedUnit = summary.unit;
      nextFormData.practiceId = resolvedSubmitPracticeId ?? '';
    }

    const validationErrors = validateRequiredFields(formTemplate.fields, nextFormData);
    const practiceValidation = validatePracticeRequirementFields({
      family: family ? (family as LogbookOperationFamily) : null,
      practiceCode: selectedPracticeCode,
      formData: nextFormData,
      baseFields: formTemplate.fields,
    });
    const harvestWorkersValidation =
      family === 'HARVEST' ? validateHarvestWorkerRows(nextFormData.workers) : {};

    setFieldErrors(validationErrors);
    setPracticeFieldErrors(practiceValidation.fieldErrors);
    setPracticeSectionError(practiceValidation.sectionError);
    setHarvestWorkersError(harvestWorkersValidation.workers ?? null);
    setProductRowErrors({});
    setGeneralSubmitError(null);

    if (
      Object.keys(validationErrors).length > 0 ||
      Object.keys(practiceValidation.fieldErrors).length > 0 ||
      Boolean(practiceValidation.sectionError) ||
      Boolean(harvestWorkersValidation.workers)
    ) {
      return;
    }

    if (category === 'CROP_OPERATION' && productsEditorField) {
      try {
        const stockIssues = await findLogbookProductStockIssues({
          token,
          mode: productsEditorField.editorMode ?? 'nutrient',
          rows: nextFormData[productsEditorField.key],
        });

        if (stockIssues.length > 0) {
          const currentProductRows = Array.isArray(nextFormData[productsEditorField.key])
            ? (nextFormData[productsEditorField.key] as unknown[])
            : [];
          const stockErrors = Array.from(
            {
              length: Math.max(currentProductRows.length, stockIssues.length),
            },
            () => '',
          );

          stockIssues.forEach((issue) => {
            stockErrors[issue.rowIndex] = `Required ${issue.required}, but only ${issue.available} is available.`;
          });

          setProductRowErrors({
            [productsEditorField.key]: stockErrors,
          });
          return;
        }
      } catch (error) {
        setGeneralSubmitError(
          error instanceof Error ? error.message : 'Unable to validate inventory.',
        );
        return;
      }
    }

    if (
      category === 'CROP_OPERATION' &&
      family === 'HARVEST' &&
      selectedCycleId &&
      !options?.skipPhiPrecheck &&
      !phiOverrideAcknowledged
    ) {
      try {
        const treatments = await listTreatmentOperations(token, selectedCycleId);
        const phiProductIds = collectPhiProductIds(
          treatments as Array<Record<string, unknown>>,
        );
        const productMeta =
          phiProductIds.length > 0
            ? await listProductTypeMetaByIds(token, phiProductIds)
            : [];
        const restrictions = summarizePhiRestrictionsByProduct(
          computePhiRestrictionsForDate({
            treatments: treatments as Array<Record<string, unknown>>,
            harvestDate: new Date(`${String(nextFormData.harvestDate ?? date)}T00:00:00`),
            productMeta,
            unknownProductLabel: 'Unknown product',
            restrictToPesticideProducts: true,
          }),
        );
        const mostRestrictiveDate = getMostRestrictivePhiDate(restrictions);

        setPhiRestrictions(restrictions);
        setPhiMostRestrictiveDate(mostRestrictiveDate);

        if (restrictions.some((entry) => entry.isActive)) {
          setPhiWarningVisible(true);
          return;
        }
      } catch (error) {
        setGeneralSubmitError(
          error instanceof Error ? error.message : 'Unable to validate PHI restrictions.',
        );
        return;
      }
    }

    const allowedFieldKeys = new Set(formTemplate.fields.map((field) => field.key));
    allowedFieldKeys.add('details');
    allowedFieldKeys.add('attachments');
    if (family === 'HARVEST') {
      allowedFieldKeys.add('workers');
      allowedFieldKeys.add('practiceId');
    }

    const draftPayload = Object.fromEntries(
      Object.entries(nextFormData).filter(([key]) => allowedFieldKeys.has(key)),
    ) as Record<string, unknown>;
    const normalizedPayload = toSubmitPayload(draftPayload);
    const boundPayload = bindProductsEditorPayload({
      category,
      family: family ? (family as LogbookOperationFamily) : null,
      fields: formTemplate.fields,
      payload: normalizedPayload,
    });
    const payload = withOptionalSubmitDefaults(boundPayload, {
      category,
      userId: currentUserId,
    });
    const submitCommand: LogbookSubmitCommand = {
      fieldId: submitFieldId,
      date,
      category,
      entityType: normalizeEntityType(selectedCategory.entityType),
      entityId: selectedEntity.id,
      family: family ? (family as LogbookOperationFamily) : undefined,
      practiceId: resolvedSubmitPracticeId,
      payload,
      clientSessionId: sessionKeyRef.current,
    };
    const idempotencyKey = createIdempotencyKey();

    try {
      const result = await submitLogbook(token, submitCommand, {
        idempotencyKey,
        timeoutMs: LOGBOOK_SUBMIT_TIMEOUT_MS,
      });

      const normalized = normalizeSubmitResult({
        ...result,
        requiresFollowup: result.requiresFollowup,
      });
      setLatestSubmitResult(normalized);
      await clearLogbookDraft();
      resetFormState();
      await refreshContext();
      await refreshQueueState();
    } catch (error) {
      if (isOnline === false || isRetryableLogbookSubmitError(error)) {
        const queued = await enqueueQueuedLogbookSubmit({
          command: submitCommand,
          idempotencyKey,
          summary: {
            entityName: selectedEntity.name,
            practiceLabel: selectedPractice?.label ?? null,
          },
        });
        setLatestSubmitResult(
          buildQueuedResult({
            recordId: queued.id,
            category,
            family: family || null,
            entityId: selectedEntity.id,
          }),
        );
        await clearLogbookDraft();
        resetFormState();
        await refreshQueueState();
        return;
      }

      const mappedError = resolveApiFieldError(error, formFieldsForApiErrors);
      if (mappedError) {
        if (mappedError.fieldKey === 'workers') {
          setHarvestWorkersError(mappedError.message);
          return;
        }

        if (buildPracticeValidationFields(selectedPracticeCode).some((field) => field.key === mappedError.fieldKey)) {
          setPracticeFieldErrors((current) => ({
            ...current,
            [mappedError.fieldKey]: mappedError.message,
          }));
          return;
        }

        setFieldErrors((current) => ({
          ...current,
          [mappedError.fieldKey]: mappedError.message,
        }));
        return;
      }

      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Logbook submit failed.';
      setGeneralSubmitError(message);
    }
  }

  const headerContext = useMemo(() => {
    if (!selectedEntity) {
      return [];
    }

    if (category === 'CROP_OPERATION' && selectedEntity.type === 'CROP') {
      return dedupeStrings([
        readMetaText(selectedEntity, 'cropName') ?? selectedEntity.name,
        readMetaText(selectedEntity, 'lotName'),
        readMetaText(selectedEntity, 'fieldName'),
      ]);
    }

    return [selectedEntity.name];
  }, [category, selectedEntity]);

  if (isLoading && !session) {
    return (
      <View style={styles.stack}>
        <Skeleton height={56} />
        <Skeleton height={160} />
        <Skeleton height={160} />
      </View>
    );
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={() => void refreshContext()} />;
  }

  if (!session) {
    return (
      <EmptyState
        title="Logbook session unavailable"
        message="Unable to load the logbook session from the backend."
        actionLabel="Retry"
        onAction={() => void refreshContext()}
      />
    );
  }

  return (
    <View style={styles.stack}>
      {(pendingCount > 0 || recentSyncErrors.length > 0) ? (
        <DetailSectionCard
          title="Pending sync"
          description={`${pendingCount} queued submission${pendingCount === 1 ? '' : 's'}`}
          trailing={
            <AppButton
              label="Retry"
              mode="outlined"
              tone="neutral"
              onPress={() => void syncNow({ includeFailed: true })}
            />
          }
        >
          <Text style={styles.helperText}>
            {isOnline === false
              ? 'Offline. Queued submissions will retry when the connection returns.'
              : 'Retry failed or pending submissions manually from here.'}
          </Text>
          {recentSyncErrors.map((entry, index) => (
            <Text key={`${entry}-${index}`} style={styles.errorText}>
              {entry}
            </Text>
          ))}
        </DetailSectionCard>
      ) : null}

      {latestSubmitResult ? (
        <AlertStrip
          title={
            latestSubmitResult.status === 'queued'
              ? 'Queued for sync'
              : latestSubmitResult.status === 'saved_draft'
                ? 'Saved as draft'
                : 'Log saved'
          }
          subtitle={
            latestSubmitResult.warning?.message ??
            (latestSubmitResult.requiresFollowup
              ? 'Follow-up is still required for this record.'
              : 'Activity recorded successfully.')
          }
          icon="check-circle-outline"
          borderColor={palette.primaryDark}
          iconColor={palette.primaryDark}
        />
      ) : null}

      {generalSubmitError ? (
        <AlertStrip
          title="Unable to save"
          subtitle={generalSubmitError}
          icon="alert-circle-outline"
          borderColor={palette.destructive}
          iconColor={palette.destructive}
        />
      ) : null}

      <DetailSectionCard
        title="Logbook context"
        description="Select the field, activity category, and target entity."
      >
        <FormField label="Field" required>
          <AppSelect
            value={fieldId || null}
            options={session.fields.map((entry) => ({
              label: entry.name,
              value: entry.id,
            }))}
            onChange={(nextValue) => {
              setFieldId(nextValue);
              resetFormState({ nextFieldId: nextValue });
            }}
            placeholder="Select field"
            label="Field"
          />
        </FormField>

        <FormField label="Date" required>
          <AppDatePicker
            value={date}
            onChange={(nextValue) => {
              setDate(nextValue ?? date);
              if (nextValue) {
                setGeneralSubmitError(null);
              }
            }}
            label="Log date"
          />
        </FormField>

        <FormField label="Category" required>
          <AppSelect
            value={category}
            options={session.categories.map((entry) => ({
              label: entry.label,
              value: entry.key,
            }))}
            onChange={(nextValue) => {
              const nextCategory = nextValue as LogbookCategoryKey;
              setCategory(nextCategory);
              setEntityId('');
              setFamily('');
              setPracticeId('');
              resetFormState();
            }}
            placeholder="Select category"
            label="Category"
          />
        </FormField>

        <FormField label="Entity" required>
          <AppSelect
            value={entityId || null}
            options={entityOptions.map((entry) => ({
              label: entry.name,
              value: entry.id,
            }))}
            onChange={(nextValue) => {
              setEntityId(nextValue);
              resetFormState();
            }}
            placeholder="Select entity"
            label="Entity"
            searchable={entityOptions.length > 8}
            searchPlaceholder="Search entities"
          />
        </FormField>

        {isCropCategory(category) ? (
          <>
            <FormField label="Operation family" required>
              <AppSelect
                value={family || null}
                options={cropFamilyOptions}
                onChange={(nextValue) => {
                  setFamily(nextValue);
                  setPracticeId(`${DEFAULT_PRACTICE_ID_PREFIX}${nextValue}`);
                  resetFormState();
                }}
                placeholder="Select family"
                label="Operation family"
              />
            </FormField>

            <FormField label="Practice" required>
              <AppSelect
                value={practiceId || null}
                options={practiceOptions.map((entry) => ({
                  label: entry.label,
                  value: entry.id,
                }))}
                onChange={(nextValue) => {
                  setPracticeId(nextValue);
                  setPracticeFieldErrors({});
                  setPracticeSectionError(null);
                }}
                placeholder="Select practice"
                label="Practice"
                searchable={practiceOptions.length > 8}
                searchPlaceholder="Search practices"
              />
            </FormField>
          </>
        ) : null}

        {practiceCatalogLoading ? <Skeleton height={48} /> : null}
        {practiceCatalogErrorMessage ? (
          <Text style={styles.errorText}>{practiceCatalogErrorMessage}</Text>
        ) : null}

        {headerContext.length > 0 ? (
          <View style={styles.contextRow}>
            {headerContext.map((entry) => (
              <View key={entry} style={styles.contextChip}>
                <Text style={styles.contextChipText}>{entry}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </DetailSectionCard>

      <DetailSectionCard title={formTemplate.title} description="Enter activity details.">
        {formTemplate.fields.map((field) => {
          const value = formData[field.key];
          const fieldError = fieldErrors[field.key];
          const isReadOnlyIdentityField =
            field.key === 'operator_id' ||
            field.key === 'service_performed_by' ||
            field.key === 'performed_by_id' ||
            field.key === 'workerName';
          const isDerivedHarvestField =
            family === 'HARVEST' &&
            (field.key === 'totalHarvestedQuantity' || field.key === 'totalHarvestedUnit');

          if (field.type === 'products_editor') {
            return (
              <View key={field.key} style={styles.sectionGap}>
                <LogbookProductsEditor
                  token={token}
                  mode={field.editorMode ?? 'nutrient'}
                  cropId={category === 'CROP_OPERATION' ? selectedCropId : null}
                  value={value}
                  products={products}
                  warehouses={warehouses}
                  onChange={(rows) => updateFormField(field.key, rows)}
                  onTotalCostChange={(totalCost) => {
                    setComputedCost(totalCost);
                    if (autoCostFieldKey && !isCostManuallyOverridden) {
                      updateFormField(
                        autoCostFieldKey,
                        totalCost > 0 ? totalCost : '',
                        { isAutoCostUpdate: true },
                      );
                    }
                  }}
                  stockErrors={productRowErrors[field.key] ?? []}
                  title={field.label}
                />
                {fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}
              </View>
            );
          }

          if (field.type === 'textarea') {
            return (
              <FormField key={field.key} label={field.label} errorText={fieldError} required={field.required}>
                <AppTextArea
                  value={String(value ?? '')}
                  onChangeText={(nextValue) => updateFormField(field.key, nextValue)}
                  placeholder={field.placeholder}
                  error={Boolean(fieldError)}
                />
              </FormField>
            );
          }

          if (field.type === 'select') {
            return (
              <FormField key={field.key} label={field.label} errorText={fieldError} required={field.required}>
                <AppSelect
                  value={String(value ?? '') || null}
                  options={field.options ?? []}
                  onChange={(nextValue) => updateFormField(field.key, nextValue)}
                  placeholder={field.placeholder ?? `Select ${field.label}`}
                  label={field.label}
                />
              </FormField>
            );
          }

          if (field.type === 'checkbox') {
            return (
              <Pressable
                key={field.key}
                style={styles.checkboxRow}
                onPress={() => updateFormField(field.key, !value)}
              >
                <Checkbox status={value ? 'checked' : 'unchecked'} />
                <View style={styles.checkboxCopy}>
                  <Text style={styles.checkboxLabel}>{field.label}</Text>
                  {fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}
                </View>
              </Pressable>
            );
          }

          return (
            <FormField key={field.key} label={field.label} errorText={fieldError} required={field.required}>
              {field.type === 'date' ? (
                <AppDatePicker
                  value={typeof value === 'string' ? value : null}
                  onChange={(nextValue) => updateFormField(field.key, nextValue ?? '')}
                  label={field.label}
                />
              ) : (
                <AppInput
                  value={(() => {
                    if (isReadOnlyIdentityField) {
                      return currentUserName;
                    }

                    if (isDerivedHarvestField) {
                      const summary = summarizeHarvestWorkers(formData.workers, 'kg');
                      return field.key === 'totalHarvestedQuantity'
                        ? summary.totalQuantity > 0
                          ? String(Number(summary.totalQuantity.toFixed(2)))
                          : ''
                        : summary.unit;
                    }

                    if (typeof value === 'number') {
                      return value === 0 && field.type === 'number' ? '' : String(value);
                    }

                    return String(value ?? '');
                  })()}
                  onChangeText={(nextValue) => updateFormField(field.key, nextValue)}
                  placeholder={field.placeholder}
                  keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
                  disabled={isReadOnlyIdentityField || isDerivedHarvestField}
                  error={Boolean(fieldError)}
                />
              )}
              {autoCostFieldKey === field.key && computedCost !== null ? (
                <Text style={styles.helperText}>
                  {isCostManuallyOverridden
                    ? `Computed subtotal: ${computedCost.toFixed(2)}`
                    : `Auto-calculated from product lines: ${computedCost.toFixed(2)}`}
                </Text>
              ) : null}
              {isDerivedHarvestField ? (
                <Text style={styles.helperText}>
                  {`Calculated from ${summarizeHarvestWorkers(formData.workers, 'kg').rows.length} worker row(s).`}
                </Text>
              ) : null}
            </FormField>
          );
        })}

        <PracticeDynamicFieldsSection
          practiceCode={selectedPracticeCode}
          values={detailValues}
          onValuesChange={(nextValues) => {
            setDetailValues(nextValues);
            updateFormField('details', buildDetailsPayload(selectedPracticeCode, nextValues));
          }}
          requiredKeys={practiceRequiredKeys}
          fieldErrors={practiceFieldErrors}
          sectionError={practiceSectionError}
        />

        {family === 'HARVEST' ? (
          <DetailSectionCard title="Workers">
            <LogbookHarvestWorkersEditor
              value={formData.workers}
              onChange={(rows) => updateFormField('workers', rows as HarvestWorkerRow[])}
              users={users}
              contacts={contacts}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              error={harvestWorkersError}
            />
          </DetailSectionCard>
        ) : null}

        <AppButton
          label={isSubmitting ? 'Saving...' : 'Save log'}
          onPress={() => void handleSubmit()}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </DetailSectionCard>

      <PhiWarningDialog
        visible={phiWarningVisible}
        restrictions={phiRestrictions}
        mostRestrictiveDate={phiMostRestrictiveDate}
        onCancel={() => setPhiWarningVisible(false)}
        onProceed={() => {
          setPhiOverrideAcknowledged(true);
          setPhiWarningVisible(false);
          void handleSubmit({ skipPhiPrecheck: true });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  helperText: {
    ...typography.caption,
    color: palette.mutedForeground,
  },
  errorText: {
    ...typography.caption,
    color: palette.destructive,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  contextChip: {
    backgroundColor: palette.surfaceVariant,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  contextChipText: {
    ...typography.caption,
    color: palette.foreground,
    fontWeight: '600',
  },
  sectionGap: {
    gap: spacing.xs,
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  checkboxCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  checkboxLabel: {
    ...typography.body,
    color: palette.foreground,
  },
});
