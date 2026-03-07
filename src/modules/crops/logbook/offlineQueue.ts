import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../../../api/client';
import type { LogbookSubmitCommand, LogbookSubmitResult } from './types';

const LOGBOOK_PENDING_SUBMITS_STORAGE_KEY = 'qualora.logbook.pending-submits.v1';

export interface QueuedLogbookSubmitSummary {
  entityName?: string | null;
  practiceLabel?: string | null;
}

export interface QueuedLogbookSubmitCommand {
  id: string;
  command: LogbookSubmitCommand;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  lastSyncError: string | null;
  status: 'pending' | 'failed';
  summary?: QueuedLogbookSubmitSummary;
}

function createQueueId(): string {
  return `logbook-queue-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isQueueEntry(value: unknown): value is QueuedLogbookSubmitCommand {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const entry = value as QueuedLogbookSubmitCommand;
  return (
    typeof entry.id === 'string' &&
    typeof entry.idempotencyKey === 'string' &&
    typeof entry.createdAt === 'string' &&
    typeof entry.updatedAt === 'string' &&
    typeof entry.retryCount === 'number' &&
    typeof entry.status === 'string' &&
    Boolean(entry.command)
  );
}

async function readQueue(): Promise<QueuedLogbookSubmitCommand[]> {
  const raw = await AsyncStorage.getItem(LOGBOOK_PENDING_SUBMITS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isQueueEntry);
  } catch {
    return [];
  }
}

async function writeQueue(entries: QueuedLogbookSubmitCommand[]): Promise<void> {
  await AsyncStorage.setItem(LOGBOOK_PENDING_SUBMITS_STORAGE_KEY, JSON.stringify(entries));
}

export async function listQueuedLogbookSubmissions(): Promise<QueuedLogbookSubmitCommand[]> {
  return readQueue();
}

export async function enqueueQueuedLogbookSubmit(args: {
  command: LogbookSubmitCommand;
  idempotencyKey: string;
  summary?: QueuedLogbookSubmitSummary;
}): Promise<QueuedLogbookSubmitCommand> {
  const now = new Date().toISOString();
  const entry: QueuedLogbookSubmitCommand = {
    id: createQueueId(),
    command: args.command,
    idempotencyKey: args.idempotencyKey,
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
    lastSyncError: null,
    status: 'pending',
    ...(args.summary ? { summary: args.summary } : {}),
  };

  await writeQueue([...(await readQueue()), entry]);
  return entry;
}

export async function removeQueuedLogbookSubmit(entryId: string): Promise<void> {
  await writeQueue((await readQueue()).filter((entry) => entry.id !== entryId));
}

export async function updateQueuedLogbookSubmit(
  entryId: string,
  updater: (entry: QueuedLogbookSubmitCommand) => QueuedLogbookSubmitCommand,
): Promise<QueuedLogbookSubmitCommand | null> {
  let updated: QueuedLogbookSubmitCommand | null = null;
  const nextEntries = (await readQueue()).map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }

    updated = updater(entry);
    return updated;
  });

  await writeQueue(nextEntries);
  return updated;
}

export function isRetryableLogbookSubmitError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.code === 'REQUEST_TIMEOUT') {
      return true;
    }

    if (error.status >= 400 && error.status < 500) {
      return false;
    }

    return error.status <= 0 || error.status >= 500;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.trim().toLowerCase();
  return (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('offline')
  );
}

export async function syncQueuedLogbookSubmissions(args: {
  submit: (
    command: LogbookSubmitCommand,
    options: { idempotencyKey: string },
  ) => Promise<LogbookSubmitResult>;
  includeFailed?: boolean;
}): Promise<{
  synced: number;
  failed: number;
  remaining: QueuedLogbookSubmitCommand[];
}> {
  const queue = await readQueue();
  const candidates = queue.filter(
    (entry) => entry.status === 'pending' || Boolean(args.includeFailed),
  );
  let synced = 0;
  let failed = 0;

  for (const entry of candidates) {
    try {
      await args.submit(entry.command, { idempotencyKey: entry.idempotencyKey });
      synced += 1;
      await removeQueuedLogbookSubmit(entry.id);
    } catch (error) {
      failed += 1;
      const message =
        error instanceof Error ? error.message : 'Failed to sync queued logbook entry';

      await updateQueuedLogbookSubmit(entry.id, (current) => ({
        ...current,
        retryCount: current.retryCount + 1,
        updatedAt: new Date().toISOString(),
        lastSyncError: message,
        status: isRetryableLogbookSubmitError(error) ? 'pending' : 'failed',
      }));
    }
  }

  return {
    synced,
    failed,
    remaining: await readQueue(),
  };
}
