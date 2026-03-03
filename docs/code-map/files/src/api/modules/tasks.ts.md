# Code Map: `src/api/modules/tasks.ts`

## Purpose
Typed API module wrapper for backend endpoints.

## Imports
- `import { apiClient } from '../client';`
- `import type { operations } from '../generated/schema';`
- `import { OPENAPI_BLOCKER_IDS } from './openapi-blockers';`
- `import {`

## Exports
- `export type TaskStatus = string;`
- `export type TaskSummary = {`
- `export type TaskAssetOption = {`
- `export type TaskComment = {`
- `export type TaskActivityEntry = {`
- `export type CreateTaskFallbackRequest = {`
- `export type UpdateTaskFallbackRequest = Partial<CreateTaskFallbackRequest>;`
- `export type CreateTaskRequest = CreateTaskRequestContract | CreateTaskFallbackRequest;`
- `export type UpdateTaskRequest = UpdateTaskRequestContract | UpdateTaskFallbackRequest;`
- `export async function listTasks(token: string): Promise<TaskSummary[]> {`
- `export async function getTaskById(token: string, taskId: string): Promise<TaskSummary> {`
- `export async function createTask(token: string, input: CreateTaskRequest): Promise<TaskSummary> {`
- `export async function updateTask(`
- `export async function updateTaskStatus(`
- `export async function deleteTask(token: string, taskId: string): Promise<void> {`
- `export async function listTaskAssetOptions(token: string): Promise<TaskAssetOption[]> {`
- `export async function listTaskComments(token: string, taskId: string): Promise<TaskComment[]> {`
- `export async function listTaskActivity(token: string, taskId: string): Promise<TaskActivityEntry[]> {`
- `export const TASKS_REQUEST_DTO_BLOCKER_ID = OPENAPI_BLOCKER_IDS.TASKS_REQUEST_DTOS;`
- `export const TASKS_RESPONSE_SCHEMA_BLOCKER_ID = OPENAPI_BLOCKER_IDS.TASKS_RESPONSE_SCHEMAS;`
