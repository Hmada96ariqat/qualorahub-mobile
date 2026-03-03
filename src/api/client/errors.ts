type ApiErrorInit = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
  traceId?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  traceId?: string;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.traceId = init.traceId;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeApiError(
  status: number,
  payload: unknown,
  fallbackMessage: string,
  fallbackTraceId?: string,
): ApiError {
  if (isRecord(payload)) {
    const message =
      typeof payload.message === 'string' && payload.message.trim().length > 0
        ? payload.message
        : fallbackMessage;
    const code = typeof payload.code === 'string' ? payload.code : undefined;
    const details = payload.details;
    const traceId =
      typeof payload.traceId === 'string'
        ? payload.traceId
        : typeof payload.trace_id === 'string'
          ? payload.trace_id
          : fallbackTraceId;

    return new ApiError({ status, message, code, details, traceId });
  }

  return new ApiError({
    status,
    message: fallbackMessage,
    traceId: fallbackTraceId,
  });
}
