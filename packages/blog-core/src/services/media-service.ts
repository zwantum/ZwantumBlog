import {
  BlogDatabaseAdapter,
  Media,
  MediaUpdateInput,
  PaginationParams,
  PaginatedResult,
} from '@zwantum/blog-types';
import { BlogStorageAdapter } from '@zwantum/blog-storage';

export interface UploadMediaParams {
  file: File | Blob | Uint8Array | ArrayBuffer | any;
  filename: string;
  mimeType: string;
  altText?: string;
  title?: string;
  caption?: string;
  description?: string;
  uploadedBy?: string | null;
  width?: number;
  height?: number;
}

export class MediaService {
  private db: BlogDatabaseAdapter;
  private storage: BlogStorageAdapter;

  constructor(db: BlogDatabaseAdapter, storage: BlogStorageAdapter) {
    this.db = db;
    this.storage = storage;
  }

  async list(params?: PaginationParams & { mimeType?: string; search?: string }): Promise<PaginatedResult<Media>> {
    return this.db.getMedia(params);
  }

  async getById(id: string): Promise<Media | null> {
    return this.db.getMediaById(id);
  }

  async upload(params: UploadMediaParams): Promise<Media> {
    const uploadResult = await this.storage.upload(params.file, params.filename, {
      contentType: params.mimeType,
    });

    const mediaRecord = await this.db.saveMediaRecord({
      filename: uploadResult.filename,
      original_name: params.filename,
      url: uploadResult.url,
      mime_type: uploadResult.mimeType || params.mimeType,
      file_size: uploadResult.fileSize,
      width: params.width || null,
      height: params.height || null,
      alt_text: params.altText || '',
      title: params.title || params.filename,
      caption: params.caption || '',
      description: params.description || '',
      storage_provider: 'storage',
      storage_path: uploadResult.storagePath,
      uploaded_by: params.uploadedBy || null,
      metadata: {},
    });

    return mediaRecord;
  }

  async update(id: string, input: MediaUpdateInput): Promise<Media> {
    return this.db.updateMedia(id, input);
  }

  async delete(id: string): Promise<boolean> {
    const media = await this.db.getMediaById(id);
    if (!media) return false;

    // Delete from underlying storage
    try {
      await this.storage.delete(media.storage_path);
    } catch (err) {
      console.warn(`Could not remove file from storage: ${err}`);
    }

    return this.db.deleteMediaRecord(id);
  }
}
