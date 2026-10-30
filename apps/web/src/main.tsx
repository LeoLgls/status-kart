import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// En dev, MSW répond à la place du back (VITE_MOCK=0 pour passer par le vrai back).
async function start() {
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK !== '0') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
}
start();
