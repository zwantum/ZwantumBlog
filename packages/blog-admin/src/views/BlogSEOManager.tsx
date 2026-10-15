import React, { useState, useEffect } from 'react';
import { BlogClient } from '@zwantum/blog-core';
import { toast } from '../components/Toast';

export interface BlogSEOManagerProps {
  client: BlogClient;
  className?: string;
}

export const BlogSEOManager: React.FC<BlogSEOManagerProps> = ({ client, className = '' }) => {
  const [sitemapXml, setSitemapXml] = useState('');
  const [rssXml, setRssXml] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sitemap' | 'rss' | 'schema'>('sitemap');

  useEffect(() => {
    Promise.all([client.seo.getSitemap(), client.seo.getRss()])
      .then(([sitemap, rss]) => {
        setSitemapXml(sitemap);
        setRssXml(rss);
      })
      .finally(() => setLoading(false));
  }, [client]);

  return (
    <div className={`zw-admin-container ${className}`}>
      <div className="zw-admin-header">
        <div>
          <h2 className="zw-admin-title">Blog SEO & Syndication</h2>
          <p className="zw-admin-subtitle">Search engine crawling endpoints, XML sitemaps, RSS 2.0 feeds, and structured data schemas.</p>
        </div>
      </div>

      <div className="zw-admin-tabs">
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'sitemap' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('sitemap')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
          </svg>
          <span>XML Sitemap</span>
        </button>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'rss' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('rss')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          <span>RSS 2.0 Feed</span>
        </button>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'schema' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('schema')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span>Structured Data (JSON-LD)</span>
        </button>
      </div>

      <div className="zw-admin-card">
        <div className="zw-admin-card-body">
          {loading ? (
            <p style={{ color: '#64748b' }}>Generating SEO data...</p>
          ) : activeTab === 'sitemap' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Auto-generated XML sitemap incorporating published posts, indexable categories, tags, and authors.
                </p>
                <button
                  type="button"
                  className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(sitemapXml);
                    toast.info('Sitemap XML copied to clipboard.', 'Copied');
                  }}
                >
                  Copy XML
                </button>
              </div>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  overflowX: 'auto',
                  fontSize: '12px',
                  maxHeight: '400px',
                }}
              >
                {sitemapXml}
              </pre>
            </div>
          ) : activeTab === 'rss' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Standard RSS 2.0 syndication feed for newsletter readers and aggregators.
                </p>
                <button
                  type="button"
                  className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(rssXml);
                    toast.info('RSS Feed XML copied to clipboard.', 'Copied');
                  }}
                >
                  Copy RSS
                </button>
              </div>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  overflowX: 'auto',
                  fontSize: '12px',
                  maxHeight: '400px',
                }}
              >
                {rssXml}
              </pre>
            </div>
          ) : (
            <div style={{ lineHeight: 1.6, fontSize: '13px', color: '#334155' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#0f172a' }}>Schema.org JSON-LD Support</h4>
              <p>ZwantumBlog automatically emits rich structured data for:</p>
              <ul>
                <li><strong>Article & BlogPosting:</strong> Headlines, author credits, publishers, dates, and images for Google Discover and Top Stories.</li>
                <li><strong>BreadcrumbList:</strong> Visual breadcrumb hierarchy in search engine result snippets.</li>
                <li><strong>FAQPage:</strong> Rich accordion expandable snippets when structured FAQ blocks exist.</li>
                <li><strong>Person & Organization:</strong> E-E-A-T entity signals for authors and websites.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
