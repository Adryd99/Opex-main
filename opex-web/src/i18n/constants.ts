export const DEFAULT_LANGUAGE = 'it' as const;
export const FALLBACK_LANGUAGE = 'en' as const;
export const LANGUAGE_STORAGE_KEY = 'opex-language';

export const SUPPORTED_LANGUAGES = ['it', 'en'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const APP_LANGUAGE_OPTIONS: ReadonlyArray<{ value: AppLanguage; label: string }> = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' }
];

export const APP_LOCALES: Record<AppLanguage, string> = {
  it: 'it-IT',
  en: 'en-GB'
};

export const isSupportedLanguage = (value: unknown): value is AppLanguage =>
  typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value as AppLanguage);

export const normalizeLanguage = (value: unknown): AppLanguage => {
  if (isSupportedLanguage(value)) {
    return value;
  }

  return DEFAULT_LANGUAGE;
};

export const resolveLocaleTag = (language: string): string => APP_LOCALES[normalizeLanguage(language)];
