import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Post, PostCreateInput, PostStatus, Category, Tag, Author, Media, PostSEO } from '@zwantum/blog-types';
import { BlogClient, stripHtml } from '@zwantum/blog-core';
import { BlogEditor, BlogEditorHandle } from '@zwantum/blog-editor';
import { SEOHealthBadge } from '../components/SEOHealthBadge';
import { RevisionHistoryModal } from '../components/RevisionHistoryModal';
import { PostPreviewModal } from '../components/PostPreviewModal';
import { TagInput } from '../components/TagInput';
import { toast } from '../components/Toast';
import { generateOgImageDataUri } from '@zwantum/blog-seo';

export interface PostEditorProps {
  client: BlogClient;
  postId?: string; // If undefined, creates a new post
  onSaveSuccess?: (post: Post) => void;
  onBack?: () => void;
  onOpenMediaLibrary?: (onSelect: (media: Media) => void) => void;
  siteUrl?: string; // e.g. https://zwantum.com or current origin
  basePath?: string; // e.g. /blog
  className?: string;
}

export const PostEditor: React.FC<PostEditorProps> = ({
  client,
  postId,
  onSaveSuccess,
  onBack,
  onOpenMediaLibrary,
  siteUrl,
  basePath,
  className = '',
}) => {
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Live URL & base path configuration
  const [liveBasePath, setLiveBasePath] = useState<string>(basePath || '/blog');
  const [liveSiteUrl, setLiveSiteUrl] = useState<string>(() => {
    if (siteUrl) return siteUrl;
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://zwantum.com';
  });

  useEffect(() => {
    if (siteUrl) {
      setLiveSiteUrl(siteUrl);
    } else if (typeof window !== 'undefined' && window.location.origin) {
      setLiveSiteUrl(window.location.origin);
    }
  }, [siteUrl]);

  useEffect(() => {
    if (basePath) {
      setLiveBasePath(basePath.startsWith('/') ? basePath : `/${basePath}`);
    } else {
      client.settings
        .get()
        .then((st) => {
          if (st?.basePath) {
            setLiveBasePath(st.basePath.startsWith('/') ? st.basePath : `/${st.basePath}`);
          }
        })
        .catch(() => { });
    }
  }, [client, basePath]);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [initialSlug, setInitialSlug] = useState('');
  const [initialStatus, setInitialStatus] = useState<PostStatus>('draft');
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [pendingStatusOverride, setPendingStatusOverride] = useState<PostStatus | undefined>(undefined);
  const [slugCustomized, setSlugCustomized] = useState(false);
  const [seoPreviewMode, setSeoPreviewMode] = useState<'google' | 'social'>('google');
  const [excerpt, setExcerpt] = useState('');
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  const [contentHtml, setContentHtml] = useState<string>('');
  const editorRef = useRef<BlogEditorHandle>(null);
  const contentJsonRef = useRef<Record<string, unknown>>({ type: 'doc', content: [{ type: 'paragraph' }] });
  const contentHtmlRef = useRef<string>('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [featuredMedia, setFeaturedMedia] = useState<Media | null>(null);
  const [featuredImageCaption, setFeaturedImageCaption] = useState('');

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
  const [enableAutosave, setEnableAutosave] = useState(true);

  // Load Reference Data & Blog Settings
  useEffect(() => {
    Promise.all([
      client.categories.getAll(),
      client.tags.getAll(),
      client.authors.getAll(),
      client.settings.get().catch(() => null),
    ]).then(([cats, tgs, auths, st]) => {
      setCategories(cats);
      setTags(tgs);
      setAuthors(auths);
      if (auths && auths.length > 0) {
        setSelectedAuthorId((prev) => prev || auths[0].id);
      }
      if (st && st.enableAutosave !== undefined) {
        setEnableAutosave(st.enableAutosave);
      }
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
            const cleanTitle = stripHtml(post.title || '');
            setTitle(cleanTitle);
            setSlug(post.slug || '');
            setInitialSlug(post.slug || '');
            setSlugCustomized(true);
            setExcerpt(post.excerpt || '');
            setContentJson(post.content || { type: 'doc', content: [] });
            setStatus(post.status);
            setInitialStatus(post.status);
            setIsFeatured(post.is_featured);
            setScheduledAt(post.scheduled_at ? post.scheduled_at.slice(0, 16) : '');
            const postAuthorId = post.author_id || (post as any).author?.id;
            if (postAuthorId) {
              setSelectedAuthorId(postAuthorId);
            }
            setSelectedCategoryIds(post.categories?.map((c) => c.id) || []);
            setSelectedTagIds(post.tags?.map((t) => t.id) || []);
            setFeaturedMedia(post.featured_image || null);
            setFeaturedImageCaption((post as any).featured_image_caption || post.featured_image?.caption || '');
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
    stripHtml(text)
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

  // Plain-text title change handler with HTML stripping
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = stripHtml(e.target.value).replace(/[\r\n]+/g, ' ');
    setTitle(clean);
    if (!slugCustomized) {
      setSlug(generateSlug(clean));
    }
    if (!metaTitleCustomized) {
      setSeo((prev) => ({ ...prev, meta_title: clean }));
    }
  };

  // Paste sanitization to strip all rich text / HTML tags
  const handleTitlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain') || '';
    const cleanPasted = stripHtml(pasted).replace(/[\r\n]+/g, ' ');
    const input = e.currentTarget;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const next = (title || '').slice(0, start) + cleanPasted + (title || '').slice(end);
    const sanitized = stripHtml(next).replace(/[\r\n]+/g, ' ');
    setTitle(sanitized);
    if (!slugCustomized) {
      setSlug(generateSlug(sanitized));
    }
    if (!metaTitleCustomized) {
      setSeo((prev) => ({ ...prev, meta_title: sanitized }));
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

  const handleContentChange = (json: Record<string, unknown>, html?: string) => {
    contentJsonRef.current = json;
    setContentJson(json);
    if (html !== undefined) {
      contentHtmlRef.current = html;
      setContentHtml(html);
    }
    if (!metaDescCustomized && !excerpt.trim()) {
      const extracted = extractContentText(json).slice(0, 160);
      if (extracted) {
        setSeo((prev) => ({ ...prev, meta_description: extracted }));
      }
    }
  };

  const featuredImageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

  const handleFeaturedFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFeatured(true);
    try {
      const uploaded = await client.media.upload({
        file,
        filename: file.name,
        mimeType: file.type || 'image/jpeg',
        altText: title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        title: title || file.name,
      });
      setFeaturedMedia(uploaded);
      toast.success(`Featured image "${file.name}" uploaded successfully.`, 'Image Uploaded');
    } catch (err: any) {
      toast.error(`Image upload failed: ${err.message || String(err)}`, 'Upload Error');
    } finally {
      setUploadingFeatured(false);
      if (featuredImageInputRef.current) featuredImageInputRef.current.value = '';
    }
  };

  const [currentPostId, setCurrentPostId] = useState<string | undefined>(postId);

  useEffect(() => {
    setCurrentPostId(postId);
  }, [postId]);

  const activePostId = currentPostId || postId;
  const isEditMode = !!activePostId;
  const isPublished = status === 'published';

  const handleSave = async (targetStatusOverride?: PostStatus, bypassRedirectCheck: boolean = false) => {
    const plainTitle = stripHtml(title);
    if (!plainTitle.trim()) {
      toast.warning('Article title is required before saving.', 'Missing Title');
      return;
    }

    const cleanNewSlug = slug.trim();
    // Option 2: Prompt with 301 confirmation modal if published post's slug was modified
    if (
      !bypassRedirectCheck &&
      isEditMode &&
      initialStatus === 'published' &&
      initialSlug &&
      cleanNewSlug &&
      cleanNewSlug !== initialSlug
    ) {
      setPendingStatusOverride(targetStatusOverride);
      setShowRedirectModal(true);
      return;
    }

    setSaving(true);
    try {
      const targetStatus = targetStatusOverride || status;
      const flushed = editorRef.current?.flush();
      const activeContent = flushed?.json || contentJsonRef.current || contentJson;
      const activeHtml = flushed?.html || contentHtmlRef.current || contentHtml;

      const finalMetaTitle = seo.meta_title?.trim() || stripHtml(title).trim();
      const finalMetaDesc =
        seo.meta_description?.trim() ||
        excerpt.trim() ||
        extractContentText(activeContent).slice(0, 160);

      const payload: PostCreateInput & { featured_image?: any } = {
        title: stripHtml(title).trim(),
        slug: cleanNewSlug || undefined,
        excerpt: excerpt.trim() || undefined,
        content: activeContent,
        content_html: activeHtml || undefined,
        status: targetStatus,
        is_featured: isFeatured,
        scheduled_at: targetStatus === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        author_id: selectedAuthorId || null,
        category_ids: selectedCategoryIds,
        tag_ids: selectedTagIds,
        featured_image_id: featuredMedia?.id || null,
        featured_image: featuredMedia || undefined,
        featured_image_caption: featuredImageCaption.trim() || null,
        seo: {
          ...seo,
          meta_title: finalMetaTitle,
          meta_description: finalMetaDesc,
        },
      };

      let savedPost: Post;
      if (activePostId) {
        savedPost = await client.posts.update(activePostId, payload);
      } else {
        savedPost = await client.posts.create(payload);
        setCurrentPostId(savedPost.id);
      }

      setStatus(savedPost.status);
      setInitialStatus(savedPost.status);
      setInitialSlug(savedPost.slug || '');
      if (onSaveSuccess) onSaveSuccess(savedPost);

      // Clean up local recovery backup upon intentional save
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(`zw_draft_backup_${activePostId || 'new'}`);
        }
      } catch {}

      const successTitle = isEditMode
        ? (savedPost.status === 'published' ? 'Article Updated' : 'Draft Saved')
        : (savedPost.status === 'published' ? 'Article Published' : 'Draft Created');

      const successMsg = isEditMode
        ? (savedPost.status === 'published' ? 'Your article has been updated successfully.' : 'Your draft changes have been saved.')
        : (savedPost.status === 'published' ? 'Your article is now published live.' : 'Your draft has been created successfully.');

      toast.success(successMsg, successTitle);
    } catch (err) {
      toast.error(`Save failed: ${err}`, 'Save Error');
    } finally {
      setSaving(false);
    }
  };

  const handleAutosave = async (newContent: Record<string, unknown>) => {
    if (!newContent) return;

    // Safety check: Never background autosave live published or scheduled articles!
    if (status !== 'draft') {
      return;
    }

    const isActuallyEmpty = newContent.content && Array.isArray(newContent.content) && newContent.content.length === 1 && !(newContent.content[0] as any).content;
    if (isActuallyEmpty && contentJsonRef.current && Array.isArray((contentJsonRef.current as any).content) && (contentJsonRef.current as any).content.some((c: any) => c.content && c.content.length > 0)) {
      return;
    }
    contentJsonRef.current = newContent;
    setContentJson(newContent);

    // Save lightweight local crash-recovery cushion
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          `zw_draft_backup_${postId || 'new'}`,
          JSON.stringify({
            title,
            content: newContent,
            updatedAt: new Date().toISOString(),
          })
        );
      }
    } catch {}

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

  const activeOrigin = liveSiteUrl.replace(/\/+$/, '');
  const normalizedBasePath = liveBasePath.endsWith('/') ? liveBasePath : `${liveBasePath}/`;
  const livePermalinkPrefix = `${activeOrigin}${normalizedBasePath.startsWith('/') ? normalizedBasePath : `/${normalizedBasePath}`}`;
  const fullArticleUrl = `${livePermalinkPrefix}${slug || ''}`;

  // Filtered categories for sidebar picker
  const filteredCategories = categories.filter((c) => {
    if (!categorySearch.trim()) return true;
    const term = categorySearch.toLowerCase().trim();
    const parent = c.parent_id ? categories.find((p) => p.id === c.parent_id) : null;
    return (
      c.name.toLowerCase().includes(term) ||
      (parent && parent.name.toLowerCase().includes(term))
    );
  });

  // Auto-generated 1200x630 Open Graph Social Card
  const autoOgDataUri = useMemo(() => {
    return generateOgImageDataUri({
      title: seo.meta_title || title || 'Untitled Article',
      excerpt: seo.meta_description || excerpt || '',
      siteName: 'Zwantum Blog',
      category: categories.find((c) => selectedCategoryIds.includes(c.id))?.name || 'Article',
      authorName: authors.find((a) => a.id === selectedAuthorId)?.name || 'Editorial Team',
      readingTime: `${Math.max(1, Math.ceil(extractContentText(contentJson).split(/\s+/).filter(Boolean).length / 200))} min read`,
      domain: activeOrigin.replace(/^https?:\/\//, ''),
    });
  }, [seo.meta_title, title, seo.meta_description, excerpt, categories, selectedCategoryIds, authors, selectedAuthorId, contentJson, activeOrigin]);

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
          <button
            type="button"
            className="zw-admin-btn zw-admin-btn-secondary"
            onClick={() => {
              const flushed = editorRef.current?.flush();
              if (flushed) {
                contentJsonRef.current = flushed.json;
                contentHtmlRef.current = flushed.html;
                setContentJson(flushed.json);
                setContentHtml(flushed.html);
              }
              setShowPreviewModal(true);
            }}
            title="Preview article layout, typography, device viewports & citations"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preview
          </button>

          {postId && (
            <button
              type="button"
              className="zw-admin-btn zw-admin-btn-secondary"
              onClick={() => setShowRevisionModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Revisions
            </button>
          )}

          {/* Secondary Action: Save Draft, Switch to Draft, or Publish Draft */}
          {isEditMode ? (
            isPublished ? (
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-secondary"
                disabled={saving}
                onClick={() => handleSave('draft')}
                title="Revert published article back to an unpublished draft"
              >
                {saving ? 'Saving...' : 'Switch to Draft'}
              </button>
            ) : (
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-secondary"
                disabled={saving}
                onClick={() => handleSave('published')}
                title="Publish this draft live immediately"
              >
                {saving ? 'Publishing...' : 'Publish Article'}
              </button>
            )
          ) : (
            <button
              type="button"
              className="zw-admin-btn zw-admin-btn-secondary"
              disabled={saving}
              onClick={() => handleSave('draft')}
              title="Save as draft without publishing"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}

          {/* Primary Action Button: Update Article (when editing) vs Publish Article (when creating) */}
          <button
            type="button"
            className="zw-admin-btn zw-admin-btn-primary"
            disabled={saving}
            onClick={() => handleSave(isEditMode ? status : 'published')}
            title={isEditMode ? 'Update article with latest changes' : 'Publish article live'}
          >
            {saving
              ? (isEditMode || isPublished ? 'Updating...' : 'Publishing...')
              : (isEditMode || isPublished ? 'Update Article' : 'Publish Article')}
          </button>
        </div>
      </div>

      {/* Main Split Layout: Editor (Left) & Sidebar (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Article Title & Permalink
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: (title || '').length === 0 ? '#94a3b8' : (title || '').length > 70 ? '#d97706' : '#16a34a',
                  }}
                >
                  {(title || '').length} chars
                </span>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Controlled Plain-Text Title Input (with paste & formatting sanitization) */}
              <input
                type="text"
                className="zw-admin-title-input"
                value={title || ''}
                onChange={handleTitleChange}
                onPaste={handleTitlePaste}
                placeholder="Enter article headline or post title..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: '1.35rem',
                  fontWeight: 500,
                  color: '#1e293b',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  outline: 'none',
                  background: '#ffffff',
                  lineHeight: 1.4,
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ffcc00';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 204, 0, 0.25)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12.5px', fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>Permalink:</span>

                  <span>{livePermalinkPrefix}</span>

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
                    fontWeight: 500,
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
                        fontWeight: 500,
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      Reset
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(fullArticleUrl);
                        setCopiedSlug(true);
                        setTimeout(() => setCopiedSlug(false), 2000);
                      }
                    }}
                    title="Copy full live URL"
                    style={{
                      background: copiedSlug ? '#ecfdf5' : '#ffffff',
                      borderColor: copiedSlug ? '#a7f3d0' : '#e2e8f0',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      color: copiedSlug ? '#059669' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    {copiedSlug ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy URL
                      </>
                    )}
                  </button>

                  <a
                    href={fullArticleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open live URL in a new tab"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #bae6fd',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      color: '#0284c7',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#0284c7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#bae6fd';
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Live Link
                  </a>
                </div>

                {postId && status === 'published' && initialSlug && slug !== initialSlug && (
                  <div
                    style={{
                      width: '100%',
                      fontSize: '12px',
                      color: '#0369a1',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '6px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="15 14 20 9 15 4" />
                      <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
                    </svg>
                    <span>
                      <strong>Automatic 301 Redirect Protection:</strong> Saving will preserve backlinks by creating a 301 redirect from <code>{livePermalinkPrefix}{initialSlug}</code> to <code>{fullArticleUrl}</code>.
                    </span>
                  </div>
                )}
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Article Content
                </span>
              </div>
            </div>

            {/* Tiptap Rich Text Editor */}
            <BlogEditor
              ref={editorRef}
              content={contentJson}
              onChange={(json: Record<string, unknown>, html: string) => handleContentChange(json, html)}
              onAutosave={handleAutosave}
              enableAutosave={enableAutosave && status === 'draft'}
              onOpenMediaLibrary={() => {
                if (onOpenMediaLibrary) {
                  onOpenMediaLibrary((selected) => {
                    if (selected && selected.url) {
                      editorRef.current?.insertImage(
                        selected.url,
                        selected.alt_text || '',
                        selected.caption || selected.title || ''
                      );
                    }
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
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
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                    Canonical URL
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSeoPreviewMode('google')}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: seoPreviewMode === 'google' ? 600 : 400,
                        border: 'none',
                        borderRadius: '4px',
                        background: seoPreviewMode === 'google' ? '#ffffff' : 'transparent',
                        color: seoPreviewMode === 'google' ? '#0f172a' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      Google SERP
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeoPreviewMode('social')}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: seoPreviewMode === 'social' ? 600 : 400,
                        border: 'none',
                        borderRadius: '4px',
                        background: seoPreviewMode === 'social' ? '#ffffff' : 'transparent',
                        color: seoPreviewMode === 'social' ? '#0f172a' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      Social Card (OG)
                    </button>
                  </div>

                  {seoPreviewMode === 'google' ? (
                    <span style={{ fontSize: '11px', color: (seo.robots || '').includes('noindex') ? '#d97706' : '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {(seo.robots || '').includes('noindex') ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          Noindex
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Indexable
                        </>
                      )}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 500 }}>
                      1200 × 630 px
                    </span>
                  )}
                </div>

                {seoPreviewMode === 'google' ? (
                  <>
                    <div style={{ fontSize: '11.5px', color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeOrigin} › {normalizedBasePath.replace(/^\/|\/$/g, '') || 'blog'} › {slug || 'post-slug'}
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
                  </>
                ) : (
                  <div>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#090d16' }}>
                      <img
                        src={featuredMedia?.url || autoOgDataUri}
                        alt="Social Share Card Preview"
                        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '180px', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                      <span>{featuredMedia?.url ? 'Using manual cover image for social previews' : 'Automated dynamic branded card for Twitter, LinkedIn & WhatsApp'}</span>
                    </div>
                  </div>
                )}
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
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
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
                <label htmlFor="feat-checkbox" style={{ fontSize: '13px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="zw-admin-label" style={{ margin: 0 }}>Categories</label>
                  {selectedCategoryIds.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#854d0e', background: '#fef3c7', padding: '1px 8px', borderRadius: '10px', fontWeight: 500 }}>
                      {selectedCategoryIds.length} selected
                    </span>
                  )}
                </div>

                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#ffffff',
                    overflow: 'hidden',
                  }}
                >
                  {/* Category Search Input */}
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid #f1f5f9',
                      background: '#f8fafc',
                      padding: '6px 10px',
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ marginRight: '8px', flexShrink: 0 }}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search categories..."
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '12px',
                        color: '#1e293b',
                        width: '100%',
                        padding: '1px 0',
                      }}
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch('')}
                        title="Clear search"
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          marginLeft: '4px',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Scrollable Category Checkboxes */}
                  <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '6px 8px' }}>
                    {filteredCategories.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#94a3b8', padding: '14px 6px', textAlign: 'center' }}>
                        {categorySearch ? (
                          <>No categories match &ldquo;{categorySearch}&rdquo;</>
                        ) : (
                          'No categories found'
                        )}
                      </div>
                    ) : (
                      filteredCategories.map((c) => {
                        const isChecked = selectedCategoryIds.includes(c.id);
                        const parentCat = c.parent_id ? categories.find((p) => p.id === c.parent_id) : null;
                        return (
                          <label
                            key={c.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              padding: '5px 8px',
                              borderRadius: '5px',
                              margin: '1px 0',
                              cursor: 'pointer',
                              backgroundColor: isChecked ? '#fffdf0' : 'transparent',
                              transition: 'background-color 0.12s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategoryIds([...selectedCategoryIds, c.id]);
                                } else {
                                  setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== c.id));
                                }
                              }}
                              style={{ accentColor: '#ffcc00', cursor: 'pointer' }}
                            />
                            <span style={{ color: isChecked ? '#0f172a' : '#334155', fontWeight: isChecked ? 500 : 400 }}>
                              {parentCat && (
                                <span style={{ color: '#94a3b8', fontSize: '11px', marginRight: '4px' }}>
                                  {parentCat.name} ›
                                </span>
                              )}
                              {c.name}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Tags</label>
                <TagInput
                  availableTags={tags}
                  selectedTagIds={selectedTagIds}
                  onChange={setSelectedTagIds}
                  client={client}
                  onTagCreated={(newTag) => setTags((prev) => [...prev, newTag])}
                  placeholder="Type tags, comma-separated..."
                />
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

              {uploadingFeatured ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', border: '2px dashed #cbd5e1', borderRadius: '8px' }}>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0, fontWeight: 500 }}>Uploading image...</p>
                </div>
              ) : featuredMedia ? (
                <div>
                  <img
                    src={featuredMedia.url}
                    alt={featuredMedia.alt_text || 'Featured image'}
                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                  />
                  <div className="zw-admin-form-group">
                    <label className="zw-admin-label">Image Alt Text</label>
                    <input
                      type="text"
                      className="zw-admin-input"
                      value={featuredMedia.alt_text || ''}
                      onChange={(e) => setFeaturedMedia({ ...featuredMedia, alt_text: e.target.value })}
                      placeholder="Descriptive alt text for screen readers & search engines"
                    />
                  </div>
                  <div className="zw-admin-form-group" style={{ marginTop: '8px' }}>
                    <label className="zw-admin-label">Cover Image Caption</label>
                    <input
                      type="text"
                      className="zw-admin-input"
                      value={featuredImageCaption}
                      onChange={(e) => setFeaturedImageCaption(e.target.value)}
                      placeholder="Editorial caption displayed below the cover image"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-primary zw-admin-btn-sm"
                      onClick={() => {
                        if (onOpenMediaLibrary) {
                          onOpenMediaLibrary((selected) => {
                            setFeaturedMedia(selected);
                            if (selected?.caption && !featuredImageCaption) {
                              setFeaturedImageCaption(selected.caption);
                            }
                          });
                        } else {
                          featuredImageInputRef.current?.click();
                        }
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      Media Library
                    </button>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-danger zw-admin-btn-sm"
                      onClick={() => {
                        setFeaturedMedia(null);
                        setFeaturedImageCaption('');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '18px 12px', border: '2px dashed #cbd5e1', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>No featured image set</p>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="zw-admin-btn zw-admin-btn-primary zw-admin-btn-sm"
                      onClick={() => {
                        if (onOpenMediaLibrary) {
                          onOpenMediaLibrary((selected) => {
                            setFeaturedMedia(selected);
                            if (selected?.caption && !featuredImageCaption) {
                              setFeaturedImageCaption(selected.caption);
                            }
                          });
                        } else {
                          featuredImageInputRef.current?.click();
                        }
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      Media Library
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
            toast.info('Revision restored into editor!', 'Revision Restored');
          }}
        />
      )}

      {/* Live Article Preview Modal */}
      <PostPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={title}
        excerpt={excerpt}
        status={status}
        author={authors.find((a) => a.id === selectedAuthorId)}
        readingTime={Math.max(1, Math.ceil(extractContentText(contentJson).split(/\s+/).filter(Boolean).length / 200))}
        wordCount={extractContentText(contentJson).split(/\s+/).filter(Boolean).length}
        featuredMedia={featuredMedia}
        featuredImageCaption={featuredImageCaption}
        contentJson={contentJson}
        contentHtml={contentHtml}
        categories={categories.filter((c) => selectedCategoryIds.includes(c.id))}
        tags={tags.filter((t) => selectedTagIds.includes(t.id))}
        publishedAt={scheduledAt ? new Date(scheduledAt).toISOString() : null}
        postId={postId}
        client={client}
      />

      {/* 301 Redirect Confirmation Modal (Option 2) */}
      {showRedirectModal && (
        <div className="zw-admin-modal-overlay">
          <div className="zw-admin-modal" style={{ maxWidth: '560px' }}>
            <div className="zw-admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px', color: '#0f172a' }}>
                <span style={{ display: 'inline-flex', color: '#f59e0b' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <span>URL Slug Changed on Published Post</span>
              </div>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                onClick={() => setShowRedirectModal(false)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="zw-admin-modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
                You modified the URL slug for an already-published post. To prevent broken inbound links, search indexing penalties, and 404 errors for visitors, we recommend creating an automatic <strong>301 Permanent Redirect</strong>.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>Original URL</span>
                  <div style={{ fontFamily: 'monospace', fontSize: '12.5px', color: '#dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fee2e2', marginTop: '4px', wordBreak: 'break-all' }}>
                    {`${liveBasePath}/${initialSlug}`.replace(/\/+/g, '/')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0', color: '#64748b' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>New Destination URL</span>
                  <div style={{ fontFamily: 'monospace', fontSize: '12.5px', color: '#16a34a', background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px', border: '1px solid #dcfce7', marginTop: '4px', wordBreak: 'break-all' }}>
                    {`${liveBasePath}/${slug.trim()}`.replace(/\/+/g, '/')}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-flex', color: '#6366f1' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
                <span>You can view and manage all active rules anytime in Settings &rarr; Redirects.</span>
              </div>
            </div>

            <div className="zw-admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-secondary"
                onClick={async () => {
                  setShowRedirectModal(false);
                  await handleSave(pendingStatusOverride, true);
                }}
              >
                Update without Redirect
              </button>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={async () => {
                  const cleanSource = `${liveBasePath}/${initialSlug}`.replace(/\/+/g, '/');
                  const cleanDest = `${liveBasePath}/${slug.trim()}`.replace(/\/+/g, '/');
                  try {
                    await client.redirects.create({
                      source_url: cleanSource,
                      destination_url: cleanDest,
                      status_code: 301,
                    });
                    toast.success(`301 redirect created: ${cleanSource} → ${cleanDest}`, 'Redirect Active');
                  } catch (err: any) {
                    console.warn('Redirect creation skipped or existing rule found:', err);
                  }
                  setShowRedirectModal(false);
                  await handleSave(pendingStatusOverride, true);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Create 301 &amp; Update</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
