import type { TaskAssetOption, TaskSummary } from '../../api/modules/tasks';

export const TASK_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
] as const;

export const TASK_PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
] as const;

export type TaskStatusOption = (typeof TASK_STATUS_OPTIONS)[number]['value'];
export type TaskPriorityOption = (typeof TASK_PRIORITY_OPTIONS)[number]['value'];
export type TaskFormMode = 'create' | 'edit';
export type TaskListMode = 'all' | TaskStatusOption;

export type TaskFormValues = {
  title: string;
  description: string;
  status: TaskStatusOption;
  priority: TaskPriorityOption;
  dueDate: string | null;
  assetId: string | null;
};

export type TaskAssetPayload = {
  assigned_to: string | null;
  field_id: string | null;
  livestock_id: string | null;
  equipment_id: string | null;
};

export type TaskDueDateSerialization =
  | {
      valid: true;
      dueDateTime: string | null;
      dueDate: string | null;
    }
  | {
      valid: false;
      dueDateTime: null;
      dueDate: null;
    };

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isIsoDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toUtcMidnightIso(dateOnly: string): string {
  return `${dateOnly}T00:00:00.000Z`;
}

function parseDateOnly(dateOnly: string): Date | null {
  if (!isDateOnly(dateOnly)) return null;

  const [yearRaw, monthRaw, dayRaw] = dateOnly.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return candidate;
}

function toFormDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isDateOnly(trimmed)) return trimmed;
  if (!isIsoDateTime(trimmed)) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return toIsoDateOnly(parsed);
}

export function serializeTaskDueDate(value: string | Date | null | undefined): TaskDueDateSerialization {
  if (value == null) {
    return { valid: true, dueDateTime: null, dueDate: null };
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { valid: false, dueDateTime: null, dueDate: null };
    }
    const iso = value.toISOString();
    return { valid: true, dueDateTime: iso, dueDate: iso.slice(0, 10) };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: true, dueDateTime: null, dueDate: null };
  }

  if (isDateOnly(trimmed)) {
    const parsedDateOnly = parseDateOnly(trimmed);
    if (!parsedDateOnly) {
      return { valid: false, dueDateTime: null, dueDate: null };
    }

    return {
      valid: true,
      dueDateTime: toUtcMidnightIso(trimmed),
      dueDate: trimmed,
    };
  }

  if (!isIsoDateTime(trimmed)) {
    return { valid: false, dueDateTime: null, dueDate: null };
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { valid: false, dueDateTime: null, dueDate: null };
  }

  const iso = parsed.toISOString();
  return { valid: true, dueDateTime: iso, dueDate: iso.slice(0, 10) };
}

function createEmptyTaskAssetPayload(): TaskAssetPayload {
  return {
    assigned_to: null,
    field_id: null,
    livestock_id: null,
    equipment_id: null,
  };
}

export function toTaskAssetPayload(
  selectedAssetId: string | null | undefined,
  options: TaskAssetOption[],
): TaskAssetPayload {
  const payload = createEmptyTaskAssetPayload();
  if (!selectedAssetId) {
    return payload;
  }

  const selectedOption = options.find((option) => option.value === selectedAssetId);
  if (!selectedOption) {
    return payload;
  }

  payload[selectedOption.binding] = selectedOption.value;
  return payload;
}

export function normalizeTaskStatus(value: string | null | undefined): TaskStatusOption {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'in_progress' || normalized === 'completed') {
    return normalized;
  }
  return 'pending';
}

export function normalizeTaskPriority(value: string | null | undefined): TaskPriorityOption {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'low' || normalized === 'high') {
    return normalized;
  }
  return 'medium';
}

export function toTaskFormValues(task?: TaskSummary | null): TaskFormValues {
  if (!task) {
    return {
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: null,
      assetId: null,
    };
  }

  return {
    title: task.title,
    description: task.description ?? '',
    status: normalizeTaskStatus(task.status),
    priority: normalizeTaskPriority(task.priority),
    dueDate: toFormDateOnly(task.dueDate),
    assetId:
      task.assetId ??
      task.fieldId ??
      task.equipmentId ??
      task.livestockId ??
      task.assignedTo ??
      null,
  };
}
