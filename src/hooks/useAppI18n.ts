import { useAppLocalization } from './useAppLocalization';
import { t, type I18nNamespace, type TranslationParams } from '../i18n/mobile';

export function useAppI18n() {
  const { language } = useAppLocalization();

  return {
    language,
    t: (
      namespace: I18nNamespace,
      key: string,
      fallback?: string,
      params?: TranslationParams,
    ) => t(namespace, key, fallback, params),
  };
}
