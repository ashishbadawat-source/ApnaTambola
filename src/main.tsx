import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// Intercept benign third-party widget runtime errors (like Tawk.to script cross-origin/i18next glitches)
if (typeof window !== 'undefined') {
  // Filter console.error / console.warn for known benign third party widget loggers
  const origError = console.error;
  console.error = (...args: any[]) => {
    try {
      const msg = args
        .map((a) => {
          if (typeof a === 'string') return a;
          if (a?.message) return String(a.message);
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(' ')
        .toLowerCase();

      if (
        msg.includes('tawk') ||
        msg.includes('i18next') ||
        msg.includes('logger')
      ) {
        // Suppress noisy third party telemetry logs in sandbox
        return;
      }
    } catch {
      // Ignore filter error and pass through
    }
    origError.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    const msg = (event.message || '').toLowerCase();
    const file = (event.filename || '').toLowerCase();
    if (
      msg.includes('_tawk') ||
      msg.includes('tawk') ||
      msg.includes('i18next') ||
      file.includes('tawk.to')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason || '').toLowerCase();
    if (
      reasonStr.includes('_tawk') ||
      reasonStr.includes('tawk') ||
      reasonStr.includes('i18next')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="अपना तंबोला लाइव (Apna Tambola Live)">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

