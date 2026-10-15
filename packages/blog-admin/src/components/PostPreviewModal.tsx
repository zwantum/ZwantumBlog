import React, { useState, useEffect, useMemo } from 'react';
import { Author, Category, Tag, Media, PostStatus } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';
import { BlogContent, ShareButtons, CommentSection, BlogProvider } from '@zwantum/blog-react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export interface CitationItem {
  number: number;
  text: string;
  url: string;
  rel: string;
}

export interface PostPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  excerpt?: string;
  status: PostStatus;
  author?: Author | null;
  readingTime?: number;
  wordCount?: number;
  featuredMedia?: Media | null;
  featuredImageCaption?: string;
  contentJson?: Record<string, unknown>;
  contentHtml?: string;
  categories?: Category[];
  tags?: Tag[];
  publishedAt?: string | null;
  postId?: string;
  client?: BlogClient;
}

export const PostPreviewModal: React.FC<PostPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  excerpt,
  status,
  author,
  readingTime = 1,
  featuredMedia,
  featuredImageCaption,
  contentJson,
  contentHtml,
  categories = [],
  tags = [],
  publishedAt,
  postId,
  client,
}) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');

  // Keyboard shortcut: Escape to close preview
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract bibliography citations from contentJson or contentHtml
  const extractedCitations = useMemo(() => {
    const list: CitationItem[] = [];
    let count = 0;

    if (contentJson && typeof contentJson === 'object') {
      const walk = (node: any) => {
        if (!node) return;
        if (node.marks && Array.isArray(node.marks)) {
          const citMark = node.marks.find(
            (m: any) => m.type === 'blogCitation' || m.type === 'citation'
          );
          if (citMark && citMark.attrs?.href) {
            count++;
            list.push({
              number: count,
              text: node.text || citMark.attrs.href,
              url: citMark.attrs.href,
              rel: citMark.attrs.rel || 'nofollow',
            });
          }
        }
        if (node.content && Array.isArray(node.content)) {
          node.content.forEach(walk);
        }
      };
      walk(contentJson);
    }

    if (list.length === 0 && contentHtml) {
      const regex = /<a[^>]*data-citation="true"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(contentHtml)) !== null) {
        count++;
        const relMatch = match[0].match(/rel="([^"]*)"/i);
        list.push({
          number: count,
          text: match[2].replace(/<[^>]+>/g, '').trim() || match[1],
          url: match[1],
          rel: relMatch ? relMatch[1] : 'nofollow',
        });
      }
    }

    return list;
  }, [contentJson, contentHtml]);

  if (!isOpen) return null;

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : status === 'published'
    ? 'Published'
    : 'Draft Preview (Unpublished)';

  // The authentic blog page layout (matching live blog design)
  const blogPageContent = (
    <div
      style={{
        background: '#faf9f6',
        color: '#1c1917',
        minHeight: '100%',
        fontFamily: "'Merriweather', Georgia, serif",
      }}
    >
      {/* Blog Site Header */}
      <header
        style={{
          borderBottom: '1px solid #e7e5e4',
          padding: '24px 0',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#78350f',
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              SANCTUARY & ARCHITECTURE
            </span>
            <h1
              style={{
                margin: '4px 0 0 0',
                fontSize: '2rem',
                fontFamily: "'Cinzel', 'Merriweather', serif",
                fontWeight: 700,
                color: '#1c1917',
              }}
            >
              The Vastu Chronicle
            </h1>
          </div>
          <nav
            style={{
              display: 'flex',
              gap: '20px',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span style={{ cursor: 'pointer', color: '#78350f', fontWeight: 600 }}>Journal</span>
            <span style={{ cursor: 'pointer', color: '#78716c' }}>Consultations</span>
            <span style={{ cursor: 'pointer', color: '#78716c' }}>Philosophy</span>
          </nav>
        </div>
      </header>

      {/* Main Blog Article Canvas */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {/* Breadcrumb Back Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#78350f',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              marginBottom: '24px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Back to Journal
          </button>

          {/* Category Tag */}
          {categories.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#78350f',
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {categories.map((c) => c.name).join(' • ')}
              </span>
            </div>
          )}

          {/* Article Title */}
          <h1
            style={{
              fontSize: device === 'mobile' ? '1.85rem' : '2.5rem',
              lineHeight: 1.25,
              margin: '12px 0 16px',
              color: '#1c1917',
              fontWeight: 700,
              fontFamily: "'Merriweather', Georgia, serif",
              wordBreak: 'break-word',
            }}
          >
            {title || 'Untitled Article'}
          </h1>

          {/* Excerpt */}
          {excerpt && (
            <p
              style={{
                fontSize: '1.25rem',
                lineHeight: 1.6,
                color: '#57534e',
                fontStyle: 'italic',
                marginBottom: '24px',
                fontFamily: "'Merriweather', Georgia, serif",
              }}
            >
              {excerpt}
            </p>
          )}

          {/* Author & Publication Meta Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderTop: '1px solid #e7e5e4',
              borderBottom: '1px solid #e7e5e4',
              marginBottom: '32px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              color: '#78716c',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {author?.profile_image_url ? (
                <img
                  src={author.profile_image_url}
                  alt={author.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#e7e5e4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#44403c',
                  }}
                >
                  {author?.name ? author.name.charAt(0) : 'A'}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, color: '#1c1917' }}>
                  {author?.name || 'Sanctuary Editorial'}
                </div>
                <div>{author?.designation || 'Consultant'}</div>
              </div>
            </div>
            <div>
              <span>{formattedDate}</span> • <span>{readingTime} min read</span>
            </div>
          </div>

          {/* Featured Image with Caption */}
          {featuredMedia?.url && (
            <figure style={{ margin: '0 0 32px 0' }}>
              <img
                src={featuredMedia.url}
                alt={featuredMedia.alt_text || title}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  display: 'block',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  maxHeight: '520px',
                  objectFit: 'cover',
                }}
              />
              {featuredImageCaption && (
                <figcaption
                  className="blog-featured-image-caption"
                  style={{
                    fontSize: '0.875rem',
                    color: '#78716c',
                    marginTop: '8px',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                  }}
                >
                  {featuredImageCaption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Structured Article Content */}
          <div
            style={{
              fontSize: '1.1rem',
              lineHeight: 1.8,
              color: '#292524',
              fontFamily: "'Merriweather', Georgia, serif",
              margin: '0 0 40px 0',
            }}
          >
            {client ? (
              <BlogProvider client={client}>
                <BlogContent
                  content={contentJson || contentHtml || '<p>No content written yet.</p>'}
                  className="zw-blog-content"
                />
              </BlogProvider>
            ) : (
              <BlogContent
                content={contentJson || contentHtml || '<p>No content written yet.</p>'}
                className="zw-blog-content"
              />
            )}
          </div>

          {/* Bibliography / Citations List (if present) */}
          {extractedCitations.length > 0 && (
            <div
              style={{
                marginTop: '40px',
                paddingTop: '24px',
                borderTop: '1px solid #e7e5e4',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1c1917',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '14px',
                }}
              >
                References & Citations ({extractedCitations.length})
              </div>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#57534e',
                  lineHeight: 1.5,
                }}
              >
                {extractedCitations.map((cit) => (
                  <li key={cit.number}>
                    <span style={{ fontWeight: 600 }}>{cit.text}</span>
                    {cit.url && (
                      <>
                        {' — '}
                        <a
                          href={cit.url}
                          target="_blank"
                          rel={cit.rel === 'dofollow' ? 'noopener' : 'nofollow noopener'}
                          style={{
                            color: '#78350f',
                            textDecoration: 'underline',
                            wordBreak: 'break-all',
                          }}
                        >
                          {cit.url}
                        </a>
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Social Share Buttons & Tags */}
          <div
            style={{
              marginTop: '48px',
              paddingTop: '24px',
              borderTop: '1px solid #e7e5e4',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <ShareButtons title={title} />

            {/* Tags Section below Share Option */}
            {tags && tags.length > 0 && (
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#78716c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Tags:
                </span>
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: '#f5f5f4',
                      color: '#44403c',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      border: '1px solid #e7e5e4',
                    }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reader Comments Section */}
          <div style={{ marginTop: '36px' }}>
            <CommentSection postId={postId || 'preview-post'} />
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: device === 'desktop' ? '#faf9f6' : '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Top Preview Control Bar */}
      <header
        style={{
          height: '52px',
          background: '#ffffff',
          borderBottom: '1px solid #e7e5e4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          fontFamily: "'Inter', sans-serif",
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#f5f5f4',
              border: '1px solid #e7e5e4',
              borderRadius: '6px',
              color: '#44403c',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            ← Back to Editor
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917' }}>
              Blog Preview Mode
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '12px',
                background: status === 'published' ? '#dcfce7' : '#fef9c3',
                color: status === 'published' ? '#166534' : '#854d0e',
              }}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f5f5f4',
            padding: '3px',
            borderRadius: '8px',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: device === 'desktop' ? '#ffffff' : 'transparent',
              color: device === 'desktop' ? '#1c1917' : '#78716c',
              boxShadow: device === 'desktop' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Desktop (Full Page)
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: device === 'tablet' ? '#ffffff' : 'transparent',
              color: device === 'tablet' ? '#1c1917' : '#78716c',
              boxShadow: device === 'tablet' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Tablet (768px)
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: device === 'mobile' ? '#ffffff' : 'transparent',
              color: device === 'mobile' ? '#1c1917' : '#78716c',
              boxShadow: device === 'mobile' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Mobile (375px)
          </button>
        </div>

        {/* Exit Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11.5px', color: '#a8a29e' }}>Esc to exit</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#1c1917',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Exit Preview
          </button>
        </div>
      </header>

      {/* Main Preview Container */}
      {device === 'desktop' ? (
        <div style={{ flex: 1 }}>
          {client ? (
            <BlogProvider client={client}>{blogPageContent}</BlogProvider>
          ) : (
            blogPageContent
          )}
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            padding: '32px 16px',
          }}
        >
          <div
            style={{
              width: device === 'tablet' ? '768px' : '375px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
          >
            {client ? (
              <BlogProvider client={client}>{blogPageContent}</BlogProvider>
            ) : (
              blogPageContent
            )}
          </div>
        </div>
      )}
    </div>
  );
};
