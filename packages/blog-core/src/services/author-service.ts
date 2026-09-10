import { BlogDatabaseAdapter, Author, AuthorInput, PaginationParams, PaginatedResult } from '@zwantum/blog-types';
import { validateAuthorInput } from '../validation';
import { slugify } from './slug-service';

export class AuthorService {
  private db: BlogDatabaseAdapter;

  constructor(db: BlogDatabaseAdapter) {
    this.db = db;
  }

  async list(params?: PaginationParams): Promise<PaginatedResult<Author>> {
    return this.db.getAuthors(params);
  }

  async getAll(): Promise<Author[]> {
    return this.db.getAllAuthors();
  }

  async getById(id: string): Promise<Author | null> {
    return this.db.getAuthorById(id);
  }

  async getBySlug(slug: string): Promise<Author | null> {
    return this.db.getAuthorBySlug(slug);
  }

  async create(input: AuthorInput): Promise<Author> {
    validateAuthorInput(input);
    const slug = input.slug ? slugify(input.slug) : slugify(input.name);
    return this.db.createAuthor({
      ...input,
      slug,
    });
  }

  async update(id: string, input: Partial<AuthorInput>): Promise<Author> {
    if (input.slug) {
      input.slug = slugify(input.slug);
    }
    return this.db.updateAuthor(id, input);
  }

  async delete(id: string): Promise<boolean> {
    return this.db.deleteAuthor(id);
  }
}
