import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Do not inject the checkout .env into tests. The server entrypoint loads it.
  envDir: path.join(root, 'server/test/env'),
  test: {
    include: ['tests/**/*.test.ts', 'tests/contracts/*.spec.ts', 'tests/ui/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'server/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**', 'scratch/**'],
    environment: 'node',
    setupFiles: ['./server/test/forbidPgPool.setup.ts'],
  },
});
