import { defineConfig } from 'tsup';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/core.ts',
    'src/editor.ts',
    'src/admin.ts',
    'src/react.ts',
    'src/next.ts',
    'src/next-server.ts',
    'src/next-client.ts',
    'src/seo.ts',
    'src/storage.ts',
    'src/types.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: false,
  onSuccess: async () => {
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }

    const adminCssPath = path.resolve(__dirname, '../blog-admin/dist/styles.css');
    const contentCssPath = path.resolve(__dirname, '../blog-editor/dist/content.css');
    const reactCssPath = path.resolve(__dirname, '../blog-react/dist/index.css');

    // 1. dist/admin.css (contains all admin + editor styles)
    if (fs.existsSync(adminCssPath)) {
      fs.copyFileSync(adminCssPath, 'dist/admin.css');
    }

    // 2. dist/content.css (contains article prose and formatting styles)
    if (fs.existsSync(contentCssPath)) {
      fs.copyFileSync(contentCssPath, 'dist/content.css');
    }

    // 3. dist/styles.css (combined master stylesheet for the whole blog suite)
    let fullCss = '/* @zwantum/blog universal stylesheet */\n';
    if (fs.existsSync(adminCssPath)) {
      fullCss += fs.readFileSync(adminCssPath, 'utf8') + '\n\n';
    }
    if (fs.existsSync(reactCssPath)) {
      fullCss += fs.readFileSync(reactCssPath, 'utf8') + '\n';
    }
    fs.writeFileSync('dist/styles.css', fullCss);
  },
});
