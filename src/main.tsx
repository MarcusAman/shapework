import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Auto-recover if browser tries to load a stale pre-deployment chunk hash
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('The requested module') || e.message.includes('dynamically imported module') || e.message.includes('Failed to fetch'))) {
    window.location.reload();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason ? (e.reason.message || String(e.reason)) : '';
  if (reason.includes('dynamically imported module') || reason.includes('Failed to fetch') || reason.includes('export named')) {
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
