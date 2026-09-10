-- ============================================================================
-- Migration 010: Create Blog Redirects Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url VARCHAR(1000) NOT NULL UNIQUE,
    destination_url VARCHAR(1000) NOT NULL,
    status_code INT NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302)),
    post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    hit_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_redirects_source ON blog_redirects(source_url);
