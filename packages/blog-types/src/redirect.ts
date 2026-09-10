export type RedirectStatusCode = 301 | 302;

export interface BlogRedirect {
  id: string;
  source_url: string;
  destination_url: string;
  status_code: RedirectStatusCode;
  post_id?: string | null;
  hit_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRedirectInput {
  source_url: string;
  destination_url: string;
  status_code?: RedirectStatusCode;
  post_id?: string | null;
}
