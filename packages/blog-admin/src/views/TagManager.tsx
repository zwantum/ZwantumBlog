import React, { useState, useEffect, useCallback } from 'react';
import { Tag, TagInput } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface TagManagerProps {
  client: BlogClient;
  className?: string;
}

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const TagManager: React.FC<TagManagerProps> = ({ client, className = '' }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Form fields (Left Sidebar)
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [tagDescription, setTagDescription] = useState('');
  const [rankEnabled, setRankEnabled] = useState(false); // Default: hidden until clicked
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  // Edit Modal State (Popup Window)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRankEnabled, setEditRankEnabled] = useState(false);
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editSeoDescription, setEditSeoDescription] = useState('');
  const [editCanonicalUrl, setEditCanonicalUrl] = useState('');

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.tags.getAll();
      setTags(res);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const resetCreateForm = () => {
    setTagName('');
    setTagSlug('');
    setIsSlugCustomized(false);
    setTagDescription('');
    setRankEnabled(false);
    setSeoTitle('');
    setSeoDescription('');
    setCanonicalUrl('');
  };

  const handleNameChange = (val: string) => {
    setTagName(val);
    if (!isSlugCustomized) {
      setTagSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugCustomized(true);
    setTagSlug(slugify(val));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    try {
      const finalSlug = tagSlug.trim() ? slugify(tagSlug.trim()) : slugify(tagName.trim());
      const robots = rankEnabled ? 'index,follow' : 'noindex,follow';
      const no_index = !rankEnabled;

      const input: TagInput = {
        name: tagName.trim(),
        slug: finalSlug,
        description: tagDescription.trim() || null,
        seo_title: rankEnabled && seoTitle.trim() ? seoTitle.trim() : null,
        seo_description: rankEnabled && seoDescription.trim() ? seoDescription.trim() : null,
        canonical_url: rankEnabled && canonicalUrl.trim() ? canonicalUrl.trim() : null,
        robots,
        no_index,
      };

      await client.tags.create(input);
      resetCreateForm();
      fetchTags();
    } catch (err) {
      alert(`Error creating tag: ${err}`);
    }
  };

  // Open Edit Popup Modal
  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditSlug(tag.slug);
    setEditDescription(tag.description || '');
    const isNoIndex = tag.no_index || (tag.robots?.includes('noindex') ?? false);
    setEditRankEnabled(!isNoIndex);
    setEditSeoTitle(tag.seo_title || '');
    setEditSeoDescription(tag.seo_description || '');
    setEditCanonicalUrl(tag.canonical_url || '');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTag(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editName.trim()) return;

    try {
      const finalSlug = editSlug.trim() ? slugify(editSlug.trim()) : slugify(editName.trim());
      const robots = editRankEnabled ? 'index,follow' : 'noindex,follow';
      const no_index = !editRankEnabled;

      const input: Partial<TagInput> = {
        name: editName.trim(),
        slug: finalSlug,
        description: editDescription.trim() || null,
        seo_title: editRankEnabled && editSeoTitle.trim() ? editSeoTitle.trim() : null,
        seo_description: editRankEnabled && editSeoDescription.trim() ? editSeoDescription.trim() : null,
        canonical_url: editRankEnabled && editCanonicalUrl.trim() ? editCanonicalUrl.trim() : null,
        robots,
        no_index,
      };

      await client.tags.update(editingTag.id, input);
      closeEditModal();
      fetchTags();
    } catch (err) {
      alert(`Error updating tag: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tag?')) return;
    try {
      await client.tags.delete(id);
      if (editingTag?.id === id) {
        closeEditModal();
      }
      fetchTags();
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  // Filtered tags for table
  const filteredTags = tags.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`zw-admin-container ${className}`} style={{ width: '100%', margin: 0 }}>
      {/* Top Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
          Tags
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 400 }}>
          Labels for cross-referencing, organizing, and managing search indexing for blog articles.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 370px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Always Add New Tag Form */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#fffdf5',
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: '#ffcc00',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              #
            </span>
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 600, color: '#0f172a' }}>
              Add New Tag
            </h3>
          </div>

          <form onSubmit={handleCreate} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tag Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                Tag Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Interior Design"
                value={tagName}
                onChange={(e) => handleNameChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Slug (Auto-synced from name, editable) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                Slug
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>
                  /tag/
                </span>
                <input
                  type="text"
                  value={tagSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="interior-design"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 52px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13.5px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Description (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Brief summary or topic description for articles filed under this tag..."
                value={tagDescription}
                onChange={(e) => setTagDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Rank This Tag Toggle: By default SEO fields do NOT show until clicked */}
            <div
              onClick={() => setRankEnabled(!rankEnabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: '10px',
                border: rankEnabled ? '1.5px solid #ffcc00' : '1px solid #e2e8f0',
                background: rankEnabled ? '#fffdf0' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={rankEnabled ? '#b45309' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                    Rank this tag in search results
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {rankEnabled ? 'Search indexing enabled (index, follow)' : 'Click to enable SEO fields & Google indexing'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: '38px',
                  height: '20px',
                  borderRadius: '10px',
                  background: rankEnabled ? '#ffcc00' : '#cbd5e1',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: '3px',
                    left: rankEnabled ? '21px' : '3px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </div>

            {/* SEO Fields: Shown ONLY if rankEnabled is clicked */}
            {rankEnabled && (
              <div
                style={{
                  border: '1px solid #fed7aa',
                  borderRadius: '12px',
                  padding: '14px',
                  background: '#fffdfa',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* SEO Title */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>SEO Meta Title</label>
                    <span style={{ fontSize: '11px', color: seoTitle.length > 60 ? '#ef4444' : '#64748b' }}>
                      {seoTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={`#${tagName || 'topic'} - Articles & Guides | Blog`}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                    }}
                  />
                </div>

                {/* SEO Description */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>SEO Meta Description</label>
                    <span style={{ fontSize: '11px', color: seoDescription.length > 160 ? '#ef4444' : '#64748b' }}>
                      {seoDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder={tagDescription || `Explore all articles tagged with #${tagName || 'topic'}...`}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Canonical URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Canonical URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourdomain.com/blog/tag/custom-slug"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                    }}
                  />
                </div>

                {/* SERP Snippet Preview */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#16a34a' }}>
                    Google SERP Preview (Eligible to Rank)
                  </div>
                  <div style={{ fontSize: '11px', color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    https://example.com › blog › tag › {tagSlug || slugify(tagName) || 'topic'}
                  </div>
                  <div
                    style={{
                      fontSize: '13.5px',
                      color: '#1a0dab',
                      fontWeight: 500,
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {seoTitle.trim() || (tagName ? `#${tagName} - Articles & Guides | Blog` : '#Topic - Articles & Guides')}
                  </div>
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: '#4d5156',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {seoDescription.trim() || tagDescription.trim() || `Browse articles tagged under #${tagName || 'topic'}.`}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#ffcc00',
                color: '#0f172a',
                border: 'none',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255, 204, 0, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              Add Tag
            </button>
          </form>
        </div>

        {/* Right: Tag List Table Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            overflow: 'hidden',
          }}
        >
          {/* Table Toolbar */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
              All Tags ({tags.length})
            </div>
            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 30px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '12px', background: '#fafafa' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Tag & Description</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Slug</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Search Ranking</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Articles</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      Loading tags...
                    </td>
                  </tr>
                ) : filteredTags.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      {searchQuery ? 'No tags match your search.' : 'No tags created yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredTags.map((t) => {
                    const isRanked = !t.no_index && !(t.robots?.includes('noindex') ?? false);

                    return (
                      <tr
                        key={t.id}
                        style={{
                          borderBottom: '1px solid #f8fafc',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>
                              #{t.name}
                            </span>
                          </div>
                          {t.description && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#64748b',
                                marginTop: '3px',
                                maxWidth: '300px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {t.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#64748b', fontFamily: 'monospace', fontSize: '12.5px' }}>
                          /tag/{t.slug}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {isRanked ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: '#dcfce7',
                                color: '#15803d',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a' }} />
                              Indexable
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#d97706' }} />
                              Noindex
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: '#f1f5f9',
                              color: '#334155',
                              fontSize: '11.5px',
                              fontWeight: 500,
                            }}
                          >
                            {t.post_count || 0}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(t)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                color: '#0f172a',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(t.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                color: '#ef4444',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Tag Popup Window (Modal) */}
      {isEditModalOpen && editingTag && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: '#ffcc00',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12.5px',
                  }}
                >
                  #
                </span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                  Edit Tag: #{editingTag.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
                {/* Tag Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Tag Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Slug
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>
                      /tag/
                    </span>
                    <input
                      type="text"
                      value={editSlug}
                      onChange={(e) => setEditSlug(slugify(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 52px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13.5px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief summary or topic description for articles filed under this tag..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Rank Toggle */}
                <div
                  onClick={() => setEditRankEnabled(!editRankEnabled)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: editRankEnabled ? '1.5px solid #ffcc00' : '1px solid #e2e8f0',
                    background: editRankEnabled ? '#fffdf0' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={editRankEnabled ? '#b45309' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                        Rank this tag in search results
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {editRankEnabled ? 'Search indexing enabled (index, follow)' : 'Click to enable SEO fields & Google indexing'}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      width: '38px',
                      height: '20px',
                      borderRadius: '10px',
                      background: editRankEnabled ? '#ffcc00' : '#cbd5e1',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: editRankEnabled ? '21px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      }}
                    />
                  </div>
                </div>

                {/* SEO Fields: Shown ONLY if editRankEnabled is active */}
                {editRankEnabled && (
                  <div
                    style={{
                      border: '1px solid #fed7aa',
                      borderRadius: '12px',
                      padding: '14px',
                      background: '#fffdfa',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* SEO Title */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>SEO Meta Title</label>
                        <span style={{ fontSize: '11px', color: editSeoTitle.length > 60 ? '#ef4444' : '#64748b' }}>
                          {editSeoTitle.length}/60
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder={`#${editName || 'topic'} - Articles & Guides | Blog`}
                        value={editSeoTitle}
                        onChange={(e) => setEditSeoTitle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: '#ffffff',
                        }}
                      />
                    </div>

                    {/* SEO Description */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>SEO Meta Description</label>
                        <span style={{ fontSize: '11px', color: editSeoDescription.length > 160 ? '#ef4444' : '#64748b' }}>
                          {editSeoDescription.length}/160
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder={editDescription || `Explore all articles tagged with #${editName || 'topic'}...`}
                        value={editSeoDescription}
                        onChange={(e) => setEditSeoDescription(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: '#ffffff',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>

                    {/* Canonical URL */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Canonical URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://yourdomain.com/blog/tag/custom-slug"
                        value={editCanonicalUrl}
                        onChange={(e) => setEditCanonicalUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12.5px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: '#ffffff',
                        }}
                      />
                    </div>

                    {/* SERP Snippet Preview */}
                    <div
                      style={{
                        background: '#ffffff',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                      }}
                    >
                      <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#16a34a' }}>
                        Google SERP Preview (Eligible to Rank)
                      </div>
                      <div style={{ fontSize: '11px', color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        https://example.com › blog › tag › {editSlug || slugify(editName) || 'topic'}
                      </div>
                      <div
                        style={{
                          fontSize: '13.5px',
                          color: '#1a0dab',
                          fontWeight: 500,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {editSeoTitle.trim() || (editName ? `#${editName} - Articles & Guides | Blog` : '#Topic - Articles & Guides')}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: '#4d5156',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {editSeoDescription.trim() || editDescription.trim() || `Browse articles tagged under #${editName || 'topic'}.`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid #f1f5f9',
                  background: '#fafafa',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#ffcc00',
                    color: '#0f172a',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(255, 204, 0, 0.35)',
                  }}
                >
                  Update Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
