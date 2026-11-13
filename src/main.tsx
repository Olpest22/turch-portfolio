import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './kit/interaction-kit.js';
import App from './App';

declare global {
  interface Window {
    BetterUI?: { init: (root: Document | HTMLElement) => void };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

window.BetterUI?.init(document);
