import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidDraftState, LOGBOOK_DRAFT_STORAGE_KEY } from './helpers';
import type { LogbookDraftState } from './types';

export async function readLogbookDraft(): Promise<LogbookDraftState | null> {
  const raw = await AsyncStorage.getItem(LOGBOOK_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return isValidDraftState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeLogbookDraft(draft: LogbookDraftState): Promise<void> {
  await AsyncStorage.setItem(LOGBOOK_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export async function clearLogbookDraft(): Promise<void> {
  await AsyncStorage.removeItem(LOGBOOK_DRAFT_STORAGE_KEY);
}
