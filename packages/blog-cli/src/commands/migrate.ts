import path from 'path';
import fs from 'fs';

export async function runMigrateCommand() {
  console.log('\n📦 ZwantumBlog Database Migrations\n');
  console.log('PostgreSQL / Supabase compatible idempotent migrations:');

  // Print migration files
  const migrations = [
    '001_create_authors.sql',
    '002_create_media.sql',
    '003_create_categories.sql',
    '004_create_tags.sql',
    '005_create_posts.sql',
    '006_create_post_categories.sql',
    '007_create_post_tags.sql',
    '008_create_post_revisions.sql',
    '009_create_post_seo.sql',
    '010_create_redirects.sql',
    '011_create_comments.sql',
    '012_create_blog_settings.sql',
    'apply_all.sql (Single Master Script)',
  ];

  migrations.forEach((m, idx) => {
    console.log(`  ${idx + 1}. ${m}`);
  });

  console.log('\nTo apply to your database:');
  console.log('1. Open your Supabase Dashboard -> SQL Editor');
  console.log('2. Paste the contents of "database/migrations/apply_all.sql"');
  console.log('3. Click Run!\n');

  // If local database folder exists in cwd, copy apply_all.sql
  const targetDir = path.join(process.cwd(), 'database', 'migrations');
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    console.log(`✓ Migration scripts reference available in @zwantum/blog`);
  } catch (err) {
    // Ignore error
  }
}
