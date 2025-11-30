import { resolve } from 'path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    environment: 'node',
    pool: 'threads',
    exclude: ['**\/node_modules/**', '**\/.git/**', '**\/dist/**'],
  },
  plugins: [swc.vite()],
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },
});
