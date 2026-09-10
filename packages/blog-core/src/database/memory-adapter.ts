import {
  BlogDatabaseAdapter,
  Post,
  PostCreateInput,
  PostUpdateInput,
  PostFilterInput,
  Category,
  CategoryInput,
  Tag,
  TagInput,
  Author,
  AuthorInput,
  Media,
  MediaUpdateInput,
  PostRevision,
  CreateRevisionInput,
  PostSEO,
  BlogRedirect,
  CreateRedirectInput,
  Comment,
  CommentInput,
  CommentStatus,
  BlogSettings,
  PaginatedResult,
  PaginationParams,
} from '@zwantum/blog-types';
import { calculateContentMetrics } from '../utils/content';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class MemoryDatabaseAdapter implements BlogDatabaseAdapter {
  public posts: Map<string, Post> = new Map();
  public categories: Map<string, Category> = new Map();
  public tags: Map<string, Tag> = new Map();
  public authors: Map<string, Author> = new Map();
  public media: Map<string, Media> = new Map();
  public revisions: Map<string, PostRevision[]> = new Map();
  public seo: Map<string, PostSEO> = new Map();
  public redirects: Map<string, BlogRedirect> = new Map();
  public comments: Map<string, Comment> = new Map();
  public settings: Map<string, BlogSettings> = new Map();

  // Junctions
  public postCategories: Map<string, Set<string>> = new Map(); // postId -> categoryIds
  public postTags: Map<string, Set<string>> = new Map(); // postId -> tagIds

  constructor(seed: boolean = false) {
    this.settings.set('general', {
      blogTitle: 'Zwantum Blog',
      basePath: '/blog',
      postsPerPage: 9,
      defaultPostStatus: 'draft',
      enableComments: true,
      enableMedia: true,
      enableScheduling: true,
      enableRevisions: true,
      enableRedirects: true,
      timezone: 'UTC',
    });

    if (seed) {
      this.seedData();
    }
  }

  // --- POSTS ---
  async getPosts(params?: PaginationParams & PostFilterInput): Promise<PaginatedResult<Post>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const includeTrashed = params?.includeTrashed || false;

    let items = Array.from(this.posts.values());

    // Filter trashed
    if (!includeTrashed) {
      items = items.filter((p) => p.status !== 'trash' && !p.deleted_at);
    }

    // Status filter
    if (params?.status) {
      const allowedStatuses = Array.isArray(params.status) ? params.status : [params.status];
      items = items.filter((p) => allowedStatuses.includes(p.status));
    }

    // Category filter
    if (params?.categorySlug) {
      const cat = Array.from(this.categories.values()).find((c) => c.slug === params.categorySlug);
      if (cat) {
        items = items.filter((p) => this.postCategories.get(p.id)?.has(cat.id));
      } else {
        items = [];
      }
    } else if (params?.categoryId) {
      items = items.filter((p) => this.postCategories.get(p.id)?.has(params.categoryId!));
    }

    // Tag filter
    if (params?.tagSlug) {
      const tag = Array.from(this.tags.values()).find((t) => t.slug === params.tagSlug);
      if (tag) {
        items = items.filter((p) => this.postTags.get(p.id)?.has(tag.id));
      } else {
        items = [];
      }
    } else if (params?.tagId) {
      items = items.filter((p) => this.postTags.get(p.id)?.has(params.tagId!));
    }

    // Author filter
    if (params?.authorSlug) {
      const auth = Array.from(this.authors.values()).find((a) => a.slug === params.authorSlug);
      if (auth) {
        items = items.filter((p) => p.author_id === auth.id);
      } else {
        items = [];
      }
    } else if (params?.authorId) {
      items = items.filter((p) => p.author_id === params.authorId);
    }

    // Featured filter
    if (params?.isFeatured !== undefined) {
      items = items.filter((p) => p.is_featured === params.isFeatured);
    }

    // Content type filter
    if (params?.contentType) {
      items = items.filter((p) => p.content_type === params.contentType);
    }

    // Search filter
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((p) => {
        return (
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    const sortField = params?.sortBy || 'published_at';
    const sortOrder = params?.sortOrder || 'desc';

    items.sort((a, b) => {
      const valA = (a as unknown as Record<string, unknown>)[sortField] || a.created_at;
      const valB = (b as unknown as Record<string, unknown>)[sortField] || b.created_at;
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pagedItems = items.slice(offset, offset + limit).map((p) => this.populatePostRelations(p));

    return {
      data: pagedItems,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getPostById(id: string): Promise<Post | null> {
    const post = this.posts.get(id);
    return post ? this.populatePostRelations(post) : null;
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const post = Array.from(this.posts.values()).find((p) => p.slug === slug);
    return post ? this.populatePostRelations(post) : null;
  }

  async createPost(input: PostCreateInput): Promise<Post> {
    const now = new Date().toISOString();
    const id = uuid();

    const metrics = calculateContentMetrics(input.content || {});

    const post: Post = {
      id,
      title: input.title,
      slug: input.slug || input.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      excerpt: input.excerpt || null,
      content: input.content || { type: 'doc', content: [] },
      content_html: input.content_html || null,
      featured_image_id: input.featured_image_id || null,
      author_id: input.author_id || null,
      status: input.status || 'draft',
      content_type: input.content_type || 'article',
      is_featured: input.is_featured ?? false,
      reading_time: metrics.readingTime,
      word_count: metrics.wordCount,
      custom_fields: input.custom_fields || {},
      published_at: input.status === 'published' ? (input.published_at || now) : null,
      scheduled_at: input.scheduled_at || null,
      created_at: now,
      updated_at: now,
    };

    this.posts.set(id, post);

    if (input.category_ids) {
      this.postCategories.set(id, new Set(input.category_ids));
      for (const catId of input.category_ids) {
        this.updateCategoryPostCount(catId);
      }
    }

    if (input.tag_ids) {
      this.postTags.set(id, new Set(input.tag_ids));
      for (const tagId of input.tag_ids) {
        this.updateTagPostCount(tagId);
      }
    }

    if (input.seo) {
      const seo: PostSEO = {
        id: uuid(),
        post_id: id,
        meta_title: input.seo.meta_title || post.title,
        meta_description: input.seo.meta_description || post.excerpt,
        focus_keyword: input.seo.focus_keyword || null,
        canonical_url: input.seo.canonical_url || null,
        og_title: input.seo.og_title || null,
        og_description: input.seo.og_description || null,
        og_image_url: input.seo.og_image_url || null,
        twitter_title: input.seo.twitter_title || null,
        twitter_description: input.seo.twitter_description || null,
        twitter_image_url: input.seo.twitter_image_url || null,
        robots: input.seo.robots || 'index,follow',
        schema_type: input.seo.schema_type || 'Article',
        custom_schema: input.seo.custom_schema || {},
        created_at: now,
        updated_at: now,
      };
      this.seo.set(id, seo);
    }

    return this.populatePostRelations(post);
  }

  async updatePost(id: string, input: PostUpdateInput): Promise<Post> {
    const existing = this.posts.get(id);
    if (!existing) throw new Error(`Post with id ${id} not found`);

    const now = new Date().toISOString();
    let metrics = { wordCount: existing.word_count, readingTime: existing.reading_time };

    if (input.content) {
      metrics = calculateContentMetrics(input.content);
    }

    let publishedAt = existing.published_at;
    if (input.status === 'published' && !existing.published_at) {
      publishedAt = input.published_at || now;
    }

    const updated: Post = {
      ...existing,
      ...input,
      word_count: metrics.wordCount,
      reading_time: metrics.readingTime,
      published_at: publishedAt,
      updated_at: now,
    };

    this.posts.set(id, updated);

    if (input.category_ids) {
      this.postCategories.set(id, new Set(input.category_ids));
      for (const catId of input.category_ids) {
        this.updateCategoryPostCount(catId);
      }
    }

    if (input.tag_ids) {
      this.postTags.set(id, new Set(input.tag_ids));
      for (const tagId of input.tag_ids) {
        this.updateTagPostCount(tagId);
      }
    }

    if (input.seo) {
      await this.upsertPostSEO(id, input.seo);
    }

    return this.populatePostRelations(updated);
  }

  async deletePost(id: string, permanent: boolean = false): Promise<boolean> {
    const post = this.posts.get(id);
    if (!post) return false;

    if (permanent) {
      this.posts.delete(id);
      this.postCategories.delete(id);
      this.postTags.delete(id);
      this.seo.delete(id);
      this.revisions.delete(id);
      return true;
    } else {
      post.status = 'trash';
      post.deleted_at = new Date().toISOString();
      this.posts.set(id, post);
      return true;
    }
  }

  async restorePost(id: string): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) throw new Error(`Post ${id} not found`);
    post.status = 'draft';
    post.deleted_at = null;
    post.updated_at = new Date().toISOString();
    this.posts.set(id, post);
    return this.populatePostRelations(post);
  }

  async getFeaturedPosts(limit: number = 5): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter((p) => p.is_featured && p.status === 'published')
      .sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''))
      .slice(0, limit)
      .map((p) => this.populatePostRelations(p));
  }

  async getRelatedPosts(postId: string, limit: number = 3): Promise<Post[]> {
    const targetPost = this.posts.get(postId);
    if (!targetPost) return [];

    const targetCats = this.postCategories.get(postId) || new Set();
    const targetTags = this.postTags.get(postId) || new Set();

    const candidates = Array.from(this.posts.values()).filter(
      (p) => p.id !== postId && p.status === 'published'
    );

    const scored = candidates.map((p) => {
      let score = 0;
      const pCats = this.postCategories.get(p.id) || new Set();
      const pTags = this.postTags.get(p.id) || new Set();

      for (const catId of targetCats) {
        if (pCats.has(catId)) score += 3;
      }
      for (const tagId of targetTags) {
        if (pTags.has(tagId)) score += 1;
      }
      return { post: p, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => this.populatePostRelations(s.post));
  }

  // --- CATEGORIES ---
  async getCategories(params?: PaginationParams): Promise<PaginatedResult<Category>> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const items = Array.from(this.categories.values()).sort(
      (a, b) => a.display_order - b.display_order
    );

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    return {
      data: items.slice(offset, offset + limit),
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => a.display_order - b.display_order);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return this.categories.get(id) || null;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return Array.from(this.categories.values()).find((c) => c.slug === slug) || null;
  }

  async createCategory(input: CategoryInput): Promise<Category> {
    const now = new Date().toISOString();
    const id = uuid();
    const robots = input.robots || (input.no_index ? 'noindex,follow' : 'index,follow');
    const cat: Category = {
      id,
      name: input.name,
      slug: input.slug || input.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: input.description || null,
      parent_id: input.parent_id || null,
      image_url: input.image_url || null,
      seo_title: input.seo_title || null,
      seo_description: input.seo_description || null,
      canonical_url: input.canonical_url || null,
      robots,
      no_index: input.no_index !== undefined ? input.no_index : robots.includes('noindex'),
      display_order: input.display_order || 0,
      is_active: input.is_active ?? true,
      post_count: 0,
      created_at: now,
      updated_at: now,
    };
    this.categories.set(id, cat);
    return cat;
  }

  async updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
    const cat = this.categories.get(id);
    if (!cat) throw new Error(`Category ${id} not found`);

    let robots = input.robots;
    if (robots === undefined && input.no_index !== undefined) {
      robots = input.no_index ? 'noindex,follow' : 'index,follow';
    }

    const updated: Category = {
      ...cat,
      ...input,
      robots: robots || cat.robots || 'index,follow',
      no_index: input.no_index !== undefined ? input.no_index : (robots ? robots.includes('noindex') : cat.no_index),
      updated_at: new Date().toISOString(),
    };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  private updateCategoryPostCount(catId: string): void {
    let count = 0;
    for (const [pId, catSet] of this.postCategories.entries()) {
      const p = this.posts.get(pId);
      if (p && p.status === 'published' && catSet.has(catId)) {
        count++;
      }
    }
    const cat = this.categories.get(catId);
    if (cat) {
      cat.post_count = count;
      this.categories.set(catId, cat);
    }
  }

  // --- TAGS ---
  async getTags(params?: PaginationParams): Promise<PaginatedResult<Tag>> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const items = Array.from(this.tags.values()).sort((a, b) => b.post_count - a.post_count);
    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    return {
      data: items.slice(offset, offset + limit),
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTagById(id: string): Promise<Tag | null> {
    return this.tags.get(id) || null;
  }

  async getTagBySlug(slug: string): Promise<Tag | null> {
    return Array.from(this.tags.values()).find((t) => t.slug === slug) || null;
  }

  async createTag(input: TagInput): Promise<Tag> {
    const now = new Date().toISOString();
    const id = uuid();
    const robots = input.robots || (input.no_index ? 'noindex,follow' : 'index,follow');
    const tag: Tag = {
      id,
      name: input.name,
      slug: input.slug || input.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: input.description || null,
      seo_title: input.seo_title || null,
      seo_description: input.seo_description || null,
      canonical_url: input.canonical_url || null,
      robots,
      no_index: input.no_index !== undefined ? input.no_index : robots.includes('noindex'),
      post_count: 0,
      created_at: now,
      updated_at: now,
    };
    this.tags.set(id, tag);
    return tag;
  }

  async updateTag(id: string, input: Partial<TagInput>): Promise<Tag> {
    const tag = this.tags.get(id);
    if (!tag) throw new Error(`Tag ${id} not found`);

    let robots = input.robots;
    if (robots === undefined && input.no_index !== undefined) {
      robots = input.no_index ? 'noindex,follow' : 'index,follow';
    }

    const updated: Tag = {
      ...tag,
      ...input,
      robots: robots || tag.robots || 'index,follow',
      no_index: input.no_index !== undefined ? input.no_index : (robots ? robots.includes('noindex') : tag.no_index),
      updated_at: new Date().toISOString(),
    };
    this.tags.set(id, updated);
    return updated;
  }

  async deleteTag(id: string): Promise<boolean> {
    return this.tags.delete(id);
  }

  private updateTagPostCount(tagId: string): void {
    let count = 0;
    for (const [pId, tagSet] of this.postTags.entries()) {
      const p = this.posts.get(pId);
      if (p && p.status === 'published' && tagSet.has(tagId)) {
        count++;
      }
    }
    const tag = this.tags.get(tagId);
    if (tag) {
      tag.post_count = count;
      this.tags.set(tagId, tag);
    }
  }

  // --- AUTHORS ---
  async getAuthors(params?: PaginationParams): Promise<PaginatedResult<Author>> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const items = Array.from(this.authors.values()).filter((a) => a.is_active);
    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    return {
      data: items.slice(offset, offset + limit),
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getAllAuthors(): Promise<Author[]> {
    return Array.from(this.authors.values()).filter((a) => a.is_active);
  }

  async getAuthorById(id: string): Promise<Author | null> {
    return this.authors.get(id) || null;
  }

  async getAuthorBySlug(slug: string): Promise<Author | null> {
    return Array.from(this.authors.values()).find((a) => a.slug === slug) || null;
  }

  async createAuthor(input: AuthorInput): Promise<Author> {
    const now = new Date().toISOString();
    const id = uuid();
    const author: Author = {
      id,
      name: input.name,
      slug: input.slug || input.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      email: input.email || null,
      bio: input.bio || null,
      designation: input.designation || null,
      profile_image_url: input.profile_image_url || null,
      social_links: input.social_links || {},
      seo: input.seo || {},
      is_active: input.is_active ?? true,
      user_id: input.user_id || null,
      created_at: now,
      updated_at: now,
    };
    this.authors.set(id, author);
    return author;
  }

  async updateAuthor(id: string, input: Partial<AuthorInput>): Promise<Author> {
    const auth = this.authors.get(id);
    if (!auth) throw new Error(`Author ${id} not found`);
    const updated = {
      ...auth,
      ...input,
      updated_at: new Date().toISOString(),
    };
    this.authors.set(id, updated);
    return updated;
  }

  async deleteAuthor(id: string): Promise<boolean> {
    return this.authors.delete(id);
  }

  // --- MEDIA ---
  async getMedia(params?: PaginationParams & { mimeType?: string; search?: string }): Promise<PaginatedResult<Media>> {
    const page = params?.page || 1;
    const limit = params?.limit || 24;
    let items = Array.from(this.media.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (params?.mimeType) {
      items = items.filter((m) => m.mime_type.startsWith(params.mimeType!));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (m) =>
          m.filename.toLowerCase().includes(q) ||
          (m.alt_text && m.alt_text.toLowerCase().includes(q)) ||
          (m.title && m.title.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    return {
      data: items.slice(offset, offset + limit),
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getMediaById(id: string): Promise<Media | null> {
    return this.media.get(id) || null;
  }

  async saveMediaRecord(mediaData: Omit<Media, 'id' | 'created_at' | 'updated_at'>): Promise<Media> {
    const now = new Date().toISOString();
    const id = uuid();
    const record: Media = {
      ...mediaData,
      id,
      created_at: now,
      updated_at: now,
    };
    this.media.set(id, record);
    return record;
  }

  async updateMedia(id: string, input: MediaUpdateInput): Promise<Media> {
    const media = this.media.get(id);
    if (!media) throw new Error(`Media ${id} not found`);
    const updated = {
      ...media,
      ...input,
      updated_at: new Date().toISOString(),
    };
    this.media.set(id, updated);
    return updated;
  }

  async deleteMediaRecord(id: string): Promise<boolean> {
    return this.media.delete(id);
  }

  // --- POST SEO ---
  async getPostSEO(postId: string): Promise<PostSEO | null> {
    return this.seo.get(postId) || null;
  }

  async upsertPostSEO(postId: string, seoData: Partial<PostSEO>): Promise<PostSEO> {
    const existing = this.seo.get(postId);
    const now = new Date().toISOString();
    const updated: PostSEO = {
      id: existing?.id || uuid(),
      post_id: postId,
      meta_title: seoData.meta_title ?? existing?.meta_title ?? null,
      meta_description: seoData.meta_description ?? existing?.meta_description ?? null,
      focus_keyword: seoData.focus_keyword ?? existing?.focus_keyword ?? null,
      canonical_url: seoData.canonical_url ?? existing?.canonical_url ?? null,
      og_title: seoData.og_title ?? existing?.og_title ?? null,
      og_description: seoData.og_description ?? existing?.og_description ?? null,
      og_image_url: seoData.og_image_url ?? existing?.og_image_url ?? null,
      twitter_title: seoData.twitter_title ?? existing?.twitter_title ?? null,
      twitter_description: seoData.twitter_description ?? existing?.twitter_description ?? null,
      twitter_image_url: seoData.twitter_image_url ?? existing?.twitter_image_url ?? null,
      twitter_card: seoData.twitter_card ?? existing?.twitter_card ?? 'summary_large_image',
      robots: seoData.robots ?? existing?.robots ?? 'index,follow',
      schema_type: seoData.schema_type ?? existing?.schema_type ?? 'Article',
      custom_schema: seoData.custom_schema ?? existing?.custom_schema ?? {},
      health_score: seoData.health_score ?? existing?.health_score ?? 100,
      created_at: existing?.created_at || now,
      updated_at: now,
    };
    this.seo.set(postId, updated);
    return updated;
  }

  // --- REVISIONS ---
  async getRevisions(postId: string): Promise<PostRevision[]> {
    return this.revisions.get(postId) || [];
  }

  async createRevision(input: CreateRevisionInput): Promise<PostRevision> {
    const rev: PostRevision = {
      id: uuid(),
      post_id: input.post_id,
      title: input.title,
      excerpt: input.excerpt || null,
      content: input.content,
      summary: input.summary || null,
      created_by: input.created_by || null,
      created_at: new Date().toISOString(),
    };
    const list = this.revisions.get(input.post_id) || [];
    list.unshift(rev); // newest first
    this.revisions.set(input.post_id, list);
    return rev;
  }

  async getRevisionById(id: string): Promise<PostRevision | null> {
    for (const list of this.revisions.values()) {
      const match = list.find((r) => r.id === id);
      if (match) return match;
    }
    return null;
  }

  // --- REDIRECTS ---
  async getRedirects(params?: PaginationParams): Promise<PaginatedResult<BlogRedirect>> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const items = Array.from(this.redirects.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    return {
      data: items.slice(offset, offset + limit),
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getRedirectBySource(sourceUrl: string): Promise<BlogRedirect | null> {
    return this.redirects.get(sourceUrl) || null;
  }

  async createRedirect(input: CreateRedirectInput): Promise<BlogRedirect> {
    const now = new Date().toISOString();
    const redirect: BlogRedirect = {
      id: uuid(),
      source_url: input.source_url,
      destination_url: input.destination_url,
      status_code: input.status_code || 301,
      post_id: input.post_id || null,
      hit_count: 0,
      created_at: now,
      updated_at: now,
    };
    this.redirects.set(input.source_url, redirect);
    return redirect;
  }

  async deleteRedirect(id: string): Promise<boolean> {
    for (const [src, r] of this.redirects.entries()) {
      if (r.id === id) {
        return this.redirects.delete(src);
      }
    }
    return false;
  }

  async incrementRedirectHit(id: string): Promise<void> {
    for (const r of this.redirects.values()) {
      if (r.id === id) {
        r.hit_count++;
        r.updated_at = new Date().toISOString();
        break;
      }
    }
  }

  // --- COMMENTS ---
  async getComments(params?: PaginationParams & { postId?: string; status?: CommentStatus }): Promise<PaginatedResult<Comment>> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    let items = Array.from(this.comments.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));

    if (params?.postId) {
      items = items.filter((c) => c.post_id === params.postId);
    }
    if (params?.status) {
      items = items.filter((c) => c.status === params.status);
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    return {
      data: items.slice(offset, offset + limit),
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async createComment(input: CommentInput): Promise<Comment> {
    const now = new Date().toISOString();
    const comment: Comment = {
      id: uuid(),
      post_id: input.post_id,
      parent_id: input.parent_id || null,
      author_name: input.author_name,
      author_email: input.author_email,
      author_url: input.author_url || null,
      content: input.content,
      status: 'pending',
      user_id: input.user_id || null,
      ip_address: input.ip_address || null,
      user_agent: input.user_agent || null,
      created_at: now,
      updated_at: now,
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  async updateCommentStatus(id: string, status: CommentStatus): Promise<Comment> {
    const comment = this.comments.get(id);
    if (!comment) throw new Error(`Comment ${id} not found`);
    comment.status = status;
    comment.updated_at = new Date().toISOString();
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  // --- SETTINGS ---
  async getSettings(key: string = 'general'): Promise<BlogSettings> {
    return (
      this.settings.get(key) || {
        blogTitle: 'Blog',
        basePath: '/blog',
        postsPerPage: 10,
        defaultPostStatus: 'draft',
        enableComments: false,
        enableMedia: true,
        enableScheduling: true,
        enableRevisions: true,
        enableRedirects: true,
        timezone: 'UTC',
      }
    );
  }

  async updateSettings(newSettings: Partial<BlogSettings>, key: string = 'general'): Promise<BlogSettings> {
    const current = await this.getSettings(key);
    const updated: BlogSettings = { ...current, ...newSettings };
    this.settings.set(key, updated);
    return updated;
  }

  // --- STATS ---
  async getBlogOverviewStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    scheduledPosts: number;
    trashedPosts: number;
    totalCategories: number;
    totalTags: number;
    totalAuthors: number;
    totalComments: number;
    totalMedia: number;
  }> {
    const postsList = Array.from(this.posts.values());
    return {
      totalPosts: postsList.filter((p) => p.status !== 'trash').length,
      publishedPosts: postsList.filter((p) => p.status === 'published').length,
      draftPosts: postsList.filter((p) => p.status === 'draft').length,
      scheduledPosts: postsList.filter((p) => p.status === 'scheduled').length,
      trashedPosts: postsList.filter((p) => p.status === 'trash').length,
      totalCategories: this.categories.size,
      totalTags: this.tags.size,
      totalAuthors: this.authors.size,
      totalComments: this.comments.size,
      totalMedia: this.media.size,
    };
  }

  // --- HELPERS ---
  private populatePostRelations(post: Post): Post {
    const copy = { ...post };

    // Author
    if (post.author_id) {
      copy.author = this.authors.get(post.author_id) || null;
    }

    // Featured Image
    if (post.featured_image_id) {
      copy.featured_image = this.media.get(post.featured_image_id) || null;
    }

    // Categories
    const catIds = this.postCategories.get(post.id);
    if (catIds) {
      copy.categories = Array.from(catIds)
        .map((cid) => this.categories.get(cid))
        .filter(Boolean) as Category[];
    } else {
      copy.categories = [];
    }

    // Tags
    const tagIds = this.postTags.get(post.id);
    if (tagIds) {
      copy.tags = Array.from(tagIds)
        .map((tid) => this.tags.get(tid))
        .filter(Boolean) as Tag[];
    } else {
      copy.tags = [];
    }

    // SEO
    copy.seo = this.seo.get(post.id) || null;

    return copy;
  }

  public seedData(): void {
    const now = new Date().toISOString();

    // Author
    const authorId = uuid();
    this.authors.set(authorId, {
      id: authorId,
      name: 'Dr. Aarav Sharma',
      slug: 'dr-aarav-sharma',
      email: 'aarav@example.com',
      bio: 'Senior Vastu & Architecture Consultant with over 18 years of experience.',
      designation: 'Chief Editorial Consultant',
      profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
      social_links: { twitter: 'https://twitter.com', linkedin: 'https://linkedin.com' },
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // Categories
    const cat1Id = uuid();
    this.categories.set(cat1Id, {
      id: cat1Id,
      name: 'Architectural Vastu',
      slug: 'architectural-vastu',
      description: 'Principles of spatial energy alignment for modern commercial and residential buildings.',
      parent_id: null,
      image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
      display_order: 1,
      is_active: true,
      post_count: 2,
      created_at: now,
      updated_at: now,
    });

    const cat2Id = uuid();
    this.categories.set(cat2Id, {
      id: cat2Id,
      name: 'Harmonious Living',
      slug: 'harmonious-living',
      description: 'Practical daily adjustments to enhance serenity and well-being.',
      parent_id: null,
      image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
      display_order: 2,
      is_active: true,
      post_count: 1,
      created_at: now,
      updated_at: now,
    });

    // Tags
    const tag1Id = uuid();
    this.tags.set(tag1Id, {
      id: tag1Id,
      name: 'Energy Flow',
      slug: 'energy-flow',
      post_count: 2,
      created_at: now,
      updated_at: now,
    });

    const tag2Id = uuid();
    this.tags.set(tag2Id, {
      id: tag2Id,
      name: 'Interior Design',
      slug: 'interior-design',
      post_count: 1,
      created_at: now,
      updated_at: now,
    });

    // Media
    const media1Id = uuid();
    this.media.set(media1Id, {
      id: media1Id,
      filename: 'modern-vastu-living.jpg',
      original_name: 'modern-vastu-living.jpg',
      url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80',
      mime_type: 'image/jpeg',
      file_size: 452000,
      width: 1200,
      height: 800,
      alt_text: 'Symmetrical sunlit living room with natural wood finishes and indoor greenery',
      title: 'Balanced Living Space',
      storage_provider: 'memory',
      storage_path: 'media/modern-vastu-living.jpg',
      created_at: now,
      updated_at: now,
    });

    // Post 1
    const post1Id = uuid();
    const post1: Post = {
      id: post1Id,
      title: 'The Five Elements in Modern Residential Architecture',
      slug: 'five-elements-modern-residential-architecture',
      excerpt: 'Discover how balancing Earth, Water, Fire, Air, and Space transforms both aesthetics and tranquility in contemporary homes.',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Balancing Nature and Structure' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Every architectural space is more than just concrete and glass; it is a dynamic living vessel where natural energies circulate. By incorporating the traditional five cosmic elements into modern floor plans, architects can unlock spaces that nurture mental clarity and physical vitality.',
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: '1. The North-East Water Axis' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'The North-East quadrant commands serenity and clarity. Placing reflective water elements, indoor reflection fountains, or expansive open balconies here fosters an atmosphere of unburdened morning sunlight.',
              },
            ],
          },
        ],
      },
      featured_image_id: media1Id,
      author_id: authorId,
      status: 'published',
      content_type: 'article',
      is_featured: true,
      reading_time: 4,
      word_count: 580,
      custom_fields: { orientation: 'North-East', architecturalStyle: 'Contemporary Minimalist' },
      published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      scheduled_at: null,
      created_at: now,
      updated_at: now,
    };
    this.posts.set(post1Id, post1);
    this.postCategories.set(post1Id, new Set([cat1Id]));
    this.postTags.set(post1Id, new Set([tag1Id, tag2Id]));

    this.seo.set(post1Id, {
      id: uuid(),
      post_id: post1Id,
      meta_title: 'Five Elements in Modern Architecture | Spatial Harmony',
      meta_description: 'Learn how aligning the five classical elements creates peaceful, vibrant residential environments.',
      focus_keyword: 'five elements',
      canonical_url: null,
      og_title: 'The Five Elements in Modern Residential Architecture',
      og_description: 'Transform your modern living spaces with timeless elemental principles.',
      og_image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80',
      robots: 'index,follow',
      schema_type: 'Article',
      health_score: 95,
      created_at: now,
      updated_at: now,
    });

    // Post 2
    const post2Id = uuid();
    const post2: Post = {
      id: post2Id,
      title: 'Morning Sun and Directional Alignment for Workspace Clarity',
      slug: 'morning-sun-directional-alignment-workspace',
      excerpt: 'Strategic desk orientation and natural eastern illumination can reduce fatigue and boost creative productivity.',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Optimizing Workspace Ergonomics with Natural Light' }],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Orienting your primary workspace towards the North or East allows soft, non-glaring natural light to stimulate circadian wakefulness without inducing screen reflections or eye strain.',
              },
            ],
          },
        ],
      },
      featured_image_id: media1Id,
      author_id: authorId,
      status: 'published',
      content_type: 'article',
      is_featured: false,
      reading_time: 3,
      word_count: 410,
      custom_fields: { roomType: 'Executive Office' },
      published_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      scheduled_at: null,
      created_at: now,
      updated_at: now,
    };
    this.posts.set(post2Id, post2);
    this.postCategories.set(post2Id, new Set([cat1Id, cat2Id]));
    this.postTags.set(post2Id, new Set([tag1Id]));

    this.seo.set(post2Id, {
      id: uuid(),
      post_id: post2Id,
      meta_title: 'Morning Sun & Workspace Directional Alignment',
      meta_description: 'Boost office focus and energy through natural light and directional alignment.',
      focus_keyword: 'workspace alignment',
      robots: 'index,follow',
      schema_type: 'Article',
      health_score: 90,
      created_at: now,
      updated_at: now,
    });

    // Seed Real Comments
    const comment1Id = uuid();
    this.comments.set(comment1Id, {
      id: comment1Id,
      post_id: post1Id,
      author_name: 'Sneha Kapoor',
      author_email: 'sneha.kapoor@example.com',
      content: 'Very helpful article! Really loved the points mentioned about directional alignment and natural light.',
      status: 'pending',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
    });

    const comment2Id = uuid();
    this.comments.set(comment2Id, {
      id: comment2Id,
      post_id: post1Id,
      author_name: 'Rahul Mehta',
      author_email: 'rahul.mehta@example.com',
      content: 'Can you share more details about applying this technique in compact modern apartments?',
      status: 'approved',
      created_at: new Date(Date.now() - 18000000).toISOString(),
      updated_at: new Date(Date.now() - 18000000).toISOString(),
    });
  }
}
