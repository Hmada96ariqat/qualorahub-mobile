import React, { useEffect } from 'react';
import { markAppStartupComplete, reportAppError } from '../utils/observability';

type ErrorUtilsHandler = (error: Error, isFatal?: boolean) => void;

type ErrorUtilsLike = {
  getGlobalHandler?: () => ErrorUtilsHandler;
  setGlobalHandler?: (handler: ErrorUtilsHandler) => void;
};

type RuntimeWithErrorUtils = {
  ErrorUtils?: ErrorUtilsLike;
  addEventListener?: (type: string, handler: (event: unknown) => void) => void;
  removeEventListener?: (type: string, handler: (event: unknown) => void) => void;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string' && error.trim().length > 0) {
    return new Error(error);
  }
  return new Error('Unknown runtime error');
}

function extractRejectionReason(event: unknown): unknown {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return event;
  }

  const record = event as Record<string, unknown>;
  return 'reason' in record ? record.reason : event;
}

export function ObservabilityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    markAppStartupComplete({
      source: 'root-layout',
    });
  }, []);

  useEffect(() => {
    const runtime = globalThis as RuntimeWithErrorUtils;
    const errorUtils = runtime.ErrorUtils;
    if (!errorUtils?.setGlobalHandler) {
      return undefined;
    }

    const previousHandler = errorUtils.getGlobalHandler?.();
    const nextHandler: ErrorUtilsHandler = (error, isFatal) => {
      reportAppError(error, {
        source: 'global-handler',
        isFatal: Boolean(isFatal),
      });

      previousHandler?.(error, isFatal);
    };

    errorUtils.setGlobalHandler(nextHandler);
    return () => {
      if (previousHandler) {
        errorUtils.setGlobalHandler?.(previousHandler);
      }
    };
  }, []);

  useEffect(() => {
    const runtime = globalThis as RuntimeWithErrorUtils;
    if (!runtime.addEventListener || !runtime.removeEventListener) {
      return undefined;
    }

    const rejectionHandler = (event: unknown) => {
      const reason = extractRejectionReason(event);
      reportAppError(normalizeError(reason), {
        source: 'unhandled-rejection',
      });
    };

    runtime.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      runtime.removeEventListener?.('unhandledrejection', rejectionHandler);
    };
  }, []);

  return <>{children}</>;
}
