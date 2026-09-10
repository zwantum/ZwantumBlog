import {
  BlogDatabaseAdapter,
  Post,
  PostCreateInput,
  PostUpdateInput,
  PostFilterInput,
  PaginationParams,
  PaginatedResult,
  BlogConfig,
} from '@zwantum/blog-types';
import { validatePostInput } from '../validation';
import { generateUniquePostSlug, handlePostSlugChange } from './slug-service';
import { PostNotFoundError } from '../errors';

export class PostService {
  private db: BlogDatabaseAdapter;
  private config?: BlogConfig;

  constructor(db: BlogDatabaseAdapter, config?: BlogConfig) {
    this.db = db;
    this.config = config;
  }

  async list(params?: PaginationParams & PostFilterInput): Promise<PaginatedResult<Post>> {
    return this.db.getPosts(params);
  }

  async getById(id: string): Promise<Post | null> {
    return this.db.getPostById(id);
  }

  async getBySlug(slug: string): Promise<Post | null> {
    return this.db.getPostBySlug(slug);
  }

  async create(input: PostCreateInput): Promise<Post> {
    validatePostInput(input, false);

    // Auto-generate safe unique slug if missing or requested
    const resolvedSlug = await generateUniquePostSlug(input.title, this.db, undefined, input.slug);

    const post = await this.db.createPost({
      ...input,
      slug: resolvedSlug,
    });

    // Create initial revision if revisions are enabled
    if (this.config?.features?.revisions !== false && input.content) {
      await this.db.createRevision({
        post_id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        summary: 'Initial draft',
      });
    }

    return post;
  }

  async update(id: string, input: PostUpdateInput): Promise<Post> {
    validatePostInput(input, true);

    const existing = await this.db.getPostById(id);
    if (!existing) {
      throw new PostNotFoundError(id);
    }

    let finalSlug = existing.slug;
    if (input.slug && input.slug !== existing.slug) {
      finalSlug = await generateUniquePostSlug(input.title || existing.title, this.db, id, input.slug);

      // Protect SEO: if already published, register a 301 redirect from old slug to new slug
      const basePath = this.config?.basePath || '/blog';
      await handlePostSlugChange(
        id,
        existing.slug,
        finalSlug,
        existing.status === 'published',
        basePath,
        this.db
      );
    }

    const updated = await this.db.updatePost(id, {
      ...input,
      slug: finalSlug,
    });

    // Save revision snapshot if content changed
    if (this.config?.features?.revisions !== false && input.content) {
      await this.db.createRevision({
        post_id: id,
        title: updated.title,
        excerpt: updated.excerpt,
        content: updated.content,
        summary: 'Content update',
      });
    }

    return updated;
  }

  async delete(id: string, permanent: boolean = false): Promise<boolean> {
    const existing = await this.db.getPostById(id);
    if (!existing) return false;
    return this.db.deletePost(id, permanent);
  }

  async restore(id: string): Promise<Post> {
    return this.db.restorePost(id);
  }

  async duplicate(id: string): Promise<Post> {
    const original = await this.db.getPostById(id);
    if (!original) {
      throw new PostNotFoundError(id);
    }

    const copyTitle = `${original.title} (Copy)`;
    const newSlug = await generateUniquePostSlug(copyTitle, this.db);

    const duplicateInput: PostCreateInput = {
      title: copyTitle,
      slug: newSlug,
      excerpt: original.excerpt,
      content: JSON.parse(JSON.stringify(original.content)),
      featured_image_id: original.featured_image_id,
      author_id: original.author_id,
      status: 'draft', // Duplicated posts must ALWAYS start as drafts
      content_type: original.content_type,
      is_featured: false,
      custom_fields: JSON.parse(JSON.stringify(original.custom_fields || {})),
      category_ids: original.categories?.map((c) => c.id),
      tag_ids: original.tags?.map((t) => t.id),
      seo: original.seo
        ? {
            meta_title: original.seo.meta_title ? `${original.seo.meta_title} (Copy)` : undefined,
            meta_description: original.seo.meta_description,
            focus_keyword: original.seo.focus_keyword,
            robots: original.seo.robots,
            schema_type: original.seo.schema_type,
          }
        : undefined,
    };

    return this.create(duplicateInput);
  }

  async getFeatured(limit: number = 5): Promise<Post[]> {
    return this.db.getFeaturedPosts(limit);
  }

  async getRelated(postId: string, limit: number = 3): Promise<Post[]> {
    return this.db.getRelatedPosts(postId, limit);
  }
}
