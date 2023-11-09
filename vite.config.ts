import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // API calls can take a while, so we need to increase the timeout
    testTimeout: 15000,
  },
});
