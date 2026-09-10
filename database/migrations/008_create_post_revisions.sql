-- ============================================================================
-- Migration 008: Create Post Revisions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_post_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT,
    content JSONB NOT NULL,
    summary TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_post_revisions_post_id ON blog_post_revisions(post_id, created_at DESC);
