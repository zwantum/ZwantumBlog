export type SchemaType =
  | 'Article'
  | 'BlogPosting'
  | 'NewsArticle'
  | 'Person'
  | 'Organization'
  | 'BreadcrumbList'
  | 'FAQPage';

export type RobotsDirective = 'index,follow' | 'noindex,follow' | 'index,nofollow' | 'noindex,nofollow';

export interface PostSEO {
  id?: string;
  post_id?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  focus_keyword?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image_url?: string | null;
  twitter_card?: 'summary' | 'summary_large_image';
  robots?: RobotsDirective | string;
  schema_type?: SchemaType | string;
  custom_schema?: Record<string, unknown>;
  health_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SEOHealthCheckItem {
  id: string;
  label: string;
  passed: boolean;
  type: 'success' | 'warning' | 'error';
  message: string;
}

export interface SEOHealthReport {
  score: number;
  passedCount: number;
  warningCount: number;
  errorCount: number;
  checks: SEOHealthCheckItem[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}
