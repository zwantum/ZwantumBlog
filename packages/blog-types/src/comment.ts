export type CommentStatus = 'pending' | 'approved' | 'spam' | 'trash';

export interface Comment {
  id: string;
  post_id: string;
  parent_id?: string | null;
  author_name: string;
  author_email: string;
  author_url?: string | null;
  content: string;
  status: CommentStatus;
  user_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

export interface CommentInput {
  post_id: string;
  parent_id?: string | null;
  author_name: string;
  author_email: string;
  author_url?: string | null;
  content: string;
  user_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}
