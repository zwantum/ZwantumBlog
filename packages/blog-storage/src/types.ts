export interface StorageUploadOptions {
  bucket?: string;
  folder?: string;
  contentType?: string;
  upsert?: boolean;
}

export interface StorageUploadResult {
  url: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  filename: string;
}

export interface BlogStorageAdapter {
  upload(file: File | Blob | Uint8Array | ArrayBuffer | any, filename: string, options?: StorageUploadOptions): Promise<StorageUploadResult>;
  delete(storagePath: string, bucket?: string): Promise<boolean>;
  getUrl(storagePath: string, bucket?: string): string;
}
