-- ============================================================================
-- Migration 009: Create Post SEO Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_post_seo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL UNIQUE REFERENCES blog_posts(id) ON DELETE CASCADE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    focus_keyword VARCHAR(255),
    canonical_url TEXT,
    og_title VARCHAR(255),
    og_description TEXT,
    og_image_url TEXT,
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image_url TEXT,
    twitter_card VARCHAR(50) DEFAULT 'summary_large_image',
    robots VARCHAR(100) DEFAULT 'index,follow',
    schema_type VARCHAR(50) DEFAULT 'Article',
    custom_schema JSONB DEFAULT '{}'::jsonb,
    health_score INT DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_post_seo_post_id ON blog_post_seo(post_id);
