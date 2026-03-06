import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: './tests',
    exclude: [...configDefaults.exclude],
    coverage: {
      include: ['src/**/*.ts'],
    },
  },
});
