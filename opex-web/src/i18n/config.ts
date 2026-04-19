import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, isSupportedLanguage, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './constants';
import { resources } from './resources';

const readStoredLanguage = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    return isSupportedLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

export const persistLanguagePreference = (language: string) => {
  if (typeof window === 'undefined' || !isSupportedLanguage(language)) {
    return;
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures and keep the current in-memory language.
  }
};

export const applyLanguageMetadata = (language: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
};

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: readStoredLanguage(),
      fallbackLng: FALLBACK_LANGUAGE,
      supportedLngs: [...SUPPORTED_LANGUAGES],
      defaultNS: 'common',
      ns: ['common', 'app', 'settings', 'dashboard', 'budget', 'taxes', 'banking'],
      interpolation: {
        escapeValue: false
      },
      returnNull: false
    });
}

persistLanguagePreference(i18n.resolvedLanguage ?? i18n.language);
applyLanguageMetadata(i18n.resolvedLanguage ?? i18n.language);

export { i18n };
