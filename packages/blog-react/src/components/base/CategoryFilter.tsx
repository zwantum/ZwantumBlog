import React from 'react';
import { Category } from '@zwantum/blog-types';

export interface CategoryFilterProps {
  categories: Category[];
  activeSlug?: string | null;
  onSelect: (categorySlug: string | null) => void;
  className?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeSlug = null,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`zw-blog-categories ${className}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '20px 0' }}>
      <button
        type="button"
        onClick={() => onSelect(null)}
        style={{
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid',
          borderColor: activeSlug === null ? '#4f46e5' : '#e2e8f0',
          background: activeSlug === null ? '#4f46e5' : '#f8fafc',
          color: activeSlug === null ? '#fff' : '#475569',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        All
      </button>

      {categories.map((cat) => {
        const isSelected = activeSlug === cat.slug;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.slug)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
              background: isSelected ? '#4f46e5' : '#f8fafc',
              color: isSelected ? '#fff' : '#475569',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {cat.name}
            {cat.post_count !== undefined && cat.post_count > 0 && (
              <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '0.85em' }}>({cat.post_count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
