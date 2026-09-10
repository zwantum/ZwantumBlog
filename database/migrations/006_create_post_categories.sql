-- ============================================================================
-- Migration 006: Create Post Categories Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_post_categories (
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_bpc_category_id ON blog_post_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_bpc_post_id ON blog_post_categories(post_id);
