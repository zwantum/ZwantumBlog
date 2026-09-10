export type MediaType = 'image' | 'video' | 'document' | 'audio';

export interface MediaMetadata {
  format?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface Media {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
  alt_text?: string;
  title?: string;
  caption?: string;
  description?: string;
  storage_provider: string;
  storage_path: string;
  uploaded_by?: string | null;
  metadata?: MediaMetadata;
  created_at: string;
  updated_at: string;
}

export interface MediaUploadInput {
  file: File | Blob | Uint8Array | ArrayBuffer | any;
  filename: string;
  mimeType: string;
  altText?: string;
  title?: string;
  caption?: string;
  description?: string;
  uploadedBy?: string | null;
}

export interface MediaUpdateInput {
  alt_text?: string;
  title?: string;
  caption?: string;
  description?: string;
}
