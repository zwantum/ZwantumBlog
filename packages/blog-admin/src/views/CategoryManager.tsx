import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Category, CategoryInput } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface CategoryManagerProps {
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

export const CategoryManager: React.FC<CategoryManagerProps> = ({ client, className = '' }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  // Image Upload
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // SEO Fields (like tags)
  const [rankEnabled, setRankEnabled] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await client.categories.getAll();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIsSlugCustomized(false);
    setDescription('');
    setParentId('');
    setDisplayOrder(categories.length);
    setImageUrl('');
    setRankEnabled(false); // Default hidden until clicked
    setSeoTitle('');
    setSeoDescription('');
    setCanonicalUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIsSlugCustomized(true);
    setDescription(cat.description || '');
    setParentId(cat.parent_id || '');
    setDisplayOrder(cat.display_order || 0);
    setImageUrl(cat.image_url || '');

    const isNoIndex = cat.no_index || (cat.robots?.includes('noindex') ?? false);
    setRankEnabled(!isNoIndex);
    setSeoTitle(cat.seo_title || '');
    setSeoDescription(cat.seo_description || '');
    setCanonicalUrl(cat.canonical_url || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugCustomized) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugCustomized(true);
    setSlug(slugify(val));
  };

  // Device file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const finalSlug = slug.trim() ? slugify(slug.trim()) : slugify(name.trim());
      const robots = rankEnabled ? 'index,follow' : 'noindex,follow';
      const no_index = !rankEnabled;

      const input: CategoryInput = {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        parent_id: parentId || null,
        display_order: displayOrder,
        image_url: imageUrl.trim() || null,
        seo_title: rankEnabled && seoTitle.trim() ? seoTitle.trim() : null,
        seo_description: rankEnabled && seoDescription.trim() ? seoDescription.trim() : null,
        canonical_url: rankEnabled && canonicalUrl.trim() ? canonicalUrl.trim() : null,
        robots,
        no_index,
      };

      if (editingCategory) {
        await client.categories.update(editingCategory.id, input);
      } else {
        await client.categories.create(input);
      }

      closeModal();
      fetchCategories();
    } catch (err) {
      alert(`Error saving category: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? Posts attached to it will not be deleted.')) return;
    try {
      await client.categories.delete(id);
      if (editingCategory?.id === id) {
        closeModal();
      }
      fetchCategories();
    } catch (err) {
      alert(`Error deleting category: ${err}`);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`zw-admin-container ${className}`} style={{ width: '100%', margin: 0 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Categories
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 400 }}>
            Organize articles into hierarchical topics, manage featured imagery, and configure search engine indexing.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Card & Table */}
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
            All Categories ({categories.length})
          </div>
          <div style={{ position: 'relative', width: '240px' }}>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
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
              style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
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
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Slug</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Parent</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Search Ranking</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Articles</th>
                <th style={{ padding: '12px 18px', fontWeight: 600 }}>Order</th>
                <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    {searchQuery ? 'No categories match your search.' : 'No categories created yet.'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const parent = categories.find((c) => c.id === cat.parent_id);
                  const isRanked = !cat.no_index && !(cat.robots?.includes('noindex') ?? false);

                  return (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {cat.image_url ? (
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                background: '#fffbeb',
                                border: '1px solid #fef3c7',
                                color: '#b45309',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '12px',
                                flexShrink: 0,
                              }}
                            >
                              📁
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>
                              {cat.name}
                            </div>
                            {cat.description && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#64748b',
                                  marginTop: '2px',
                                  maxWidth: '280px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {cat.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#64748b', fontFamily: 'monospace', fontSize: '12.5px' }}>
                        /category/{cat.slug}
                      </td>
                      <td style={{ padding: '14px 18px', color: parent ? '#0f172a' : '#94a3b8' }}>
                        {parent ? parent.name : '—'}
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
                          {cat.post_count || 0}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#64748b' }}>
                        {cat.display_order}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
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
                            onClick={() => handleDelete(cat.id)}
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

      {/* Add / Edit Category Modal (Popup Window) */}
      {isModalOpen && (
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
              maxWidth: '560px',
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
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#0f172a' }}>
                {editingCategory ? `Edit Category` : 'Add New Category'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
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

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
                {/* Category Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Architectural Vastu"
                    value={name}
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
                      /category/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="architectural-vastu"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 84px',
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

                {/* Parent Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Parent Category (Optional)
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13.5px',
                      background: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">None (Top Level)</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Category Image (Device Upload + URL like Author) */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Category Image (Optional)
                  </label>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    {/* Preview Thumbnail */}
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: '#f1f5f9',
                        border: '1.5px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt="Category Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '20px' }}>📁</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            fontSize: '12.5px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <span>Upload from Device</span>
                        </button>
                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              padding: '4px 6px',
                            }}
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste image URL (https://...)"
                        value={imageUrl.startsWith('data:') ? '✓ Uploaded from device' : imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        disabled={imageUrl.startsWith('data:')}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          background: imageUrl.startsWith('data:') ? '#f1f5f9' : '#ffffff',
                          color: '#475569',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Principles of spatial energy alignment for modern commercial and residential buildings..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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

                {/* Display Order */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
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

                {/* Rank Toggle (Like Tags: Hidden by default until clicked) */}
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
                        Rank this category in search results
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
                        placeholder={`${name || 'Category Name'} - Articles & Guides | Blog`}
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
                        placeholder={description || `Explore articles and updates under ${name || 'this category'}...`}
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
                        placeholder="https://yourdomain.com/blog/category/custom-slug"
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

                    {/* Google SERP Preview */}
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
                        https://example.com › blog › category › {slug || slugify(name) || 'category'}
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
                        {seoTitle.trim() || (name ? `${name} - Articles & Guides | Blog` : 'Category Title - Articles & Guides')}
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
                        {seoDescription.trim() || description.trim() || `Browse articles and insights filed under ${name || 'this category'}.`}
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
                  onClick={closeModal}
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
