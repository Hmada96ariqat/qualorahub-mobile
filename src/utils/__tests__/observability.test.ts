import {
  clearObservabilityStateForTests,
  getRecentObservabilityEvents,
  markAppStartupComplete,
  registerObservabilitySink,
  reportAppError,
  trackApiError,
  trackApiRequest,
  trackObservabilityEvent,
} from '../observability';

describe('observability', () => {
  beforeEach(() => {
    clearObservabilityStateForTests();
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tracks events and exposes in-memory history', () => {
    trackObservabilityEvent({
      type: 'api.request',
      level: 'info',
      message: 'GET /fields -> 200',
      context: { status: 200 },
    });

    const events = getRecentObservabilityEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'api.request',
      level: 'info',
      message: 'GET /fields -> 200',
      context: { status: 200 },
    });
  });

  it('delivers events to registered sinks and supports unsubscribe', () => {
    const sink = jest.fn<void, [ReturnType<typeof getRecentObservabilityEvents>[number]]>();
    const unsubscribe = registerObservabilitySink(sink);

    trackApiRequest({
      method: 'GET',
      path: '/dashboard/snapshot',
      status: 200,
      traceId: 'trace-1',
      durationMs: 24,
    });
    expect(sink).toHaveBeenCalledTimes(1);

    unsubscribe();
    trackApiRequest({
      method: 'GET',
      path: '/tasks',
      status: 200,
      traceId: 'trace-2',
      durationMs: 20,
    });
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it('normalizes app errors and tracks startup marker', () => {
    markAppStartupComplete({ source: 'test' });
    reportAppError('boom', { source: 'test' });

    const [startupEvent, errorEvent] = getRecentObservabilityEvents();
    expect(startupEvent.type).toBe('app.startup');
    expect(startupEvent.context.startupDurationMs).toEqual(expect.any(Number));
    expect(errorEvent).toMatchObject({
      type: 'app.error',
      level: 'error',
      message: 'boom',
      context: {
        source: 'test',
        errorName: 'Error',
      },
    });
  });

  it('tracks api error events with status metadata', () => {
    trackApiError({
      method: 'PATCH',
      path: '/user-management/users/profile-1',
      status: 500,
      traceId: 'trace-err',
      durationMs: 112,
      code: 'INTERNAL_ERROR',
      errorMessage: 'failed',
    });

    const [event] = getRecentObservabilityEvents();
    expect(event).toMatchObject({
      type: 'api.error',
      level: 'error',
      context: {
        status: 500,
        code: 'INTERNAL_ERROR',
        traceId: 'trace-err',
      },
    });
  });
});
