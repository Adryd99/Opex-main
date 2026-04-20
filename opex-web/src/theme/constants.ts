export const DEFAULT_THEME = 'light' as const;
export const THEME_STORAGE_KEY = 'app-theme';

export const APP_THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
] as const;

export type AppTheme = (typeof APP_THEME_OPTIONS)[number]['value'];

export const APP_THEME_META_COLORS: Record<AppTheme, string> = {
  light: '#F8F9FB',
  dark: '#08131B'
};
