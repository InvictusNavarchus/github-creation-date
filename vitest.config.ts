import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Sources import GM_* from the virtual module "$" that vite-plugin-monkey
// provides at build time. Tests alias it to a mock (unit) or a fetch-backed
// shim (integration). The monkey plugin is deliberately not loaded here.
const resolveFromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const gmAlias = (target: string) => [{ find: /^\$$/, replacement: resolveFromRoot(target) }];

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: gmAlias('./tests/mocks/gm.ts') },
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        resolve: { alias: gmAlias('./tests/integration/gm-fetch.ts') },
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          testTimeout: 20_000,
        },
      },
    ],
  },
});
