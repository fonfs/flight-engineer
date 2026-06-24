import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@classic-flight-engineer/aircraft-data': path.resolve(__dirname, './packages/aircraft-data/src/index.ts'),
      '@classic-flight-engineer/aviation-domain': path.resolve(__dirname, './packages/aviation-domain/src/index.ts'),
      '@classic-flight-engineer/performance-engine': path.resolve(__dirname, './packages/performance-engine/src/index.ts'),
      '@classic-flight-engineer/simbrief-adapter': path.resolve(__dirname, './packages/simbrief-adapter/src/index.ts'),
      '@classic-flight-engineer/ui': path.resolve(__dirname, './packages/ui/src/index.ts'),
      '@classic-flight-engineer/unit-system': path.resolve(__dirname, './packages/unit-system/src/index.ts'),
      '@classic-flight-engineer/validation': path.resolve(__dirname, './packages/validation/src/index.ts'),
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api/simbrief': {
        target: 'https://www.simbrief.com',
        changeOrigin: true,
        rewrite: (urlPath) => {
          const url = new URL(urlPath, 'https://www.simbrief.com');
          const pilotId = url.searchParams.get('pilotId');
          const username = url.searchParams.get('username');
          let query = 'json=v2';
          if (pilotId) {
            query += `&userid=${encodeURIComponent(pilotId)}`;
          } else if (username) {
            query += `&username=${encodeURIComponent(username)}`;
          }
          return `/api/xml.fetcher.php?${query}`;
        }
      }
    }
  }
});
