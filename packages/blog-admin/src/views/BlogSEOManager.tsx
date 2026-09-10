import React, { useState, useEffect } from 'react';
import { BlogClient } from '@zwantum/blog-core';

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
        >
          🗺️ XML Sitemap
        </button>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'rss' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('rss')}
        >
          📡 RSS 2.0 Feed
        </button>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'schema' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('schema')}
        >
          📐 Structured Data (JSON-LD)
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
                    alert('Sitemap XML copied to clipboard.');
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
                    alert('RSS Feed XML copied to clipboard.');
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
