import fs from 'fs';
import path from 'path';
import { detectEnvironment } from '../detector';

export async function runInitCommand(options: { basePath?: string; yes?: boolean }) {
  const cwd = process.cwd();
  console.log('\n🚀 Initializing ZwantumBlog in host application...\n');

  const env = detectEnvironment(cwd);
  console.log(`✓ Detected Framework: ${env.isNextJs ? 'Next.js' + (env.hasNextAppRouter ? ' (App Router)' : '') : env.isVite ? 'React (Vite)' : 'Standard React'}`);
  console.log(`✓ Detected Language: ${env.isTypeScript ? 'TypeScript' : 'JavaScript'}`);
  console.log(`✓ Package Manager: ${env.packageManager}\n`);

  const basePath = options.basePath || '/blog';
  const ext = env.isTypeScript ? 'ts' : 'js';

  // 1. Create blog.config.ts safely
  const configFileName = `blog.config.${ext}`;
  const configPath = path.join(cwd, configFileName);

  if (fs.existsSync(configPath)) {
    console.log(`⚠️  ${configFileName} already exists. Skipping creation to avoid overwriting your settings.`);
  } else {
    const configContent = `// ZwantumBlog Configuration for Host Application
export const blogConfig = {
  basePath: '${basePath}',
  features: {
    categories: true,
    tags: true,
    authors: true,
    comments: true,
    scheduling: true,
    revisions: true,
    redirects: true,
    seo: true,
    media: true,
  },
  pagination: {
    postsPerPage: 9,
  },
  editor: {
    headings: true,
    images: true,
    links: true,
    tables: true,
    youtube: true,
    code: true,
    faq: true,
    callout: true,
    cta: true,
  },
  seo: {
    siteName: 'My Website',
    siteUrl: 'https://example.com',
    schema: true,
    breadcrumbs: true,
    sitemap: true,
    rss: true,
  },
};
`;
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log(`✓ Created configuration file: ${configFileName}`);
  }

  // 2. Setup Client Factory in lib/
  const targetDir = env.hasSrcDir ? path.join(cwd, 'src', 'lib') : path.join(cwd, 'lib');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const clientFileName = `blog.${ext}`;
  const clientFilePath = path.join(targetDir, clientFileName);

  if (fs.existsSync(clientFilePath)) {
    console.log(`⚠️  ${path.relative(cwd, clientFilePath)} already exists. Skipping.`);
  } else {
    const clientCode = `import { createBlogClient } from '@zwantum/blog';
import { blogConfig } from '${env.hasSrcDir ? '../..' : '..'}/blog.config';

// Initialize the universal ZwantumBlog client
// By default, uses memory storage & database for development.
// For production, pass SupabaseDatabaseAdapter and SupabaseStorageAdapter!
export const blog = createBlogClient({
  config: blogConfig,
});
`;
    fs.writeFileSync(clientFilePath, clientCode, 'utf8');
    console.log(`✓ Created client helper: ${path.relative(cwd, clientFilePath)}`);
  }

  // 3. Output next steps
  console.log('\n🎉 ZwantumBlog has been successfully configured!\n');
  console.log('Next Steps:');
  console.log('1. Database Migrations: Apply migrations from @zwantum/blog to your Supabase/PostgreSQL database.');
  console.log('   Run: npx zwantum-blog migrate');
  console.log('2. Dashboard Integration: Place <PostList /> or <PostEditor /> inside your host dashboard navigation:');
  console.log('   import { PostList, PostEditor } from "@zwantum/blog/admin";');
  console.log('3. Frontend Presentation: Build your website-specific Blog UI using data from "blog.posts.list()".\n');
}
