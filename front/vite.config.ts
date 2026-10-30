import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Sans MSW (VITE_MOCK=0), les appels /api partent vers le vrai back.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000', '/fsq-manifest.json': 'http://localhost:4000' } },
});
