import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, I18nManager, Platform, StyleSheet, View } from 'react-native';
import * as Updates from 'expo-updates';
import {
  getCurrentLanguage,
  getLanguageDirection,
  getLanguageOption,
  getSupportedLanguages,
  isLanguageRtl,
  normalizeLanguage,
  setCurrentLanguage,
  t,
  type I18nDirection,
  type LanguageOption,
  type SupportedLanguage,
} from '../i18n/mobile';
import {
  readStoredLanguagePreference,
  writeStoredLanguagePreference,
} from '../i18n/localization.storage';
import { palette } from '../theme/tokens';

type LocalizationContextValue = {
  direction: I18nDirection;
  getLanguageOption: (language: SupportedLanguage) => LanguageOption;
  initializing: boolean;
  isRTL: boolean;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  supportedLanguages: ReadonlyArray<LanguageOption>;
};

const DEFAULT_CONTEXT: LocalizationContextValue = {
  direction: getLanguageDirection(),
  getLanguageOption,
  initializing: false,
  isRTL: getLanguageDirection() === 'rtl',
  language: getCurrentLanguage(),
  setLanguage: async () => undefined,
  supportedLanguages: getSupportedLanguages(),
};

const LocalizationContext = createContext<LocalizationContextValue>(DEFAULT_CONTEXT);

function shouldReloadForDirection(language: SupportedLanguage): boolean {
  if (Platform.OS === 'web') {
    return false;
  }

  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);

  const nextIsRTL = isLanguageRtl(language);
  if (I18nManager.isRTL === nextIsRTL) {
    return false;
  }

  I18nManager.forceRTL(nextIsRTL);
  return true;
}

async function reloadForDirectionChange(): Promise<void> {
  await Updates.reloadAsync();
}

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(getCurrentLanguage());
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const storedLanguage = await readStoredLanguagePreference();
      const resolvedLanguage = normalizeLanguage(storedLanguage);

      setCurrentLanguage(resolvedLanguage);
      if (active) {
        setLanguageState(resolvedLanguage);
      }

      const reloadRequired = shouldReloadForDirection(resolvedLanguage);
      if (reloadRequired) {
        try {
          await reloadForDirectionChange();
          return;
        } catch (error) {
          Alert.alert(
            t('system', 'language.title', 'Display language'),
            t(
              'system',
              'language.reloadFailed',
              'Language updated, but the app could not reload. Restart the app to finish applying the new direction.',
            ),
          );
          if (__DEV__) {
            console.warn('[localization] Failed to reload after applying layout direction.', error);
          }
        }
      }

      if (active) {
        setInitializing(false);
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback(
    async (nextLanguage: SupportedLanguage): Promise<void> => {
      const resolvedLanguage = normalizeLanguage(nextLanguage);
      if (resolvedLanguage === language) {
        return;
      }

      await writeStoredLanguagePreference(resolvedLanguage);

      const reloadRequired = shouldReloadForDirection(resolvedLanguage);
      if (reloadRequired) {
        try {
          await reloadForDirectionChange();
          return;
        } catch (error) {
          I18nManager.forceRTL(isLanguageRtl(language));
          throw error instanceof Error
            ? error
            : new Error(
                'Language updated, but the app could not reload to apply the new layout direction.',
              );
        }
      }

      setCurrentLanguage(resolvedLanguage);
      setLanguageState(resolvedLanguage);
    },
    [language],
  );

  const contextValue = useMemo<LocalizationContextValue>(
    () => ({
      direction: getLanguageDirection(language),
      getLanguageOption,
      initializing,
      isRTL: getLanguageDirection(language) === 'rtl',
      language,
      setLanguage,
      supportedLanguages: getSupportedLanguages(),
    }),
    [initializing, language, setLanguage],
  );

  if (initializing) {
    return (
      <LocalizationContext.Provider value={contextValue}>
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      </LocalizationContext.Provider>
    );
  }

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextValue {
  return useContext(LocalizationContext);
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
});
