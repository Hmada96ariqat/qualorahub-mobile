export type ObservabilityLevel = 'info' | 'warning' | 'error';

export type ObservabilityEventType =
  | 'app.startup'
  | 'app.error'
  | 'api.request'
  | 'api.error';

export type ObservabilityEvent = {
  type: ObservabilityEventType;
  level: ObservabilityLevel;
  message: string;
  timestamp: string;
  context: Record<string, unknown>;
};

type ObservabilitySink = (event: ObservabilityEvent) => void;

const MAX_RECENT_EVENTS = 100;
const recentEvents: ObservabilityEvent[] = [];
const sinks = new Set<ObservabilitySink>();
const startupStartedAt = Date.now();

function isDevRuntime(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }

  const runtime = globalThis as { __DEV__?: unknown };
  if (typeof runtime.__DEV__ === 'boolean') {
    return runtime.__DEV__;
  }

  return process.env.NODE_ENV !== 'production';
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string' && error.trim().length > 0) {
    return new Error(error);
  }
  return new Error('Unknown application error');
}

function pushRecentEvent(event: ObservabilityEvent): void {
  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.splice(0, recentEvents.length - MAX_RECENT_EVENTS);
  }
}

function emitToRegisteredSinks(event: ObservabilityEvent): void {
  for (const sink of sinks) {
    try {
      sink(event);
    } catch {
      // Never let telemetry sink failures affect app behavior.
    }
  }
}

function emitDevConsole(event: ObservabilityEvent): void {
  if (!isDevRuntime()) return;

  const prefix = `[observability] ${event.type}`;
  if (event.level === 'error') {
    console.error(prefix, event.message, event.context);
    return;
  }

  if (event.level === 'warning') {
    console.warn(prefix, event.message, event.context);
    return;
  }

  console.info(prefix, event.message, event.context);
}

export function trackObservabilityEvent(input: {
  type: ObservabilityEventType;
  level: ObservabilityLevel;
  message: string;
  context?: Record<string, unknown>;
}): ObservabilityEvent {
  const event: ObservabilityEvent = {
    type: input.type,
    level: input.level,
    message: input.message,
    timestamp: new Date().toISOString(),
    context: input.context ?? {},
  };

  pushRecentEvent(event);
  emitToRegisteredSinks(event);
  emitDevConsole(event);
  return event;
}

export function registerObservabilitySink(sink: ObservabilitySink): () => void {
  sinks.add(sink);
  return () => {
    sinks.delete(sink);
  };
}

export function getRecentObservabilityEvents(): ObservabilityEvent[] {
  return [...recentEvents];
}

export function clearObservabilityStateForTests(): void {
  recentEvents.length = 0;
  sinks.clear();
}

export function markAppStartupComplete(context: Record<string, unknown> = {}): void {
  trackObservabilityEvent({
    type: 'app.startup',
    level: 'info',
    message: 'App startup completed.',
    context: {
      startupDurationMs: Date.now() - startupStartedAt,
      ...context,
    },
  });
}

export function reportAppError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  const normalized = normalizeError(error);
  trackObservabilityEvent({
    type: 'app.error',
    level: 'error',
    message: normalized.message,
    context: {
      errorName: normalized.name,
      stack: normalized.stack ?? null,
      ...context,
    },
  });
}

export function trackApiRequest(input: {
  method: string;
  path: string;
  status: number;
  traceId: string;
  durationMs: number;
}): void {
  trackObservabilityEvent({
    type: 'api.request',
    level: 'info',
    message: `${input.method} ${input.path} -> ${input.status}`,
    context: {
      ...input,
    },
  });
}

export function trackApiError(input: {
  method: string;
  path: string;
  status: number;
  traceId: string;
  durationMs: number;
  code?: string;
  errorMessage?: string;
}): void {
  trackObservabilityEvent({
    type: 'api.error',
    level: 'error',
    message: `${input.method} ${input.path} failed (${input.status})`,
    context: {
      ...input,
    },
  });
}
