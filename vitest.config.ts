import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**',
      '**/*.spec.ts' // Playwright files usually end with .spec.ts
    ],
    globals: true,
  },
});
