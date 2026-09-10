import { BlogDatabaseAdapter, Tag, TagInput, PaginationParams, PaginatedResult } from '@zwantum/blog-types';
import { validateTagInput } from '../validation';
import { slugify } from './slug-service';

export class TagService {
  private db: BlogDatabaseAdapter;

  constructor(db: BlogDatabaseAdapter) {
    this.db = db;
  }

  async list(params?: PaginationParams): Promise<PaginatedResult<Tag>> {
    return this.db.getTags(params);
  }

  async getAll(): Promise<Tag[]> {
    return this.db.getAllTags();
  }

  async getById(id: string): Promise<Tag | null> {
    return this.db.getTagById(id);
  }

  async getBySlug(slug: string): Promise<Tag | null> {
    return this.db.getTagBySlug(slug);
  }

  async create(input: TagInput): Promise<Tag> {
    validateTagInput(input);
    const slug = input.slug ? slugify(input.slug) : slugify(input.name);
    return this.db.createTag({
      ...input,
      slug,
    });
  }

  async update(id: string, input: Partial<TagInput>): Promise<Tag> {
    if (input.slug) {
      input.slug = slugify(input.slug);
    }
    return this.db.updateTag(id, input);
  }

  async delete(id: string): Promise<boolean> {
    return this.db.deleteTag(id);
  }
}
