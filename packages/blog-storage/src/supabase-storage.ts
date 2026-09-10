import { BlogStorageAdapter, StorageUploadOptions, StorageUploadResult } from './types';

declare const Buffer: any;

export interface SupabaseStorageClientLike {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: unknown,
        options?: { contentType?: string; upsert?: boolean }
      ) => Promise<{ data: { path: string } | null; error: Error | null }>;
      remove: (paths: string[]) => Promise<{ data: unknown; error: Error | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
}

export interface SupabaseStorageConfig {
  client: SupabaseStorageClientLike;
  defaultBucket?: string;
}

export class SupabaseStorageAdapter implements BlogStorageAdapter {
  private client: SupabaseStorageClientLike;
  private defaultBucket: string;

  constructor(config: SupabaseStorageConfig) {
    this.client = config.client;
    this.defaultBucket = config.defaultBucket || 'blog-media';
  }

  async upload(
    file: File | Blob | Uint8Array | ArrayBuffer | any,
    filename: string,
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    const bucket = options?.bucket || this.defaultBucket;
    const folder = options?.folder ? `${options.folder.replace(/\/$/, '')}/` : '';
    const timestamp = Date.now();
    const sanitizedName = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const storagePath = `${folder}${timestamp}-${sanitizedName}`;

    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(storagePath, file, {
        contentType: options?.contentType,
        upsert: options?.upsert ?? false,
      });

    if (error || !data) {
      throw new Error(`Failed to upload to Supabase Storage: ${error?.message || 'Unknown error'}`);
    }

    const { data: urlData } = this.client.storage.from(bucket).getPublicUrl(storagePath);

    // Calculate approximate size if possible
    let fileSize = 0;
    if (typeof (file as Blob).size === 'number') {
      fileSize = (file as Blob).size;
    } else if (typeof Buffer !== 'undefined' && (Buffer as any).isBuffer?.(file)) {
      fileSize = file.length;
    } else if (file instanceof Uint8Array) {
      fileSize = file.byteLength;
    }

    return {
      url: urlData.publicUrl,
      storagePath,
      fileSize,
      mimeType: options?.contentType || 'application/octet-stream',
      filename,
    };
  }

  async delete(storagePath: string, bucket?: string): Promise<boolean> {
    const targetBucket = bucket || this.defaultBucket;
    const { error } = await this.client.storage.from(targetBucket).remove([storagePath]);
    if (error) {
      console.error(`Failed to delete file from Supabase storage: ${error.message}`);
      return false;
    }
    return true;
  }

  getUrl(storagePath: string, bucket?: string): string {
    const targetBucket = bucket || this.defaultBucket;
    const { data } = this.client.storage.from(targetBucket).getPublicUrl(storagePath);
    return data.publicUrl;
  }
}
