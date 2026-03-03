# Code Map: `src/modules/tasks/contracts.ts`

## Purpose
Feature module implementation.

## Imports
- `import type { TaskSummary } from '../../api/modules/tasks';`

## Exports
- `export const TASK_STATUS_OPTIONS = [`
- `export const TASK_PRIORITY_OPTIONS = [`
- `export type TaskStatusOption = (typeof TASK_STATUS_OPTIONS)[number]['value'];`
- `export type TaskPriorityOption = (typeof TASK_PRIORITY_OPTIONS)[number]['value'];`
- `export type TaskFormMode = 'create' | 'edit';`
- `export type TaskListMode = 'all' | TaskStatusOption;`
- `export type TaskFormValues = {`
- `export function normalizeTaskStatus(value: string | null | undefined): TaskStatusOption {`
- `export function normalizeTaskPriority(value: string | null | undefined): TaskPriorityOption {`
- `export function toTaskFormValues(task?: TaskSummary | null): TaskFormValues {`
