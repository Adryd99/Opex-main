import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_LANGUAGE_OPTIONS, normalizeLanguage, type AppLanguage, resolveLocaleTag } from './constants';

export const useAppLanguage = () => {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const setLanguage = useCallback((nextLanguage: AppLanguage) => i18n.changeLanguage(nextLanguage), [i18n]);

  return {
    language,
    locale: resolveLocaleTag(language),
    options: APP_LANGUAGE_OPTIONS,
    setLanguage
  };
};
