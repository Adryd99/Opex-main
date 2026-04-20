import { createContext, type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { APP_THEME_OPTIONS, type AppTheme, THEME_STORAGE_KEY } from './constants';
import { applyThemeToDocument, getInitialTheme, persistTheme, resolveAppTheme } from './config';

type AppThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  options: typeof APP_THEME_OPTIONS;
  setTheme: (theme: AppTheme) => void;
};

export const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export const AppThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setThemeState] = useState<AppTheme>(() => getInitialTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      setThemeState(resolveAppTheme(event.newValue));
    };

    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      options: APP_THEME_OPTIONS,
      setTheme: (nextTheme) => setThemeState(resolveAppTheme(nextTheme))
    }),
    [theme]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
};
