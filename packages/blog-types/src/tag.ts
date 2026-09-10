export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  robots?: string;
  no_index?: boolean;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface TagInput {
  name: string;
  slug?: string;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  robots?: string;
  no_index?: boolean;
}
