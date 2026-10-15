-- ============================================================================
-- Migration 013: Update Posts Table and Blog Settings for New Features
-- (HTML Code Mode, Citations, Image Captions, Editorial Drop Cap, Autosave, 301 Redirects, TOC, OG Image Generator, Search Indexing)
-- ============================================================================

-- 1. Ensure content_html column exists in blog_posts for dual-mode HTML editing & fast SSR rendering
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_html TEXT;

-- 2. Ensure featured_image_caption column exists in blog_posts for editorial figure captions
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image_caption TEXT;

-- 3. Ensure no_index column exists on categories and tags for granular SEO control
ALTER TABLE blog_categories ADD COLUMN IF NOT EXISTS no_index BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE blog_tags ADD COLUMN IF NOT EXISTS no_index BOOLEAN NOT NULL DEFAULT false;

-- 4. Safely merge new module settings into existing general blog_settings row
UPDATE blog_settings
SET value = '{
    "blogTitle": "Blog",
    "basePath": "/blog",
    "postsPerPage": 10,
    "defaultPostStatus": "draft",
    "enableComments": false,
    "enableMedia": true,
    "enableScheduling": true,
    "enableRevisions": true,
    "enableRedirects": true,
    "enableDropCap": false,
    "enableAutosave": true,
    "enableTableOfContents": true,
    "enableOgImageGenerator": true,
    "timezone": "UTC"
}'::jsonb || value
WHERE key = 'general';

