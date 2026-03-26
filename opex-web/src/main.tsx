import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root')!;
// @ts-ignore
if (!window.__root) {
  // @ts-ignore
  window.__root = createRoot(container);
}
// @ts-ignore
window.__root.render(<App />);
