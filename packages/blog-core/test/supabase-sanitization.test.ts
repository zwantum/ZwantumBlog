import { describe, it, expect, vi } from 'vitest';
import { SupabaseDatabaseAdapter, isValidUUID } from '../src';

describe('SupabaseDatabaseAdapter Input Sanitization', () => {
  it('validates UUIDs properly', () => {
    expect(isValidUUID('c398327d-08ec-4d56-b072-bb2f2c8d234a')).toBe(true);
    expect(isValidUUID('manual-img')).toBe(false);
    expect(isValidUUID('12345')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(undefined)).toBe(false);
  });

  it('strips joined relation objects and sanitizes invalid UUIDs on createPost', async () => {
    let insertedPayload: any = null;
    let categoryInserts: any[] = [];
    let tagInserts: any[] = [];

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'blog_posts') {
          return {
            insert: vi.fn((payload) => {
              insertedPayload = payload;
              return {
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({
                    data: { id: 'c398327d-08ec-4d56-b072-bb2f2c8d234a', ...payload },
                    error: null,
                  })),
                })),
              };
            }),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    id: 'c398327d-08ec-4d56-b072-bb2f2c8d234a',
                    title: 'Test Post',
                    author: null,
                    featured_image: null,
                    categories: [],
                    tags: [],
                  },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === 'blog_authors') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(async () => ({
                    data: [{ id: 'a1111111-1111-4111-8111-111111111111' }],
                  })),
                })),
              })),
            })),
          };
        }
        if (table === 'blog_post_categories') {
          return {
            insert: vi.fn(async (rows) => {
              categoryInserts = rows;
              return { data: rows, error: null };
            }),
          };
        }
        if (table === 'blog_post_tags') {
          return {
            insert: vi.fn(async (rows) => {
              tagInserts = rows;
              return { data: rows, error: null };
            }),
          };
        }
        return {
          insert: vi.fn(async () => ({ data: null, error: null })),
          select: vi.fn(() => ({ single: vi.fn(async () => ({ data: null, error: null })) })),
        };
      }),
    };

    const adapter = new SupabaseDatabaseAdapter(mockClient as any);

    const validCatId = '22222222-2222-4222-8222-222222222222';
    const validTagId = '33333333-3333-4333-8333-333333333333';

    await adapter.createPost({
      title: 'Testing Relations Leakage',
      slug: 'testing-relations-leakage',
      content: { type: 'doc', content: [] },
      featured_image_id: 'not-a-real-uuid' as any,
      author_id: 'invalid-author-uuid' as any,
      category_ids: [validCatId, 'invalid-cat-id'],
      tag_ids: [validTagId, 'invalid-tag-id'],
      // Simulating joined relation objects being erroneously passed by admin UI:
      author: { id: 'x', name: 'Author' },
      featured_image: { id: 'y', url: 'https://test.com/img.jpg' },
      categories: [{ id: 'z', name: 'Tech' }],
      tags: [{ id: 'w', name: 'News' }],
    } as any);

    // Verify relations were NOT inserted into blog_posts table
    expect(insertedPayload.author).toBeUndefined();
    expect(insertedPayload.featured_image).toBeUndefined();
    expect(insertedPayload.categories).toBeUndefined();
    expect(insertedPayload.tags).toBeUndefined();
    expect(insertedPayload.category_ids).toBeUndefined();
    expect(insertedPayload.tag_ids).toBeUndefined();

    // Verify invalid featured_image_id became null
    expect(insertedPayload.featured_image_id).toBeNull();

    // Verify invalid author_id fell back to active author UUID
    expect(insertedPayload.author_id).toBe('a1111111-1111-4111-8111-111111111111');

    // Verify junction tables only received valid UUIDs
    expect(categoryInserts).toHaveLength(1);
    expect(categoryInserts[0].category_id).toBe(validCatId);

    expect(tagInserts).toHaveLength(1);
    expect(tagInserts[0].tag_id).toBe(validTagId);
  });

  it('strips joined relation objects and sanitizes invalid UUIDs on updatePost', async () => {
    let updatedPayload: any = null;

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'blog_posts') {
          return {
            update: vi.fn((payload) => {
              updatedPayload = payload;
              return {
                eq: vi.fn(async () => ({ error: null })),
              };
            }),
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    id: 'c398327d-08ec-4d56-b072-bb2f2c8d234a',
                    title: 'Updated Post',
                  },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === 'blog_authors') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(async () => ({
                    data: [{ id: 'a1111111-1111-4111-8111-111111111111' }],
                  })),
                })),
              })),
            })),
          };
        }
        if (table === 'blog_post_categories' || table === 'blog_post_tags') {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(async () => ({ error: null })),
            })),
            insert: vi.fn(async () => ({ data: [], error: null })),
          };
        }
        return {};
      }),
    };

    const adapter = new SupabaseDatabaseAdapter(mockClient as any);

    await adapter.updatePost('c398327d-08ec-4d56-b072-bb2f2c8d234a', {
      title: 'Updated Title',
      featured_image_id: 'manual-img',
      author: { id: 'a' } as any,
      featured_image: { id: 'b' } as any,
      categories: [{ id: 'c' }] as any,
      tags: [{ id: 'd' }] as any,
      category_ids: ['invalid-id'],
      tag_ids: ['invalid-id'],
    } as any);

    expect(updatedPayload.author).toBeUndefined();
    expect(updatedPayload.featured_image).toBeUndefined();
    expect(updatedPayload.categories).toBeUndefined();
    expect(updatedPayload.tags).toBeUndefined();
    expect(updatedPayload.category_ids).toBeUndefined();
    expect(updatedPayload.tag_ids).toBeUndefined();
    expect(updatedPayload.featured_image_id).toBeNull();
  });
});
