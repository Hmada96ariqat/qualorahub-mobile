import { env } from '../../config/env';
import { normalizeApiError } from './errors';
import { trackApiError, trackApiRequest } from '../../utils/observability';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type ApiClientRequestOptions<TBody = unknown> = {
  method?: HttpMethod;
  token?: string;
  body?: TBody;
  idempotencyKey?: string;
  traceId?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type ApiClientResponse<T> = {
  data: T;
  status: number;
  traceId: string;
};

export type UnauthorizedEvent = {
  path: string;
  traceId: string;
  status: number;
};

let unauthorizedHandler: ((event: UnauthorizedEvent) => void) | undefined;
let forbiddenHandler: ((event: UnauthorizedEvent) => void) | undefined;

export function setUnauthorizedHandler(
  handler: ((event: UnauthorizedEvent) => void) | undefined,
): void {
  unauthorizedHandler = handler;
}

export function setForbiddenHandler(
  handler: ((event: UnauthorizedEvent) => void) | undefined,
): void {
  forbiddenHandler = handler;
}

function createTraceId(): string {
  const now = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `qh_${now}_${random}`;
}

function parsePayload(text: string): unknown {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildUrl(path: string): string {
  return `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiClientRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiClientRequestOptions<TBody> = {},
): Promise<ApiClientResponse<TResponse>> {
  const method = options.method ?? 'GET';
  const traceId = options.traceId ?? createTraceId();
  const url = buildUrl(path);
  const startedAt = Date.now();

  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      'X-Trace-Id': traceId,
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const text = await res.text();
  const payload = parsePayload(text);
  const responseTraceId = res.headers.get('x-trace-id') ?? traceId;
  const durationMs = Date.now() - startedAt;

  if (!res.ok) {
    const payloadRecord =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : null;
    const code = typeof payloadRecord?.code === 'string' ? payloadRecord.code : undefined;
    const errorMessage =
      typeof payloadRecord?.message === 'string' ? payloadRecord.message : undefined;

    trackApiError({
      method,
      path,
      status: res.status,
      traceId: responseTraceId,
      durationMs,
      code,
      errorMessage,
    });

    if (
      res.status === 401 &&
      !path.startsWith('/auth/login') &&
      !path.startsWith('/auth/refresh')
    ) {
      unauthorizedHandler?.({
        path,
        traceId: responseTraceId,
        status: res.status,
      });
    }

    // Phase 3 (BUG 3): On 403, trigger RBAC refresh so stale permissions get updated
    if (res.status === 403) {
      forbiddenHandler?.({
        path,
        traceId: responseTraceId,
        status: res.status,
      });
    }

    throw normalizeApiError(
      res.status,
      payload,
      `Request failed (${res.status})`,
      responseTraceId,
    );
  }

  trackApiRequest({
    method,
    path,
    status: res.status,
    traceId: responseTraceId,
    durationMs,
  });

  return {
    data: payload as TResponse,
    status: res.status,
    traceId: responseTraceId,
  };
}

export const apiClient = {
  request: apiClientRequest,
  get<TResponse>(path: string, options: Omit<ApiClientRequestOptions<never>, 'method' | 'body'> = {}) {
    return apiClientRequest<TResponse>(path, {
      ...options,
      method: 'GET',
    });
  },
  post<TResponse, TBody = unknown>(
    path: string,
    options: Omit<ApiClientRequestOptions<TBody>, 'method'> = {},
  ) {
    return apiClientRequest<TResponse, TBody>(path, {
      ...options,
      method: 'POST',
    });
  },
  patch<TResponse, TBody = unknown>(
    path: string,
    options: Omit<ApiClientRequestOptions<TBody>, 'method'> = {},
  ) {
    return apiClientRequest<TResponse, TBody>(path, {
      ...options,
      method: 'PATCH',
    });
  },
  delete<TResponse, TBody = unknown>(
    path: string,
    options: Omit<ApiClientRequestOptions<TBody>, 'method'> = {},
  ) {
    return apiClientRequest<TResponse, TBody>(path, {
      ...options,
      method: 'DELETE',
    });
  },
};

export async function httpRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiClientRequestOptions<TBody> = {},
): Promise<TResponse> {
  const response = await apiClientRequest<TResponse, TBody>(path, options);
  return response.data;
}
