import { defineConfig } from 'tsup';
import fs from 'node:fs';
import path from 'node:path';

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
    // Bundle editor toolbar styles, content styles, and admin styles together into dist/styles.css
    let combinedCss = '';
    const editorCssPath = path.resolve(__dirname, '../blog-editor/src/styles/editor.css');
    const contentCssPath = path.resolve(__dirname, '../blog-editor/src/styles/content.css');
    const adminCssPath = path.resolve(__dirname, 'src/styles/admin.css');

    if (fs.existsSync(editorCssPath)) {
      combinedCss += `/* --- @zwantum/blog-editor/editor.css --- */\n` + fs.readFileSync(editorCssPath, 'utf8') + '\n\n';
    }
    if (fs.existsSync(contentCssPath)) {
      combinedCss += `/* --- @zwantum/blog-editor/content.css --- */\n` + fs.readFileSync(contentCssPath, 'utf8') + '\n\n';
    }
    if (fs.existsSync(adminCssPath)) {
      combinedCss += `/* --- @zwantum/blog-admin/admin.css --- */\n` + fs.readFileSync(adminCssPath, 'utf8') + '\n';
    }

    fs.writeFileSync('dist/styles.css', combinedCss);
  },
});
