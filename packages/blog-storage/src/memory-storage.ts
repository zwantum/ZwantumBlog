import { BlogStorageAdapter, StorageUploadOptions, StorageUploadResult } from './types';

declare const Buffer: any;

export class MemoryStorageAdapter implements BlogStorageAdapter {
  private files: Map<string, { buffer: Uint8Array; mimeType: string }> = new Map();
  private publicBaseUrl: string;

  constructor(publicBaseUrl: string = 'https://images.unsplash.com') {
    this.publicBaseUrl = publicBaseUrl;
  }

  async upload(
    file: File | Blob | Uint8Array | ArrayBuffer | any,
    filename: string,
    options?: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    const timestamp = Date.now();
    const sanitizedName = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const storagePath = `media/${timestamp}-${sanitizedName}`;

    let buffer: Uint8Array;
    let fileSize = 0;

    if (typeof Buffer !== 'undefined' && (Buffer as any).isBuffer?.(file)) {
      buffer = new Uint8Array(file);
      fileSize = file.length;
    } else if (file instanceof Uint8Array) {
      buffer = file;
      fileSize = file.byteLength;
    } else if (typeof (file as Blob).arrayBuffer === 'function') {
      const ab = await (file as Blob).arrayBuffer();
      buffer = new Uint8Array(ab);
      fileSize = (file as Blob).size;
    } else {
      buffer = new Uint8Array();
    }

    const mimeType = options?.contentType || 'image/jpeg';
    this.files.set(storagePath, { buffer, mimeType });

    // In dev / memory mode, generate working preview URL or data URL
    let url = `${this.publicBaseUrl}/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80`;
    if (fileSize > 0 && fileSize < 500000 && typeof Buffer !== 'undefined') {
      url = `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;
    }

    return {
      url,
      storagePath,
      fileSize,
      mimeType,
      filename,
    };
  }

  async delete(storagePath: string): Promise<boolean> {
    return this.files.delete(storagePath);
  }

  getUrl(storagePath: string): string {
    const file = this.files.get(storagePath);
    if (file && typeof Buffer !== 'undefined') {
      return `data:${file.mimeType};base64,${Buffer.from(file.buffer).toString('base64')}`;
    }
    return `${this.publicBaseUrl}/${storagePath}`;
  }
}
