-- ============================================================================
-- Migration 002: Create Media Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    width INT,
    height INT,
    alt_text TEXT DEFAULT '',
    title VARCHAR(255) DEFAULT '',
    caption TEXT DEFAULT '',
    description TEXT DEFAULT '',
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'supabase',
    storage_path TEXT NOT NULL,
    uploaded_by VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_media_mime_type ON blog_media(mime_type);
CREATE INDEX IF NOT EXISTS idx_blog_media_created_at ON blog_media(created_at DESC);
