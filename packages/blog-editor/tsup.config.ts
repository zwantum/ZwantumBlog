import { defineConfig } from 'tsup';
import fs from 'node:fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: false,
  onSuccess: async () => {
    if (fs.existsSync('src/styles/editor.css')) {
      fs.copyFileSync('src/styles/editor.css', 'dist/styles.css');
    }
  },
});
