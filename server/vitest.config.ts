import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    globalSetup: './tests/globalSetup.ts',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    },
    // API tests share one SQLite test DB — keep them in a single thread
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    testTimeout: 20000,
  },
})
