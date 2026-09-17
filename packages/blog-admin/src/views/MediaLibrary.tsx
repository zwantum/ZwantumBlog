import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Media } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface MediaLibraryProps {
  client: BlogClient;
  onSelectMedia?: (media: Media) => void;
  className?: string;
}

export interface UnifiedMediaItem {
  id: string;
  name: string;
  url: string;
  mime_type: string;
  size: number;
  created_at: string;
  alt_text?: string;
  title?: string;
  caption?: string;
}

const SUPABASE_STORAGE_SQL_FIX = `-- Run this once in your Supabase Dashboard -> SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Media Select" ON storage.objects;
CREATE POLICY "Public Media Select" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Public Media Insert" ON storage.objects;
CREATE POLICY "Public Media Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Public Media Update" ON storage.objects;
CREATE POLICY "Public Media Update" ON storage.objects FOR UPDATE USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Public Media Delete" ON storage.objects;
CREATE POLICY "Public Media Delete" ON storage.objects FOR DELETE USING (bucket_id = 'media');

ALTER TABLE IF EXISTS blog_media DISABLE ROW LEVEL SECURITY;`;

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  client,
  onSelectMedia,
  className = '',
}) => {
  const [items, setItems] = useState<UnifiedMediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<UnifiedMediaItem | null>(null);
  const [altText, setAltText] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [rlsError, setRlsError] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Access the raw Supabase client if available from storage or db adapter
  const supabaseClient =
    (client.storage as any)?.client ||
    (client.db as any)?.client ||
    (client.db as any)?.raw?.client;

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      if (supabaseClient?.storage) {
        const { data, error } = await supabaseClient.storage
          .from('media')
          .list('', { limit: 250, sortBy: { column: 'created_at', order: 'desc' } });

        if (!error && data) {
          // Optional metadata enrichment from blog_media table
          const metadataMap = new Map<string, any>();
          try {
            const { data: dbRows } = await supabaseClient
              .from('blog_media')
              .select('id, filename, url, alt_text, title, caption');
            if (dbRows) {
              for (const r of dbRows) {
                if (r.filename) metadataMap.set(r.filename, r);
                if (r.url) metadataMap.set(r.url, r);
              }
            }
          } catch {
            // non-fatal
          }

          const mapped: UnifiedMediaItem[] = data
            .filter((file: any) => file.name && file.name !== '.emptyFolderPlaceholder')
            .map((file: any) => {
              const { data: pubData } = supabaseClient.storage.from('media').getPublicUrl(file.name);
              const ext = (file.name.split('.').pop() || '').toLowerCase();
              const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'].includes(ext);
              const mime = file.metadata?.mimetype || (isImg ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'application/octet-stream');
              const dbRecord = metadataMap.get(file.name) || metadataMap.get(pubData.publicUrl);

              return {
                id: dbRecord?.id || file.id || file.name,
                name: file.name,
                url: pubData.publicUrl,
                mime_type: mime,
                size: file.metadata?.size || 0,
                created_at: file.created_at || new Date().toISOString(),
                alt_text: dbRecord?.alt_text || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                title: dbRecord?.title || file.name,
                caption: dbRecord?.caption || '',
              };
            });

          setItems(mapped);
          return;
        }
      }

      // Fallback to client.media.list()
      const res = await client.media.list({ limit: 100 });
      setItems(
        res.data.map((m) => ({
          id: m.id,
          name: m.filename,
          url: m.url,
          mime_type: m.mime_type,
          size: m.file_size,
          created_at: m.created_at,
          alt_text: m.alt_text,
          title: m.title,
          caption: m.caption,
        }))
      );
    } catch (err) {
      console.error('Error fetching media assets:', err);
    } finally {
      setLoading(false);
    }
  }, [client, supabaseClient]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    setUploading(true);

    try {
      if (supabaseClient?.storage) {
        const ext = file.name.split('.').pop() || 'jpg';
        const cleanBase = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .toLowerCase();
        const filePath = `${Date.now()}_${cleanBase}.${ext}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('media')
          .upload(filePath, file, { cacheControl: '3600', upsert: true, contentType: file.type });

        if (uploadError) {
          const errMsg = uploadError.message || String(uploadError);
          if (
            errMsg.includes('row-level security') ||
            errMsg.includes('violates row-level security policy') ||
            errMsg.includes('403') ||
            errMsg.includes('AccessDenied')
          ) {
            setRlsError(true);
            // Fallback so the user can still use this image immediately for their blog post
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const fallbackItem: UnifiedMediaItem = {
                id: `local-${Date.now()}`,
                name: file.name,
                url: dataUrl,
                mime_type: file.type || 'image/jpeg',
                size: file.size,
                created_at: new Date().toISOString(),
                alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                title: file.name,
              };
              setItems((prev) => [fallbackItem, ...prev]);
              setSelectedItem(fallbackItem);
              setAltText(fallbackItem.alt_text || '');
              setTitle(fallbackItem.title || '');
            };
            reader.readAsDataURL(file);
            return;
          }
          throw uploadError;
        }

        const { data: pubData } = supabaseClient.storage.from('media').getPublicUrl(filePath);
        const publicUrl = pubData.publicUrl;

        let createdId = filePath;
        try {
          const { data: row } = await supabaseClient
            .from('blog_media')
            .upsert(
              {
                filename: filePath,
                original_name: file.name,
                url: publicUrl,
                mime_type: file.type || 'image/jpeg',
                file_size: file.size,
                alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                title: file.name,
                storage_provider: 'supabase',
                storage_path: filePath,
              },
              { onConflict: 'url' }
            )
            .select()
            .single();

          if (row?.id) createdId = row.id;
        } catch {
          // non-fatal
        }

        const newItem: UnifiedMediaItem = {
          id: createdId,
          name: filePath,
          url: publicUrl,
          mime_type: file.type || 'image/jpeg',
          size: file.size,
          created_at: new Date().toISOString(),
          alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
          title: file.name,
        };

        setItems((prev) => [newItem, ...prev]);
        setSelectedItem(newItem);
        setAltText(newItem.alt_text || '');
        setTitle(newItem.title || '');
      } else {
        const uploaded = await client.media.upload({
          file,
          filename: file.name,
          mimeType: file.type || 'image/jpeg',
          altText: file.name.replace(/\.[^/.]+$/, ''),
          title: file.name,
        });

        const newItem: UnifiedMediaItem = {
          id: uploaded.id,
          name: uploaded.filename,
          url: uploaded.url,
          mime_type: uploaded.mime_type,
          size: uploaded.file_size,
          created_at: uploaded.created_at,
          alt_text: uploaded.alt_text,
          title: uploaded.title,
          caption: uploaded.caption,
        };

        setItems((prev) => [newItem, ...prev]);
        setSelectedItem(newItem);
        setAltText(newItem.alt_text || '');
        setTitle(newItem.title || '');
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes('row-level security') ||
        errMsg.includes('violates row-level security policy') ||
        errMsg.includes('403')
      ) {
        setRlsError(true);
      } else {
        alert(`Upload failed: ${errMsg}`);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmSelect = (item: UnifiedMediaItem) => {
    const mediaObj: Media = {
      id: item.id,
      filename: item.name,
      original_name: item.name,
      url: item.url,
      mime_type: item.mime_type,
      file_size: item.size,
      alt_text: altText || item.alt_text || item.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      title: title || item.title || item.name,
      caption: item.caption || '',
      storage_provider: 'supabase',
      storage_path: item.name,
      created_at: item.created_at,
      updated_at: item.created_at,
    };

    onSelectMedia?.(mediaObj);
  };

  const handleDelete = async (item: UnifiedMediaItem) => {
    if (!window.confirm(`Delete image "${item.name}" from Supabase storage?`)) return;
    try {
      if (supabaseClient?.storage) {
        await supabaseClient.storage.from('media').remove([item.name]);
        try {
          await supabaseClient.from('blog_media').delete().match({ filename: item.name });
        } catch {
          // non-fatal
        }
      } else {
        await client.media.delete(item.id);
      }

      setItems((prev) => prev.filter((f) => f.name !== item.name && f.id !== item.id));
      if (selectedItem?.id === item.id || selectedItem?.name === item.name) {
        setSelectedItem(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message || String(err)}`);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedItem) return;
    try {
      if (supabaseClient?.from) {
        await supabaseClient
          .from('blog_media')
          .upsert(
            {
              id: selectedItem.id.length === 36 ? selectedItem.id : undefined,
              filename: selectedItem.name,
              url: selectedItem.url,
              alt_text: altText,
              title,
              storage_provider: 'supabase',
              storage_path: selectedItem.name,
            },
            { onConflict: 'url' }
          );
      } else {
        await client.media.update(selectedItem.id, { alt_text: altText, title });
      }

      setItems((prev) =>
        prev.map((i) => (i.name === selectedItem.name ? { ...i, alt_text: altText, title } : i))
      );
      setSelectedItem((prev) => (prev ? { ...prev, alt_text: altText, title } : null));
      alert('Media details saved successfully.');
    } catch (err: any) {
      alert(`Save failed: ${err.message || String(err)}`);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filtered = items.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.alt_text && f.alt_text.toLowerCase().includes(search.toLowerCase())) ||
    (f.title && f.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      className={`zw-media-library-root ${className}`}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}
    >
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="zw-admin-input"
            placeholder="Search images by name or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '380px' }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Clear
            </button>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#0f172a',
            color: '#ffffff',
            borderRadius: '8px',
            border: 'none',
            cursor: uploading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {uploading ? 'Uploading...' : '☁️ Upload New Image'}
        </button>
      </div>

      {/* RLS Guidance Banner */}
      {rlsError && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ color: '#c2410c', fontSize: '13px' }}>
              ⚠️ Supabase Storage Upload Blocked by Row-Level Security (RLS)
            </strong>
            <button
              type="button"
              onClick={() => setRlsError(false)}
              style={{ background: 'transparent', border: 'none', color: '#9a3412', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#9a3412', lineHeight: 1.5 }}>
            Your image was loaded locally so you can use it right now. To enable permanent storage in your Supabase <strong>&apos;media&apos;</strong> bucket, copy the SQL fix below and run it in your <strong>Supabase Dashboard → SQL Editor</strong>.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_STORAGE_SQL_FIX);
                alert('SQL copied! Paste and run it in your Supabase Dashboard -> SQL Editor.');
              }}
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📋 Copy Supabase SQL Fix
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#64748b' }}>
        Showing all assets from Supabase storage bucket &lsquo;media&rsquo;. Select any existing image to reuse it directly.
      </div>

      {/* Main Content Layout: Grid + Inspector */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '380px', alignItems: 'stretch' }}>
        {/* Images Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: onSelectMedia ? '440px' : '620px',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px',
            background: '#ffffff',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontSize: '13px' }}>
              Loading assets from Supabase &lsquo;media&rsquo; bucket...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '13px' }}>
              {search ? `No images found matching "${search}".` : 'No media files in Supabase bucket yet. Upload one above!'}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
              }}
            >
              {filtered.map((item) => {
                const isSelected = selectedItem?.name === item.name || selectedItem?.id === item.id;
                const isImage = item.mime_type.startsWith('image');

                return (
                  <div
                    key={item.name}
                    onClick={() => {
                      setSelectedItem(item);
                      setAltText(item.alt_text || '');
                      setTitle(item.title || '');
                    }}
                    style={{
                      border: isSelected ? '2px solid #ffcc00' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#ffffff',
                      boxShadow: isSelected ? '0 0 0 2px rgba(255, 204, 0, 0.4)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        height: '100px',
                        background: '#f8fafc',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isImage ? (
                        <img
                          src={item.url}
                          alt={item.alt_text || item.name}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '24px' }}>📄</span>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '6px 8px',
                        fontSize: '11px',
                        color: '#334155',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        background: isSelected ? '#fffdf0' : '#ffffff',
                      }}
                    >
                      {item.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Media Inspector Sidebar */}
        {selectedItem && (
          <div
            style={{
              width: '280px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#f8fafc',
              overflowY: 'auto',
              maxHeight: onSelectMedia ? '440px' : '620px',
            }}
          >
            <div>
              <div
                style={{
                  height: '150px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedItem.mime_type.startsWith('image') ? (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.alt_text || selectedItem.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '32px' }}>📄</span>
                )}
              </div>

              {onSelectMedia && (
                <button
                  type="button"
                  onClick={() => handleConfirmSelect(selectedItem)}
                  style={{
                    width: '100%',
                    marginBottom: '14px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: '#ffcc00',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(255, 204, 0, 0.45)',
                    textAlign: 'center',
                  }}
                >
                  ✓ Select This Image
                </button>
              )}

              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-all', marginBottom: '4px' }}>
                  {selectedItem.name}
                </div>
                <div>Size: {formatSize(selectedItem.size)}</div>
                <div>Type: {selectedItem.mime_type}</div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Alt Text (for SEO & Accessibility)
                </label>
                <input
                  type="text"
                  className="zw-admin-input"
                  style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe image for search engines..."
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Title
                </label>
                <input
                  type="text"
                  className="zw-admin-input"
                  style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Image title..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                onClick={handleSaveDetails}
                style={{ flex: 1 }}
              >
                Save Details
              </button>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                onClick={() => copyUrl(selectedItem.url)}
              >
                {copied ? '✓ Copied!' : 'Copy URL'}
              </button>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-danger zw-admin-btn-sm"
                onClick={() => handleDelete(selectedItem)}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
