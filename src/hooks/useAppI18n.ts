import { t, type I18nNamespace } from '../i18n/mobile';

export function useAppI18n() {
  return {
    t: (namespace: I18nNamespace, key: string, fallback?: string) => t(namespace, key, fallback),
  };
}
