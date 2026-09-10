import { describe, it, expect, beforeEach } from 'vitest';
import { createBlogClient, BlogClient } from '../src';
import { MemoryDatabaseAdapter } from '../src/database/memory-adapter';
import { MemoryStorageAdapter } from '@zwantum/blog-storage';

describe('ZwantumBlog Core Functionality', () => {
  let client: BlogClient;

  beforeEach(() => {
    const db = new MemoryDatabaseAdapter(false); // start fresh
    const storage = new MemoryStorageAdapter();
    client = createBlogClient({ db, storage });
  });

  it('creates and retrieves a blog post with auto-generated slug', async () => {
    const post = await client.posts.create({
      title: 'Vastu Alignment For Modern Homes',
      excerpt: 'A deep dive into architectural energy balance.',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'This is the article content.' }],
          },
        ],
      },
    });

    expect(post.id).toBeDefined();
    expect(post.slug).toBe('vastu-alignment-for-modern-homes');
    expect(post.status).toBe('draft');
    expect(post.word_count).toBeGreaterThan(0);
    expect(post.reading_time).toBe(1);

    const fetched = await client.posts.getBySlug('vastu-alignment-for-modern-homes');
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('Vastu Alignment For Modern Homes');
  });

  it('handles slug conflict resolution by appending numeric suffixes', async () => {
    const post1 = await client.posts.create({ title: 'Yoga Asanas' });
    const post2 = await client.posts.create({ title: 'Yoga Asanas' });

    expect(post1.slug).toBe('yoga-asanas');
    expect(post2.slug).toBe('yoga-asanas-1');
  });

  it('automatically registers a 301 redirect when an already published post slug changes', async () => {
    const post = await client.posts.create({
      title: 'Original Title',
      status: 'published',
    });

    expect(post.slug).toBe('original-title');

    // Update slug while published
    await client.posts.update(post.id, {
      slug: 'brand-new-title',
    });

    const redirect = await client.db.getRedirectBySource('/blog/original-title');
    expect(redirect).not.toBeNull();
    expect(redirect?.destination_url).toBe('/blog/brand-new-title');
    expect(redirect?.status_code).toBe(301);
  });

  it('duplicates a post as a new draft with a fresh unique slug', async () => {
    const original = await client.posts.create({
      title: 'Original Post',
      status: 'published',
      excerpt: 'Original excerpt',
    });

    const duplicate = await client.posts.duplicate(original.id);

    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.status).toBe('draft');
    expect(duplicate.title).toBe('Original Post (Copy)');
    expect(duplicate.slug).toBe('original-post-copy');
    expect(duplicate.excerpt).toBe(original.excerpt);
  });

  it('manages hierarchical categories', async () => {
    const parent = await client.categories.create({
      name: 'Vastu',
      description: 'Parent Category',
    });

    const child = await client.categories.create({
      name: 'Home Vastu',
      parent_id: parent.id,
    });

    const tree = await client.categories.getCategoryTree();
    expect(tree.length).toBe(1);
    expect(tree[0].name).toBe('Vastu');
    expect(tree[0].children?.length).toBe(1);
    expect(tree[0].children?.[0].name).toBe('Home Vastu');
  });

  it('publishes and schedules posts correctly', async () => {
    const post = await client.posts.create({ title: 'Draft Post' });
    expect(post.status).toBe('draft');

    const published = await client.publishing.publishImmediately(post.id);
    expect(published.status).toBe('published');
    expect(published.published_at).toBeDefined();

    const futureDate = new Date(Date.now() + 86400000);
    const scheduled = await client.publishing.schedulePost(post.id, futureDate);
    expect(scheduled.status).toBe('scheduled');
    expect(scheduled.scheduled_at).toBe(futureDate.toISOString());
  });

  it('maintains revision history and allows rollback', async () => {
    const post = await client.posts.create({
      title: 'Revision Test',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'V1' }] }] },
    });

    // Update with V2
    await client.posts.update(post.id, {
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'V2' }] }] },
    });

    const revisions = await client.revisions.getRevisions(post.id);
    expect(revisions.length).toBeGreaterThanOrEqual(2);

    const earliestRev = revisions[revisions.length - 1];
    const restored = await client.revisions.restoreRevision(post.id, earliestRev.id);

    expect(JSON.stringify(restored.content)).toContain('V1');
  });
});
