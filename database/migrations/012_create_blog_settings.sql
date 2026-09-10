-- ============================================================================
-- Migration 012: Create Blog Settings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row if missing
INSERT INTO blog_settings (key, value, description)
VALUES (
    'general',
    '{
        "blogTitle": "Blog",
        "basePath": "/blog",
        "postsPerPage": 10,
        "defaultPostStatus": "draft",
        "enableComments": false,
        "enableScheduling": true,
        "enableRevisions": true,
        "enableRedirects": true,
        "timezone": "UTC"
    }'::jsonb,
    'General blog module configuration'
)
ON CONFLICT (key) DO NOTHING;
