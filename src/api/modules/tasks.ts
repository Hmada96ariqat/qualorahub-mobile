import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';
import {
  isRecord,
  readArray,
  normalizeRows,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';
import { trackObservabilityEvent } from '../../utils/observability';

type CreateTaskRequestContract =
  operations['OrderWriteController_createTask_v1']['requestBody']['content']['application/json'];
type UpdateTaskRequestContract =
  operations['OrderWriteController_updateTask_v1']['requestBody']['content']['application/json'];

export type TaskStatus = string;

export type TaskSummary = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string | null;
  dueDate: string | null;
  assetId: string | null;
  assetLabel: string | null;
  assignedTo: string | null;
  fieldId: string | null;
  livestockId: string | null;
  equipmentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskAssetBinding = 'assigned_to' | 'field_id' | 'livestock_id' | 'equipment_id';

export type TaskAssetOption = {
  label: string;
  value: string;
  binding: TaskAssetBinding;
};

export type TaskComment = {
  id: string;
  message: string;
  author: string | null;
  createdAt: string | null;
};

export type TaskActivityEntry = {
  id: string;
  action: string;
  message: string | null;
  createdAt: string | null;
};

export type CreateTaskFallbackRequest = {
  title?: string;
  name?: string;
  description?: string | null;
  notes?: string | null;
  status?: TaskStatus;
  priority?: string | null;
  due_date_time?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
  field_id?: string | null;
  livestock_id?: string | null;
  equipment_id?: string | null;
  asset_id?: string | null;
};

export type UpdateTaskFallbackRequest = Partial<CreateTaskFallbackRequest>;

// TODO(openapi-blocker: QH-OAPI-006): Remove fallback union when CreateTaskDto is typed in OpenAPI.
export type CreateTaskRequest = CreateTaskRequestContract | CreateTaskFallbackRequest;

// TODO(openapi-blocker: QH-OAPI-006): Remove fallback union when UpdateTaskDto is typed in OpenAPI.
export type UpdateTaskRequest = UpdateTaskRequestContract | UpdateTaskFallbackRequest;

function readFirstString(record: UnknownRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = readString(record, key);
    if (value.length > 0) return value;
  }
  return fallback;
}

function readFirstNullableString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = readNullableString(record, key);
    if (value !== null) return value;
  }
  return null;
}

const TASK_ASSET_BINDING_KEYS = [
  'assigned_to',
  'field_id',
  'livestock_id',
  'equipment_id',
] as const;

const TASK_ASSET_BINDING_FROM_GROUP: Record<string, TaskAssetBinding | null> = {
  fields: 'field_id',
  equipment: 'equipment_id',
  livestock: 'livestock_id',
  profiles: 'assigned_to',
  users: 'assigned_to',
  lots: null,
  warehouses: null,
  housing_units: null,
};

const TASK_ASSET_GROUP_LABELS: Record<string, string> = {
  fields: 'Field',
  lots: 'Lot',
  warehouses: 'Warehouse',
  equipment: 'Equipment',
  livestock: 'Livestock',
  housing_units: 'Housing Unit',
  profiles: 'User',
  users: 'User',
};

const TASK_ASSET_BINDING_LABELS: Record<TaskAssetBinding, string> = {
  assigned_to: 'User',
  field_id: 'Field',
  livestock_id: 'Livestock',
  equipment_id: 'Equipment',
};

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PREFIX_REGEX = /^\d{4}-\d{2}-\d{2}T/;

function toUtcMidnightIso(dateOnly: string): string {
  return `${dateOnly}T00:00:00.000Z`;
}

function normalizeDueDateTimeValue(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (ISO_DATE_ONLY_REGEX.test(trimmed)) {
    return toUtcMidnightIso(trimmed);
  }

  if (!ISO_DATE_TIME_PREFIX_REGEX.test(trimmed)) {
    throw new Error(
      'Invalid task due date. Expected ISO-8601 datetime or YYYY-MM-DD date-only format.',
    );
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid task due date. Unable to parse provided datetime value.');
  }

  return parsed.toISOString();
}

