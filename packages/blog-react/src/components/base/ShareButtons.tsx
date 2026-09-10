import React, { useState } from 'react';

export interface ShareButtonsProps {
  title: string;
  url?: string;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ title, url, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`zw-blog-share ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>Share:</span>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ padding: '6px 12px', borderRadius: '6px', background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}
      >
        𝕏 Post
      </a>

      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ padding: '6px 12px', borderRadius: '6px', background: '#dcfce7', color: '#166534', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}
      >
        WhatsApp
      </a>

      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ padding: '6px 12px', borderRadius: '6px', background: '#e0e7ff', color: '#3730a3', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}
      >
        LinkedIn
      </a>

      <button
        type="button"
        onClick={copyToClipboard}
        style={{ padding: '6px 12px', borderRadius: '6px', background: '#f1f5f9', border: 'none', color: '#0f172a', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
      >
        {copied ? '✓ Copied' : '🔗 Copy Link'}
      </button>
    </div>
  );
};
