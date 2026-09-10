import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@zwantum/blog-editor/styles.css': path.resolve(__dirname, '../../packages/blog-editor/src/styles/editor.css'),
      '@zwantum/blog-admin/styles.css': path.resolve(__dirname, '../../packages/blog-admin/src/styles/admin.css'),
      '@zwantum/blog-types': path.resolve(__dirname, '../../packages/blog-types/src'),
      '@zwantum/blog-core': path.resolve(__dirname, '../../packages/blog-core/src'),
      '@zwantum/blog-storage': path.resolve(__dirname, '../../packages/blog-storage/src'),
      '@zwantum/blog-seo': path.resolve(__dirname, '../../packages/blog-seo/src'),
      '@zwantum/blog-editor': path.resolve(__dirname, '../../packages/blog-editor/src'),
      '@zwantum/blog-react': path.resolve(__dirname, '../../packages/blog-react/src'),
      '@zwantum/blog-admin': path.resolve(__dirname, '../../packages/blog-admin/src'),
      '@zwantum/blog': path.resolve(__dirname, '../../packages/blog/src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
