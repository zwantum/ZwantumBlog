export interface AuthorSocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  instagram?: string;
  youtube?: string;
  [key: string]: string | undefined;
}

export interface AuthorSEO {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  bio?: string | null;
  designation?: string | null;
  profile_image_url?: string | null;
  social_links?: AuthorSocialLinks;
  seo?: AuthorSEO;
  is_active: boolean;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorInput {
  name: string;
  slug?: string;
  email?: string | null;
  bio?: string | null;
  designation?: string | null;
  profile_image_url?: string | null;
  social_links?: AuthorSocialLinks;
  seo?: AuthorSEO;
  is_active?: boolean;
  user_id?: string | null;
}
