import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Integration tests (Payload Local API) run in Node; unit/component tests
    // can annotate @vitest-environment jsdom via the in-file docblock if needed.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'tests/int/**/*.int.spec.ts',
      'tests/integration/**/*.test.ts',
      'tests/unit/**/*.test.ts',
    ],
    testTimeout: 30000,
    globals: true,
  },
})
