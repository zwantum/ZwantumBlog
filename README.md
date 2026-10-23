# ZwantumBlog — Universal Reusable Blog Module

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black.svg)](https://nextjs.org/)
[![Tiptap](https://img.shields.io/badge/Editor-Tiptap-22c55e.svg)](https://tiptap.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2FSupabase-336791.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready, modular, embeddable Blog Engine designed to drop cleanly into **any website** (React, Next.js, Vite, Remix, etc.) without database collisions or replacing your existing dashboard layout.

---

## 🎯 Core Architectural Principle

> **ZwantumBlog owns the BLOG DOMAIN. The HOST WEBSITE owns the APPLICATION.**

* **Zero Table Collisions**: All database tables are strictly scoped with the `blog_` prefix (`blog_posts`, `blog_categories`, `blog_comments`, `blog_settings`, `blog_redirects`, `blog_backups`), ensuring 100% coexistence with existing host tables (`users`, `orders`, `profiles`, `products`).
* **1-Line Admin Integration**: Drop `<BlogAdmin client={client} />` into your existing admin dashboard with a single line of code.
* **Pluggable Architecture**:
  * **Media**: Toggle the built-in media library or connect your existing DAM/asset uploader via `onOpenHostMediaPicker`.
  * **Comments**: Globally toggle comments on/off in Settings (`enableComments`).
  * **Table of Contents**: Automatic, collapsible, sequentially numbered headings (`1.`, `2.`, `3.`) with active scroll spy.
  * **301 URL Redirect Manager**: Automatic prompting when modifying published slugs, plus full manual redirect management.
  * **Bulk Selection Actions**: Bulk publish, draft, trash, restore, or delete articles.
  * **Portable Backups**: One-click JSON backup export and restore with relational integrity.
  * **Automated Social Cards**: Dynamic Open Graph / Twitter image generator for instant branded social share cards.
  * **SEO & Syndication**: Built-in XML Sitemaps, RSS 2.0, Schema.org JSON-LD, and Google SERP previews.

---

## 📦 Monorepo Packages

| Package | Description |
| :--- | :--- |
| **`@zwantum/blog`** | Meta-package exporting everything with tree-shakeable subpaths |
| **`@zwantum/blog-core`** | Framework-agnostic client, services, and database adapters (Supabase, In-Memory) |
| **`@zwantum/blog-admin`** | Complete admin dashboard (`<BlogAdmin />`), post editor, and moderation views |
| **`@zwantum/blog-react`** | Public React components (`<BlogContent />`, `<TableOfContents />`, `<CommentSection />`, hooks) |
| **`@zwantum/blog-next`** | Next.js App Router helpers, automated `generateMetadata()`, SSR & ISR helpers |
| **`@zwantum/blog-seo`** | Metadata generator, Schema.org JSON-LD, XML Sitemaps, RSS 2.0 feeds |
| **`@zwantum/blog-storage`**| Storage providers (Supabase Storage, Memory, S3) |

---

## 🗄️ Step 1: Database Setup (Supabase / PostgreSQL)

1. Open your **Supabase Dashboard** (or any PostgreSQL interface) &rarr; **SQL Editor** &rarr; **New query**.
2. Run the master migration script [`database/migrations/apply_all.sql`](database/migrations/apply_all.sql).

This idempotently sets up all 14 scoped tables, unique indexes, and buckets:
* `blog_authors`, `blog_media`, `blog_categories`, `blog_tags`, `blog_posts`
* `blog_post_categories`, `blog_post_tags`, `blog_post_revisions`, `blog_post_seo`
* `blog_redirects`, `blog_comments`, `blog_settings`, `blog_backups`
* Unique indexes: `blog_media_url_idx ON blog_media(url)` & `blog_media_storage_path_idx ON blog_media(storage_path)`
* Supabase Storage buckets: `media` (public) and `backups` (private)

---

## 💻 Step 2: Installation & CSS Setup

### 1. Install the Unified Package
```bash
npm install @zwantum/blog @supabase/supabase-js
# or
pnpm add @zwantum/blog @supabase/supabase-js
# or
yarn add @zwantum/blog @supabase/supabase-js
```

### 2. Import Styles
Import the pre-bundled stylesheet in your root layout (`app/layout.tsx` or `src/main.tsx`):

```tsx
import '@zwantum/blog/styles.css';
```

> [!NOTE]
> **All-In-One Bundled CSS**: `@zwantum/blog/styles.css` includes the admin controls, rich-text editor toolbar, and prose content formatting in a single self-contained bundle. You do **not** need to import separate editor styles, and buttons will never collapse into plain text even with Tailwind CSS preflight/resets active.

> [!TIP]
> **Clean Modular Subpaths**:
> * `@zwantum/blog/core` — Client, database adapters, and services
> * `@zwantum/blog/admin` — Full admin dashboard (`<BlogAdmin />`) & rich editor
> * `@zwantum/blog/react` — All-in-one `<BlogArticleReader />`, `<BlogContent />`, `<AuthorAvatar />`, hooks
> * `@zwantum/blog/next` or `@zwantum/blog/next/server` — Server-safe App Router data fetching & SEO
> * `@zwantum/blog/next/client` — Next.js client-side editor (`<BlogEditorNext />`)
> * `@zwantum/blog/seo` — Metadata generator, XML sitemaps, RSS 2.0 feeds

---

## ⚛️ Guide 1: Integration in a React / Vite Website

### 1. Initialize the Blog Client
Create a shared client file (e.g., `src/lib/blogClient.ts`):

```typescript
import { createClient } from '@supabase/supabase-js';
import { createBlogClient, SupabaseDatabaseAdapter } from '@zwantum/blog/core';
import { SupabaseStorageAdapter } from '@zwantum/blog/storage';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const blogClient = createBlogClient({
  db: new SupabaseDatabaseAdapter(supabase),
  storage: new SupabaseStorageAdapter(supabase, { bucket: 'media' }),
});
```

### 2. Add Blog Management to Your Admin Dashboard
Drop `<BlogAdmin />` into your admin route or dashboard:

```tsx
import React from 'react';
import { BlogAdmin } from '@zwantum/blog/admin';
import { blogClient } from '../lib/blogClient';

export default function AdminBlogPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <BlogAdmin 
        client={blogClient} 
        title="Publication"
        subtitle="Manage articles, categories, and settings"
      />
    </div>
  );
}
```

### 3. Display Blog Posts on Your Public Website
Wrap public blog routes with `<BlogProvider>`:

```tsx
// src/pages/BlogIndex.tsx
import React from 'react';
import { BlogProvider, useBlogPosts } from '@zwantum/blog/react';
import { blogClient } from '../lib/blogClient';

function BlogList() {
  const { posts, loading } = useBlogPosts();

  if (loading) return <div>Loading articles...</div>;

  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <a key={post.id} href={`/blog/${post.slug}`} className="blog-card">
          {post.featured_image?.url && (
            <img src={post.featured_image.url} alt={post.title} />
          )}
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </a>
      ))}
    </div>
  );
}

export default function BlogPage() {
  return (
    <BlogProvider client={blogClient}>
      <BlogList />
    </BlogProvider>
  );
}
```

### 4. Article Reader with Built-In Layout, Share & Comments
You can render the complete unboxed article in one line using `<BlogArticleReader />`:

```tsx
// src/pages/BlogPost.tsx
import React from 'react';
import { BlogProvider, useBlogPost, BlogArticleReader } from '@zwantum/blog/react';
import { blogClient } from '../lib/blogClient';

function ArticleView({ slug }: { slug: string }) {
  const { post, loading } = useBlogPost(slug);

  if (loading) return <div>Loading article...</div>;
  if (!post) return <div>Article not found.</div>;

  // Renders complete article with cover image, caption, TOC, drop cap, share pills, author byline, and comments
  return <BlogArticleReader post={post} />;
}

export default function BlogPostPage({ slug }: { slug: string }) {
  return (
    <BlogProvider client={blogClient}>
      <ArticleView slug={slug} />
    </BlogProvider>
  );
}
```

---

## ⚡ Guide 2: Integration in Next.js (App Router)

### 1. Initialize Client (`lib/blogClient.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import { createBlogClient, SupabaseDatabaseAdapter } from '@zwantum/blog/core';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Storage is auto-detected from SupabaseDatabaseAdapter!
export const blogClient = createBlogClient({
  db: new SupabaseDatabaseAdapter(supabase),
});
```

### 2. Public Blog Index with ISR (`app/blog/page.tsx`)
```tsx
import { getPosts } from '@zwantum/blog/next/server';
import { blogClient } from '@/lib/blogClient';
import Link from 'next/link';

export const revalidate = 60; // Incremental Static Regeneration

export default async function BlogPage() {
  const result = await getPosts({ page: 1, limit: 12 }, blogClient);

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '32px' }}>Articles</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {result.data.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

### 3. Server-Rendered Article with Automated SEO (`app/blog/[slug]/page.tsx`)
```tsx
import { getPost, getBlogMetadata } from '@zwantum/blog/next/server';
import { BlogArticleReader, BlogProvider } from '@zwantum/blog/react';
import { blogClient } from '@/lib/blogClient';
import { notFound } from 'next/navigation';

// Automated Google OpenGraph, Twitter Cards, Canonical links & RSS discovery
export async function generateMetadata({ params }: { params: { slug: string } }) {
  return getBlogMetadata(params.slug, blogClient);
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug, blogClient);
  if (!post) notFound();

  return (
    <BlogProvider client={blogClient}>
      <BlogArticleReader post={post} />
    </BlogProvider>
  );
}
```

### 4. Admin Dashboard Page (`app/admin/blog/page.tsx`)
```tsx
'use client';

import { BlogAdmin } from '@zwantum/blog/admin';
import { blogClient } from '@/lib/blogClient';

export default function AdminBlogPage() {
  return <BlogAdmin client={blogClient} />;
}
```

### 5. Dynamic RSS 2.0 & Sitemap Endpoints
* **RSS feed** (`app/blog/rss.xml/route.ts`):
  ```typescript
  import { blogClient } from '@/lib/blogClient';

  export async function GET() {
    const rss = await blogClient.seo.getRss();
    return new Response(rss, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
  ```
* **XML Sitemap** (`app/blog/sitemap.xml/route.ts`):
  ```typescript
  import { blogClient } from '@/lib/blogClient';

  export async function GET() {
    const sitemap = await blogClient.seo.getSitemap();
    return new Response(sitemap, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
  ```

---

## 🌟 Key Features & Capabilities

### 1. Interactive Table of Contents (TOC)
* Headings (`H1`–`H4`) are extracted automatically from the article content.
* Headings are sequentially numbered (`1.`, `2.`, `3.`) with smooth scrolling to heading anchors.
* Default state is clean and collapsed with toggle controls.
* Controlled globally via **Settings &rarr; Modules &rarr; Table of Contents**.

### 2. 301 URL Redirect Manager
* **Automated Conflict Protection**: If an author changes the slug of an already-published post, an interactive confirmation modal appears on save with options:
  - **Create 301 & Update**: Automatically inserts a 301 rule into `blog_redirects` and saves the post.
  - **Update without Redirect**: Saves the new slug directly without adding a redirect rule.
* **Dedicated Manager**: View, search, add custom rules, and track hit counts under **Settings &rarr; 301 Redirects**.

### 3. Bulk Selection Toolbar
* Check one, multiple, or all posts in the post list view.
* Instant action bar displays the live selection count with one-click actions:
  - **`✓ Publish`**: Bulk publish selected posts.
  - **`📄 Make Draft`**: Bulk convert selected posts to draft.
  - **`🗑 Move to Trash`**: Bulk trash selected posts.
  - In Trash view: **`Restore Selected`** and **`Delete Permanently`**.
  - **`Deselect All`** and table header indeterminate checkbox support.

### 4. Portable Backup & Disaster Recovery
* **Full JSON Snapshot**: Exports all articles, authors, categories, tags, media metadata, comments, redirects, and settings with relational integrity.
* **Safe Import Modes**:
  - **Merge**: Restores missing data and updates existing records.
  - **Replace**: Cleanly overwrites matching records with the backup file.
* Located under **Settings &rarr; Backup & Recovery**.

### 5. Editorial Typography & Dual Editor Modes
* **True Editorial Drop Cap**: Strictly styles the first letter of the first paragraph; automatically resets for blockquotes, bullet lists, callouts, and captions.
* **Dual-Mode Visual / HTML Editor**: Switch seamlessly between Tiptap visual WYSIWYG and raw HTML code mode with syntax highlighting.
* **Figure Captions**: Dedicated caption field for featured imagery.

---

## ⚙️ Blog Settings Reference

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `blogTitle` | `string` | `"Blog"` | Display name of the blog publication |
| `basePath` | `string` | `"/blog"` | URL path prefix for blog posts |
| `postsPerPage` | `number` | `10` | Pagination limit on frontend and admin |
| `defaultPostStatus` | `string` | `"draft"` | Default status for newly created articles |
| `enableComments` | `boolean` | `false` | Master toggle for reader discussion sections |
| `enableMedia` | `boolean` | `true` | Toggle built-in media manager vs host DAM |
| `enableScheduling`| `boolean` | `true` | Scheduled publishing support |
| `enableRevisions` | `boolean` | `true` | Historical post snapshots and revision rollback |
| `enableRedirects` | `boolean` | `true` | Automatic 301 URL redirect management |
| `enableDropCap` | `boolean` | `false` | Editorial first-letter drop cap on articles |
| `enableAutosave` | `boolean` | `true` | Automatic local recovery and draft autosaving |
| `enableTableOfContents` | `boolean` | `true` | Automatic article table of contents |
| `enableOgImageGenerator` | `boolean` | `true` | Automated social share card generator |
| `timezone` | `string` | `"UTC"` | Publication scheduling timezone |

---

## 💡 Checklist for New Website Integrations

When dropping ZwantumBlog into any new website or dashboard, use this 5-point checklist for a flawless setup:

### 1. Database Migration & Unique Indexes
Run [`database/migrations/apply_all.sql`](database/migrations/apply_all.sql) in your database. If you already have an existing `blog_media` table, ensure the unique indexes are present:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS blog_media_url_idx ON blog_media(url);
CREATE UNIQUE INDEX IF NOT EXISTS blog_media_storage_path_idx ON blog_media(storage_path);
```

### 2. Single Stylesheet Import
Import the pre-bundled CSS once in your root layout (`app/layout.tsx` or `src/main.tsx`):
```tsx
import '@zwantum/blog/styles.css';
```
No secondary CSS imports or editor stylesheets are required. Buttons, icons, and prose typography remain intact regardless of Tailwind CSS resets.

### 3. Server vs. Client Boundary in Next.js App Router
* **Server Components (`app/blog/...`)**: Import data fetchers from `@zwantum/blog/next/server` (or `@zwantum/blog/next`). This guarantees 100% server safety with zero DOM/Tiptap runtime code executing on Node.js.
* **Client Components (`'use client'`)**: If you render the admin editor `<BlogEditorNext />` directly, import it from `@zwantum/blog/next/client`.

### 4. Storage Auto-Detection
You do not need to manually instantiate `SupabaseStorageAdapter`:
```typescript
export const blogClient = createBlogClient({
  db: new SupabaseDatabaseAdapter(supabase),
});
```
`createBlogClient` automatically detects the underlying Supabase storage bucket (`media`).

### 5. Instant Article Rendering
Instead of manually wiring headings, cover images, share pills, tag badges, author cards, and comment forms, use the pre-built all-in-one reader:
```tsx
<BlogProvider client={blogClient}>
  <BlogArticleReader post={post} />
</BlogProvider>
```

---

## 🧪 Local Testing & Playground

```bash
# Run unit tests across all packages
pnpm test

# Build all monorepo packages
pnpm build

# Start interactive playground showcase (Admin dashboard + live frontend)
pnpm --filter playground dev
```

---

## 📄 License
MIT © Zwantum