function readNormalizedDueDateTime(record: UnknownRecord): string | null | undefined {
  if ('due_date_time' in record || 'dueDateTime' in record) {
    return normalizeDueDateTimeValue(readFirstNullableString(record, ['due_date_time', 'dueDateTime']));
  }

  if ('due_date' in record || 'dueDate' in record) {
    return normalizeDueDateTimeValue(readFirstNullableString(record, ['due_date', 'dueDate']));
  }

  return undefined;
}

function readBindingValue(record: UnknownRecord, key: TaskAssetBinding): string | null | undefined {
  const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  if (!(key in record) && !(camelKey in record)) {
    return undefined;
  }

  return readFirstNullableString(record, [key, camelKey]);
}

function parseTaskSummary(payload: unknown): TaskSummary | null {
  if (!isRecord(payload)) return null;

  const title = readFirstString(payload, ['title', 'name', 'task_name']);
  const assignedTo = readFirstNullableString(payload, ['assigned_to', 'assignedTo']);
  const fieldId = readFirstNullableString(payload, ['field_id', 'fieldId']);
  const livestockId = readFirstNullableString(payload, ['livestock_id', 'livestockId']);
  const equipmentId = readFirstNullableString(payload, ['equipment_id', 'equipmentId']);
  const legacyAssetId = readFirstNullableString(payload, ['asset_id', 'assetId']);

  return {
    id: readString(payload, 'id'),
    title: title || 'Untitled task',
    description: readFirstNullableString(payload, ['description', 'notes', 'message']),
    status: readFirstString(payload, ['status', 'task_status'], 'pending'),
    priority: readFirstNullableString(payload, ['priority', 'task_priority']),
    dueDate: readFirstNullableString(payload, [
      'due_date_time',
      'dueDateTime',
      'due_date',
      'dueDate',
      'due_at',
    ]),
    assetId: fieldId ?? equipmentId ?? livestockId ?? assignedTo ?? legacyAssetId,
    assetLabel: readFirstNullableString(payload, [
      'asset_name',
      'assetName',
      'asset_label',
      'field_name',
      'equipment_name',
      'livestock_name',
      'assigned_to_name',
      'assignee_name',
    ]),
    assignedTo,
    fieldId,
    livestockId,
    equipmentId,
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function inferTaskAssetBinding(record: UnknownRecord): TaskAssetBinding | null {
  const directFieldId = readNullableString(record, 'field_id');
  if (directFieldId) return 'field_id';

  const directEquipmentId = readNullableString(record, 'equipment_id');
  if (directEquipmentId) return 'equipment_id';

  const directLivestockId = readNullableString(record, 'livestock_id');
  if (directLivestockId) return 'livestock_id';

  const directAssignedTo = readNullableString(record, 'assigned_to');
  if (directAssignedTo) return 'assigned_to';

  const legacyUserId = readNullableString(record, 'user_id');
  if (legacyUserId) return 'assigned_to';

  const kind = readFirstString(record, ['type', 'asset_type', 'group']).trim().toLowerCase();
  if (kind in TASK_ASSET_BINDING_FROM_GROUP) {
    return TASK_ASSET_BINDING_FROM_GROUP[kind] ?? null;
  }

  return null;
}

function toTaskAssetLabel(rawLabel: string, binding: TaskAssetBinding, groupLabel?: string): string {
  const prefix = groupLabel ?? TASK_ASSET_BINDING_LABELS[binding];
  return rawLabel.startsWith(`${prefix}:`) ? rawLabel : `${prefix}: ${rawLabel}`;
}

function parseTaskAssetOption(
  payload: unknown,
  bindingHint?: TaskAssetBinding,
  groupLabel?: string,
): TaskAssetOption | null {
  if (!isRecord(payload)) return null;

  const value = readFirstString(payload, [
    'id',
    'value',
    'field_id',
    'equipment_id',
    'livestock_id',
    'assigned_to',
    'asset_id',
    'user_id',
  ]);
  const label = readFirstString(payload, [
    'name',
    'label',
    'asset_name',
    'display_name',
    'email',
    'barn_name',
    'unit_code',
  ]);
  const binding = bindingHint ?? inferTaskAssetBinding(payload);

  if (!value || !label || !binding) return null;

  return {
    value,
    label: toTaskAssetLabel(label, binding, groupLabel),
    binding,
  };
}

function parseTaskAssetOptions(payload: unknown): TaskAssetOption[] {
  if (Array.isArray(payload)) {
    return parseList(payload, (value) => parseTaskAssetOption(value));
  }

  if (!isRecord(payload)) {
    return [];
  }

  const options: TaskAssetOption[] = [];
  const seen = new Set<string>();

  for (const [groupKey, rawValue] of Object.entries(payload)) {
    const binding = TASK_ASSET_BINDING_FROM_GROUP[groupKey];
    if (!binding) {
      continue;
    }

    const groupLabel = TASK_ASSET_GROUP_LABELS[groupKey] ?? TASK_ASSET_BINDING_LABELS[binding];
    for (const row of parseList(rawValue, (value) => parseTaskAssetOption(value, binding, groupLabel))) {
      const dedupeKey = `${row.binding}:${row.value}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      options.push(row);
    }
  }

  return options;
}

function parseTaskComment(payload: unknown): TaskComment | null {
  if (!isRecord(payload)) return null;

  const message = readFirstString(payload, ['comment', 'message', 'text', 'content']);
  if (!message) return null;

  return {
    id: readString(payload, 'id'),
    message,
    author: readFirstNullableString(payload, ['author_name', 'created_by', 'user_name']),
    createdAt: readFirstNullableString(payload, ['created_at', 'createdAt']),
  };
}

function parseTaskActivityEntry(payload: unknown): TaskActivityEntry | null {
  if (!isRecord(payload)) return null;

  const details = isRecord(payload.details) ? payload.details : null;
  const detailMessage = details
    ? [readNullableString(details, 'title'), readNullableString(details, 'status')]
        .filter((value): value is string => Boolean(value))
        .join(' • ')
    : null;

  return {
    id: readString(payload, 'id'),
    action: readFirstString(payload, ['action', 'type'], 'activity'),
    message: readFirstNullableString(payload, ['description', 'message']) ?? detailMessage,
    createdAt: readFirstNullableString(payload, ['created_at', 'createdAt', 'timestamp']),
  };
}

function parseList<T>(payload: unknown, parser: (value: unknown) => T | null): T[] {
  return normalizeRows(payload)
    .map((item) => parser(item))
    .filter((item): item is T => Boolean(item));
}

function parseFirst<T>(payload: unknown, parser: (value: unknown) => T | null, errorText: string): T {
  const rows = parseList(payload, parser);
  if (rows.length === 0) {
    throw new Error(errorText);
  }
  return rows[0];
}

function normalizeTaskRequest(input: CreateTaskRequest | UpdateTaskRequest): UnknownRecord {
  const record = isRecord(input) ? input : {};
  const normalized: UnknownRecord = {};

  if ('title' in record || 'name' in record) {
    normalized.title = readFirstString(record, ['title', 'name']);
  }
  if ('description' in record || 'notes' in record) {
    normalized.description = readFirstNullableString(record, ['description', 'notes']);
  }
  if ('status' in record) {
    normalized.status = readString(record, 'status');
  }
  if ('priority' in record) {
    normalized.priority = record.priority ?? null;
  }

  const dueDateTime = readNormalizedDueDateTime(record);
  if (dueDateTime !== undefined) {
    normalized.due_date_time = dueDateTime;
  }

  if ('assigned_users' in record || 'assignedUsers' in record) {
    const values =
      ('assigned_users' in record ? readArray(record, 'assigned_users') : readArray(record, 'assignedUsers'))
        .map((value) => (typeof value === 'string' ? value : null))
        .filter((value): value is string => Boolean(value));

    normalized.assigned_users = values;
  }

  for (const key of TASK_ASSET_BINDING_KEYS) {
    const value = readBindingValue(record, key);
    if (value !== undefined) {
      normalized[key] = value;
    }
  }

  return normalized;
}

// TODO(openapi-blocker: QH-OAPI-007): Replace unknown payload parsing once task responses are typed.
export async function listTasks(token: string): Promise<TaskSummary[]> {
  const { data } = await apiClient.get<unknown>('/tasks', { token });
  return parseList(data, parseTaskSummary);
}

// TODO(openapi-blocker: QH-OAPI-007): Replace unknown payload parsing once task responses are typed.
export async function getTaskById(token: string, taskId: string): Promise<TaskSummary> {
  const { data } = await apiClient.get<unknown>(`/tasks/${taskId}`, { token });
  return parseFirst(data, parseTaskSummary, 'Tasks API returned an empty detail payload.');
}

// TODO(openapi-blocker: QH-OAPI-007): Replace unknown payload parsing once task responses are typed.
export async function createTask(token: string, input: CreateTaskRequest): Promise<TaskSummary> {
  const body = normalizeTaskRequest(input);
  const { data } = await apiClient.post<unknown, UnknownRecord>('/tasks', {
    token,
    body,
    idempotencyKey: `tasks-create-${Date.now()}`,
  });
  return parseFirst(data, parseTaskSummary, 'Tasks API returned an empty create payload.');
}

// TODO(openapi-blocker: QH-OAPI-007): Replace unknown payload parsing once task responses are typed.
export async function updateTask(
  token: string,
  taskId: string,
  input: UpdateTaskRequest,
): Promise<TaskSummary> {
  const body = normalizeTaskRequest(input);
  const rawInput = isRecord(input) ? input : {};
  const legacyDueDate = readFirstNullableString(rawInput, ['due_date', 'dueDate']);

  trackObservabilityEvent({
    type: 'api.request',
    level: 'info',
    message: `PATCH /tasks/${taskId} payload`,
    context: {
      method: 'PATCH',
      path: `/tasks/${taskId}`,
      payloadKeys: Object.keys(body).sort(),
      due_date_time: body.due_date_time ?? null,
      due_date: legacyDueDate,
    },
  });

  const { data } = await apiClient.patch<unknown, UnknownRecord>(`/tasks/${taskId}`, {
    token,
    body,
  });
  return parseFirst(data, parseTaskSummary, 'Tasks API returned an empty update payload.');
}

export async function updateTaskStatus(
  token: string,
  taskId: string,
  status: TaskStatus,
): Promise<TaskSummary> {
  return updateTask(token, taskId, { status });
}

export async function deleteTask(token: string, taskId: string): Promise<void> {
  await apiClient.delete<unknown>(`/tasks/${taskId}`, { token });
}

// TODO(openapi-blocker: QH-OAPI-007): Replace unknown payload parsing once task responses are typed.
export async function listTaskAssetOptions(token: string): Promise<TaskAssetOption[]> {
  const { data } = await apiClient.get<unknown>('/tasks/assets/options', { token });
  return parseTaskAssetOptions(data);
}

// TODO(openapi-blocker: QH-OAPI-007): Replace unknown payload parsing once task responses are typed.
export async function listTaskComments(token: string, taskId: string): Promise<TaskComment[]> {
  const { data } = await apiClient.get<unknown>(`/tasks/${taskId}/comments`, { token });
  return parseList(data, parseTaskComment);
}

// TODO(openapi-blocker: QH-OAPI-007): Replace unknown payload parsing once task responses are typed.
export async function listTaskActivity(token: string, taskId: string): Promise<TaskActivityEntry[]> {
  const { data } = await apiClient.get<unknown>(`/tasks/${taskId}/activity`, { token });
  return parseList(data, parseTaskActivityEntry);
}

export const TASKS_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.TASKS_REQUEST_DTOS;
export const TASKS_RESPONSE_SCHEMA_BLOCKER_ID = OPENAPI_BLOCKER_IDS.TASKS_RESPONSE_SCHEMAS;
