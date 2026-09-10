-- ============================================================================
-- Migration 007: Create Post Tags Junction Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_bpt_tag_id ON blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_bpt_post_id ON blog_post_tags(post_id);
