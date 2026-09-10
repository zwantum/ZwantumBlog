import {
  BlogDatabaseAdapter,
  Comment,
  CommentInput,
  CommentStatus,
  PaginationParams,
  PaginatedResult,
} from '@zwantum/blog-types';

export class CommentService {
  private db: BlogDatabaseAdapter;

  constructor(db: BlogDatabaseAdapter) {
    this.db = db;
  }

  async list(params?: PaginationParams & { postId?: string; status?: CommentStatus }): Promise<PaginatedResult<Comment>> {
    return this.db.getComments(params);
  }

  async create(input: CommentInput): Promise<Comment> {
    if (!input.content || !input.content.trim()) {
      throw new Error('Comment content cannot be empty');
    }
    if (!input.author_name || !input.author_name.trim()) {
      throw new Error('Author name is required');
    }
    return this.db.createComment(input);
  }

  async approve(id: string): Promise<Comment> {
    return this.db.updateCommentStatus(id, 'approved');
  }

  async markSpam(id: string): Promise<Comment> {
    return this.db.updateCommentStatus(id, 'spam');
  }

  async trash(id: string): Promise<Comment> {
    return this.db.updateCommentStatus(id, 'trash');
  }

  async delete(id: string): Promise<boolean> {
    return this.db.deleteComment(id);
  }
}
