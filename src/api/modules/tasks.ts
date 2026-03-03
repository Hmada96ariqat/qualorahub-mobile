import { apiClient } from '../client';
import type { operations } from '../generated/schema';
import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';
import {
  isRecord,
  normalizeRows,
  readNullableString,
  readString,
  type UnknownRecord,
} from './runtime-parsers';

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
  createdAt: string;
  updatedAt: string;
};

export type TaskAssetOption = {
  label: string;
  value: string;
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
  due_date?: string | null;
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

function parseTaskSummary(payload: unknown): TaskSummary | null {
  if (!isRecord(payload)) return null;

  const title = readFirstString(payload, ['title', 'name', 'task_name']);

  return {
    id: readString(payload, 'id'),
    title: title || 'Untitled task',
    description: readFirstNullableString(payload, ['description', 'notes', 'message']),
    status: readFirstString(payload, ['status', 'task_status'], 'pending'),
    priority: readFirstNullableString(payload, ['priority', 'task_priority']),
    dueDate: readFirstNullableString(payload, ['due_date', 'dueDate', 'due_at']),
    assetId: readFirstNullableString(payload, ['asset_id', 'assetId']),
    assetLabel: readFirstNullableString(payload, ['asset_name', 'assetName', 'asset_label']),
    createdAt: readFirstString(payload, ['created_at', 'createdAt']),
    updatedAt: readFirstString(payload, ['updated_at', 'updatedAt']),
  };
}

function parseTaskAssetOption(payload: unknown): TaskAssetOption | null {
  if (!isRecord(payload)) return null;

  const value = readFirstString(payload, ['id', 'value', 'asset_id', 'user_id']);
  const label = readFirstString(payload, [
    'name',
    'label',
    'asset_name',
    'display_name',
    'email',
    'barn_name',
    'unit_code',
  ]);

  if (!value || !label) return null;

  return { value, label };
}

const ASSET_GROUP_LABELS: Record<string, string> = {
  fields: 'Field',
  lots: 'Lot',
  warehouses: 'Warehouse',
  equipment: 'Equipment',
  livestock: 'Livestock',
  housing_units: 'Housing Unit',
  profiles: 'User',
};

function parseTaskAssetOptions(payload: unknown): TaskAssetOption[] {
  if (Array.isArray(payload)) {
    return parseList(payload, parseTaskAssetOption);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const options: TaskAssetOption[] = [];
  const seen = new Set<string>();

  for (const [groupKey, rawValue] of Object.entries(payload)) {
    const groupLabel = ASSET_GROUP_LABELS[groupKey] ?? groupKey;
    for (const row of parseList(rawValue, parseTaskAssetOption)) {
      if (seen.has(row.value)) continue;
      seen.add(row.value);

      options.push({
        value: row.value,
        label: `${groupLabel}: ${row.label}`,
      });
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
  if ('status' in record) normalized.status = readString(record, 'status');
  if ('priority' in record) normalized.priority = record.priority ?? null;
  if ('due_date' in record) normalized.due_date = record.due_date ?? null;
  if ('asset_id' in record) normalized.asset_id = record.asset_id ?? null;

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
  const { data } = await apiClient.post<unknown, UnknownRecord>('/tasks', {
    token,
    body: normalizeTaskRequest(input),
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
  const { data } = await apiClient.patch<unknown, UnknownRecord>(`/tasks/${taskId}`, {
    token,
    body: normalizeTaskRequest(input),
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
