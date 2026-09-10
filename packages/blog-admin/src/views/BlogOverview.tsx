import React, { useEffect, useState } from 'react';
import { Post, Comment } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface BlogOverviewProps {
  client: BlogClient;
  onNavigateToPosts?: () => void;
  onNavigateToNewPost?: () => void;
  onNavigateToEditPost?: (id: string) => void;
  className?: string;
}

export const BlogOverview: React.FC<BlogOverviewProps> = ({
  client,
  onNavigateToPosts,
  onNavigateToNewPost,
  onNavigateToEditPost,
  className = '',
}) => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    scheduledPosts: 0,
    trashedPosts: 0,
    totalCategories: 0,
    totalTags: 0,
    totalAuthors: 0,
    totalComments: 0,
    totalMedia: 0,
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      client.getOverviewStats(),
      client.posts.list({ limit: 5, sortBy: 'updated_at', sortOrder: 'desc' }),
      client.comments.list({ limit: 5 }),
      client.media.list({ limit: 1 }),
    ])
      .then(([s, postsRes, commentsRes, mediaRes]) => {
        if (isMounted) {
          setStats({
            ...s,
            totalComments: commentsRes.total,
            totalMedia: mediaRes.total,
          });
          setRecentPosts(postsRes.data);
          setRecentComments(commentsRes.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load blog overview stats:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [client]);

  // Current formatted date string
  const todayDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recently';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  return (
    <div className={`zw-admin-container ${className}`} style={{ width: '100%', margin: 0 }}>
      {/* 1. Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Blog Overview
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 400 }}>
            Here's what's happening with your blog today.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '7px 14px', borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: 400 }}>
            {todayDate}
          </div>
          {onNavigateToNewPost && (
            <button
              type="button"
              onClick={onNavigateToNewPost}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#ffcc00',
                color: '#0f172a',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255, 204, 0, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Post</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Primary Stat Cards (Row 1: 4 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {/* Total Posts */}
        <div style={statCardStyle}>
          <div style={{ ...iconBadgeStyle, background: '#fef9c3', color: '#ca8a04' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>Total Posts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: '#0f172a', margin: '2px 0 3px' }}>
              {stats.totalPosts}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
              <span style={{ color: stats.publishedPosts > 0 ? '#16a34a' : '#64748b', fontWeight: 500 }}>{stats.publishedPosts} published</span> • {stats.draftPosts} drafts
            </div>
          </div>
        </div>

        {/* Published */}
        <div style={statCardStyle}>
          <div style={{ ...iconBadgeStyle, background: '#dcfce7', color: '#16a34a' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>Published</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: '#0f172a', margin: '2px 0 3px' }}>
              {stats.publishedPosts}
            </div>
            <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500 }}>
              ✓ Live <span style={{ color: '#94a3b8', fontWeight: 400 }}>on website</span>
            </div>
          </div>
        </div>

        {/* Drafts */}
        <div style={statCardStyle}>
          <div style={{ ...iconBadgeStyle, background: '#fef3c7', color: '#d97706' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>Drafts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: '#0f172a', margin: '2px 0 3px' }}>
              {stats.draftPosts}
            </div>
            <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 500 }}>
              Unpublished <span style={{ color: '#94a3b8', fontWeight: 400 }}>in progress</span>
            </div>
          </div>
        </div>

        {/* Scheduled */}
        <div style={statCardStyle}>
          <div style={{ ...iconBadgeStyle, background: '#f3e8ff', color: '#9333ea' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>Scheduled</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: '#0f172a', margin: '2px 0 3px' }}>
              {stats.scheduledPosts}
            </div>
            <div style={{ fontSize: '12px', color: '#9333ea', fontWeight: 500 }}>
              Queued <span style={{ color: '#94a3b8', fontWeight: 400 }}>for future release</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Secondary Compact Stat Cards (Row 2: 5 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {/* Categories */}
        <div style={compactCardStyle}>
          <div style={{ ...compactBadgeStyle, background: '#fef9c3', color: '#ca8a04' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>Categories</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#0f172a' }}>{stats.totalCategories}</div>
          </div>
        </div>

        {/* Tags */}
        <div style={compactCardStyle}>
          <div style={{ ...compactBadgeStyle, background: '#ffedd5', color: '#ea580c' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
              <circle cx="7" cy="7" r="1.5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>Tags</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#0f172a' }}>{stats.totalTags}</div>
          </div>
        </div>

        {/* Authors */}
        <div style={compactCardStyle}>
          <div style={{ ...compactBadgeStyle, background: '#f3e8ff', color: '#9333ea' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>Authors</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#0f172a' }}>{stats.totalAuthors}</div>
          </div>
        </div>

        {/* Comments */}
        <div style={compactCardStyle}>
          <div style={{ ...compactBadgeStyle, background: '#e0e7ff', color: '#4f46e5' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>Comments</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#0f172a' }}>{stats.totalComments}</div>
          </div>
        </div>

        {/* Media Files */}
        <div style={compactCardStyle}>
          <div style={{ ...compactBadgeStyle, background: '#e0f2fe', color: '#0284c7' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>Media Files</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#0f172a' }}>{stats.totalMedia}</div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section (Recent Posts Table + Recent Comments Feed) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)', gap: '20px' }}>
        {/* Recent Posts Table Card */}
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Recent Posts</h3>
            {onNavigateToPosts && (
              <button
                type="button"
                onClick={onNavigateToPosts}
                style={{ background: 'none', border: 'none', color: '#ca8a04', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>View All</span>
                <span>→</span>
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>#</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>Title</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>Author</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>Published Date</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500 }}>Read Time</th>
                  <th style={{ padding: '8px 10px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                      <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>No articles published yet</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Create your first post using the "+ New Post" button above.</p>
                    </td>
                  </tr>
                ) : (
                  recentPosts.map((post: Post, idx: number) => {
                    const numStr = String(idx + 1).padStart(2, '0');
                    const isPublished = post.status === 'published';
                    const isDraft = post.status === 'draft';
                    const thumb = post.featured_image?.url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=80&auto=format&fit=crop&q=80';

                    return (
                      <tr key={post.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '12px' }}>{numStr}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={thumb} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
                            <span style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {post.title}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', color: '#475569', fontSize: '12px' }}>
                          {post.author?.name || 'Staff'}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 500,
                              background: isPublished ? '#dcfce7' : isDraft ? '#fef3c7' : '#f3e8ff',
                              color: isPublished ? '#15803d' : isDraft ? '#b45309' : '#9333ea',
                              textTransform: 'capitalize',
                            }}
                          >
                            {post.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '12px' }}>
                          {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '12px' }}>
                          {post.reading_time ? `${post.reading_time} min read` : `${post.word_count || 0} words`}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          {onNavigateToEditPost ? (
                            <button
                              type="button"
                              onClick={() => onNavigateToEditPost(post.id)}
                              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
                              title="Edit post"
                            >
                              •••
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>•••</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Comments Feed Card */}
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Recent Comments</h3>
            <span style={{ color: '#ca8a04', fontSize: '13px', fontWeight: 500 }}>{stats.totalComments} Total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentComments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>No comments yet</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>When readers submit comments on your published articles, they will appear here.</p>
              </div>
            ) : (
              recentComments.map((comm) => {
                const isApproved = comm.status === 'approved';
                const isPending = comm.status === 'pending';
                const initials = comm.author_name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div key={comm.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f8fafc' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '11px',
                        flexShrink: 0,
                      }}
                    >
                      {initials || '💬'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12.5px', color: '#0f172a' }}>{comm.author_name}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>{formatRelativeTime(comm.created_at)}</span>
                      </div>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {comm.content}
                      </p>
                    </div>
                    {/* Status pill with dot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: isApproved ? '#16a34a' : isPending ? '#eab308' : '#ef4444',
                        }}
                      />
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 500,
                          background: isApproved ? '#dcfce7' : isPending ? '#fef9c3' : '#fee2e2',
                          color: isApproved ? '#15803d' : isPending ? '#854d0e' : '#b91c1c',
                          textTransform: 'capitalize',
                        }}
                      >
                        {comm.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Common modern card styles matching the reference image
const statCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #f1f5f9',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
};

const iconBadgeStyle: React.CSSProperties = {
  width: '52px',
  height: '52px',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const compactCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #f1f5f9',
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
};

const compactBadgeStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const chartCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #f1f5f9',
  padding: '22px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
};
