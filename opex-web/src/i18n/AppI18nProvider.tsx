import { PropsWithChildren, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { applyLanguageMetadata, i18n, persistLanguagePreference } from './config';

export const AppI18nProvider = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const syncLanguage = (language: string) => {
      persistLanguagePreference(language);
      applyLanguageMetadata(language);
    };

    syncLanguage(i18n.resolvedLanguage ?? i18n.language);
    i18n.on('languageChanged', syncLanguage);

    return () => {
      i18n.off('languageChanged', syncLanguage);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
