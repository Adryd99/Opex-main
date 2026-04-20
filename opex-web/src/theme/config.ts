import { APP_THEME_META_COLORS, AppTheme, DEFAULT_THEME, THEME_STORAGE_KEY } from './constants';

export const isAppTheme = (value: unknown): value is AppTheme =>
  value === 'light' || value === 'dark';

export const resolveAppTheme = (value: unknown): AppTheme =>
  isAppTheme(value) ? value : DEFAULT_THEME;

export const readStoredTheme = (): AppTheme => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  try {
    return resolveAppTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
};

export const readDocumentTheme = (): AppTheme => {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME;
  }

  return resolveAppTheme(document.documentElement.dataset.theme);
};

export const getInitialTheme = (): AppTheme => {
  const documentTheme = readDocumentTheme();
  if (documentTheme !== DEFAULT_THEME) {
    return documentTheme;
  }

  return readStoredTheme();
};

export const applyThemeToDocument = (theme: AppTheme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  themeColorMeta?.setAttribute('content', APP_THEME_META_COLORS[theme]);
};

export const persistTheme = (theme: AppTheme) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage write failures and keep the in-memory theme active.
  }
};
