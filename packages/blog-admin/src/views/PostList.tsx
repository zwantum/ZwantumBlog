import React, { useState, useEffect, useCallback } from 'react';
import { Post, PostStatus, Category, Author } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface PostListProps {
  client: BlogClient;
  onNavigateToNewPost?: () => void;
  onNavigateToEditPost?: (id: string) => void;
  className?: string;
}

export const PostList: React.FC<PostListProps> = ({
  client,
  onNavigateToNewPost,
  onNavigateToEditPost,
  className = '',
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Real Database Tab Counts
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
    archived: 0,
    trash: 0,
  });

  // Custom Confirmation Popup Modal (no browser alerts)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    postId: string;
    postTitle: string;
    isPermanent: boolean;
  } | null>(null);

  // Category Badge Colors
  const getCategoryBadgeStyle = (categoryName?: string) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('architectural')) {
      return { background: '#fef9c3', color: '#b45309' };
    }
    if (cat.includes('office')) {
      return { background: '#eff6ff', color: '#2563eb' };
    }
    if (cat.includes('home')) {
      return { background: '#f5f3ff', color: '#7c3aed' };
    }
    if (cat.includes('lifestyle')) {
      return { background: '#f0fdf4', color: '#16a34a' };
    }
    if (cat.includes('interior')) {
      return { background: '#fff1f2', color: '#e11d48' };
    }
    if (cat.includes('wealth') || cat.includes('prosperity')) {
      return { background: '#eef2ff', color: '#4f46e5' };
    }
    if (cat.includes('education') || cat.includes('school')) {
      return { background: '#f0f9ff', color: '#0284c7' };
    }
    return { background: '#f1f5f9', color: '#475569' };
  };

  // Status Badge Colors
  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return { background: '#dcfce7', color: '#16a34a' };
      case 'draft':
        return { background: '#fef3c7', color: '#d97706' };
      case 'scheduled':
        return { background: '#f3e8ff', color: '#9333ea' };
      case 'archived':
        return { background: '#f1f5f9', color: '#64748b' };
      case 'trashed':
      case 'trash':
        return { background: '#fee2e2', color: '#dc2626' };
      default:
        return { background: '#f1f5f9', color: '#64748b' };
    }
  };

  // Author Initials Helper
  const getAuthorInitials = (name?: string) => {
    if (!name) return 'AU';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Date Display Helper
  const formatDateDisplay = (dateStr?: string | null, status?: string) => {
    if (!dateStr || status === 'draft') {
      return { line1: '—', line2: 'Not published' };
    }
    try {
      const d = new Date(dateStr);
      const line1 = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const line2 = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return { line1, line2 };
    } catch {
      return { line1: '—', line2: 'Not published' };
    }
  };

  // Fetch real counts for tabs
  const fetchTabCounts = useCallback(async () => {
    try {
      const allRes = await client.posts.list({ limit: 1000, includeTrashed: true });
      const allList = allRes.data || [];
      setTabCounts({
        all: allList.filter((p) => p.status !== 'trash').length,
        published: allList.filter((p) => p.status === 'published').length,
        draft: allList.filter((p) => p.status === 'draft').length,
        scheduled: allList.filter((p) => p.status === 'scheduled').length,
        archived: allList.filter((p) => p.status === 'archived').length,
        trash: allList.filter((p) => p.status === 'trash').length,
      });
    } catch (err) {
      console.error('Failed to load tab counts', err);
    }
  }, [client]);

  // Fetch posts based on current active tab & filters
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let statusParam: PostStatus | PostStatus[] | undefined = undefined;
      if (selectedStatus !== 'all') {
        statusParam = selectedStatus as PostStatus;
      } else if (currentTab !== 'all') {
        statusParam = currentTab as PostStatus;
      }

      const isTrashView = currentTab === 'trash' || selectedStatus === 'trash';

      const result = await client.posts.list({
        page,
        limit: itemsPerPage,
        status: statusParam,
        categoryId: selectedCategory || undefined,
        authorId: selectedAuthor || undefined,
        search: searchQuery.trim() || undefined,
        includeTrashed: isTrashView,
      });

      const loadedPosts = result.data || [];
      setPosts(loadedPosts);
      const count = result.total !== undefined ? result.total : loadedPosts.length;
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / itemsPerPage)));
    } catch (err) {
      console.error('Failed to load posts', err);
      setPosts([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [client, currentTab, selectedStatus, selectedCategory, selectedAuthor, searchQuery, page, itemsPerPage]);

  useEffect(() => {
    client.categories.getAll().then(setCategories).catch(() => {});
    client.authors.getAll().then(setAuthors).catch(() => {});
    fetchTabCounts();
  }, [client, fetchTabCounts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDuplicate = async (id: string) => {
    try {
      await client.posts.duplicate(id);
      fetchPosts();
      fetchTabCounts();
    } catch (err) {
      alert(`Failed to duplicate: ${err}`);
    }
  };

  // Opens Confirmation Popup Modal for moving to Trash
  const handleOpenTrashModal = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      postId: id,
      postTitle: title,
      isPermanent: false,
    });
  };

  // Opens Confirmation Popup Modal for Permanent Delete
  const handleOpenPermanentDeleteModal = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      postId: id,
      postTitle: title,
      isPermanent: true,
    });
  };

  // Execute confirmed action
  const executeConfirmAction = async () => {
    if (!confirmModal) return;
    try {
      await client.posts.delete(confirmModal.postId, confirmModal.isPermanent);
      setConfirmModal(null);
      fetchPosts();
      fetchTabCounts();
    } catch (err) {
      alert(`Failed to delete post: ${err}`);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await client.posts.restore(id);
      fetchPosts();
      fetchTabCounts();
    } catch (err) {
      alert(`Failed to restore post: ${err}`);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAuthor('');
    setSelectedStatus('all');
    setCurrentTab('all');
    setPage(1);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPosts(new Set(posts.map((p) => p.id)));
    } else {
      setSelectedPosts(new Set());
    }
  };

  const handleToggleSelectPost = (id: string) => {
    setSelectedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Dynamic real tab definitions
  const statusTabs = [
    { key: 'all', label: 'All', count: tabCounts.all },
    { key: 'published', label: 'Published', count: tabCounts.published },
    { key: 'draft', label: 'Drafts', count: tabCounts.draft },
    { key: 'scheduled', label: 'Scheduled', count: tabCounts.scheduled },
    { key: 'archived', label: 'Archived', count: tabCounts.archived },
    { key: 'trash', label: 'Trash', count: tabCounts.trash },
  ];

  // Dynamic real page numbers generator
  const renderPageButtons = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`zw-admin-container ${className}`} style={{ width: '100%', margin: 0 }}>
      {/* 1. Top Header Area: Title & "+ Add New Post" Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Posts
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 400 }}>
            Create, manage and publish your blog content.
          </p>
        </div>

        {onNavigateToNewPost && (
          <button
            type="button"
            onClick={onNavigateToNewPost}
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
            <span>Add New Post</span>
          </button>
        )}
      </div>

      {/* 2. Status Filter Tabs (Shows Real Live Counts) */}
      <div style={{ display: 'flex', gap: '28px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px', overflowX: 'auto' }}>
        {statusTabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setCurrentTab(tab.key);
                setSelectedStatus('all');
                setPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2.5px solid #ffcc00' : '2.5px solid transparent',
                padding: '8px 4px 12px 4px',
                color: isActive ? '#0f172a' : '#64748b',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span style={{ color: isActive ? '#0f172a' : '#94a3b8', fontSize: '13px' }}>({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* 3. Filters Control Bar (Search, Category, Author, Status, Date Range, Filter & Reset) */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '240px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search posts by title, keyword, or slug..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                fetchPosts();
              }
            }}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '13px',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category Dropdown (Clean SVG Chevron Icon) */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 34px 9px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '13px',
              color: '#475569',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Author Dropdown (Clean SVG Chevron Icon) */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedAuthor}
            onChange={(e) => {
              setSelectedAuthor(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 34px 9px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '13px',
              color: '#475569',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="">All Authors</option>
            {authors.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Status Dropdown (Clean SVG Chevron Icon) */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 34px 9px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '13px',
              color: '#475569',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
            <option value="trash">Trash</option>
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Date Range Button */}
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 14px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#64748b',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Select Date Range</span>
        </button>

        {/* Filter Action Button */}
        <button
          type="button"
          onClick={() => {
            setPage(1);
            fetchPosts();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '10px',
            border: 'none',
            background: '#ffcc00',
            color: '#0f172a',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(255, 204, 0, 0.35)',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Filter</span>
        </button>

        {/* Reset Action Button */}
        <button
          type="button"
          onClick={handleResetFilters}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 14px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>Reset</span>
        </button>
      </div>

      {/* 4. Posts Data Table Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '12px', background: '#fafafa' }}>
                <th style={{ padding: '14px 16px', width: '36px' }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={posts.length > 0 && selectedPosts.size === posts.length}
                    style={{ cursor: 'pointer', borderRadius: '4px', accentColor: '#ffcc00' }}
                  />
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Post</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Author</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>Date ↓</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading posts...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No posts match your filters.
                  </td>
                </tr>
              ) : (
                posts.map((post: any) => {
                  const isChecked = selectedPosts.has(post.id);
                  const catName = post.categoryName || post.categories?.[0]?.name || 'General';
                  const catStyle = getCategoryBadgeStyle(catName);
                  const statusStyle = getStatusBadgeStyle(post.status);
                  const authorName = post.author?.name || 'Staff Author';
                  const authorInitials = getAuthorInitials(authorName);
                  const dateInfo = formatDateDisplay(post.published_at, post.status);
                  const thumb =
                    post.image ||
                    post.featured_image?.url ||
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=120&auto=format&fit=crop&q=80';

                  return (
                    <tr
                      key={post.id}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        background: isChecked ? '#fffdf0' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '14px 16px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectPost(post.id)}
                          style={{ cursor: 'pointer', borderRadius: '4px', accentColor: '#ffcc00' }}
                        />
                      </td>

                      {/* Post Title & Slug */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img
                            src={thumb}
                            alt=""
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '1px solid #e2e8f0',
                            }}
                          />
                          <div>
                            <div
                              onClick={() => onNavigateToEditPost && onNavigateToEditPost(post.id)}
                              style={{
                                fontWeight: 600,
                                color: '#0f172a',
                                fontSize: '13.5px',
                                cursor: 'pointer',
                                lineHeight: 1.35,
                              }}
                            >
                              {post.title}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '11.5px', marginTop: '2px', fontFamily: 'monospace' }}>
                              /{post.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            background: catStyle.background,
                            color: catStyle.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {catName}
                        </span>
                      </td>

                      {/* Author */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: '#f1f5f9',
                              color: '#475569',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {authorInitials}
                          </div>
                          <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 400 }}>{authorName}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: 500,
                            background: statusStyle.background,
                            color: statusStyle.color,
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {post.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 500 }}>{dateInfo.line1}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{dateInfo.line2}</div>
                      </td>

                      {/* Actions: Edit, Duplicate, Trash */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {currentTab === 'trash' || post.status === 'trashed' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRestore(post.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  color: '#16a34a',
                                  fontSize: '11.5px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                Restore
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenPermanentDeleteModal(post.id, post.title)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: '#fef2f2',
                                  border: '1px solid #fee2e2',
                                  color: '#ef4444',
                                  fontSize: '11.5px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Edit Button */}
                              {onNavigateToEditPost && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToEditPost(post.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    background: '#fffdf0',
                                    border: '1px solid #fef08a',
                                    color: '#ca8a04',
                                    fontSize: '11.5px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.1s ease',
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                  </svg>
                                  <span>Edit</span>
                                </button>
                              )}

                              {/* Duplicate Button */}
                              <button
                                type="button"
                                onClick={() => handleDuplicate(post.id)}
                                title="Duplicate as Draft"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  color: '#475569',
                                  fontSize: '11.5px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.1s ease',
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span>Duplicate</span>
                              </button>

                              {/* Trash Button: Triggers custom popup modal, no browser alert */}
                              <button
                                type="button"
                                onClick={() => handleOpenTrashModal(post.id, post.title)}
                                title="Move to Trash"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  background: '#fff1f2',
                                  border: '1px solid #ffe4e6',
                                  color: '#e11d48',
                                  fontSize: '11.5px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.1s ease',
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                                <span>Trash</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination & Footer (Real dynamic pages right after Show Per Page) */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #f1f5f9',
            fontSize: '12.5px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Left Count */}
          <div style={{ color: '#64748b' }}>
            Showing {totalCount > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, totalCount)} of {totalCount} posts
          </div>

          {/* Right Section: Show Per Page Selector, followed by Pagination Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Show per page selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
              <span>Show</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value);
                    setItemsPerPage(newLimit);
                    setPage(1);
                  }}
                  style={{
                    padding: '5px 26px 5px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    fontSize: '12.5px',
                    color: '#475569',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <span>per page</span>
            </div>

            {/* Dynamic Page Buttons: only real pages */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Prev */}
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: page <= 1 ? '#cbd5e1' : '#64748b',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                ‹
              </button>

              {renderPageButtons().map((pItem, idx) => {
                if (pItem === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} style={{ color: '#94a3b8', padding: '0 4px', fontSize: '12px' }}>
                      ...
                    </span>
                  );
                }
                const pNum = pItem as number;
                const isCurrent = page === pNum;
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: isCurrent ? 'none' : '1px solid #e2e8f0',
                      background: isCurrent ? '#ffcc00' : '#ffffff',
                      color: isCurrent ? '#0f172a' : '#64748b',
                      fontWeight: isCurrent ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      boxShadow: isCurrent ? '0 1px 4px rgba(255, 204, 0, 0.4)' : 'none',
                    }}
                  >
                    {pNum}
                  </button>
                );
              })}

              {/* Next */}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: page >= totalPages ? '#cbd5e1' : '#64748b',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Custom Confirmation Popup Modal (No browser alerts) */}
      {confirmModal && confirmModal.isOpen && (
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
              maxWidth: '440px',
              width: '100%',
              padding: '26px 24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Red Trash Icon Circle */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: 600, color: '#0f172a' }}>
              {confirmModal.isPermanent ? 'Permanently Delete Post?' : 'Move to Trash?'}
            </h3>
            <p style={{ margin: '0 0 22px 0', fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
              {confirmModal.isPermanent ? (
                <>
                  Are you sure you want to permanently delete <strong>"{confirmModal.postTitle}"</strong>? This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to move <strong>"{confirmModal.postTitle}"</strong> to trash? You can restore it anytime from the Trash tab.
                </>
              )}
            </p>

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                }}
              >
                {confirmModal.isPermanent ? 'Delete Permanently' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
