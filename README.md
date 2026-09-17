# ZwantumBlog — Universal Reusable Blog Module

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black.svg)](https://nextjs.org/)
[![Tiptap](https://img.shields.io/badge/Editor-Tiptap-22c55e.svg)](https://tiptap.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2FSupabase-336791.svg)](https://supabase.com/)

A production-ready, modular, embeddable Blog Engine designed to drop cleanly into **any existing or new website** (React, Next.js, Vite, etc.) without conflicting with host database tables or replacing your existing dashboard shell.

---

## 🎯 Core Architectural Principle

> **ZwantumBlog owns the BLOG DOMAIN. The HOST WEBSITE owns the WEBSITE APPLICATION.**

* **Zero Table Collisions**: All database tables are strictly scoped with the `blog_` prefix (`blog_posts`, `blog_categories`, `blog_comments`, `blog_settings`), ensuring 100% compatibility with your existing database tables (`users`, `orders`, `profiles`, `products`).
* **All-in-One Admin Component**: Drop `<BlogAdmin client={client} />` into your existing dashboard with **1 line of code**.
* **Pluggable Architecture**:
  * **Media**: If your host website already has its own media library/DAM, toggle off the built-in media tab or connect your existing media picker via `onOpenHostMediaPicker`.
  * **Comments**: Toggle comments on/off globally across blog posts right inside the Blog Settings module.
  * **SEO & Sitemaps**: Built right into the Blog Settings module (XML Sitemaps, RSS 2.0, Schema.org JSON-LD).

---

## 📦 Monorepo Packages

| Package | Description |
| :--- | :--- |
| **`@zwantum/blog`** | Meta-package exporting everything (core, admin, react, next, seo, storage) |
| **`@zwantum/blog-core`** | Framework-agnostic client, services, and database adapters |
| **`@zwantum/blog-admin`** | Complete admin dashboard (`<BlogAdmin />`), post editor, and moderation views |
| **`@zwantum/blog-react`** | Public React components (`<BlogContent />`, `<CommentSection />`, `<BlogCard />`, hooks) |
| **`@zwantum/blog-next`** | Next.js App Router helpers, automated OpenGraph `generateMetadata()`, SSR helpers |
| **`@zwantum/blog-seo`** | Metadata generator, Schema.org JSON-LD, XML Sitemaps, RSS 2.0 |
| **`@zwantum/blog-storage`**| Storage providers (Supabase Storage, Memory, S3) |

---

## 🗄️ Step 1: Database Setup (Supabase / PostgreSQL)

1. Open your **Supabase Dashboard** -> **SQL Editor** -> **New query**.
2. Open the file [`database/migrations/apply_all.sql`](database/migrations/apply_all.sql) in this repository.
3. Paste its contents and click **Run**.

This idempotently creates the 12 scoped tables:
* `blog_authors`, `blog_media`, `blog_categories`, `blog_tags`, `blog_posts`
* `blog_post_categories`, `blog_post_tags`, `blog_post_revisions`, `blog_post_seo`
* `blog_redirects`, `blog_comments`, `blog_settings`

---

## 💻 Step 2: Installation in Any Website / Project

Install the official package from NPM:

```bash
npm install @zwantum/blog @supabase/supabase-js
# or
pnpm add @zwantum/blog @supabase/supabase-js
# or
yarn add @zwantum/blog @supabase/supabase-js
```

> [!TIP]
> **Single Unified Package**: `@zwantum/blog` includes everything. You do not need to install any sub-packages individually. Import exactly what you need via clean subpaths:
> * `@zwantum/blog/core` — Client, Supabase adapters, and utilities
> * `@zwantum/blog/admin` — Full admin dashboard (`<BlogAdmin />`) & rich editor
> * `@zwantum/blog/react` — Frontend article reader, comments, and React hooks
> * `@zwantum/blog/next` — Next.js App Router helpers, metadata, SSR & schema
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
  import.meta.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY!
);

export const blogClient = createBlogClient({
  db: new SupabaseDatabaseAdapter(supabase),
  storage: new SupabaseStorageAdapter(supabase, { bucket: 'blog-media' }),
});
```

### 2. Add Blog Management to Your Existing Dashboard
Drop `<BlogAdmin />` into your admin route or dashboard tab:

```tsx
import React from 'react';
import { BlogAdmin } from '@zwantum/blog/admin';
import { blogClient } from '../lib/blogClient';

export default function AdminBlogPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* 
        Renders complete Blogs dropdown with Overview, Posts, Categories,
        Tags, Authors, Media, Comments, and Settings out of the box.
      */}
      <BlogAdmin 
        client={blogClient} 
        title="Blog"
        subtitle="Manage articles & discussions"
      />
    </div>
  );
}
```

### 3. Display Blog Posts on Your Public React Website
Wrap your public blog routes with `<BlogProvider>`:

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
          {post.featured_image?.url && <img src={post.featured_image.url} alt={post.title} />}
          {/* Supports styled HTML titles (e.g. italics, colors) */}
          <h2 dangerouslySetInnerHTML={{ __html: post.title }} />
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

### 4. Public Article Reading & Interactive Comments
```tsx
// src/pages/BlogPost.tsx
import React from 'react';
import { BlogProvider, useBlogPost, BlogContent, ShareButtons, CommentSection } from '@zwantum/blog/react';
import { blogClient } from '../lib/blogClient';

