import { BlogDatabaseAdapter, BlogSettings } from '@zwantum/blog-types';

export class SettingsService {
  private db: BlogDatabaseAdapter;

  constructor(db: BlogDatabaseAdapter) {
    this.db = db;
  }

  async get(key?: string): Promise<BlogSettings> {
    return this.db.getSettings(key);
  }

  async update(settings: Partial<BlogSettings>, key?: string): Promise<BlogSettings> {
    return this.db.updateSettings(settings, key);
  }
}
