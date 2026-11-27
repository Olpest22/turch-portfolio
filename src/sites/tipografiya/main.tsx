import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './tipografiya.css';
import '@/shared/kit/interaction-kit.js';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
(window as unknown as { BetterUI?: { init: (d: Document) => void } }).BetterUI?.init(document);
