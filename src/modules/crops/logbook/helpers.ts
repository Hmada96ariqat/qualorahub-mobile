import type { LogbookCategoryKey, LogbookDraftState, LogbookFormField, LogbookOperationFamily, LogbookSubmitResult } from './types';

export const LOGBOOK_DRAFT_STORAGE_KEY = 'qualora.logbook.draft.v1';

export function isCropCategory(category: LogbookCategoryKey | null | undefined): boolean {
  return category === 'CROP_OPERATION';
}

export function localDateToYmd(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toNullableText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function toObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry),
  );
}

export function readMetaText(entity: { meta?: Record<string, unknown> | null }, key: string): string | null {
  const value = entity.meta?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function parseInitialFormData(
  date: string,
  fieldId: string | null,
  userId: string | null,
  userDisplayName: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    date,
    date_used: date,
    date_performed: date,
    plantingDate: date,
    harvestDate: date,
    operationDate: date,
    dateApplied: date,
    treatment_date: date,
    operator_id: userId ?? '',
    service_performed_by: userId ? `user:${userId}` : '',
    performed_by_id: userId ?? '',
    workerName: userDisplayName,
  };

  if (fieldId) {
    payload.field_id = fieldId;
  }

  return payload;
}

export function withOptionalSubmitDefaults(
  payload: Record<string, unknown>,
  args: {
    category: LogbookCategoryKey;
    userId: string | null;
  },
): Record<string, unknown> {
  const next = { ...payload };

  if (args.userId) {
    if (!toNullableText(next.operator_id)) {
      next.operator_id = args.userId;
    }
    if (!toNullableText(next.performed_by_id)) {
      next.performed_by_id = args.userId;
    }
    if (!toNullableText(next.service_performed_by)) {
      next.service_performed_by = `user:${args.userId}`;
    }
  }

  if (args.category === 'EQUIPMENT_USAGE' && !toNullableText(next.usage_purpose)) {
    next.usage_purpose = 'Logged via logbook';
  }

  if (args.category === 'EQUIPMENT_MAINTENANCE') {
    if (!toNullableText(next.service_type)) {
      next.service_type = 'scheduled';
    }
    if (!toNullableText(next.service_description)) {
      next.service_description = 'Logged via logbook';
    }
  }

  if (args.category === 'ANIMAL_FEED_WATER') {
    if (!toNullableText(next.type)) {
      next.type = 'Feed';
    }
    const quantity = Number(next.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      next.quantity = 1;
    }
  }

  if (args.category === 'ANIMAL_HOUSE_MAINTENANCE' && !toNullableText(next.service_type)) {
    next.service_type = 'General maintenance';
  }

  return next;
}

export function getAutoCostFieldKey(fields: Array<{ key: string }> | undefined): string | null {
  if (!fields) {
    return null;
  }

  const candidates = ['totalCost', 'cost', 'total_cost'];
  for (const key of candidates) {
    if (fields.some((field) => field.key === key)) {
      return key;
    }
  }

  return null;
}

export function dedupeStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0),
    ),
  );
}

export function findProductsEditorField(
  fields: LogbookFormField[] | undefined,
): LogbookFormField | null {
  return fields?.find((field) => field.type === 'products_editor') ?? null;
}

export function summarizeHarvestWorkers(
  value: unknown,
  fallbackUnit = 'kg',
): {
  rows: Array<{
    workerId: string;
    workerName: string;
    quantity: number;
    unit: string;
    cost?: number;
  }>;
  totalQuantity: number;
  unit: string;
} {
  const rows = toObjectArray(value)
    .map((entry) => {
      const quantity = toNullableNumber(entry.quantity) ?? 0;
      const cost = toNullableNumber(entry.cost);
      return {
        workerId: String(entry.workerId ?? '').trim(),
        workerName: String(entry.workerName ?? '').trim(),
        quantity: quantity > 0 ? quantity : 0,
        unit: String(entry.unit ?? fallbackUnit).trim() || fallbackUnit,
        ...(cost !== null && cost >= 0 ? { cost } : {}),
      };
    })
    .filter(
      (entry) =>
        entry.workerId.length > 0 ||
        entry.workerName.length > 0 ||
        entry.quantity > 0,
    );

  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  return {
    rows,
    totalQuantity,
    unit: rows[0]?.unit ?? fallbackUnit,
  };
}

export function buildQueuedSubmitResult(args: {
  recordId: string;
  category: LogbookCategoryKey;
  family: LogbookOperationFamily | null;
  entityId: string;
  message?: string;
}): LogbookSubmitResult {
  return {
    status: 'queued',
    recordId: args.recordId,
    category: args.category,
    family: args.family,
    entityId: args.entityId,
    requires_followup: true,
    warning: {
      code: 'QUEUED_OFFLINE',
      message:
        args.message ??
        'Saved locally and queued for sync. Final validation will run when you are back online.',
    },
  };
}

export function isCostField(key: string): boolean {
  return key.toLowerCase().includes('cost');
}

export function isValidDraftState(value: unknown): value is LogbookDraftState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const draft = value as LogbookDraftState;
  return (
    typeof draft.fieldId === 'string' &&
    typeof draft.date === 'string' &&
    typeof draft.category === 'string' &&
    typeof draft.entityType === 'string' &&
    typeof draft.entityId === 'string' &&
    typeof draft.family === 'string' &&
    typeof draft.practiceId === 'string' &&
    draft.formData !== null &&
    typeof draft.formData === 'object' &&
    !Array.isArray(draft.formData) &&
    draft.detailValues !== null &&
    typeof draft.detailValues === 'object' &&
    !Array.isArray(draft.detailValues) &&
    typeof draft.isCostManuallyOverridden === 'boolean' &&
    (draft.computedCost === null || typeof draft.computedCost === 'number') &&
    typeof draft.updatedAt === 'string'
  );
}
