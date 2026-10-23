import React from 'react';
import { Post } from '@zwantum/blog-types';
import { useBlogSettings } from '../hooks/useBlogData';
import { BlogContent } from './BlogContent';
import { ShareButtons } from './base/ShareButtons';
import { CommentSection } from './base/CommentSection';
import { AuthorAvatar } from './base/AuthorAvatar';

export interface BlogArticleReaderProps {
  post: Post;
  showShareBar?: boolean;
  showAuthorBio?: boolean;
  showComments?: boolean;
  showCoverImage?: boolean;
  layout?: 'unboxed' | 'boxed' | 'full';
  className?: string;
}

export const BlogArticleReader: React.FC<BlogArticleReaderProps> = ({
  post,
  showShareBar = true,
  showAuthorBio = true,
  showComments = true,
  showCoverImage = true,
  layout = 'unboxed',
  className = '',
}) => {
  const { settings } = useBlogSettings();

  const coverUrl = post.featured_image?.url;
  const coverCaption = post.featured_image_caption || (post.featured_image as any)?.caption;
  const coverAlt = post.featured_image?.alt_text || post.title;

  const containerStyle: React.CSSProperties = {
    maxWidth: layout === 'full' ? '100%' : '860px',
    margin: '0 auto',
    padding: layout === 'boxed' ? '32px' : '24px 16px',
    background: layout === 'boxed' ? '#ffffff' : 'transparent',
    borderRadius: layout === 'boxed' ? '16px' : '0',
    boxShadow: layout === 'boxed' ? '0 4px 20px rgba(0,0,0,0.04)' : 'none',
  };

  return (
    <article className={`zw-blog-article-reader ${className}`} style={containerStyle}>
      {/* 1. Article Header */}
      <header className="zw-blog-article-header" style={{ marginBottom: '28px' }}>
        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {post.categories.map((cat) => (
              <span
                key={cat.id}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  background: '#fef9c3',
                  color: '#854d0e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#0f172a',
            margin: '0 0 16px 0',
            letterSpacing: '-0.02em',
          }}
        >
          {post.title}
        </h1>

        {/* Meta Bar: Author & Date & Reading Time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {post.author && <AuthorAvatar author={post.author} size={38} />}
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>
                {post.author?.name || 'Editorial Staff'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {post.published_at && (
                  <span>
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {post.reading_time > 0 && <span>• {post.reading_time} min read</span>}
              </div>
            </div>
          </div>

          {showShareBar && (
            <ShareButtons url={typeof window !== 'undefined' ? window.location.href : post.slug} title={post.title} variant="pills" />
          )}
        </div>
      </header>

      {/* 2. Cover Image with Figcaption */}
      {showCoverImage && coverUrl && (
        <figure
          className="zw-blog-cover-figure"
          style={{
            margin: '0 0 32px 0',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <img
            src={coverUrl}
            alt={coverAlt}
            className="zw-blog-cover-image"
            style={{
              width: '100%',
              maxHeight: '480px',
              objectFit: 'cover',
              borderRadius: '12px',
              display: 'block',
            }}
          />
          {coverCaption && (
            <figcaption
              className="zw-blog-cover-caption"
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '8px',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              {coverCaption}
            </figcaption>
          )}
        </figure>
      )}

      {/* 3. Editorial Content Body (Automatically reads TOC and DropCap from settings) */}
      <div className="zw-blog-article-body" style={{ margin: '0 0 40px 0' }}>
        <BlogContent content={post.content} />
      </div>

      {/* 4. Tags Section */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '24px 0 32px 0' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>Tags:</span>
          {post.tags.map((tag) => (
            <span
              key={tag.id}
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#334155',
                fontWeight: 500,
              }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* 5. Author Biography Card */}
      {showAuthorBio && post.author && (
        <div
          className="zw-blog-author-bio-card"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            padding: '20px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            margin: '32px 0',
          }}
        >
          <AuthorAvatar author={post.author} size={54} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#0f172a' }}>
              About {post.author.name}
            </div>
            {post.author.designation && (
              <div style={{ fontSize: '12px', color: '#854d0e', fontWeight: 600, marginTop: '2px' }}>
                {post.author.designation}
              </div>
            )}
            {post.author.bio && (
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>
                {post.author.bio}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6. Discussion / Comments (Auto-checks master settings.enableComments) */}
      {showComments && (settings ? settings.enableComments : true) && (
        <section className="zw-blog-comments-section" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
          <CommentSection postId={post.id} />
        </section>
      )}
    </article>
  );
};
