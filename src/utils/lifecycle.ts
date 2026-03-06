import { ApiError } from '../api/client';

export type LifecycleConflictBlocker = {
  kind: string;
  count: number | null;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toTitleCase(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function joinHumanList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function parseQuotedLabel(message: string): string | null {
  const match = message.match(/"([^"]+)"/);
  return match?.[1]?.trim() || null;
}

function toBlockerLabel(blocker: LifecycleConflictBlocker): string {
  const count = blocker.count;
  switch (blocker.kind) {
    case 'active_lots':
      return count === 1 ? '1 active lot' : `${count ?? 'Multiple'} active lots`;
    case 'active_housing_units':
      return count === 1 ? '1 active housing unit' : `${count ?? 'Multiple'} active housing units`;
    case 'operational_crops':
      return count === 1
        ? '1 planned or active crop'
        : `${count ?? 'Multiple'} planned or active crops`;
    case 'active_production_cycles':
      return count === 1
        ? '1 active production cycle'
        : `${count ?? 'Multiple'} active production cycles`;
    default:
      return blocker.message;
  }
}

function formatBlockerConflictMessage(error: ApiError): string | null {
  const blockers = getLifecycleConflictBlockers(error);
  if (blockers.length === 0) return null;

  const blockerSummary = joinHumanList(blockers.map(toBlockerLabel));
  const fieldMatch = error.message.match(/^Cannot deactivate field\b/i);
  const lotMatch = error.message.match(/^Cannot deactivate lot\b/i);
  const cropMatch = error.message.match(/^Cannot deactivate crop\b/i);

  if (fieldMatch) {
    const fieldLabel = parseQuotedLabel(error.message);
    const subject = fieldLabel ? `Field ${fieldLabel}` : 'This field';
    return `${subject} can't be deactivated yet because it still has ${blockerSummary}. Resolve those first, then try again.`;
  }

  if (lotMatch) {
    return `This lot can't be deactivated yet because it still has ${blockerSummary}. Resolve those first, then try again.`;
  }

  if (cropMatch) {
    return `This crop can't be deactivated yet because it still has ${blockerSummary}. Resolve those first, then try again.`;
  }

  return `This record can't be updated yet because it still has ${blockerSummary}. Resolve those first, then try again.`;
}

function formatRequiredStatusConflictMessage(error: ApiError): string | null {
  if (!isRecord(error.details)) {
    return null;
  }

  const entity =
    typeof error.details.entity === 'string' && error.details.entity.trim().length > 0
      ? error.details.entity.trim().toLowerCase()
      : '';
  const requiredStatus =
    typeof error.details.requiredStatus === 'string' && error.details.requiredStatus.trim().length > 0
      ? error.details.requiredStatus.trim().toLowerCase()
      : '';

  if (entity !== 'field' || requiredStatus !== 'active') {
    return null;
  }

  if (/reactivat/i.test(error.message)) {
    return "This record can't be reactivated until its field is active. Reactivate the field first, then try again.";
  }

  if (/activat/i.test(error.message) || /inactive field/i.test(error.message)) {
    return "This record can't be activated while its field is inactive. Activate the field first, then try again.";
  }

  return "This record requires an active field before it can be used in this workflow.";
}

function formatLifecycleConflictMessage(error: ApiError): string | null {
  const blockerMessage = formatBlockerConflictMessage(error);
  if (blockerMessage) return blockerMessage;

  const requiredStatusMessage = formatRequiredStatusConflictMessage(error);
  if (requiredStatusMessage) return requiredStatusMessage;

  if (error.status === 409 && /does not belong to the selected field/i.test(error.message)) {
    return toTitleCase(error.message);
  }

  return null;
}

export function normalizeLifecycleStatus(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function isActiveLifecycleStatus(value: string | null | undefined): boolean {
  return normalizeLifecycleStatus(value) === 'active';
}

export function isInactiveLifecycleStatus(value: string | null | undefined): boolean {
  return normalizeLifecycleStatus(value) === 'inactive';
}

export function isOperationalCropStatus(value: string | null | undefined): boolean {
  const normalized = normalizeLifecycleStatus(value);
  return normalized === 'planned' || normalized === 'active';
}

export function getLifecycleConflictBlockers(error: unknown): LifecycleConflictBlocker[] {
  if (!(error instanceof ApiError) || !isRecord(error.details)) {
    return [];
  }

  const blockers = error.details.blockers;
  if (!Array.isArray(blockers)) {
    return [];
  }

  return blockers
    .map((blocker) => {
      if (!isRecord(blocker)) return null;

      const kind = readString(blocker.kind);
      const message = readString(blocker.message);
      return {
        kind,
        count: readCount(blocker.count),
        message,
      };
    })
    .filter((blocker): blocker is LifecycleConflictBlocker => Boolean(blocker && blocker.kind && blocker.message));
}

export function formatApiErrorMessage(error: unknown, fallback: string): string {
  const lifecycleMessage = error instanceof ApiError ? formatLifecycleConflictMessage(error) : null;
  const baseMessage =
    error instanceof ApiError
      ? lifecycleMessage ?? (error.message.trim().length > 0 ? error.message.trim() : fallback)
      : error instanceof Error && error.message.trim().length > 0
        ? error.message.trim()
        : fallback;
  const traceId =
    error instanceof ApiError && typeof error.traceId === 'string' && error.traceId.trim().length > 0
      ? error.traceId.trim()
      : null;

  const blockerMessages = lifecycleMessage
    ? []
    : getLifecycleConflictBlockers(error)
        .map((blocker) => blocker.message)
        .filter((message) => !baseMessage.includes(message));

  const message = blockerMessages.length > 0 ? `${baseMessage} ${blockerMessages.join(' ')}` : baseMessage;
  return traceId ? `${message} (trace: ${traceId})` : message;
}
