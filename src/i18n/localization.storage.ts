import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeLanguage, type SupportedLanguage } from './mobile';

const LANGUAGE_STORAGE_KEY = 'app.language.v1';

export async function readStoredLanguagePreference(): Promise<SupportedLanguage | null> {
  try {
    const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return normalizeLanguage(raw);
  } catch (error) {
    if (__DEV__) {
      console.warn('[localization-storage] Failed to read language preference.', error);
    }

    return null;
  }
}

export async function writeStoredLanguagePreference(language: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    if (__DEV__) {
      console.warn('[localization-storage] Failed to write language preference.', error);
    }

    throw error;
  }
}

export const LANGUAGE_PREFERENCE_STORAGE_KEY = LANGUAGE_STORAGE_KEY;
