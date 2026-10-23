import React from 'react';
import { Author } from '@zwantum/blog-types';

export function getAuthorInitials(name?: string): string {
  if (!name || !name.trim()) return 'AU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface AuthorAvatarProps {
  author?: Author | { name?: string; profile_image_url?: string | null; avatar_url?: string | null } | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AuthorAvatar: React.FC<AuthorAvatarProps> = ({
  author,
  size = 36,
  className = '',
  style = {},
}) => {
  const imageUrl = author?.profile_image_url || (author as any)?.avatar_url;
  const name = author?.name || 'Author';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`zw-author-avatar ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'inline-block',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  const initials = getAuthorInitials(name);

  return (
    <div
      className={`zw-author-avatar-initials ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#f1f5f9',
        color: '#334155',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size <= 32 ? '11px' : size <= 48 ? '13px' : '16px',
        flexShrink: 0,
        userSelect: 'none',
        ...style,
      }}
      title={name}
    >
      {initials}
    </div>
  );
};
