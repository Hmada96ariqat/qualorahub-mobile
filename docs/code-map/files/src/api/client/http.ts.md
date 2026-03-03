# Code Map: `src/api/client/http.ts`

## Purpose
API client infrastructure and request handling.

## Imports
- `import { env } from '../../config/env';`
- `import { normalizeApiError } from './errors';`
- `import { trackApiError, trackApiRequest } from '../../utils/observability';`

## Exports
- `export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';`
- `export type ApiClientRequestOptions<TBody = unknown> = {`
- `export type ApiClientResponse<T> = {`
- `export type UnauthorizedEvent = {`
- `export function setUnauthorizedHandler(`
- `export async function apiClientRequest<TResponse, TBody = unknown>(`
- `export const apiClient = {`
- `export async function httpRequest<TResponse, TBody = unknown>(`
