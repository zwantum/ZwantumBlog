import { useState } from 'react';
import { Post } from '@zwantum/blog-types';
import { useBlogPosts, useCategories, useFeaturedPosts, BlogContent, ShareButtons, CommentSection } from '@zwantum/blog-react';

export const EditorialDesign: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { posts, loading } = useBlogPosts({
    categorySlug: activeCategory || undefined,
  });
  const { categories } = useCategories();
  const { posts: featuredPosts } = useFeaturedPosts(1);
  const heroPost = featuredPosts[0];

  return (
    <div style={{ background: '#faf9f6', color: '#1c1917', minHeight: '100vh', fontFamily: "'Merriweather', serif" }}>
      {/* Website Header */}
      <header style={{ borderBottom: '1px solid #e7e5e4', padding: '24px 0', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#78350f', fontWeight: 700 }}>
              SANCTUARY & ARCHITECTURE
            </span>
            <h1 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontFamily: "'Cinzel', serif", fontWeight: 700 }}>
              The Vastu Chronicle
            </h1>
          </div>
          <nav style={{ display: 'flex', gap: '20px', fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
            <span style={{ cursor: 'pointer', color: '#78350f', fontWeight: 600 }}>Journal</span>
            <span style={{ cursor: 'pointer', color: '#78716c' }}>Consultations</span>
            <span style={{ cursor: 'pointer', color: '#78716c' }}>Philosophy</span>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {selectedPost ? (
          /* Article Detail View */
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#78350f',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                marginBottom: '24px',
              }}
            >
              ← Back to Journal
            </button>

            {selectedPost.categories?.[0] && (
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#78350f', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                {selectedPost.categories[0].name}
              </span>
            )}

            <h1 style={{ fontSize: '2.5rem', lineHeight: 1.25, margin: '12px 0 16px', color: '#1c1917' }}>
              {selectedPost.title}
            </h1>

            {selectedPost.excerpt && (
              <p style={{ fontSize: '1.25rem', lineHeight: 1.6, color: '#57534e', fontStyle: 'italic', marginBottom: '24px' }}>
                {selectedPost.excerpt}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid #e7e5e4', borderBottom: '1px solid #e7e5e4', marginBottom: '32px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#78716c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {selectedPost.author?.profile_image_url && (
                  <img
                    src={selectedPost.author.profile_image_url}
                    alt={selectedPost.author.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 600, color: '#1c1917' }}>{selectedPost.author?.name || 'Sanctuary Editorial'}</div>
                  <div>{selectedPost.author?.designation || 'Consultant'}</div>
                </div>
              </div>
              <div>
                <span>{selectedPost.published_at ? new Date(selectedPost.published_at).toLocaleDateString() : ''}</span> •{' '}
                <span>{selectedPost.reading_time} min read</span>
              </div>
            </div>

            {selectedPost.featured_image?.url && (
              <img
                src={selectedPost.featured_image.url}
                alt={selectedPost.featured_image.alt_text || selectedPost.title}
                style={{ width: '100%', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
              />
            )}

            {/* Render Tiptap Structured JSON Content */}
            <div style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#292524' }}>
              <BlogContent content={selectedPost.content} />
            </div>

            <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e7e5e4', fontFamily: "'Inter', sans-serif" }}>
              <ShareButtons title={selectedPost.title} />
            </div>

            {/* Reader Comments & Discussion Section */}
            <CommentSection postId={selectedPost.id} />
          </div>
        ) : (
          /* Editorial Listing View */
          <div>
            {/* Featured Hero Article */}
            {heroPost && (
              <div
                onClick={() => setSelectedPost(heroPost)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '32px',
                  background: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  marginBottom: '48px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                }}
              >
                {heroPost.featured_image?.url && (
                  <div style={{ height: '360px', overflow: 'hidden' }}>
                    <img
                      src={heroPost.featured_image.url}
                      alt={heroPost.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#78350f', fontWeight: 700, fontFamily: "'Inter', sans-serif", marginBottom: '8px' }}>
                    FEATURED ESSAY
                  </span>
                  <h2 style={{ fontSize: '2rem', margin: '0 0 16px', lineHeight: 1.3 }}>{heroPost.title}</h2>
                  <p style={{ color: '#57534e', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 24px' }}>{heroPost.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#78716c', fontFamily: "'Inter', sans-serif" }}>
                    <span>By {heroPost.author?.name || 'Staff'}</span> • <span>{heroPost.reading_time} min read</span>
                  </div>
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid #e7e5e4', paddingBottom: '16px', fontFamily: "'Inter', sans-serif", overflowX: 'auto' }}>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: activeCategory === null ? 700 : 400,
                  color: activeCategory === null ? '#78350f' : '#78716c',
                  borderBottom: activeCategory === null ? '2px solid #78350f' : 'none',
                  paddingBottom: '6px',
                  cursor: 'pointer',
                }}
              >
                All Themes
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.slug)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: activeCategory === c.slug ? 700 : 400,
                    color: activeCategory === c.slug ? '#78350f' : '#78716c',
                    borderBottom: activeCategory === c.slug ? '2px solid #78350f' : 'none',
                    paddingBottom: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* 3-Column Editorial Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
              {loading ? (
                <p style={{ fontFamily: "'Inter', sans-serif", color: '#78716c' }}>Loading articles...</p>
              ) : (
                posts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {post.featured_image?.url && (
                      <div style={{ aspectRatio: '16/10', overflow: 'hidden', borderRadius: '12px', marginBottom: '16px' }}>
                        <img
                          src={post.featured_image.url}
                          alt={post.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#78350f', fontWeight: 700, fontFamily: "'Inter', sans-serif", marginBottom: '6px' }}>
                      {post.categories?.[0]?.name || 'Architecture'}
                    </span>
                    <h3
                      style={{ fontSize: '1.35rem', lineHeight: 1.35, margin: '0 0 10px', color: '#1c1917' }}
                      dangerouslySetInnerHTML={{ __html: post.title }}
                    />
                    <p style={{ color: '#57534e', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 14px' }}>
                      {post.excerpt}
                    </p>
                    <div style={{ marginTop: 'auto', fontSize: '12px', color: '#78716c', fontFamily: "'Inter', sans-serif" }}>
                      <span>{post.author?.name}</span> • <span>{post.reading_time} min read</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Copyright */}
      <footer
        style={{
          borderTop: '1px solid #e7e5e4',
          marginTop: '60px',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#78716c',
          fontFamily: "'Inter', sans-serif",
          maxWidth: '1200px',
          margin: '60px auto 0',
        }}
      >
        <span>© {new Date().getFullYear()} Zwantum. All rights reserved.</span>
        <span>
          Powered by <strong style={{ color: '#1c1917' }}>Zwantum</strong>
        </span>
      </footer>
    </div>
  );
};
