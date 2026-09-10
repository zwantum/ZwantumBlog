# AI Developer & Coding Agent Guide: ZwantumBlog Integration

> [!IMPORTANT]
> **MANDATORY INSTRUCTIONS FOR AI AGENTS (Gemini, Claude, GPT, Cursor, Copilot, Antigravity, etc.)**
> When building or updating any website that incorporates a Blog or Content Management section:
>
> 1. **DO NOT recreate a Blog backend.**
> 2. **DO NOT create custom blog database tables.**
> 3. **DO NOT create custom blog CRUD endpoints or controllers.**
> 4. **DO NOT reinstall or reconfigure Tiptap from scratch.**
> 5. **DO NOT create a separate Blog authentication or user system.**
> 6. **DO NOT create a standalone "Blog Dashboard" with its own login.**
> 7. **USE `@zwantum/blog` for all blog business logic, data models, SEO, revisions, and editor functionality.**
> 8. **CUSTOMIZE ONLY the website-specific Blog frontend presentation and UI components.**

---

## 1. What ZwantumBlog Owns vs What The Host Website Owns

| Domain | Owner | Implementation Rule |
| :--- | :--- | :--- |
| **Authentication & Sessions** | **Host Website** | ZwantumBlog never implements login, passwords, JWTs, or signup. |
| **Users & Roles** | **Host Website** | The host website passes permission checks to ZwantumBlog. |
| **Dashboard Layout Shell** | **Host Website** | Host owns sidebar, navbar, branding, and container. |
| **Blog Data & CRUD** | **ZwantumBlog** | Use `blog.posts.*`, `blog.categories.*`, `blog.tags.*`, etc. |
| **Rich Text Editor** | **ZwantumBlog** | Use `<BlogEditor />` or `<BlogEditorNext />`. Do not install raw Tiptap. |
| **Blog SEO & Schema** | **ZwantumBlog** | Use `blog.seo.*` for metadata, JSON-LD schemas, sitemaps, RSS. |
| **Blog Admin Views** | **ZwantumBlog** | Embed `<PostList />`, `<PostEditor />`, `<MediaLibrary />` into host dashboard. |
| **Blog Frontend Design** | **Host Website** | Build website-specific cards, heroes, and articles using blog data. |

---

## 2. Quick Setup in New Projects

### Next.js App Router
```bash
npm install @zwantum/blog
npx zwantum-blog init
```

In your Next.js server component (`app/blog/[slug]/page.tsx`):
```tsx
import { getPost, getBlogMetadata, getBlogSchema } from '@zwantum/blog/next';
import { BlogContent } from '@zwantum/blog/react';
import { notFound } from 'next/navigation';
import { blog } from '@/lib/blog';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return getBlogMetadata(params.slug, blog);
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug, blog);
  if (!post) notFound();

  return (
    <article className="my-custom-website-article">
      <h1>{post.title}</h1>
      <p className="lead">{post.excerpt}</p>
      {/* Renders structured Tiptap JSON safely */}
      <BlogContent content={post.content} />
    </article>
  );
}
```

### React / Vite
```bash
npm install @zwantum/blog
npx zwantum-blog init
```

In your React component:
```tsx
import { useBlogPost, BlogContent } from '@zwantum/blog/react';

export function BlogPost({ slug }: { slug: string }) {
  const { post, loading, error } = useBlogPost(slug);

  if (loading) return <div>Loading article...</div>;
  if (error || !post) return <div>Article not found</div>;

  return (
    <div className="website-theme-wrapper">
      <h1>{post.title}</h1>
      <BlogContent content={post.content} />
    </div>
  );
}
```

---

## 3. Embedding Into An Existing Dashboard

When adding the Blog module to an existing dashboard:
```tsx
import { useState } from 'react';
import { PostList, PostEditor, CategoryManager, MediaLibrary } from '@zwantum/blog/admin';
import { blog } from '@/lib/blog';

export function HostDashboard() {
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'categories' | 'media'>('posts');
  const [editingPostId, setEditingPostId] = useState<string | undefined>();

  return (
    <div className="existing-host-dashboard-shell">
      <MyExistingSidebar />
      <div className="dashboard-content">
        {activeTab === 'posts' && (
          <PostList
            client={blog}
            onNavigateToNewPost={() => { setEditingPostId(undefined); setActiveTab('editor'); }}
            onNavigateToEditPost={(id) => { setEditingPostId(id); setActiveTab('editor'); }}
          />
        )}
        {activeTab === 'editor' && (
          <PostEditor
            client={blog}
            postId={editingPostId}
            onBack={() => setActiveTab('posts')}
          />
        )}
        {activeTab === 'categories' && <CategoryManager client={blog} />}
        {activeTab === 'media' && <MediaLibrary client={blog} />}
      </div>
    </div>
  );
}
```

---

## 4. Customizing Frontend Presentation

Do **NOT** alter the blog database schema to change visual presentation.
Build website-specific UI components that consume ZwantumBlog data:

```tsx
// VastuWebsiteBlogCard.tsx
export function VastuBlogCard({ post }: { post: Post }) {
  return (
    <div className="vastu-card-luxury">
      <img src={post.featured_image?.url} alt={post.featured_image?.alt_text} />
      <span className="vastu-element-tag">{post.categories?.[0]?.name}</span>
      <h3 className="serif-heading">{post.title}</h3>
      <p>{post.excerpt}</p>
    </div>
  );
}
```
Or for a School Website:
```tsx
// SchoolWebsiteNewsCard.tsx
export function SchoolNewsCard({ post }: { post: Post }) {
  return (
    <div className="school-bulletin-row">
      <div className="date-badge">{new Date(post.published_at!).toLocaleDateString()}</div>
      <h4>{post.title}</h4>
      <span className="badge">{post.categories?.[0]?.name}</span>
    </div>
  );
}
```
Both use identical blog APIs. Only the UI differs.
