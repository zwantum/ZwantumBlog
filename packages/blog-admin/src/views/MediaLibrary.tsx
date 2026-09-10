import React, { useState, useEffect, useCallback } from 'react';
import { Media } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface MediaLibraryProps {
  client: BlogClient;
  onSelectMedia?: (media: Media) => void;
  className?: string;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  client,
  onSelectMedia,
  className = '',
}) => {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  // Edit details state
  const [altText, setAltText] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const result = await client.media.list({
        search: searchQuery || undefined,
        mimeType: mimeFilter || undefined,
        limit: 50,
      });
      setMediaList(result.data);
    } finally {
      setLoading(false);
    }
  }, [client, searchQuery, mimeFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await client.media.upload({
        file,
        filename: file.name,
        mimeType: file.type || 'image/jpeg',
        altText: file.name.replace(/\.[^/.]+$/, ''),
        title: file.name,
      });
      fetchMedia();
      setSelectedMedia(uploaded);
      setAltText(uploaded.alt_text || '');
      setTitle(uploaded.title || '');
      setCaption(uploaded.caption || '');
    } catch (err) {
      alert(`Upload failed: ${err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedMedia) return;
    try {
      const updated = await client.media.update(selectedMedia.id, {
        alt_text: altText,
        title,
        caption,
      });
      setSelectedMedia(updated);
      fetchMedia();
      alert('Media details saved.');
    } catch (err) {
      alert(`Error saving media details: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this media asset permanently?')) return;
    try {
      await client.media.delete(id);
      setSelectedMedia(null);
      fetchMedia();
    } catch (err) {
      alert(`Error deleting media: ${err}`);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Media URL copied to clipboard.');
  };

  return (
    <div className={`zw-admin-container ${className}`}>
      {/* Header */}
      <div className="zw-admin-header">
        <div>
          <h2 className="zw-admin-title">Media Library</h2>
          <p className="zw-admin-subtitle">Centralized media management with accessibility alt text optimization.</p>
        </div>
        <label className="zw-admin-btn zw-admin-btn-primary" style={{ cursor: 'pointer' }}>
          <span>{uploading ? 'Uploading...' : '📁 Upload New File'}</span>
          <input type="file" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="zw-admin-input"
          placeholder="Search media by filename or alt text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '320px' }}
        />
        <select
          className="zw-admin-select"
          value={mimeFilter}
          onChange={(e) => setMimeFilter(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="">All Media Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="application">Documents</option>
        </select>
      </div>

      {/* Media Grid & Details Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedMedia ? '1fr 340px' : '1fr', gap: '24px', alignItems: 'start' }}>
        {/* Media Grid */}
        <div className="zw-admin-card" style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading media files...</div>
          ) : mediaList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <p>No media files uploaded yet.</p>
              <p style={{ fontSize: '13px' }}>Upload your first image or document above.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
              {mediaList.map((m) => {
                const isSelected = selectedMedia?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMedia(m);
                      setAltText(m.alt_text || '');
                      setTitle(m.title || '');
                      setCaption(m.caption || '');
                    }}
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                      cursor: 'pointer',
                      background: '#f8fafc',
                      aspectRatio: '1',
                      position: 'relative',
                    }}
                  >
                    {m.mime_type.startsWith('image') ? (
                      <img src={m.url} alt={m.alt_text || m.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '12px', padding: '10px', textAlign: 'center', color: '#64748b' }}>
                        📄 {m.filename}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Media Inspector Sidebar */}
        {selectedMedia && (
          <div className="zw-admin-card">
            <div className="zw-admin-card-header">
              <span>File Details</span>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                onClick={() => setSelectedMedia(null)}
              >
                ✕
              </button>
            </div>

            <div className="zw-admin-card-body">
              {selectedMedia.mime_type.startsWith('image') && (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt_text || ''}
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', background: '#0f172a', borderRadius: '8px', marginBottom: '16px' }}
                />
              )}

              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', lineHeight: 1.6 }}>
                <div><strong>Filename:</strong> {selectedMedia.filename}</div>
                <div><strong>Size:</strong> {(selectedMedia.file_size / 1024).toFixed(1)} KB</div>
                {selectedMedia.width && <div><strong>Dimensions:</strong> {selectedMedia.width} × {selectedMedia.height}px</div>}
                <div><strong>Type:</strong> {selectedMedia.mime_type}</div>
              </div>

              {onSelectMedia && (
                <button
                  type="button"
                  className="zw-admin-btn zw-admin-btn-primary"
                  style={{ width: '100%', marginBottom: '16px' }}
                  onClick={() => onSelectMedia(selectedMedia)}
                >
                  ✓ Select This Media
                </button>
              )}

              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Alternative Text (Alt Text) *</label>
                <input
                  type="text"
                  className="zw-admin-input"
                  placeholder="Describe image for SEO & accessibility"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>

              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Title</label>
                <input
                  type="text"
                  className="zw-admin-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Caption</label>
                <textarea
                  rows={2}
                  className="zw-admin-textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="zw-admin-btn zw-admin-btn-primary zw-admin-btn-sm" onClick={handleSaveDetails} style={{ flex: 1 }}>
                  Save Details
                </button>
                <button type="button" className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm" onClick={() => copyUrl(selectedMedia.url)}>
                  Copy URL
                </button>
                <button type="button" className="zw-admin-btn zw-admin-btn-danger zw-admin-btn-sm" onClick={() => handleDelete(selectedMedia.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
