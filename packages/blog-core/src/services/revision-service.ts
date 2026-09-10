import { BlogDatabaseAdapter, PostRevision, Post } from '@zwantum/blog-types';
import { PostNotFoundError } from '../errors';

export class RevisionService {
  private db: BlogDatabaseAdapter;

  constructor(db: BlogDatabaseAdapter) {
    this.db = db;
  }

  async getRevisions(postId: string): Promise<PostRevision[]> {
    return this.db.getRevisions(postId);
  }

  async getRevisionById(id: string): Promise<PostRevision | null> {
    return this.db.getRevisionById(id);
  }

  async restoreRevision(postId: string, revisionId: string): Promise<Post> {
    const post = await this.db.getPostById(postId);
    if (!post) throw new PostNotFoundError(postId);

    const revision = await this.db.getRevisionById(revisionId);
    if (!revision || revision.post_id !== postId) {
      throw new Error(`Revision ${revisionId} does not belong to post ${postId}`);
    }

    // Save current state as revision before restoring
    await this.db.createRevision({
      post_id: postId,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      summary: `Backup before restoring revision from ${revision.created_at}`,
    });

    // Restore content and excerpt
    return this.db.updatePost(postId, {
      title: revision.title,
      excerpt: revision.excerpt,
      content: revision.content,
    });
  }
}
