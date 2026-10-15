import { Post } from './post';
import { Category } from './category';
import { Tag } from './tag';
import { Author } from './author';
import { Media } from './media';
import { Comment } from './comment';
import { BlogRedirect } from './redirect';
import { BlogSettings } from './config';

export interface BlogBackupData {
  version: string;
  exportedAt: string;
  source: string;
  stats: {
    postsCount: number;
    categoriesCount: number;
    tagsCount: number;
    authorsCount: number;
    mediaCount: number;
    commentsCount: number;
    redirectsCount: number;
  };
  settings?: BlogSettings;
  authors: Author[];
  categories: Category[];
  tags: Tag[];
  media: Media[];
  posts: Post[];
  comments: Comment[];
  redirects: BlogRedirect[];
}

export interface RestoreBackupOptions {
  mode?: 'merge' | 'replace';
}

export interface RestoreBackupResult {
  success: boolean;
  restored: {
    posts: number;
    categories: number;
    tags: number;
    authors: number;
    media: number;
    comments: number;
    redirects: number;
    settings: boolean;
  };
  errors?: string[];
}
