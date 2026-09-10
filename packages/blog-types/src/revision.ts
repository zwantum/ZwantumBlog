export interface PostRevision {
  id: string;
  post_id: string;
  title: string;
  excerpt?: string | null;
  content: Record<string, unknown>;
  summary?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface CreateRevisionInput {
  post_id: string;
  title: string;
  excerpt?: string | null;
  content: Record<string, unknown>;
  summary?: string | null;
  created_by?: string | null;
}
