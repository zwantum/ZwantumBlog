import { Author } from './author';
import { Category } from './category';
import { Tag } from './tag';
import { Media } from './media';
import { PostSEO } from './seo';

export type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'trash';

export type ContentType = 'article' | 'news' | 'announcement' | 'event' | string;

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: Record<string, unknown>; // Tiptap structured JSON document
  content_html?: string | null;
  featured_image_id?: string | null;
  featured_image?: Media | null;
  author_id?: string | null;
  author?: Author | null;
  status: PostStatus;
  content_type: ContentType;
  is_featured: boolean;
  reading_time: number;
  word_count: number;
  custom_fields: Record<string, unknown>;
  published_at?: string | null;
  scheduled_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;

  // Populated relations
  categories?: Category[];
  tags?: Tag[];
  seo?: PostSEO | null;
}

export interface PostCreateInput {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content?: Record<string, unknown>;
  content_html?: string | null;
  featured_image_id?: string | null;
  author_id?: string | null;
  status?: PostStatus;
  content_type?: ContentType;
  is_featured?: boolean;
  custom_fields?: Record<string, unknown>;
  published_at?: string | null;
  scheduled_at?: string | null;
  category_ids?: string[];
  tag_ids?: string[];
  seo?: Partial<PostSEO>;
}

export interface PostUpdateInput extends Partial<PostCreateInput> {
  id?: string;
}

export interface PostFilterInput {
  status?: PostStatus | PostStatus[];
  categorySlug?: string;
  categoryId?: string;
  tagSlug?: string;
  tagId?: string;
  authorSlug?: string;
  authorId?: string;
  isFeatured?: boolean;
  contentType?: string;
  search?: string;
  includeTrashed?: boolean;
}
