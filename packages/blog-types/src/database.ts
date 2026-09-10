import { Post, PostCreateInput, PostUpdateInput, PostFilterInput } from './post';
import { Category, CategoryInput } from './category';
import { Tag, TagInput } from './tag';
import { Author, AuthorInput } from './author';
import { Media, MediaUpdateInput } from './media';
import { PostRevision, CreateRevisionInput } from './revision';
import { PostSEO } from './seo';
import { BlogRedirect, CreateRedirectInput } from './redirect';
import { Comment, CommentInput, CommentStatus } from './comment';
import { BlogSettings } from './config';
import { PaginatedResult, PaginationParams } from './pagination';

export interface BlogDatabaseAdapter {
  // Posts
  getPosts(params?: PaginationParams & PostFilterInput): Promise<PaginatedResult<Post>>;
  getPostById(id: string): Promise<Post | null>;
  getPostBySlug(slug: string): Promise<Post | null>;
  createPost(input: PostCreateInput): Promise<Post>;
  updatePost(id: string, input: PostUpdateInput): Promise<Post>;
  deletePost(id: string, permanent?: boolean): Promise<boolean>;
  restorePost(id: string): Promise<Post>;
  getFeaturedPosts(limit?: number): Promise<Post[]>;
  getRelatedPosts(postId: string, limit?: number): Promise<Post[]>;

  // Categories
  getCategories(params?: PaginationParams): Promise<PaginatedResult<Category>>;
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  createCategory(input: CategoryInput): Promise<Category>;
  updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;

  // Tags
  getTags(params?: PaginationParams): Promise<PaginatedResult<Tag>>;
  getAllTags(): Promise<Tag[]>;
  getTagById(id: string): Promise<Tag | null>;
  getTagBySlug(slug: string): Promise<Tag | null>;
  createTag(input: TagInput): Promise<Tag>;
  updateTag(id: string, input: Partial<TagInput>): Promise<Tag>;
  deleteTag(id: string): Promise<boolean>;

  // Authors
  getAuthors(params?: PaginationParams): Promise<PaginatedResult<Author>>;
  getAllAuthors(): Promise<Author[]>;
  getAuthorById(id: string): Promise<Author | null>;
  getAuthorBySlug(slug: string): Promise<Author | null>;
  createAuthor(input: AuthorInput): Promise<Author>;
  updateAuthor(id: string, input: Partial<AuthorInput>): Promise<Author>;
  deleteAuthor(id: string): Promise<boolean>;

  // Media
  getMedia(params?: PaginationParams & { mimeType?: string; search?: string }): Promise<PaginatedResult<Media>>;
  getMediaById(id: string): Promise<Media | null>;
  saveMediaRecord(media: Omit<Media, 'id' | 'created_at' | 'updated_at'>): Promise<Media>;
  updateMedia(id: string, input: MediaUpdateInput): Promise<Media>;
  deleteMediaRecord(id: string): Promise<boolean>;

  // Post SEO
  getPostSEO(postId: string): Promise<PostSEO | null>;
  upsertPostSEO(postId: string, seo: Partial<PostSEO>): Promise<PostSEO>;

  // Revisions
  getRevisions(postId: string): Promise<PostRevision[]>;
  createRevision(input: CreateRevisionInput): Promise<PostRevision>;
  getRevisionById(id: string): Promise<PostRevision | null>;

  // Redirects
  getRedirects(params?: PaginationParams): Promise<PaginatedResult<BlogRedirect>>;
  getRedirectBySource(sourceUrl: string): Promise<BlogRedirect | null>;
  createRedirect(input: CreateRedirectInput): Promise<BlogRedirect>;
  deleteRedirect(id: string): Promise<boolean>;
  incrementRedirectHit(id: string): Promise<void>;

  // Comments
  getComments(params?: PaginationParams & { postId?: string; status?: CommentStatus }): Promise<PaginatedResult<Comment>>;
  createComment(input: CommentInput): Promise<Comment>;
  updateCommentStatus(id: string, status: CommentStatus): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;

  // Settings
  getSettings(key?: string): Promise<BlogSettings>;
  updateSettings(settings: Partial<BlogSettings>, key?: string): Promise<BlogSettings>;

  // Overview / Stats
  getBlogOverviewStats(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    scheduledPosts: number;
    trashedPosts: number;
    totalCategories: number;
    totalTags: number;
    totalAuthors: number;
    totalComments?: number;
    totalMedia?: number;
  }>;
}
