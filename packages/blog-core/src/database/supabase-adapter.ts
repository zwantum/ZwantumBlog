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

// Generic Supabase client interface to avoid hard dependency lock in core
export interface SupabaseQueryClient {
  from: (table: string) => any;
  rpc?: (fn: string, params?: any) => Promise<any>;
}

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export class SupabaseDatabaseAdapter implements BlogDatabaseAdapter {
  private client: SupabaseQueryClient;

  constructor(client: SupabaseQueryClient) {
    this.client = client;
  }

  private async getPrimaryActiveAuthorId(): Promise<string | null> {
    try {
      const { data } = await this.client
        .from('blog_authors')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);
      if (data && data.length > 0 && isValidUUID(data[0]?.id)) {
        return data[0].id;
      }
    } catch {
      // Non-fatal fallback
    }
    return null;
  }

  async getPosts(params?: PaginationParams & PostFilterInput): Promise<PaginatedResult<Post>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.client
      .from('blog_posts')
      .select(
        '*, author:blog_authors(*), featured_image:blog_media(*), categories:blog_categories(*), tags:blog_tags(*), seo:blog_post_seo(*)',
        { count: 'exact' }
      );

    if (!params?.includeTrashed) {
      query = query.is('deleted_at', null).neq('status', 'trash');
    }

    if (params?.status) {
      if (Array.isArray(params.status)) {
        query = query.in('status', params.status);
      } else {
        query = query.eq('status', params.status);
      }
    }

    if (params?.isFeatured !== undefined) {
      query = query.eq('is_featured', params.isFeatured);
    }

    if (params?.authorId) {
      query = query.eq('author_id', params.authorId);
    }

    if (params?.search) {
      query = query.ilike('title', `%${params.search}%`);
    }

    const sortField = params?.sortBy || 'published_at';
    const ascending = params?.sortOrder === 'asc';
    query = query.order(sortField, { ascending, nullsFirst: false });
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: (data || []) as Post[],
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getPostById(id: string): Promise<Post | null> {
    const { data, error } = await this.client
      .from('blog_posts')
      .select(
        '*, author:blog_authors(*), featured_image:blog_media(*), categories:blog_categories(*), tags:blog_tags(*), seo:blog_post_seo(*)'
      )
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Post;
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const { data, error } = await this.client
      .from('blog_posts')
      .select(
        '*, author:blog_authors(*), featured_image:blog_media(*), categories:blog_categories(*), tags:blog_tags(*), seo:blog_post_seo(*)'
      )
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data as Post;
  }

  async createPost(input: PostCreateInput): Promise<Post> {
    const metrics = calculateContentMetrics(input.content || {});

    // 1. Sanitize author_id: valid UUID or fallback to primary active author
    let validAuthorId: string | null = null;
    if (isValidUUID(input.author_id)) {
      validAuthorId = input.author_id;
    } else {
      validAuthorId = await this.getPrimaryActiveAuthorId();
    }

    // 2. Sanitize featured_image_id: valid UUID or null
    const validFeaturedImageId = isValidUUID(input.featured_image_id)
      ? input.featured_image_id
      : null;

    // 3. Filter junction UUIDs
    const validCategoryIds = (input.category_ids || []).filter(isValidUUID);
    const validTagIds = (input.tag_ids || []).filter(isValidUUID);

    // 4. Clean post payload: strictly table columns, zero relation leakage
    const postPayload: Record<string, unknown> = {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt || null,
      content: input.content || { type: 'doc', content: [] },
      content_html: input.content_html || null,
      featured_image_id: validFeaturedImageId,
      author_id: validAuthorId,
      status: input.status || 'draft',
      content_type: input.content_type || 'article',
      is_featured: input.is_featured ?? false,
      reading_time: metrics.readingTime,
      word_count: metrics.wordCount,
      custom_fields: input.custom_fields || {},
      published_at: input.status === 'published' ? (input.published_at || new Date().toISOString()) : null,
      scheduled_at: input.scheduled_at || null,
    };

    const { data: post, error } = await this.client
      .from('blog_posts')
      .insert(postPayload)
      .select()
      .single();

    if (error) throw error;

    // Categories junction
    if (validCategoryIds.length > 0) {
      const catRows = validCategoryIds.map((cid, idx) => ({
        post_id: post.id,
        category_id: cid,
        is_primary: idx === 0,
      }));
      await this.client.from('blog_post_categories').insert(catRows);
    }

    // Tags junction
    if (validTagIds.length > 0) {
      const tagRows = validTagIds.map((tid) => ({
        post_id: post.id,
        tag_id: tid,
      }));
      await this.client.from('blog_post_tags').insert(tagRows);
    }

    // SEO
    if (input.seo) {
      await this.upsertPostSEO(post.id, input.seo);
    }

    return (await this.getPostById(post.id))!;
  }

  async updatePost(id: string, input: PostUpdateInput): Promise<Post> {
    const updatePayload: Record<string, unknown> = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    // 1. Strip all joined relation objects and auxiliary fields before Postgres mutation
    delete updatePayload.author;
    delete updatePayload.featured_image;
    delete updatePayload.categories;
    delete updatePayload.tags;
    delete updatePayload.category_ids;
    delete updatePayload.tag_ids;
    delete updatePayload.seo;

    // 2. Sanitize author_id if provided
    if ('author_id' in updatePayload) {
      if (isValidUUID(updatePayload.author_id)) {
        // Keep valid UUID
      } else if (updatePayload.author_id) {
        const fallbackAuthor = await this.getPrimaryActiveAuthorId();
        if (fallbackAuthor) {
          updatePayload.author_id = fallbackAuthor;
        } else {
          delete updatePayload.author_id;
        }
      } else {
        updatePayload.author_id = null;
      }
    }

    // 3. Sanitize featured_image_id if provided
    if ('featured_image_id' in updatePayload) {
      updatePayload.featured_image_id = isValidUUID(updatePayload.featured_image_id)
        ? updatePayload.featured_image_id
        : null;
    }

    // 4. Metrics calculation
    if (input.content) {
      const metrics = calculateContentMetrics(input.content);
      updatePayload.word_count = metrics.wordCount;
      updatePayload.reading_time = metrics.readingTime;
    }

    const { error } = await this.client.from('blog_posts').update(updatePayload).eq('id', id);
    if (error) throw error;

    // Update categories if provided
    if (input.category_ids !== undefined) {
      const validCategoryIds = input.category_ids.filter(isValidUUID);
      await this.client.from('blog_post_categories').delete().eq('post_id', id);
      if (validCategoryIds.length > 0) {
        const catRows = validCategoryIds.map((cid, idx) => ({
          post_id: id,
          category_id: cid,
          is_primary: idx === 0,
        }));
        await this.client.from('blog_post_categories').insert(catRows);
      }
    }

    // Update tags if provided
    if (input.tag_ids !== undefined) {
      const validTagIds = input.tag_ids.filter(isValidUUID);
      await this.client.from('blog_post_tags').delete().eq('post_id', id);
      if (validTagIds.length > 0) {
        const tagRows = validTagIds.map((tid) => ({
          post_id: id,
          tag_id: tid,
        }));
        await this.client.from('blog_post_tags').insert(tagRows);
      }
    }

    // Update SEO if provided
    if (input.seo) {
      await this.upsertPostSEO(id, input.seo);
    }

    return (await this.getPostById(id))!;
  }

  async deletePost(id: string, permanent: boolean = false): Promise<boolean> {
    if (permanent) {
      const { error } = await this.client.from('blog_posts').delete().eq('id', id);
      return !error;
    } else {
      const { error } = await this.client
        .from('blog_posts')
        .update({ status: 'trash', deleted_at: new Date().toISOString() })
        .eq('id', id);
      return !error;
    }
  }

  async restorePost(id: string): Promise<Post> {
    const { error } = await this.client
      .from('blog_posts')
      .update({ status: 'draft', deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return (await this.getPostById(id))!;
  }

  async getFeaturedPosts(limit: number = 5): Promise<Post[]> {
    const { data, error } = await this.client
      .from('blog_posts')
      .select('*, author:blog_authors(*), featured_image:blog_media(*), categories:blog_categories(*)')
      .eq('is_featured', true)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Post[];
  }

  async getRelatedPosts(postId: string, limit: number = 3): Promise<Post[]> {
    // Get current post's category ids
    const { data: catRows } = await this.client
      .from('blog_post_categories')
      .select('category_id')
      .eq('post_id', postId);

    const categoryIds = catRows?.map((r: { category_id: string }) => r.category_id) || [];

    if (categoryIds.length === 0) {
      const { data } = await this.client
        .from('blog_posts')
        .select('*, featured_image:blog_media(*), author:blog_authors(*)')
        .eq('status', 'published')
        .neq('id', postId)
        .order('published_at', { ascending: false })
        .limit(limit);
      return (data || []) as Post[];
    }

    const { data } = await this.client
      .from('blog_posts')
      .select(
        '*, featured_image:blog_media(*), author:blog_authors(*), post_categories:blog_post_categories!inner(category_id)'
      )
      .in('post_categories.category_id', categoryIds)
      .eq('status', 'published')
      .neq('id', postId)
      .limit(limit);

    return (data || []) as Post[];
  }

  // --- CATEGORIES ---
  async getCategories(params?: PaginationParams): Promise<PaginatedResult<Category>> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await this.client
      .from('blog_categories')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(from, to);

    if (error) throw error;
    return {
      data: (data || []) as Category[],
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit) || 1,
      hasNextPage: page < (Math.ceil((count || 0) / limit) || 1),
      hasPrevPage: page > 1,
    };
  }

  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await this.client
      .from('blog_categories')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data || []) as Category[];
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await this.client.from('blog_categories').select('*').eq('id', id).single();
    if (error) return null;
    return data as Category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await this.client.from('blog_categories').select('*').eq('slug', slug).single();
    if (error) return null;
    return data as Category;
  }

  async createCategory(input: CategoryInput): Promise<Category> {
    const { data, error } = await this.client.from('blog_categories').insert(input).select().single();
    if (error) throw error;
    return data as Category;
  }

  async updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
    const { data, error } = await this.client
      .from('blog_categories')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await this.client.from('blog_categories').delete().eq('id', id);
    return !error;
  }

  // --- TAGS ---
  async getTags(params?: PaginationParams): Promise<PaginatedResult<Tag>> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await this.client
      .from('blog_tags')
      .select('*', { count: 'exact' })
      .order('post_count', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: (data || []) as Tag[],
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit) || 1,
      hasNextPage: page < (Math.ceil((count || 0) / limit) || 1),
      hasPrevPage: page > 1,
    };
  }

  async getAllTags(): Promise<Tag[]> {
    const { data, error } = await this.client.from('blog_tags').select('*').order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as Tag[];
  }

  async getTagById(id: string): Promise<Tag | null> {
    const { data, error } = await this.client.from('blog_tags').select('*').eq('id', id).single();
    if (error) return null;
    return data as Tag;
  }

  async getTagBySlug(slug: string): Promise<Tag | null> {
    const { data, error } = await this.client.from('blog_tags').select('*').eq('slug', slug).single();
    if (error) return null;
    return data as Tag;
  }

  async createTag(input: TagInput): Promise<Tag> {
    const { data, error } = await this.client.from('blog_tags').insert(input).select().single();
    if (error) throw error;
    return data as Tag;
  }

  async updateTag(id: string, input: Partial<TagInput>): Promise<Tag> {
    const { data, error } = await this.client
      .from('blog_tags')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Tag;
  }

  async deleteTag(id: string): Promise<boolean> {
    const { error } = await this.client.from('blog_tags').delete().eq('id', id);
    return !error;
  }

  // --- AUTHORS ---
  async getAuthors(params?: PaginationParams): Promise<PaginatedResult<Author>> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await this.client
      .from('blog_authors')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(from, to);

    if (error) throw error;
    return {
      data: (data || []) as Author[],
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit) || 1,
      hasNextPage: page < (Math.ceil((count || 0) / limit) || 1),
      hasPrevPage: page > 1,
    };
  }

  async getAllAuthors(): Promise<Author[]> {
    const { data, error } = await this.client.from('blog_authors').select('*').eq('is_active', true);
    if (error) throw error;
    return (data || []) as Author[];
  }

  async getAuthorById(id: string): Promise<Author | null> {
    const { data, error } = await this.client.from('blog_authors').select('*').eq('id', id).single();
    if (error) return null;
    return data as Author;
  }

  async getAuthorBySlug(slug: string): Promise<Author | null> {
    const { data, error } = await this.client.from('blog_authors').select('*').eq('slug', slug).single();
    if (error) return null;
    return data as Author;
  }

  async createAuthor(input: AuthorInput): Promise<Author> {
    const { data, error } = await this.client.from('blog_authors').insert(input).select().single();
    if (error) throw error;
    return data as Author;
  }

  async updateAuthor(id: string, input: Partial<AuthorInput>): Promise<Author> {
    const { data, error } = await this.client
      .from('blog_authors')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Author;
  }

  async deleteAuthor(id: string): Promise<boolean> {
    const { error } = await this.client.from('blog_authors').delete().eq('id', id);
    return !error;
  }

  // --- MEDIA ---
  async getMedia(params?: PaginationParams & { mimeType?: string; search?: string }): Promise<PaginatedResult<Media>> {
    const page = params?.page || 1;
    const limit = params?.limit || 24;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.client.from('blog_media').select('*', { count: 'exact' });

    if (params?.mimeType) {
      query = query.ilike('mime_type', `${params.mimeType}%`);
    }
    if (params?.search) {
      query = query.or(`filename.ilike.%${params.search}%,alt_text.ilike.%${params.search}%,title.ilike.%${params.search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data: (data || []) as Media[],
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit) || 1,
      hasNextPage: page < (Math.ceil((count || 0) / limit) || 1),
      hasPrevPage: page > 1,
    };
  }

  async getMediaById(id: string): Promise<Media | null> {
    const { data, error } = await this.client.from('blog_media').select('*').eq('id', id).single();
    if (error) return null;
    return data as Media;
  }

  async saveMediaRecord(media: Omit<Media, 'id' | 'created_at' | 'updated_at'>): Promise<Media> {
    const { data, error } = await this.client.from('blog_media').insert(media).select().single();
    if (error) throw error;
    return data as Media;
  }

  async updateMedia(id: string, input: MediaUpdateInput): Promise<Media> {
    const { data, error } = await this.client
      .from('blog_media')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Media;
  }

  async deleteMediaRecord(id: string): Promise<boolean> {
    const { error } = await this.client.from('blog_media').delete().eq('id', id);
    return !error;
  }

  // --- POST SEO ---
  async getPostSEO(postId: string): Promise<PostSEO | null> {
    const { data, error } = await this.client.from('blog_post_seo').select('*').eq('post_id', postId).single();
    if (error) return null;
    return data as PostSEO;
  }

  async upsertPostSEO(postId: string, seo: Partial<PostSEO>): Promise<PostSEO> {
    const payload = {
      ...seo,
      post_id: postId,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await this.client
      .from('blog_post_seo')
      .upsert(payload, { onConflict: 'post_id' })
      .select()
      .single();

    if (error) throw error;
    return data as PostSEO;
  }

  // --- REVISIONS ---
  async getRevisions(postId: string): Promise<PostRevision[]> {
    const { data, error } = await this.client
      .from('blog_post_revisions')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as PostRevision[];
  }

  async createRevision(input: CreateRevisionInput): Promise<PostRevision> {
    const { data, error } = await this.client.from('blog_post_revisions').insert(input).select().single();
    if (error) throw error;
    return data as PostRevision;
  }

  async getRevisionById(id: string): Promise<PostRevision | null> {
    const { data, error } = await this.client.from('blog_post_revisions').select('*').eq('id', id).single();
    if (error) return null;
    return data as PostRevision;
  }

  // --- REDIRECTS ---
  async getRedirects(params?: PaginationParams): Promise<PaginatedResult<BlogRedirect>> {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await this.client
      .from('blog_redirects')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: (data || []) as BlogRedirect[],
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit) || 1,
      hasNextPage: page < (Math.ceil((count || 0) / limit) || 1),
      hasPrevPage: page > 1,
    };
  }

  async getRedirectBySource(sourceUrl: string): Promise<BlogRedirect | null> {
    const { data, error } = await this.client.from('blog_redirects').select('*').eq('source_url', sourceUrl).single();
    if (error) return null;
    return data as BlogRedirect;
  }

  async createRedirect(input: CreateRedirectInput): Promise<BlogRedirect> {
    const { data, error } = await this.client.from('blog_redirects').insert(input).select().single();
    if (error) throw error;
    return data as BlogRedirect;
  }

  async deleteRedirect(id: string): Promise<boolean> {
    const { error } = await this.client.from('blog_redirects').delete().eq('id', id);
    return !error;
  }

  async incrementRedirectHit(id: string): Promise<void> {
    if (this.client.rpc) {
      await this.client.rpc('increment_redirect_hit', { redirect_id: id });
    }
  }

  // --- COMMENTS ---
  async getComments(params?: PaginationParams & { postId?: string; status?: CommentStatus }): Promise<PaginatedResult<Comment>> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.client.from('blog_comments').select('*', { count: 'exact' });
    if (params?.postId) query = query.eq('post_id', params.postId);
    if (params?.status) query = query.eq('status', params.status);

    query = query.order('created_at', { ascending: false }).range(from, to);
    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data: (data || []) as Comment[],
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit) || 1,
      hasNextPage: page < (Math.ceil((count || 0) / limit) || 1),
      hasPrevPage: page > 1,
    };
  }

  async createComment(input: CommentInput): Promise<Comment> {
    const { data, error } = await this.client.from('blog_comments').insert(input).select().single();
    if (error) throw error;
    return data as Comment;
  }

  async updateCommentStatus(id: string, status: CommentStatus): Promise<Comment> {
    const { data, error } = await this.client
      .from('blog_comments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Comment;
  }

  async deleteComment(id: string): Promise<boolean> {
    const { error } = await this.client.from('blog_comments').delete().eq('id', id);
    return !error;
  }

  // --- SETTINGS ---
  async getSettings(key: string = 'general'): Promise<BlogSettings> {
    const { data, error } = await this.client.from('blog_settings').select('value').eq('key', key).single();
    if (error || !data) {
      return {
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
      };
    }
    return data.value as BlogSettings;
  }

  async updateSettings(settings: Partial<BlogSettings>, key: string = 'general'): Promise<BlogSettings> {
    const existing = await this.getSettings(key);
    const merged = { ...existing, ...settings };
    const { error } = await this.client
      .from('blog_settings')
      .upsert({ key, value: merged, updated_at: new Date().toISOString() });
    if (error) throw error;
    return merged;
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
  }> {
    const [postsRes, catRes, tagRes, authRes] = await Promise.all([
      this.client.from('blog_posts').select('status, deleted_at'),
      this.client.from('blog_categories').select('id', { count: 'exact', head: true }),
      this.client.from('blog_tags').select('id', { count: 'exact', head: true }),
      this.client.from('blog_authors').select('id', { count: 'exact', head: true }),
    ]);

    const postList = (postsRes.data || []) as Array<{ status: string; deleted_at: string | null }>;

    return {
      totalPosts: postList.filter((p) => !p.deleted_at && p.status !== 'trash').length,
      publishedPosts: postList.filter((p) => p.status === 'published' && !p.deleted_at).length,
      draftPosts: postList.filter((p) => p.status === 'draft' && !p.deleted_at).length,
      scheduledPosts: postList.filter((p) => p.status === 'scheduled' && !p.deleted_at).length,
      trashedPosts: postList.filter((p) => p.status === 'trash' || p.deleted_at).length,
      totalCategories: catRes.count || 0,
      totalTags: tagRes.count || 0,
      totalAuthors: authRes.count || 0,
    };
  }
}
