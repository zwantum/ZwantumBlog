import React, { useState, useEffect, useCallback } from 'react';
import { Comment, BlogSettings } from '@zwantum/blog-types';
import { useBlog } from '../../context/BlogProvider';

export interface CommentSectionProps {
  postId: string;
  className?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, className = '' }) => {
  const blog = useBlog();
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToName, setReplyToName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Check blog settings to see if comments are enabled
  useEffect(() => {
    blog.settings
      .get()
      .then(setSettings)
      .catch(() => {});
  }, [blog]);

  // 2. Fetch approved comments for this post
  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await blog.comments.list({ postId });
      // Only display approved comments on the public blog post
      const approved = (res.data || []).filter((c) => c.status === 'approved' && c.post_id === postId);
      setComments(approved);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [blog, postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // If comments are explicitly disabled in settings, do not render the section
  if (settings && settings.enableComments === false) {
    return null;
  }

  // Separate top-level comments and nested replies
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesMap = new Map<string, Comment[]>();
  comments.forEach((c) => {
    if (c.parent_id) {
      const list = repliesMap.get(c.parent_id) || [];
      list.push(c);
      repliesMap.set(c.parent_id, list);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !authorEmail.trim() || !content.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await blog.comments.create({
        post_id: postId,
        parent_id: replyToId,
        author_name: authorName.trim(),
        author_email: authorEmail.trim(),
        content: content.trim(),
      });

      setContent('');
      setReplyToId(null);
      setReplyToName('');
      setSuccessMessage('Thank you! Your comment has been submitted and is awaiting moderation.');
      setTimeout(() => setSuccessMessage(null), 6000);
      await fetchComments();
    } catch (err) {
      setErrorMessage(`Failed to submit comment: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={`zw-comment-section ${className}`}
      style={{
        marginTop: '48px',
        paddingTop: '36px',
        borderTop: '2px solid #e2e8f0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
          Discussion & Comments ({comments.length})
        </h3>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Respectful discourse is encouraged
        </span>
      </div>

      {/* Submission Form */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          marginBottom: '36px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
            {replyToId ? `Replying to ${replyToName}` : 'Leave a Comment'}
          </h4>
          {replyToId && (
            <button
              type="button"
              onClick={() => {
                setReplyToId(null);
                setReplyToName('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#dc2626',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ✕ Cancel Reply
            </button>
          )}
        </div>

        {successMessage && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            ✅ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Your Name *
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Email Address * (not published)
              </label>
              <input
                type="email"
                required
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="alex@example.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Comment *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What are your thoughts on this article?"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                lineHeight: 1.5,
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {submitting ? 'Submitting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
          Loading discussion...
        </div>
      ) : topLevel.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 16px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            color: '#64748b',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>No comments yet</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Be the first to share your thoughts on this story!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {topLevel.map((c) => {
            const replies = repliesMap.get(c.id) || [];

            return (
              <div
                key={c.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: '#e2e8f0',
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px',
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
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReplyToId(c.id);
                      setReplyToName(c.author_name);
                      window.scrollTo({ behavior: 'smooth', top: 300 });
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Reply
                  </button>
                </div>

                {/* Comment Content */}
                <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#334155' }}>
                  {c.content}
                </div>

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div
                    style={{
                      marginTop: '16px',
                      paddingLeft: '16px',
                      borderLeft: '2px solid #ffcc00',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {replies.map((r) => (
                      <div key={r.id} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '12.5px', color: '#0f172a' }}>{r.author_name}</span>
                          <span
                            style={{
                              background: '#ffcc00',
                              color: '#0f172a',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Staff Reply
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
                            {new Date(r.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#475569' }}>
                          {r.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
