export type BlogPermission =
  | 'blog.posts.view'
  | 'blog.posts.create'
  | 'blog.posts.edit'
  | 'blog.posts.delete'
  | 'blog.posts.publish'
  | 'blog.posts.schedule'
  | 'blog.categories.manage'
  | 'blog.tags.manage'
  | 'blog.authors.manage'
  | 'blog.media.manage'
  | 'blog.comments.manage'
  | 'blog.seo.manage'
  | 'blog.settings.manage';

export interface BlogPermissionContext {
  userId?: string | null;
  userRoles?: string[];
  permissions?: (BlogPermission | string)[];
  hasPermission?: (permission: BlogPermission) => boolean;
}

export const ALL_BLOG_PERMISSIONS: BlogPermission[] = [
  'blog.posts.view',
  'blog.posts.create',
  'blog.posts.edit',
  'blog.posts.delete',
  'blog.posts.publish',
  'blog.posts.schedule',
  'blog.categories.manage',
  'blog.tags.manage',
  'blog.authors.manage',
  'blog.media.manage',
  'blog.comments.manage',
  'blog.seo.manage',
  'blog.settings.manage',
];
