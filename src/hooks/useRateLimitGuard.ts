import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

type RateLimitState = {
  /** Whether the user is currently rate-limited */
  isLimited: boolean;
  /** Seconds remaining before the user can retry */
  retryAfterSec: number;
  /** User-friendly message to display */
  message: string | null;
};

/**
 * Hook to handle HTTP 429 rate limit responses.
 * Parses retryAfterSec from the error, manages a countdown timer,
 * and provides a guard function to wrap async actions.
 *
 * Usage:
 *   const { isLimited, retryAfterSec, message, guard } = useRateLimitGuard();
 *
 *   async function onSubmit() {
 *     const result = await guard(() => signIn(email, password));
 *     if (!result.ok) setError(result.error);
 *   }
 *
 *   <AppButton disabled={isLimited || submitting} />
 *   {message && <ErrorState message={message} />}
 */
export function useRateLimitGuard() {
  const [state, setState] = useState<RateLimitState>({
    isLimited: false,
    retryAfterSec: 0,
    message: null,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef(0);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current);

    countdownRef.current = seconds;
    setState({
      isLimited: true,
      retryAfterSec: seconds,
      message: `Too many attempts. Please try again in ${seconds} seconds.`,
    });

    timerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      if (countdownRef.current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setState({ isLimited: false, retryAfterSec: 0, message: null });
      } else {
        setState({
          isLimited: true,
          retryAfterSec: countdownRef.current,
          message: `Too many attempts. Please try again in ${countdownRef.current} seconds.`,
        });
      }
    }, 1000);
  }

  /**
   * Wraps an async action. If it throws a 429 ApiError, starts the countdown.
   * Returns { ok: true } on success, { ok: false, error: string } on failure.
   */
  const guard = useCallback(
    async <T>(action: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> => {
      if (state.isLimited) {
        return {
          ok: false,
          error: state.message ?? 'Too many attempts. Please wait.',
        };
      }

      try {
        const data = await action();
        return { ok: true, data };
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          // Parse retryAfterSec from the response details
          let retryAfter = 60; // default fallback
          if (error.details && typeof error.details === 'object' && !Array.isArray(error.details)) {
            const details = error.details as Record<string, unknown>;
            if (typeof details.retryAfterSec === 'number') {
              retryAfter = details.retryAfterSec;
            } else if (typeof details.retry_after_sec === 'number') {
              retryAfter = details.retry_after_sec;
            }
          }

          startCountdown(retryAfter);
          return {
            ok: false,
            error: `Too many attempts. Please try again in ${retryAfter} seconds.`,
          };
        }

        // Re-throw non-rate-limit errors
        throw error;
      }
    },
    [state.isLimited, state.message],
  );

  return {
    isLimited: state.isLimited,
    retryAfterSec: state.retryAfterSec,
    message: state.message,
    guard,
  };
}
