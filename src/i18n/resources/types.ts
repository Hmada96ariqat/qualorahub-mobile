export type SupportedLanguage = 'en' | 'es' | 'ar';

export type TranslationValue = string | readonly string[] | TranslationTree;

export type TranslationTree = {
  [key: string]: TranslationValue;
};

export type LanguageResourceBundle = Record<string, TranslationTree>;

export type TranslationParams = Record<string, number | string>;

export type LanguageOption = {
  code: SupportedLanguage;
  flag: string;
  label: string;
};
