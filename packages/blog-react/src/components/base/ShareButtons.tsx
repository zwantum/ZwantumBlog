import React, { useState } from 'react';

export interface ShareButtonsProps {
  title: string;
  url?: string;
  className?: string;
  variant?: 'pills' | 'icons' | 'dropdown';
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  title,
  url,
  className = '',
  variant = 'pills',
}) => {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  // SVG Icons
  const IconTwitter = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  const IconWhatsApp = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );

  const IconLinkedIn = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );

  const IconLink = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );

  const IconCheck = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const IconShare = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );

  // Variant: Icons
  if (variant === 'icons') {
    return (
      <div className={`zw-blog-share zw-blog-share-icons ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on X (Twitter)"
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconTwitter />
        </a>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on WhatsApp"
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconWhatsApp />
        </a>
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on LinkedIn"
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconLinkedIn />
        </a>
        <button
          type="button"
          onClick={copyToClipboard}
          title={copied ? 'Copied URL!' : 'Copy link'}
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: copied ? '#fef9c3' : '#f8fafc', border: copied ? '1px solid #fde047' : '1px solid #e2e8f0', color: copied ? '#854d0e' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {copied ? <IconCheck /> : <IconLink />}
        </button>
      </div>
    );
  }

  // Variant: Dropdown
  if (variant === 'dropdown') {
    return (
      <div className={`zw-blog-share zw-blog-share-dropdown ${className}`} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          <IconShare />
          <span>Share</span>
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '150px',
              zIndex: 50,
            }}
          >
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDropdownOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', color: '#0f172a', textDecoration: 'none', fontSize: '12.5px', fontWeight: 500 }}
            >
              <IconTwitter />
              <span>𝕏 Post</span>
            </a>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDropdownOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', color: '#16a34a', textDecoration: 'none', fontSize: '12.5px', fontWeight: 500 }}
            >
              <IconWhatsApp />
              <span>WhatsApp</span>
            </a>
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDropdownOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', color: '#2563eb', textDecoration: 'none', fontSize: '12.5px', fontWeight: 500 }}
            >
              <IconLinkedIn />
              <span>LinkedIn</span>
            </a>
            <button
              type="button"
              onClick={() => {
                copyToClipboard();
                setDropdownOpen(false);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#334155', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
              <IconLink />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Variant: Pills (Default)
  return (
    <div className={`zw-blog-share zw-blog-share-pills ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b', marginRight: '2px' }}>Share:</span>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '9999px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}
      >
        <IconTwitter />
        <span>𝕏 Post</span>
      </a>

      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '9999px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}
      >
        <IconWhatsApp />
        <span>WhatsApp</span>
      </a>

      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '9999px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}
      >
        <IconLinkedIn />
        <span>LinkedIn</span>
      </a>

      <button
        type="button"
        onClick={copyToClipboard}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '9999px', background: copied ? '#fef9c3' : '#f8fafc', border: copied ? '1px solid #fde047' : '1px solid #e2e8f0', color: copied ? '#854d0e' : '#334155', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
      >
        {copied ? <IconCheck /> : <IconLink />}
        <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
      </button>
    </div>
  );
};
