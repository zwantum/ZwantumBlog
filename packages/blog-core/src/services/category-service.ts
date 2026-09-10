import { BlogDatabaseAdapter, Category, CategoryInput, PaginationParams, PaginatedResult } from '@zwantum/blog-types';
import { validateCategoryInput } from '../validation';
import { slugify } from './slug-service';

export class CategoryService {
  private db: BlogDatabaseAdapter;

  constructor(db: BlogDatabaseAdapter) {
    this.db = db;
  }

  async list(params?: PaginationParams): Promise<PaginatedResult<Category>> {
    return this.db.getCategories(params);
  }

  async getAll(): Promise<Category[]> {
    return this.db.getAllCategories();
  }

  async getById(id: string): Promise<Category | null> {
    return this.db.getCategoryById(id);
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return this.db.getCategoryBySlug(slug);
  }

  async create(input: CategoryInput): Promise<Category> {
    validateCategoryInput(input);
    const slug = input.slug ? slugify(input.slug) : slugify(input.name);
    return this.db.createCategory({
      ...input,
      slug,
    });
  }

  async update(id: string, input: Partial<CategoryInput>): Promise<Category> {
    if (input.slug) {
      input.slug = slugify(input.slug);
    }
    return this.db.updateCategory(id, input);
  }

  async delete(id: string): Promise<boolean> {
    return this.db.deleteCategory(id);
  }

  async getCategoryTree(): Promise<Category[]> {
    const all = await this.db.getAllCategories();
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    all.forEach((c) => {
      map.set(c.id, { ...c, children: [] });
    });

    all.forEach((c) => {
      const node = map.get(c.id)!;
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
