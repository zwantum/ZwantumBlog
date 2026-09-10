import { BlogDatabaseAdapter, Post } from '@zwantum/blog-types';
import { SchedulingError, PostNotFoundError } from '../errors';

export class PublishingService {
  private db: BlogDatabaseAdapter;

  constructor(db: BlogDatabaseAdapter) {
    this.db = db;
  }

  async publishImmediately(id: string): Promise<Post> {
    const post = await this.db.getPostById(id);
    if (!post) throw new PostNotFoundError(id);

    const now = new Date().toISOString();
    return this.db.updatePost(id, {
      status: 'published',
      published_at: post.published_at || now,
      scheduled_at: null,
    });
  }

  async schedulePost(id: string, scheduledAt: string | Date): Promise<Post> {
    const post = await this.db.getPostById(id);
    if (!post) throw new PostNotFoundError(id);

    const targetDate = typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;
    if (isNaN(targetDate.getTime())) {
      throw new SchedulingError('Invalid scheduled date provided');
    }

    const isoString = targetDate.toISOString();

    return this.db.updatePost(id, {
      status: 'scheduled',
      scheduled_at: isoString,
    });
  }

  async unpublish(id: string): Promise<Post> {
    const post = await this.db.getPostById(id);
    if (!post) throw new PostNotFoundError(id);

    return this.db.updatePost(id, {
      status: 'draft',
      scheduled_at: null,
    });
  }

  async archive(id: string): Promise<Post> {
    const post = await this.db.getPostById(id);
    if (!post) throw new PostNotFoundError(id);

    return this.db.updatePost(id, {
      status: 'archived',
    });
  }

  /**
   * Process all scheduled posts that have reached or passed their scheduled timestamp.
   * Can be called from serverless cron, edge worker, or on-demand request middleware.
   */
  async processScheduledPosts(): Promise<{ publishedCount: number; postIds: string[] }> {
    const now = new Date().toISOString();
    const scheduledPostsResult = await this.db.getPosts({
      status: 'scheduled',
      limit: 100,
    });

    const readyToPublish = scheduledPostsResult.data.filter((p) => p.scheduled_at && p.scheduled_at <= now);

    const publishedIds: string[] = [];
    for (const post of readyToPublish) {
      await this.db.updatePost(post.id, {
        status: 'published',
        published_at: post.scheduled_at,
        scheduled_at: null,
      });
      publishedIds.push(post.id);
    }

    return {
      publishedCount: publishedIds.length,
      postIds: publishedIds,
    };
  }
}
