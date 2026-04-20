import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { AppI18nProvider } from '../i18n';
import { AppThemeProvider } from '../theme';

declare global {
  interface Window {
    __opexRoot?: Root;
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element "#root" was not found.');
}

const root = window.__opexRoot ?? createRoot(container);
window.__opexRoot = root;
root.render(
  <AppThemeProvider>
    <AppI18nProvider>
      <App />
    </AppI18nProvider>
  </AppThemeProvider>
);
