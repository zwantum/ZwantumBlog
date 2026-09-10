import {
  BlogConfig,
  BlogDatabaseAdapter,
  Post,
  BreadcrumbItem,
} from '@zwantum/blog-types';
import { BlogStorageAdapter, MemoryStorageAdapter } from '@zwantum/blog-storage';
import {
  generatePostMetadata,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  evaluateSEOHealth,
  generateSitemapEntries,
  generateSitemapXml,
  generateRssFeedXml,
} from '@zwantum/blog-seo';

import { MemoryDatabaseAdapter } from './database/memory-adapter';
import { PostService } from './services/post-service';
import { CategoryService } from './services/category-service';
import { TagService } from './services/tag-service';
import { AuthorService } from './services/author-service';
import { MediaService } from './services/media-service';
import { PublishingService } from './services/publishing-service';
import { RevisionService } from './services/revision-service';
import { CommentService } from './services/comment-service';
import { SettingsService } from './services/settings-service';

export interface BlogClientOptions {
  config?: BlogConfig;
  db?: BlogDatabaseAdapter;
  storage?: BlogStorageAdapter;
}

export interface BlogClient {
  config: BlogConfig;
  db: BlogDatabaseAdapter;
  storage: BlogStorageAdapter;
  posts: PostService;
  categories: CategoryService;
  tags: TagService;
  authors: AuthorService;
  media: MediaService;
  publishing: PublishingService;
  revisions: RevisionService;
  comments: CommentService;
  settings: SettingsService;
  seo: {
    getMetadata: (post: Post) => ReturnType<typeof generatePostMetadata>;
    getArticleSchema: (post: Post) => ReturnType<typeof generateArticleSchema>;
    getBreadcrumbsSchema: (items: BreadcrumbItem[]) => ReturnType<typeof generateBreadcrumbSchema>;
    getFaqSchema: (faqs: Array<{ question: string; answer: string }>) => ReturnType<typeof generateFAQSchema>;
    evaluateHealth: (post: Partial<Post>) => ReturnType<typeof evaluateSEOHealth>;
    getSitemap: () => Promise<string>;
    getRss: (feedTitle?: string, feedDescription?: string) => Promise<string>;
  };
  getOverviewStats: () => Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    scheduledPosts: number;
    trashedPosts: number;
    totalCategories: number;
    totalTags: number;
    totalAuthors: number;
  }>;
}

export function createBlogClient(options?: BlogClientOptions): BlogClient {
  const config: BlogConfig = options?.config || {
    basePath: '/blog',
    features: {
      categories: true,
      tags: true,
      authors: true,
      comments: true,
      scheduling: true,
      revisions: true,
      redirects: true,
      seo: true,
      media: true,
    },
  };

  const db = options?.db || new MemoryDatabaseAdapter(true);
  const storage = options?.storage || new MemoryStorageAdapter();

  const posts = new PostService(db, config);
  const categories = new CategoryService(db);
  const tags = new TagService(db);
  const authors = new AuthorService(db);
  const media = new MediaService(db, storage);
  const publishing = new PublishingService(db);
  const revisions = new RevisionService(db);
  const comments = new CommentService(db);
  const settings = new SettingsService(db);

  return {
    config,
    db,
    storage,
    posts,
    categories,
    tags,
    authors,
    media,
    publishing,
    revisions,
    comments,
    settings,
    seo: {
      getMetadata: (post: Post) => generatePostMetadata(post, config),
      getArticleSchema: (post: Post) => generateArticleSchema(post, config),
      getBreadcrumbsSchema: (items: BreadcrumbItem[]) => generateBreadcrumbSchema(items),
      getFaqSchema: (faqs) => generateFAQSchema(faqs),
      evaluateHealth: (post: Partial<Post>) => evaluateSEOHealth(post),
      getSitemap: async () => {
        const [postsRes, allCats, allTags, allAuthors] = await Promise.all([
          db.getPosts({ status: 'published', limit: 1000 }),
          db.getAllCategories(),
          db.getAllTags(),
          db.getAllAuthors(),
        ]);
        const entries = generateSitemapEntries({
          posts: postsRes.data,
          categories: allCats,
          tags: allTags,
          authors: allAuthors,
          config,
        });
        return generateSitemapXml(entries);
      },
      getRss: async (feedTitle?: string, feedDescription?: string) => {
        const postsRes = await db.getPosts({ status: 'published', limit: 50 });
        return generateRssFeedXml({
          posts: postsRes.data,
          config,
          feedTitle,
          feedDescription,
        });
      },
    },
    getOverviewStats: () => db.getBlogOverviewStats(),
  };
}