function ArticleView({ slug }: { slug: string }) {
  const { post, loading } = useBlogPost(slug);

  if (loading) return <div>Loading post...</div>;
  if (!post) return <div>Post not found.</div>;

  return (
    <article style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 16px' }}>
      <h1 dangerouslySetInnerHTML={{ __html: post.title }} />
      <p style={{ color: '#64748b' }}>By {post.author?.name || 'Editorial'} • {post.reading_time} min read</p>
      
      {/* Tiptap Rich Content Renderer */}
      <div style={{ margin: '24px 0' }}>
        <BlogContent content={post.content} />
      </div>

      <ShareButtons title={post.title} />

      {/* Reader Comments & Form (Automatically respects Settings -> Enable Comments toggle) */}
      <CommentSection postId={post.id} />
    </article>
  );
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

## ⚡ Guide 2: Integration in a Next.js Website (App Router)

### 1. Initialize Client (`lib/blogClient.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
import { createBlogClient, SupabaseDatabaseAdapter } from '@zwantum/blog/core';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const blogClient = createBlogClient({
  db: new SupabaseDatabaseAdapter(supabase),
});
```

### 2. Public Blog Index with SSR/ISR (`app/blog/page.tsx`)
```tsx
import { getPosts } from '@zwantum/blog/next';
import { blogClient } from '@/lib/blogClient';
import Link from 'next/link';

export const revalidate = 60; // Incremental Static Regeneration (1 min)

export default async function BlogPage() {
  const result = await getPosts({ page: 1, limit: 12 }, blogClient);

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '32px' }}>Our Blog</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {result.data.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }} dangerouslySetInnerHTML={{ __html: post.title }} />
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '8px' }}>{post.excerpt}</p>
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
import { getPost, getBlogMetadata } from '@zwantum/blog/next';
import { BlogContent, CommentSection, BlogProvider } from '@zwantum/blog/react';
import { blogClient } from '@/lib/blogClient';
import { notFound } from 'next/navigation';

// 1. Automatically generates Google OpenGraph, Twitter Cards, Canonical links & RSS auto-discovery:
export async function generateMetadata({ params }: { params: { slug: string } }) {
  return getBlogMetadata(params.slug, blogClient);
}

// 2. Server-side article rendering:
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug, blogClient);
  if (!post) notFound();

  return (
    <BlogProvider client={blogClient}>
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 20px' }}>
        <h1 
          style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.2 }}
          dangerouslySetInnerHTML={{ __html: post.title }}
        />
        <p style={{ color: '#64748b', margin: '16px 0 32px' }}>
          By {post.author?.name || 'Staff'} • {post.reading_time} min read
        </p>

        {/* Tiptap Article Content */}
        <div style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
          <BlogContent content={post.content} />
        </div>

        {/* Reactive Comments & Discussion Section */}
        <CommentSection postId={post.id} />
      </article>
    </BlogProvider>
  );
}
```

### 4. Next.js Admin Dashboard (`app/admin/blog/page.tsx`)
```tsx
'use client';

import { BlogAdmin } from '@zwantum/blog/admin';
import { blogClient } from '@/lib/blogClient';

export default function AdminBlogPage() {
  return <BlogAdmin client={blogClient} />;
}
```

### 5. RSS 2.0 Auto-Syndication Endpoint (`app/blog/rss.xml/route.ts`)
```typescript
import { blogClient } from '@/lib/blogClient';

export async function GET() {
  const rssXml = await blogClient.seo.getRss();
  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

### 6. Dynamic XML Sitemap Endpoint (`app/blog/sitemap.xml/route.ts`)
```typescript
import { blogClient } from '@/lib/blogClient';

export async function GET() {
  const sitemapXml = await blogClient.seo.getSitemap();
  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

---

## 🛠️ Advanced Options & Customizations

### 1. Connecting Your Host's Existing Media Library
If your website already has an image uploader/asset picker, pass `onOpenHostMediaPicker` to `<BlogAdmin />`:
```tsx
<BlogAdmin 
  client={blogClient}
  enableMedia={false} // Hides standalone Media tab in sidebar
  onOpenHostMediaPicker={() => openMyWebsiteMediaModal()}
/>
```

### 2. Toggling Comments
Inside the **Blog Settings** view (`Blogs -> Settings -> Modules & Toggles`), you can toggle **"Enable Comments on Blog Posts"** on or off at any time. When disabled:
- The `<CommentSection />` component automatically unmounts from public article pages.
- The **Comments** tab is automatically hidden from the admin sidebar.

---

## 🧪 Local Testing & Monorepo Development

To test and build within this monorepo:

```bash
# Run unit tests across all packages
pnpm test

# Build all packages
pnpm build

# Start interactive playground showcase (Dashboard + 2 design variations)
pnpm --filter playground dev
```

---

## 📄 License
MIT © Zwantum
