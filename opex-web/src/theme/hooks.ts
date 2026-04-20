import { useContext } from 'react';
import { AppThemeContext } from './AppThemeProvider';

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider.');
  }

  return context;
};
