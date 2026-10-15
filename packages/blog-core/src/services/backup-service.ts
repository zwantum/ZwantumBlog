import {
  BlogDatabaseAdapter,
  BlogBackupData,
  RestoreBackupOptions,
  RestoreBackupResult,
  Author,
  Category,
  Tag,
  Post,
} from '@zwantum/blog-types';

export class BackupService {
  constructor(private db: BlogDatabaseAdapter) {}

  /**
   * Export complete blog database snapshot into a structured portable backup bundle
   */
  async exportBackup(): Promise<BlogBackupData> {
    const [
      settings,
      authors,
      categories,
      tags,
      postsResult,
      mediaResult,
      commentsResult,
      redirectsResult,
    ] = await Promise.all([
      this.db.getSettings().catch(() => undefined),
      this.db.getAllAuthors().catch(() => []),
      this.db.getAllCategories().catch(() => []),
      this.db.getAllTags().catch(() => []),
      this.db.getPosts({ page: 1, limit: 10000 }).catch(() => ({ data: [] })),
      this.db.getMedia({ page: 1, limit: 10000 }).catch(() => ({ data: [] })),
      this.db.getComments({ page: 1, limit: 10000 }).catch(() => ({ data: [] })),
      this.db.getRedirects({ page: 1, limit: 10000 }).catch(() => ({ data: [] })),
    ]);

    const posts = postsResult.data || [];
    const media = mediaResult.data || [];
    const comments = commentsResult.data || [];
    const redirects = redirectsResult.data || [];

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      source: 'ZwantumBlog Engine',
      stats: {
        postsCount: posts.length,
        categoriesCount: categories.length,
        tagsCount: tags.length,
        authorsCount: authors.length,
        mediaCount: media.length,
        commentsCount: comments.length,
        redirectsCount: redirects.length,
      },
      settings,
      authors,
      categories,
      tags,
      media,
      posts,
      comments,
      redirects,
    };
  }

  /**
   * Restore blog state from a verified backup payload
   */
  async restoreBackup(
    backup: BlogBackupData,
    options: RestoreBackupOptions = { mode: 'merge' }
  ): Promise<RestoreBackupResult> {
    if (!backup || typeof backup !== 'object') {
      throw new Error('Invalid backup file format: Root JSON must be an object.');
    }

    const errors: string[] = [];
    const restored = {
      posts: 0,
      categories: 0,
      tags: 0,
      authors: 0,
      media: 0,
      comments: 0,
      redirects: 0,
      settings: false,
    };

    // 1. Restore Blog Settings
    if (backup.settings) {
      try {
        await this.db.updateSettings(backup.settings);
        restored.settings = true;
      } catch (err: any) {
        errors.push(`Failed to restore settings: ${err.message || err}`);
      }
    }

    // 2. Restore Authors
    if (Array.isArray(backup.authors)) {
      for (const author of backup.authors) {
        try {
          const existing = await this.db.getAuthorById(author.id).catch(() => null)
            || (author.slug ? await this.db.getAuthorBySlug(author.slug).catch(() => null) : null);

          if (existing) {
            await this.db.updateAuthor(existing.id, {
              name: author.name,
              email: author.email,
              bio: author.bio,
              designation: author.designation,
              profile_image_url: author.profile_image_url,
              social_links: author.social_links,
              seo: author.seo,
              is_active: author.is_active,
            });
          } else {
            await this.db.createAuthor({
              name: author.name,
              slug: author.slug,
              email: author.email,
              bio: author.bio,
              designation: author.designation,
              profile_image_url: author.profile_image_url,
              social_links: author.social_links,
              seo: author.seo,
              is_active: author.is_active,
            });
          }
          restored.authors++;
        } catch (err: any) {
          errors.push(`Author '${author.name}': ${err.message || err}`);
        }
      }
    }

    // 3. Restore Categories (Hierarchy Safe: Root categories first)
    if (Array.isArray(backup.categories)) {
      // Sort parents before children so parent_id foreign keys resolve cleanly
      const sortedCategories = [...backup.categories].sort((a, b) => {
        if (!a.parent_id && b.parent_id) return -1;
        if (a.parent_id && !b.parent_id) return 1;
        return 0;
      });

      for (const cat of sortedCategories) {
        try {
          const existing = await this.db.getCategoryById(cat.id).catch(() => null)
            || (cat.slug ? await this.db.getCategoryBySlug(cat.slug).catch(() => null) : null);

          if (existing) {
            await this.db.updateCategory(existing.id, {
              name: cat.name,
              description: cat.description,
              parent_id: cat.parent_id,
              image_url: cat.image_url,
              seo_title: cat.seo_title,
              seo_description: cat.seo_description,
              canonical_url: cat.canonical_url,
              robots: cat.robots,
              display_order: cat.display_order,
              is_active: cat.is_active,
            });
          } else {
            await this.db.createCategory({
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              parent_id: cat.parent_id,
              image_url: cat.image_url,
              seo_title: cat.seo_title,
              seo_description: cat.seo_description,
              canonical_url: cat.canonical_url,
              robots: cat.robots,
              display_order: cat.display_order,
              is_active: cat.is_active,
            });
          }
          restored.categories++;
        } catch (err: any) {
          errors.push(`Category '${cat.name}': ${err.message || err}`);
        }
      }
    }

    // 4. Restore Tags
    if (Array.isArray(backup.tags)) {
      for (const tag of backup.tags) {
        try {
          const existing = await this.db.getTagById(tag.id).catch(() => null)
            || (tag.slug ? await this.db.getTagBySlug(tag.slug).catch(() => null) : null);

          if (existing) {
            await this.db.updateTag(existing.id, {
              name: tag.name,
              description: tag.description,
              seo_title: tag.seo_title,
              seo_description: tag.seo_description,
              canonical_url: tag.canonical_url,
              robots: tag.robots,
            });
          } else {
            await this.db.createTag({
              name: tag.name,
              slug: tag.slug,
              description: tag.description,
              seo_title: tag.seo_title,
              seo_description: tag.seo_description,
              canonical_url: tag.canonical_url,
              robots: tag.robots,
            });
          }
          restored.tags++;
        } catch (err: any) {
          errors.push(`Tag '${tag.name}': ${err.message || err}`);
        }
      }
    }

    // 5. Restore Media Records
    if (Array.isArray(backup.media)) {
      for (const med of backup.media) {
        try {
          const existing = await this.db.getMediaById(med.id).catch(() => null);
          if (existing) {
            await this.db.updateMedia(med.id, {
              title: med.title,
              alt_text: med.alt_text,
              caption: med.caption,
              description: med.description,
            });
          } else {
            await this.db.saveMediaRecord({
              filename: med.filename,
              original_name: med.original_name,
              url: med.url,
              mime_type: med.mime_type,
              file_size: med.file_size,
              width: med.width,
              height: med.height,
              alt_text: med.alt_text || '',
              title: med.title || '',
              caption: med.caption || '',
              description: med.description || '',
              storage_provider: med.storage_provider || 'supabase',
              storage_path: med.storage_path,
              uploaded_by: med.uploaded_by,
              metadata: med.metadata || {},
            });
          }
          restored.media++;
        } catch (err: any) {
          errors.push(`Media '${med.filename}': ${err.message || err}`);
        }
      }
    }

    // 6. Restore Posts
    if (Array.isArray(backup.posts)) {
      for (const post of backup.posts) {
        try {
          const existing = await this.db.getPostById(post.id).catch(() => null)
            || (post.slug ? await this.db.getPostBySlug(post.slug).catch(() => null) : null);

          const category_ids = (post.categories || []).map((c: any) => c.id).filter(Boolean);
          const tag_ids = (post.tags || []).map((t: any) => t.id).filter(Boolean);

          if (existing) {
            await this.db.updatePost(existing.id, {
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              content: post.content,
              content_html: post.content_html,
              featured_image_id: post.featured_image_id,
              featured_image_caption: post.featured_image_caption,
              author_id: post.author_id,
              status: post.status,
              content_type: post.content_type,
              is_featured: post.is_featured,
              custom_fields: post.custom_fields,
              published_at: post.published_at,
              scheduled_at: post.scheduled_at,
              category_ids,
              tag_ids,
              seo: post.seo || undefined,
            });
          } else {
            await this.db.createPost({
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              content: post.content,
              content_html: post.content_html,
              featured_image_id: post.featured_image_id,
              featured_image_caption: post.featured_image_caption,
              author_id: post.author_id,
              status: post.status,
              content_type: post.content_type,
              is_featured: post.is_featured,
              custom_fields: post.custom_fields,
              published_at: post.published_at,
              scheduled_at: post.scheduled_at,
              category_ids,
              tag_ids,
              seo: post.seo || undefined,
            });
          }
          restored.posts++;
        } catch (err: any) {
          errors.push(`Post '${post.title}': ${err.message || err}`);
        }
      }
    }

    // 7. Restore Redirects
    if (Array.isArray(backup.redirects)) {
      for (const redir of backup.redirects) {
        try {
          const existing = await this.db.getRedirectBySource(redir.source_url).catch(() => null);
          if (!existing) {
            await this.db.createRedirect({
              source_url: redir.source_url,
              destination_url: redir.destination_url,
              status_code: redir.status_code || 301,
              post_id: redir.post_id || undefined,
            });
            restored.redirects++;
          }
        } catch (err: any) {
          errors.push(`Redirect '${redir.source_url}': ${err.message || err}`);
        }
      }
    }

    // 8. Restore Comments
    if (Array.isArray(backup.comments)) {
      for (const com of backup.comments) {
        try {
          const created = await this.db.createComment({
            post_id: com.post_id,
            parent_id: com.parent_id,
            author_name: com.author_name,
            author_email: com.author_email,
            author_url: com.author_url,
            content: com.content,
            user_id: com.user_id,
          });
          if (com.status && com.status !== 'pending') {
            await this.db.updateCommentStatus(created.id, com.status);
          }
          restored.comments++;
        } catch (err: any) {
          errors.push(`Comment by '${com.author_name}': ${err.message || err}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      restored,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
