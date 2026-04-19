const SETTINGS_RETURN_SECTION_STORAGE_KEY = 'opex-settings-return-section';

export const readPendingSettingsReturnSection = (): string | null =>
  window.sessionStorage.getItem(SETTINGS_RETURN_SECTION_STORAGE_KEY);

export const writePendingSettingsReturnSection = (section: string): void => {
  window.sessionStorage.setItem(SETTINGS_RETURN_SECTION_STORAGE_KEY, section);
};

export const clearPendingSettingsReturnSection = (): void => {
  window.sessionStorage.removeItem(SETTINGS_RETURN_SECTION_STORAGE_KEY);
};
