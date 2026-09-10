import React, { useState, useEffect, useCallback } from 'react';
import { Comment, Post } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface CommentManagerProps {
  client: BlogClient;
  className?: string;
}

export const CommentManager: React.FC<CommentManagerProps> = ({ client, className = '' }) => {
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [postsMap, setPostsMap] = useState<Map<string, Post>>(new Map());

  // Reply State
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyAuthorName, setReplyAuthorName] = useState('Staff Editorial');
  const [replyAuthorEmail, setReplyAuthorEmail] = useState('editorial@example.com');
  const [replyContent, setReplyContent] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Delete Confirmation State
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Load Posts reference map for post titles
  useEffect(() => {
    client.posts
      .list({ limit: 100 })
      .then((res) => {
        const map = new Map<string, Post>();
        res.data.forEach((p) => map.set(p.id, p));
        setPostsMap(map);
      })
      .catch(() => {});
  }, [client]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.comments.list();
      setAllComments(res.data);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Tab Filtering
  const filteredComments = allComments.filter((c) => {
    if (currentTab === 'all') return true;
    return c.status === currentTab;
  });

  // Top-level comments and child replies mapping
  const topLevelComments = filteredComments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, Comment[]>();
  allComments.forEach((c) => {
    if (c.parent_id) {
      const list = repliesByParent.get(c.parent_id) || [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    }
  });

  // Counts for each tab
  const counts = {
    all: allComments.length,
    pending: allComments.filter((c) => c.status === 'pending').length,
    approved: allComments.filter((c) => c.status === 'approved').length,
    spam: allComments.filter((c) => c.status === 'spam').length,
    trash: allComments.filter((c) => c.status === 'trash').length,
  };

  const handleApprove = async (id: string) => {
    await client.comments.approve(id);
    await fetchComments();
  };

  const handleSpam = async (id: string) => {
    await client.comments.markSpam(id);
    await fetchComments();
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;
    await client.comments.delete(commentToDelete);
    setCommentToDelete(null);
    await fetchComments();
  };

  const handleOpenReply = (comment: Comment) => {
    setReplyingToId(comment.id);
    setReplyContent('');
    setReplyError(null);
  };

  const handleSubmitReply = async (parentComment: Comment) => {
    if (!replyContent.trim()) {
      setReplyError('Please enter your reply text before submitting.');
      return;
    }

    setReplyError(null);
    setSubmittingReply(true);
    try {
      const reply = await client.comments.create({
        post_id: parentComment.post_id,
        parent_id: parentComment.id,
        author_name: replyAuthorName.trim() || 'Staff Editorial',
        author_email: replyAuthorEmail.trim() || 'editorial@example.com',
        content: replyContent.trim(),
      });

      // Auto-approve admin reply
      await client.comments.approve(reply.id);

      // Also ensure the parent comment is approved if it was pending
      if (parentComment.status === 'pending') {
        await client.comments.approve(parentComment.id);
      }

      setReplyingToId(null);
      setReplyContent('');
      setReplyError(null);
      await fetchComments();
    } catch (err) {
      setReplyError(`Failed to post reply: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className={`zw-admin-container ${className}`}>
      {/* Header */}
      <div className="zw-admin-header">
        <div>
          <h2 className="zw-admin-title">Comments & Reader Feedback</h2>
          <p className="zw-admin-subtitle">Moderate discussions, reply to readers, and foster engagement.</p>
        </div>
      </div>

      {/* Tabs with live count badges */}
      <div className="zw-admin-tabs">
        {(['all', 'pending', 'approved', 'spam', 'trash'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`zw-admin-tab-btn ${currentTab === tab ? 'is-active' : ''}`}
            onClick={() => setCurrentTab(tab)}
          >
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            <span
              style={{
                marginLeft: '6px',
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: currentTab === tab ? '#0f172a' : '#f1f5f9',
                color: currentTab === tab ? '#ffcc00' : '#64748b',
                fontWeight: 600,
              }}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Main Comments Card */}
      <div className="zw-admin-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="zw-admin-card-body" style={{ padding: 0 }}>
          <div className="zw-admin-table-wrap">
            <table className="zw-admin-table">
              <thead>
                <tr>
                  <th style={{ width: '220px' }}>Author</th>
                  <th>Comment & Discussion</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ width: '120px' }}>Date</th>
                  <th style={{ textAlign: 'right', width: '240px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Loading comments...
                    </td>
                  </tr>
                ) : topLevelComments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>No comments found</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        {currentTab === 'all'
                          ? 'No reader feedback has been posted yet.'
                          : `No comments with status "${currentTab}".`}
                      </div>
                    </td>
                  </tr>
                ) : (
                  topLevelComments.map((c) => {
                    const postTitle = postsMap.get(c.post_id)?.title;
                    const replies = repliesByParent.get(c.id) || [];
                    const isReplying = replyingToId === c.id;

                    return (
                      <React.Fragment key={c.id}>
                        {/* Main Comment Row */}
                        <tr style={{ background: isReplying ? '#fffdf5' : 'transparent', transition: 'background 0.15s ease' }}>
                          <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: '#f1f5f9',
                                  color: '#0f172a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  flexShrink: 0,
                                }}
                              >
                                {c.author_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase() || '💬'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{c.author_name}</div>
                                <div style={{ fontSize: '11.5px', color: '#64748b' }}>{c.author_email}</div>
                              </div>
                            </div>
                          </td>

                          <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                            <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#1e293b' }}>{c.content}</div>
                            {postTitle && (
                              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>On article:</span>
                                <strong style={{ color: '#475569', fontWeight: 600 }}>{postTitle}</strong>
                              </div>
                            )}
                          </td>

                          <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                            <span className={`zw-admin-badge zw-admin-badge-${c.status}`}>{c.status}</span>
                          </td>

                          <td style={{ verticalAlign: 'top', paddingTop: '16px', fontSize: '12px', color: '#64748b' }}>
                            {new Date(c.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          <td style={{ verticalAlign: 'top', paddingTop: '16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {/* Reply Button */}
                              <button
                                type="button"
                                className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                                onClick={() => (isReplying ? setReplyingToId(null) : handleOpenReply(c))}
                                style={{
                                  background: isReplying ? '#ffcc00' : '#ffffff',
                                  color: '#0f172a',
                                  borderColor: isReplying ? '#eab308' : '#cbd5e1',
                                  fontWeight: 600,
                                }}
                                title="Reply to this reader comment"
                              >
                                💬 {isReplying ? 'Close' : 'Reply'}
                              </button>

                              {c.status !== 'approved' && (
                                <button
                                  type="button"
                                  className="zw-admin-btn zw-admin-btn-primary zw-admin-btn-sm"
                                  onClick={() => handleApprove(c.id)}
                                  title="Approve comment for public display"
                                >
                                  Approve
                                </button>
                              )}

                              {c.status !== 'spam' && (
                                <button
                                  type="button"
                                  className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                                  onClick={() => handleSpam(c.id)}
                                  title="Flag as spam"
                                >
                                  Spam
                                </button>
                              )}

                              <button
                                type="button"
                                className="zw-admin-btn zw-admin-btn-danger zw-admin-btn-sm"
                                onClick={() => setCommentToDelete(c.id)}
                                title="Delete comment"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Reply Composer Box */}
                        {isReplying && (
                          <tr>
                            <td colSpan={5} style={{ background: '#fffdf5', padding: '16px 24px', borderBottom: '1px solid #fef08a' }}>
                              <div
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #fef08a',
                                  borderRadius: '12px',
                                  padding: '16px 20px',
                                  boxShadow: '0 2px 10px rgba(255, 204, 0, 0.1)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '15px' }}>💬</span>
                                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                                      Replying to {c.author_name}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                                    Your response will be posted as an approved public reply
                                  </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                      Responding As (Name)
                                    </label>
                                    <input
                                      type="text"
                                      className="zw-admin-input"
                                      value={replyAuthorName}
                                      onChange={(e) => setReplyAuthorName(e.target.value)}
                                      placeholder="Staff Editorial / Author Name"
                                      style={{ width: '100%', fontSize: '12.5px', padding: '6px 10px' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                      Email Address
                                    </label>
                                    <input
                                      type="email"
                                      className="zw-admin-input"
                                      value={replyAuthorEmail}
                                      onChange={(e) => setReplyAuthorEmail(e.target.value)}
                                      placeholder="editorial@example.com"
                                      style={{ width: '100%', fontSize: '12.5px', padding: '6px 10px' }}
                                    />
                                  </div>
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Reply Content
                                  </label>
                                  <textarea
                                    rows={3}
                                    className="zw-admin-textarea"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Write your thoughtful reply to ${c.author_name}...`}
                                    style={{ width: '100%', fontSize: '13px', lineHeight: 1.5 }}
                                    autoFocus
                                  />
                                </div>

                                {replyError && (
                                  <div
                                    style={{
                                      background: '#fef2f2',
                                      border: '1px solid #fecaca',
                                      borderRadius: '8px',
                                      padding: '8px 12px',
                                      fontSize: '12px',
                                      color: '#b91c1c',
                                      marginBottom: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}
                                  >
                                    <span>⚠️</span>
                                    <span>{replyError}</span>
                                  </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                                    onClick={() => setReplyingToId(null)}
                                    disabled={submittingReply}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="zw-admin-btn zw-admin-btn-primary zw-admin-btn-sm"
                                    onClick={() => handleSubmitReply(c)}
                                    disabled={submittingReply || !replyContent.trim()}
                                  >
                                    {submittingReply ? 'Posting Reply...' : 'Post Public Reply'}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Existing Nested Replies */}
                        {replies.map((r) => (
                          <tr key={r.id} style={{ background: '#fafafa', borderTop: 'none' }}>
                            <td style={{ verticalAlign: 'top', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '42px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#ca8a04', fontSize: '16px', fontWeight: 700 }}>↳</span>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{r.author_name}</span>
                                    <span
                                      style={{
                                        fontSize: '10.5px',
                                        background: '#ffcc00',
                                        color: '#0f172a',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontWeight: 700,
                                      }}
                                    >
                                      Staff Reply
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>{r.author_email}</div>
                                </div>
                              </div>
                            </td>

                            <td style={{ verticalAlign: 'top', paddingTop: '12px', paddingBottom: '12px' }}>
                              <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#334155' }}>{r.content}</div>
                            </td>

                            <td style={{ verticalAlign: 'top', paddingTop: '12px', paddingBottom: '12px' }}>
                              <span className={`zw-admin-badge zw-admin-badge-${r.status}`}>{r.status}</span>
                            </td>

                            <td style={{ verticalAlign: 'top', paddingTop: '12px', paddingBottom: '12px', fontSize: '11.5px', color: '#64748b' }}>
                              {new Date(r.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>

                            <td style={{ verticalAlign: 'top', paddingTop: '12px', paddingBottom: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                type="button"
                                className="zw-admin-btn zw-admin-btn-danger zw-admin-btn-sm"
                                onClick={() => setCommentToDelete(r.id)}
                                title="Delete this reply"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup Modal */}
      {commentToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                ⚠️
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Delete Comment?
              </h3>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to delete this comment? This action will permanently remove it from the discussion.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-secondary"
                onClick={() => setCommentToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-danger"
                onClick={confirmDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
