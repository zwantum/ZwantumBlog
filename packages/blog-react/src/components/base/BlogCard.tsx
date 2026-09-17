import React from 'react';
import { Post } from '@zwantum/blog-types';

export interface BlogCardProps {
  post: Post;
  basePath?: string;
  onClick?: (post: Post) => void;
  className?: string;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  post,
  basePath = '/blog',
  onClick,
  className = '',
}) => {
  const postUrl = `${basePath}/${post.slug}`;
  const dateFormatted = post.published_at
    ? new Date(post.published_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <article className={`zw-blog-card ${className}`} style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', transition: 'transform 0.2s, box-shadow 0.2s' }}>
      {post.featured_image?.url && (
        <a
          href={postUrl}
          onClick={(e) => {
            if (onClick) {
              e.preventDefault();
              onClick(post);
            }
          }}
          style={{ display: 'block', overflow: 'hidden', aspectRatio: '16/9' }}
        >
          <img
            src={post.featured_image.url}
            alt={post.featured_image.alt_text || post.title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </a>
      )}

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Category & Date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
          {post.categories && post.categories.length > 0 && (
            <span style={{ fontWeight: 600, color: '#4f46e5' }}>{post.categories[0].name}</span>
          )}
          <span>{dateFormatted}</span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 10px 0', lineHeight: 1.35 }}>
          <a
            href={postUrl}
            onClick={(e) => {
              if (onClick) {
                e.preventDefault();
                onClick(post);
              }
            }}
            style={{ color: '#0f172a', textDecoration: 'none' }}
            dangerouslySetInnerHTML={{ __html: post.title }}
          />
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 16px 0', flex: 1 }}>
            {post.excerpt}
          </p>
        )}

        {/* Author & Reading Time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b' }}>
          {post.author ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {post.author.profile_image_url && (
                <img
                  src={post.author.profile_image_url}
                  alt={post.author.name}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <span style={{ fontWeight: 500, color: '#1e293b' }}>{post.author.name}</span>
            </div>
          ) : (
            <span />
          )}
          <span>{post.reading_time} min read</span>
        </div>
      </div>
    </article>
  );
};
