import { defineConfig } from 'tsup';
import fs from 'node:fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
  },
  clean: false,
  onSuccess: async () => {
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    if (fs.existsSync('src/styles/admin.css')) {
      fs.copyFileSync('src/styles/admin.css', 'dist/styles.css');
    }
  },
});
