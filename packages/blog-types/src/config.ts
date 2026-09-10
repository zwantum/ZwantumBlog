export interface BlogFeatureConfig {
  categories?: boolean;
  tags?: boolean;
  authors?: boolean;
  comments?: boolean;
  scheduling?: boolean;
  revisions?: boolean;
  redirects?: boolean;
  seo?: boolean;
  media?: boolean;
}

export interface BlogEditorConfig {
  headings?: boolean;
  images?: boolean;
  links?: boolean;
  tables?: boolean;
  youtube?: boolean;
  code?: boolean;
  faq?: boolean;
  callout?: boolean;
  cta?: boolean;
}

export interface BlogSEOConfig {
  siteName?: string;
  siteUrl?: string;
  defaultOgImage?: string;
  defaultTwitterHandle?: string;
  schema?: boolean;
  breadcrumbs?: boolean;
  sitemap?: boolean;
  rss?: boolean;
}

export interface BlogConfig {
  basePath?: string;
  postsPath?: string;
  categoriesPath?: string;
  tagsPath?: string;
  authorsPath?: string;
  features?: BlogFeatureConfig;
  editor?: BlogEditorConfig;
  seo?: BlogSEOConfig;
  pagination?: {
    postsPerPage?: number;
  };
  timezone?: string;
}

export interface BlogSettings {
  blogTitle: string;
  basePath: string;
  postsPerPage: number;
  defaultPostStatus: string;
  enableComments: boolean;
  enableMedia?: boolean;
  enableScheduling: boolean;
  enableRevisions: boolean;
  enableRedirects: boolean;
  timezone: string;
  custom?: Record<string, unknown>;
}
