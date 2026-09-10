import React from 'react';
import { Post } from '@zwantum/blog-types';
import { BlogCard } from './BlogCard';

export interface BlogGridProps {
  posts: Post[];
  basePath?: string;
  columns?: 1 | 2 | 3 | 4;
  onPostClick?: (post: Post) => void;
  className?: string;
}

export const BlogGrid: React.FC<BlogGridProps> = ({
  posts,
  basePath = '/blog',
  columns = 3,
  onPostClick,
  className = '',
}) => {
  if (!posts || posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <p style={{ fontSize: '1.1rem' }}>No articles found.</p>
      </div>
    );
  }

  return (
    <div
      className={`zw-blog-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: '28px',
      }}
    >
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} basePath={basePath} onClick={onPostClick} />
      ))}
    </div>
  );
};
