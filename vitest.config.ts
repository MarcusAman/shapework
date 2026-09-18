import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/contracts/*.spec.ts', 'tests/ui/*.spec.ts', 'src/**/*.test.ts', 'server/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**', 'scratch/**'],
    environment: 'node',
  },
});
