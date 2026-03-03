import type { TaskSummary } from '../../api/modules/tasks';

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
    dueDate: task.dueDate ?? null,
    assetId: task.assetId ?? null,
  };
}
