import { useState } from 'react';
import { Post } from '@zwantum/blog-types';
import { useBlogPosts, BlogContent, ShareButtons, CommentSection } from '@zwantum/blog-react';

export const MinimalNewsDesign: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { posts, loading } = useBlogPosts({
    search: searchTerm || undefined,
  });

  return (
    <div style={{ background: '#ffffff', color: '#0f172a', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Sleek Minimal Header */}
      <header style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 0', background: '#fff' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', background: '#0f172a', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px' }}>
              Z
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>TechNews Dispatch</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                width: '180px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 20px' }}>
        {selectedPost ? (
          /* Minimal News Article View */
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
                padding: 0,
              }}
            >
              ← All Dispatches
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, color: '#334155' }}>
                {selectedPost.categories?.[0]?.name || 'News'}
              </span>
              <span>•</span>
              <span>{selectedPost.published_at ? new Date(selectedPost.published_at).toLocaleDateString() : ''}</span>
              <span>•</span>
              <span>{selectedPost.reading_time} min read</span>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.25, margin: '0 0 16px' }}>
              {selectedPost.title}
            </h1>

            {selectedPost.featured_image?.url && (
              <img
                src={selectedPost.featured_image.url}
                alt={selectedPost.title}
                style={{ width: '100%', borderRadius: '8px', marginBottom: '24px' }}
              />
            )}

            <div style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#334155' }}>
              <BlogContent content={selectedPost.content} />
            </div>

            <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <ShareButtons title={selectedPost.title} />
            </div>

            {/* Reader Comments & Discussion Section */}
            <CommentSection postId={selectedPost.id} />
          </div>
        ) : (
          /* Minimalist Chronological Feed */
          <div>
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Latest Dispatches
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{posts.length} stories</span>
            </div>

            {loading ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>Loading timeline...</p>
            ) : posts.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>No dispatches match your query.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {posts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: post.featured_image?.url ? '1fr 180px' : '1fr',
                      gap: '24px',
                      paddingBottom: '20px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: '#2563eb' }}>
                          {post.categories?.[0]?.name || 'General'}
                        </span>
                        <span>•</span>
                        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}</span>
                      </div>

                      <h3
                        style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}
                        dangerouslySetInnerHTML={{ __html: post.title }}
                      />

                      <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                        {post.excerpt}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>
                        <span>By {post.author?.name || 'Staff'}</span>
                        <span>•</span>
                        <span>{post.reading_time} min</span>
                      </div>
                    </div>

                    {post.featured_image?.url && (
                      <div style={{ borderRadius: '6px', overflow: 'hidden', height: '110px' }}>
                        <img
                          src={post.featured_image.url}
                          alt={post.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Copyright */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          marginTop: '48px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#64748b',
          fontFamily: "'Inter', sans-serif",
          maxWidth: '1100px',
          margin: '48px auto 0',
        }}
      >
        <span>© {new Date().getFullYear()} Zwantum. All rights reserved.</span>
        <span>
          Powered by <strong style={{ color: '#0f172a' }}>Zwantum</strong>
        </span>
      </footer>
    </div>
  );
};
