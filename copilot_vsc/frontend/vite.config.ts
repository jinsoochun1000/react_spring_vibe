import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 15173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:18080' } },
  preview: { port: 14173, proxy: { '/api': 'http://127.0.0.1:18080' } },
});
