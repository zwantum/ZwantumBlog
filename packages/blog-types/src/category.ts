export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  robots?: string;
  no_index?: boolean;
  display_order: number;
  is_active: boolean;
  post_count: number;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  robots?: string;
  no_index?: boolean;
  display_order?: number;
  is_active?: boolean;
}
