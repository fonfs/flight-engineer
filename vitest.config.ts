import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@classic-flight-engineer/aircraft-data': path.resolve(__dirname, './packages/aircraft-data/src/index.ts'),
      '@classic-flight-engineer/aviation-domain': path.resolve(__dirname, './packages/aviation-domain/src/index.ts'),
      '@classic-flight-engineer/performance-engine': path.resolve(__dirname, './packages/performance-engine/src/index.ts'),
      '@classic-flight-engineer/simbrief-adapter': path.resolve(__dirname, './packages/simbrief-adapter/src/index.ts'),
      '@classic-flight-engineer/ui': path.resolve(__dirname, './packages/ui/src/index.ts'),
      '@classic-flight-engineer/unit-system': path.resolve(__dirname, './packages/unit-system/src/index.ts'),
      '@classic-flight-engineer/validation': path.resolve(__dirname, './packages/validation/src/index.ts'),
    },
  },
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**',
      '**/*.spec.ts'
    ],
    globals: true,
  },
});
