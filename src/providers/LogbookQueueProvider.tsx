import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthProvider';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import {
  listQueuedLogbookSubmissions,
  syncQueuedLogbookSubmissions,
  type QueuedLogbookSubmitCommand,
} from '../modules/crops/logbook/offlineQueue';
import { submitLogbook } from '../api/modules/crops';

type LogbookQueueContextValue = {
  isOnline: boolean | null;
  queuedSubmissions: QueuedLogbookSubmitCommand[];
  pendingCount: number;
  recentSyncErrors: string[];
  isSyncing: boolean;
  refreshQueueState: () => Promise<void>;
  syncNow: (options?: { includeFailed?: boolean }) => Promise<void>;
};

const LogbookQueueContext = createContext<LogbookQueueContextValue | null>(null);

export function LogbookQueueProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const token = session?.accessToken ?? null;
  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();
  const [queuedSubmissions, setQueuedSubmissions] = useState<QueuedLogbookSubmitCommand[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncLockRef = useRef(false);

  async function refreshQueueState(): Promise<void> {
    setQueuedSubmissions(await listQueuedLogbookSubmissions());
  }

  useEffect(() => {
    void refreshQueueState();
  }, []);

  async function syncNow(options?: { includeFailed?: boolean }): Promise<void> {
    if (!token || isOnline !== true || syncLockRef.current) {
      return;
    }

    syncLockRef.current = true;
    setIsSyncing(true);

    try {
      await syncQueuedLogbookSubmissions({
        submit: (command, submitOptions) =>
          submitLogbook(token, command, {
            idempotencyKey: submitOptions.idempotencyKey,
            timeoutMs: 15_000,
          }),
        includeFailed: options?.includeFailed,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase11', 'logbook-session'] }),
        queryClient.invalidateQueries({ queryKey: ['phase11', 'practice-catalog'] }),
      ]);
    } finally {
      await refreshQueueState();
      syncLockRef.current = false;
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    if (!token || isOnline !== true || queuedSubmissions.length === 0) {
      return;
    }

    void syncNow();
  }, [isOnline, queuedSubmissions.length, token]);

  const recentSyncErrors = useMemo(
    () =>
      queuedSubmissions
        .map((entry) => entry.lastSyncError)
        .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
        .slice(0, 3),
    [queuedSubmissions],
  );

  const value = useMemo<LogbookQueueContextValue>(
    () => ({
      isOnline,
      queuedSubmissions,
      pendingCount: queuedSubmissions.length,
      recentSyncErrors,
      isSyncing,
      refreshQueueState,
      syncNow,
    }),
    [isOnline, isSyncing, queuedSubmissions, recentSyncErrors],
  );

  return (
    <LogbookQueueContext.Provider value={value}>
      {children}
    </LogbookQueueContext.Provider>
  );
}

export function useLogbookQueue() {
  const context = useContext(LogbookQueueContext);
  if (!context) {
    throw new Error('useLogbookQueue must be used within LogbookQueueProvider');
  }

  return context;
}
