import React, { useState, useEffect, useRef } from 'react';
import { Post, PostCreateInput, PostStatus, Category, Tag, Author, Media, PostSEO } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';
import { BlogEditor } from '@zwantum/blog-editor';
import { SEOHealthBadge } from '../components/SEOHealthBadge';
import { RevisionHistoryModal } from '../components/RevisionHistoryModal';

export interface PostEditorProps {
  client: BlogClient;
  postId?: string; // If undefined, creates a new post
  onSaveSuccess?: (post: Post) => void;
  onBack?: () => void;
  onOpenMediaLibrary?: (onSelect: (media: Media) => void) => void;
  className?: string;
}

export const PostEditor: React.FC<PostEditorProps> = ({
  client,
  postId,
  onSaveSuccess,
  onBack,
  onOpenMediaLibrary,
  className = '',
}) => {
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugCustomized, setSlugCustomized] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  const [status, setStatus] = useState<PostStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [featuredMedia, setFeaturedMedia] = useState<Media | null>(null);

  // SEO State
  const [seo, setSeo] = useState<Partial<PostSEO>>({
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    canonical_url: '',
    robots: 'index,follow',
    schema_type: 'Article',
  });

  // Reference Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  // Load Reference Data
  useEffect(() => {
    Promise.all([
      client.categories.getAll(),
      client.tags.getAll(),
      client.authors.getAll(),
    ]).then(([cats, tgs, auths]) => {
      setCategories(cats);
      setTags(tgs);
      setAuthors(auths);
    });
  }, [client]);

  // Load Existing Post
  useEffect(() => {
    if (postId) {
      setLoading(true);
      client.posts
        .getById(postId)
        .then((post) => {
          if (post) {
            setTitle(post.title);
            setSlug(post.slug);
            setSlugCustomized(true);
            setExcerpt(post.excerpt || '');
            setContentJson(post.content || { type: 'doc', content: [] });
            setStatus(post.status);
            setIsFeatured(post.is_featured);
            setScheduledAt(post.scheduled_at ? post.scheduled_at.slice(0, 16) : '');
            setSelectedAuthorId(post.author_id || '');
            setSelectedCategoryIds(post.categories?.map((c) => c.id) || []);
            setSelectedTagIds(post.tags?.map((t) => t.id) || []);
            setFeaturedMedia(post.featured_image || null);
            if (post.seo) {
              setSeo(post.seo);
              if (post.seo.meta_title) setMetaTitleCustomized(true);
              if (post.seo.meta_description) setMetaDescCustomized(true);
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [postId, client]);

  const [copiedSlug, setCopiedSlug] = useState(false);
  const [metaTitleCustomized, setMetaTitleCustomized] = useState(false);
  const [metaDescCustomized, setMetaDescCustomized] = useState(false);

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const extractContentText = (json: Record<string, unknown> | undefined): string => {
    if (!json) return '';
    const walk = (node: any): string => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (node.text) return node.text;
      if (Array.isArray(node.content)) {
        return node.content.map(walk).filter(Boolean).join(' ');
      }
      return '';
    };
    return walk(json).replace(/\s+/g, ' ').trim();
  };

  // Auto-slug generation and auto-SEO title from title until user edits them manually
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugCustomized) {
      setSlug(generateSlug(val));
    }
    if (!metaTitleCustomized) {
      setSeo((prev) => ({ ...prev, meta_title: val }));
    }
  };

  // Auto-sync SEO description from excerpt or content
  const handleExcerptChange = (val: string) => {
    setExcerpt(val);
    if (!metaDescCustomized) {
      const fallback = val.trim() || extractContentText(contentJson).slice(0, 160);
      setSeo((prev) => ({ ...prev, meta_description: fallback }));
    }
  };

  const handleContentChange = (json: Record<string, unknown>) => {
    setContentJson(json);
    if (!metaDescCustomized && !excerpt.trim()) {
      const extracted = extractContentText(json).slice(0, 160);
      if (extracted) {
        setSeo((prev) => ({ ...prev, meta_description: extracted }));
      }
    }
  };

  const featuredImageInputRef = useRef<HTMLInputElement | null>(null);

  const handleFeaturedFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFeaturedMedia({
          id: 'manual-img-' + Date.now(),
          filename: file.name,
          original_name: file.name,
          url: reader.result,
          mime_type: file.type,
          file_size: file.size,
          alt_text: title || file.name,
          storage_provider: 'memory',
          storage_path: reader.result,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (publishNow?: boolean) => {
    if (!title.trim()) {
      alert('Article title is required');
      return;
    }

    setSaving(true);
    try {
      const targetStatus = publishNow ? 'published' : status;

      const finalMetaTitle = seo.meta_title?.trim() || title.trim();
      const finalMetaDesc =
        seo.meta_description?.trim() ||
        excerpt.trim() ||
        extractContentText(contentJson).slice(0, 160);

      const payload: PostCreateInput = {
        title,
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        content: contentJson,
        status: targetStatus,
        is_featured: isFeatured,
        scheduled_at: targetStatus === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        author_id: selectedAuthorId || null,
        category_ids: selectedCategoryIds,
        tag_ids: selectedTagIds,
        featured_image_id: featuredMedia?.id || null,
        seo: {
          ...seo,
          meta_title: finalMetaTitle,
          meta_description: finalMetaDesc,
        },
      };

      let savedPost: Post;
      if (postId) {
        savedPost = await client.posts.update(postId, payload);
      } else {
        savedPost = await client.posts.create(payload);
      }

      setStatus(savedPost.status);
      if (onSaveSuccess) onSaveSuccess(savedPost);
      alert('Article saved successfully!');
    } catch (err) {
      alert(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAutosave = async (newContent: Record<string, unknown>) => {
    handleContentChange(newContent);
    if (postId && title.trim()) {
      await client.posts.update(postId, { content: newContent });
    }
  };

  // Live SEO Health Evaluation
  const liveHealth = client.seo.evaluateHealth({
    title,
    slug,
    excerpt,
    word_count: JSON.stringify(contentJson).length > 20 ? 350 : 0,
    author_id: selectedAuthorId,
    featured_image_id: featuredMedia?.id,
    featured_image: featuredMedia,
    seo: {
      ...seo,
      meta_title: seo.meta_title || title,
      meta_description: seo.meta_description || excerpt,
    },
  });

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading post editor...</div>;
  }

  return (
    <div className={`zw-admin-container ${className}`}>
      {/* Top Bar Navigation & Actions */}
      <div className="zw-admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button type="button" className="zw-admin-btn zw-admin-btn-secondary" onClick={onBack}>
              ← Back
            </button>
          )}
          <div>
            <h2 className="zw-admin-title">{postId ? 'Edit Article' : 'Write New Article'}</h2>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Status:{' '}
              <span className={`zw-admin-badge zw-admin-badge-${status}`}>{status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="zw-admin-actions">
          {postId && (
            <button
              type="button"
              className="zw-admin-btn zw-admin-btn-secondary"
              onClick={() => setShowRevisionModal(true)}
            >
              🕒 Revisions
            </button>
          )}

          <button
            type="button"
            className="zw-admin-btn zw-admin-btn-secondary"
            disabled={saving}
            onClick={() => handleSave(false)}
          >
            Save Draft
          </button>

          <button
            type="button"
            className="zw-admin-btn zw-admin-btn-primary"
            disabled={saving}
            onClick={() => handleSave(true)}
          >
            {saving ? 'Publishing...' : 'Publish Article'}
          </button>
        </div>
      </div>

      {/* Main Split Layout: Editor (Left) & Sidebar (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Title, Slug, Tiptap Editor */}
        <div>
          {/* Post Title & URL Card */}
          <div className="zw-admin-card" style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>✍️</span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Article Title & Permalink
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: title.length === 0 ? '#94a3b8' : title.length > 70 ? '#d97706' : '#16a34a',
                  }}
                >
                  {title.length} characters {title.length > 0 && title.length <= 70 ? '• Optimal Title' : ''}
                </span>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <input
                type="text"
                placeholder="Enter article headline or post title..."
                value={title}
                onChange={handleTitleChange}
                style={{
                  width: '100%',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  border: 'none',
                  outline: 'none',
                  color: '#0f172a',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  padding: '0 0 12px 0',
                  borderBottom: '2px solid #f1f5f9',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottomColor = '#ffcc00';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderBottomColor = '#f1f5f9';
                }}
              />

              {/* Enhanced URL Slug / Permalink Bar */}
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12.5px', fontWeight: 600 }}>
                  <span style={{ fontSize: '14px' }}>🔗</span>
                  <span>Permalink:</span>
                  <span style={{ color: '#94a3b8' }}>https://example.com/blog/</span>
                </div>

                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(generateSlug(e.target.value));
                    setSlugCustomized(true);
                  }}
                  placeholder="article-slug"
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    background: '#ffffff',
                    flex: 1,
                    minWidth: '180px',
                    maxWidth: '360px',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                  {slugCustomized && (
                    <button
                      type="button"
                      onClick={() => {
                        setSlug(generateSlug(title));
                        setSlugCustomized(false);
                      }}
                      title="Reset slug to auto-generate from title"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      🔄 Reset
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(`https://example.com/blog/${slug}`);
                        setCopiedSlug(true);
                        setTimeout(() => setCopiedSlug(false), 2000);
                      }
                    }}
                    title="Copy full URL"
                    style={{
                      background: copiedSlug ? '#ecfdf5' : '#ffffff',
                      borderColor: copiedSlug ? '#a7f3d0' : '#e2e8f0',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: copiedSlug ? '#059669' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copiedSlug ? '✓ Copied' : '📋 Copy URL'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body Editor Card with Section Heading */}
          <div className="zw-admin-card" style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>📝</span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Article Content
                </span>
                <span
                  style={{
                    background: '#fff9db',
                    color: '#854d0e',
                    border: '1px solid #fef08a',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  WYSIWYG & Markdown
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Use toolbar or type <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '1px 5px', fontSize: '11px' }}>/</kbd> for blocks
              </div>
            </div>

            {/* Tiptap Rich Text Editor */}
            <BlogEditor
              content={contentJson}
              onChange={(json) => handleContentChange(json)}
              onAutosave={handleAutosave}
              onOpenMediaLibrary={() => {
                if (onOpenMediaLibrary) {
                  onOpenMediaLibrary((_m) => {
                    // Handled via callback
                  });
                }
              }}
            />
          </div>

          {/* Excerpt Card */}
          <div className="zw-admin-card" style={{ marginTop: '20px' }}>
            <div className="zw-admin-card-header">Article Summary / Excerpt</div>
            <div className="zw-admin-card-body">
              <textarea
                rows={3}
                className="zw-admin-textarea"
                placeholder="Write a concise excerpt to display in cards and search result snippets..."
                value={excerpt}
                onChange={(e) => handleExcerptChange(e.target.value)}
              />
            </div>
          </div>

          {/* SEO & Metadata Card (Moved to Main Panel) */}
          <div className="zw-admin-card" style={{ marginTop: '20px', borderRadius: '16px', overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fffdf5',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔍</span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                  SEO & Metadata
                </h3>
              </div>
              <div>
                <SEOHealthBadge report={liveHealth} />
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Focus Keyword */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Focus Keyword
                </label>
                <input
                  type="text"
                  className="zw-admin-input"
                  placeholder="e.g. workspace alignment"
                  value={seo.focus_keyword || ''}
                  onChange={(e) => setSeo({ ...seo, focus_keyword: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* SEO Meta Title */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    SEO Meta Title
                  </label>
                  <span style={{ fontSize: '11.5px', color: (seo.meta_title || '').length > 60 ? '#ef4444' : '#64748b' }}>
                    {(seo.meta_title || '').length}/60 chars
                  </span>
                </div>
                <input
                  type="text"
                  className="zw-admin-input"
                  placeholder="Enter SEO meta title..."
                  value={seo.meta_title || ''}
                  onChange={(e) => {
                    setSeo({ ...seo, meta_title: e.target.value });
                    setMetaTitleCustomized(true);
                  }}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Meta Description */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Meta Description
                  </label>
                  <span style={{ fontSize: '11.5px', color: (seo.meta_description || '').length > 160 ? '#ef4444' : '#64748b' }}>
                    {(seo.meta_description || '').length}/160 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  className="zw-admin-textarea"
                  placeholder="Enter SEO meta description..."
                  value={seo.meta_description || ''}
                  onChange={(e) => {
                    setSeo({ ...seo, meta_description: e.target.value });
                    setMetaDescCustomized(true);
                  }}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Grid 2 Columns: Canonical URL & Robots Indexing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Canonical URL (Optional Override)
                  </label>
                  <input
                    type="text"
                    className="zw-admin-input"
                    placeholder="Leave blank to use default article URL"
                    value={seo.canonical_url || ''}
                    onChange={(e) => setSeo({ ...seo, canonical_url: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Robots Indexing
                  </label>
                  <select
                    className="zw-admin-select"
                    value={seo.robots || 'index,follow'}
                    onChange={(e) => setSeo({ ...seo, robots: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="index,follow">Index, Follow (Recommended)</option>
                    <option value="noindex,follow">Noindex, Follow</option>
                    <option value="noindex,nofollow">Noindex, Nofollow</option>
                  </select>
                </div>
              </div>

              {/* Google SERP Live Snippet Preview */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginTop: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Google SERP Preview
                  </span>
                  <span style={{ fontSize: '11px', color: (seo.robots || '').includes('noindex') ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                    {(seo.robots || '').includes('noindex') ? '⊘ Noindex' : '✓ Indexable'}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  https://example.com › blog › {slug || 'post-slug'}
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    color: '#1a0dab',
                    fontWeight: 500,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {seo.meta_title || title || 'Untitled Article'}
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: '#4d5156',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {seo.meta_description || excerpt || 'Article excerpt summary will appear here in search engine results.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Status, Categories, Featured Image */}
        <div>
          {/* Publishing Card */}
          <div className="zw-admin-card">
            <div className="zw-admin-card-header">Publishing & Status</div>
            <div className="zw-admin-card-body">
              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PostStatus)}
                  className="zw-admin-select"
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {status === 'scheduled' && (
                <div className="zw-admin-form-group">
                  <label className="zw-admin-label">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="zw-admin-input"
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Post will automatically publish once this timestamp is reached.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <input
                  type="checkbox"
                  id="feat-checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <label htmlFor="feat-checkbox" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Highlight as Featured Article
                </label>
              </div>
            </div>
          </div>

          {/* Author Card */}
          <div className="zw-admin-card">
            <div className="zw-admin-card-header">Author (E-E-A-T)</div>
            <div className="zw-admin-card-body">
              <select
                value={selectedAuthorId}
                onChange={(e) => setSelectedAuthorId(e.target.value)}
                className="zw-admin-select"
              >
                <option value="">Select Author...</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.designation ? `(${a.designation})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="zw-admin-card">
            <div className="zw-admin-card-header">Categories & Tags</div>
            <div className="zw-admin-card-body">
              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Categories</label>
                <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                  {categories.map((c) => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', margin: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategoryIds([...selectedCategoryIds, c.id]);
                          } else {
                            setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== c.id));
                          }
                        }}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Tags</label>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                  {tags.map((t) => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', margin: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTagIds([...selectedTagIds, t.id]);
                          } else {
                            setSelectedTagIds(selectedTagIds.filter((id) => id !== t.id));
                          }
                        }}
                      />
                      <span>{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="zw-admin-card">
            <div className="zw-admin-card-header">Featured Image</div>
            <div className="zw-admin-card-body">
              <input
                type="file"
                ref={featuredImageInputRef}
                accept="image/*"
                onChange={handleFeaturedFileSelect}
                style={{ display: 'none' }}
              />

              {featuredMedia ? (
                <div>
                  <img
                    src={featuredMedia.url}
                    alt={featuredMedia.alt_text || 'Featured image'}
                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                  />
                  <div className="zw-admin-form-group">
                    <label className="zw-admin-label">Image Alt Text (Crucial for SEO)</label>
                    <input
                      type="text"
                      className="zw-admin-input"
                      value={featuredMedia.alt_text || ''}
                      onChange={(e) => setFeaturedMedia({ ...featuredMedia, alt_text: e.target.value })}
                      placeholder="Descriptive alt text for screen readers & search engines"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                      onClick={() => featuredImageInputRef.current?.click()}
                    >
                      Change Image
                    </button>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-danger zw-admin-btn-sm"
                      onClick={() => setFeaturedMedia(null)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '18px 12px', border: '2px dashed #cbd5e1', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>No featured image set</p>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-primary zw-admin-btn-sm"
                      onClick={() => featuredImageInputRef.current?.click()}
                    >
                      Upload from Device
                    </button>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                      onClick={() => {
                        const url = window.prompt('Paste image URL (or use Media Library):', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80');
                        if (url) {
                          setFeaturedMedia({
                            id: 'manual-img',
                            filename: 'image.jpg',
                            original_name: 'image.jpg',
                            url,
                            mime_type: 'image/jpeg',
                            file_size: 100000,
                            alt_text: title,
                            storage_provider: 'external',
                            storage_path: url,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          });
                        }
                      }}
                    >
                      Paste URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revision History Modal */}
      {postId && (
        <RevisionHistoryModal
          postId={postId}
          client={client}
          isOpen={showRevisionModal}
          onClose={() => setShowRevisionModal(false)}
          onRestored={(restored) => {
            setTitle(restored.title);
            setExcerpt(restored.excerpt || '');
            setContentJson(restored.content);
            alert('Revision restored into editor!');
          }}
        />
      )}
    </div>
  );
};
