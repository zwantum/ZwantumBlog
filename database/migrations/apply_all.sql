-- ============================================================================
-- ZwantumBlog: Master Database Migration (Idempotent)
-- Target: PostgreSQL / Supabase
-- ============================================================================

-- Enable pgcrypto for UUIDs if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 001: Authors
CREATE TABLE IF NOT EXISTS blog_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    bio TEXT,
    designation VARCHAR(255),
    profile_image_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    seo JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    user_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_authors_slug ON blog_authors(slug);
CREATE INDEX IF NOT EXISTS idx_blog_authors_user_id ON blog_authors(user_id);

-- 002: Media
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

-- 003: Categories
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    image_url TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    canonical_url TEXT,
    robots VARCHAR(50) DEFAULT 'index,follow',
    display_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    post_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_parent_id ON blog_categories(parent_id);

-- 004: Tags
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    canonical_url TEXT,
    robots VARCHAR(50) DEFAULT 'index,follow',
    post_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);

-- 005: Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    excerpt TEXT,
    content JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
    content_html TEXT,
    featured_image_id UUID REFERENCES blog_media(id) ON DELETE SET NULL,
    author_id UUID REFERENCES blog_authors(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'scheduled', 'published', 'archived', 'trash')),
    content_type VARCHAR(50) NOT NULL DEFAULT 'article',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    reading_time INT NOT NULL DEFAULT 1,
    word_count INT NOT NULL DEFAULT 0,
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_at ON blog_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_featured ON blog_posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_deleted_at ON blog_posts(deleted_at);

-- 006: Post Categories
CREATE TABLE IF NOT EXISTS blog_post_categories (
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_bpc_category_id ON blog_post_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_bpc_post_id ON blog_post_categories(post_id);

-- 007: Post Tags
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_bpt_tag_id ON blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_bpt_post_id ON blog_post_tags(post_id);

-- 008: Post Revisions
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

-- 009: Post SEO
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

-- 010: Redirects
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

-- 011: Comments
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    author_url TEXT,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'trash')),
    user_id VARCHAR(255),
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_status ON blog_comments(post_id, status);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_id);

-- 012: Settings
CREATE TABLE IF NOT EXISTS blog_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO blog_settings (key, value, description)
VALUES (
    'general',
    '{
        "blogTitle": "Blog",
        "basePath": "/blog",
        "postsPerPage": 10,
        "defaultPostStatus": "draft",
        "enableComments": true,
        "enableMedia": true,
        "enableScheduling": true,
        "enableRevisions": true,
        "enableRedirects": true,
        "timezone": "UTC"
    }'::jsonb,
    'General blog module configuration'
)
ON CONFLICT (key) DO NOTHING;
