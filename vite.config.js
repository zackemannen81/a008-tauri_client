import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const A008_HOST = process.env.A008_HOST ?? 'http://127.0.0.1:8787';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      '/health': A008_HOST,
      '/auth': { target: A008_HOST, changeOrigin: true },
      '/v1': { target: A008_HOST, changeOrigin: true },
      '/v2': { target: A008_HOST, changeOrigin: true, ws: true },
    },
  },
});
