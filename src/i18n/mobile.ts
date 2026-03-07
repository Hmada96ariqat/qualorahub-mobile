import arResources from './resources/ar';
import enResources from './resources/en';
import esResources from './resources/es';
import { LANGUAGE_OPTIONS, SYSTEM_RESOURCES } from './system-resources';
import type {
  LanguageOption,
  LanguageResourceBundle,
  SupportedLanguage,
  TranslationParams,
  TranslationTree,
  TranslationValue,
} from './resources/types';

export type { LanguageOption, SupportedLanguage, TranslationParams } from './resources/types';

export type I18nDirection = 'ltr' | 'rtl';

const RESOURCE_BUNDLES = {
  ar: {
    ...arResources,
    ...SYSTEM_RESOURCES.ar,
  },
  en: {
    ...enResources,
    ...SYSTEM_RESOURCES.en,
  },
  es: {
    ...esResources,
    ...SYSTEM_RESOURCES.es,
  },
} as const satisfies Record<SupportedLanguage, LanguageResourceBundle>;

const RTL_LANGUAGES: Record<SupportedLanguage, boolean> = {
  ar: true,
  en: false,
  es: false,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export type I18nNamespace = keyof (typeof RESOURCE_BUNDLES)[typeof DEFAULT_LANGUAGE];

let currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

function resolveValue(tree: TranslationTree | undefined, key: string): TranslationValue | undefined {
  return key.split('.').reduce<TranslationValue | undefined>((current, segment) => {
    if (!current || typeof current === 'string' || Array.isArray(current)) {
      return undefined;
    }

    return (current as TranslationTree)[segment];
  }, tree);
}

function interpolate(input: string, params?: TranslationParams): string {
  if (!params) {
    return input;
  }

  return input.replace(/\{\{\s*(\w+)\s*\}\}/g, (token, key) => {
    const replacement = params[key];
    return replacement === undefined ? token : String(replacement);
  });
}

export function normalizeLanguage(language: string | null | undefined): SupportedLanguage {
  const base = (language ?? '').trim().toLowerCase().split('-')[0];
  if (base === 'es' || base === 'ar' || base === 'en') {
    return base;
  }

  return DEFAULT_LANGUAGE;
}

export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function setCurrentLanguage(language: SupportedLanguage): void {
  currentLanguage = language;
}

export function getSupportedLanguages(): ReadonlyArray<LanguageOption> {
  return LANGUAGE_OPTIONS;
}

export function getLanguageOption(language: SupportedLanguage): LanguageOption {
  const match = LANGUAGE_OPTIONS.find((option) => option.code === language);
  return match ?? LANGUAGE_OPTIONS[0];
}

export function isLanguageRtl(language: SupportedLanguage): boolean {
  return RTL_LANGUAGES[language];
}

export function getLanguageDirection(language: SupportedLanguage = currentLanguage): I18nDirection {
  return isLanguageRtl(language) ? 'rtl' : 'ltr';
}

export function t(
  namespace: I18nNamespace,
  key: string,
  fallback?: string,
  params?: TranslationParams,
): string {
  const namespaced = RESOURCE_BUNDLES[currentLanguage][namespace];
  const resolved = resolveValue(namespaced, key);

  if (typeof resolved === 'string') {
    return interpolate(resolved, params);
  }

  if (fallback) {
    return interpolate(fallback, params);
  }

  return `${namespace}.${key}`;
}
