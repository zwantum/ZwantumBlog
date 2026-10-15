-- ============================================================================
-- Migration 014: Create Backups Table and Storage Bucket
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    source VARCHAR(100) NOT NULL DEFAULT 'admin-export',
    file_size BIGINT NOT NULL DEFAULT 0,
    storage_path TEXT,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_backups_created_at ON blog_backups(created_at DESC);

-- Supabase Storage Bucket for Backups (Private archive)
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Backups Bucket (Restricted to authenticated sessions)
DROP POLICY IF EXISTS "Authenticated Users Select Backups" ON storage.objects;
CREATE POLICY "Authenticated Users Select Backups" ON storage.objects
    FOR SELECT USING (bucket_id = 'backups' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Users Insert Backups" ON storage.objects;
CREATE POLICY "Authenticated Users Insert Backups" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'backups' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Users Delete Backups" ON storage.objects;
CREATE POLICY "Authenticated Users Delete Backups" ON storage.objects
    FOR DELETE USING (bucket_id = 'backups' AND auth.role() = 'authenticated');
