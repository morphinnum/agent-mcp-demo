import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The UI lives in web/; /api calls go to src/web.ts on :8787.
export default defineConfig({
  root: 'web',
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
});
