import React from 'react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav className={`zw-blog-pagination ${className}`} aria-label="Blog pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '40px 0' }}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        style={{
          padding: '8px 14px',
          border: '1px solid #cbd5e1',
          background: '#fff',
          borderRadius: '6px',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
          opacity: page <= 1 ? 0.5 : 1,
        }}
      >
        Previous
      </button>

      {pages.map((p, idx) => {
        if (p === '...') {
          return <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>;
        }

        const isCurrent = p === page;
        return (
          <button
            key={`page-${p}`}
            type="button"
            onClick={() => onPageChange(Number(p))}
            style={{
              padding: '8px 14px',
              border: '1px solid',
              borderColor: isCurrent ? '#4f46e5' : '#cbd5e1',
              background: isCurrent ? '#4f46e5' : '#fff',
              color: isCurrent ? '#fff' : '#1e293b',
              fontWeight: isCurrent ? 600 : 400,
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        style={{
          padding: '8px 14px',
          border: '1px solid #cbd5e1',
          background: '#fff',
          borderRadius: '6px',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          opacity: page >= totalPages ? 0.5 : 1,
        }}
      >
        Next
      </button>
    </nav>
  );
};
