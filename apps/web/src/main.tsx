import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles.css';

// Le cache de requêtes garde tout l'état serveur (ADR 0003).
const queryClient = new QueryClient();

// En dev, MSW répond à la place du back (VITE_MOCK : voir src/mocks/browser.ts).
async function start() {
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK !== '0') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
    </StrictMode>,
  );
}
start();
