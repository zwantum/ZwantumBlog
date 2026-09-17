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
    if (fs.existsSync('src/styles/editor.css')) {
      fs.copyFileSync('src/styles/editor.css', 'dist/styles.css');
    }
    if (fs.existsSync('src/styles/content.css')) {
      fs.copyFileSync('src/styles/content.css', 'dist/content.css');
    }
  },
});
