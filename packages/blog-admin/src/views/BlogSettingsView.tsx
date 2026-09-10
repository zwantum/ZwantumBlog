import React, { useState, useEffect } from 'react';
import { BlogSettings } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface BlogSettingsViewProps {
  client: BlogClient;
  className?: string;
  onSettingsUpdated?: (settings: BlogSettings) => void;
}

export const BlogSettingsView: React.FC<BlogSettingsViewProps> = ({
  client,
  className = '',
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<BlogSettings>({
    blogTitle: 'Blog',
    basePath: '/blog',
    postsPerPage: 9,
    defaultPostStatus: 'draft',
    enableComments: true,
    enableMedia: true,
    enableScheduling: true,
    enableRevisions: true,
    enableRedirects: true,
    timezone: 'UTC',
  });

  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'modules'>('general');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // SEO & Syndication state
  const [sitemapXml, setSitemapXml] = useState('');
  const [rssXml, setRssXml] = useState('');
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [seoSubTab, setSeoSubTab] = useState<'sitemap' | 'rss' | 'schema'>('sitemap');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    client.settings.get().then((data) => {
      setSettings((prev) => ({
        ...prev,
        ...data,
        enableMedia: data.enableMedia !== false,
      }));
    });
  }, [client]);

  // Load SEO feeds when switching to SEO tab
  useEffect(() => {
    if (activeTab === 'seo' && !sitemapXml) {
      setLoadingSeo(true);
      Promise.all([client.seo.getSitemap(), client.seo.getRss()])
        .then(([sitemap, rss]) => {
          setSitemapXml(sitemap);
          setRssXml(rss);
        })
        .catch(() => {})
        .finally(() => setLoadingSeo(false));
    }
  }, [activeTab, client, sitemapXml]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} copied to clipboard!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage(null);
    try {
      const updated = await client.settings.update(settings);
      setSettings(updated);
      setToastMessage({ text: 'Blog configuration saved successfully.', type: 'success' });
      onSettingsUpdated?.(updated);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setToastMessage({
        text: `Error saving settings: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`zw-admin-container ${className}`}>
      {/* Header */}
      <div className="zw-admin-header">
        <div>
          <h2 className="zw-admin-title">Settings & Configuration</h2>
          <p className="zw-admin-subtitle">
            Configure blog routing, global search engine indexing, syndication, and module integrations.
          </p>
        </div>
      </div>

      {/* Primary Settings Navigation Tabs */}
      <div className="zw-admin-tabs" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'general' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          ⚙️ General Settings
        </button>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'seo' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          🔍 Global SEO & Feeds
        </button>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'modules' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          🧩 Modules & Toggles
        </button>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            maxWidth: '680px',
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: toastMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${toastMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: toastMessage.type === 'success' ? '#166534' : '#b91c1c',
          }}
        >
          <span>{toastMessage.type === 'success' ? '✅' : '⚠️'}</span>
          <span style={{ fontWeight: 500 }}>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. GENERAL SETTINGS TAB */}
      {activeTab === 'general' && (
        <div className="zw-admin-card" style={{ maxWidth: '680px' }}>
          <form onSubmit={handleSave} className="zw-admin-card-body">
            <div className="zw-admin-form-group">
              <label className="zw-admin-label">Blog Title</label>
              <input
                type="text"
                className="zw-admin-input"
                value={settings.blogTitle}
                onChange={(e) => setSettings({ ...settings, blogTitle: e.target.value })}
              />
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                The public name of your publication or knowledge center.
              </div>
            </div>

            <div className="zw-admin-form-group">
              <label className="zw-admin-label">URL Base Path</label>
              <input
                type="text"
                className="zw-admin-input"
                placeholder="/blog or /insights or /news"
                value={settings.basePath}
                onChange={(e) => setSettings({ ...settings, basePath: e.target.value })}
              />
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                Base routing path under your website domain (e.g. <code>/blog</code>).
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Posts Per Page</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="zw-admin-input"
                  value={settings.postsPerPage}
                  onChange={(e) => setSettings({ ...settings, postsPerPage: Number(e.target.value) })}
                />
              </div>

              <div className="zw-admin-form-group">
                <label className="zw-admin-label">Default Post Status</label>
                <select
                  className="zw-admin-select"
                  value={settings.defaultPostStatus}
                  onChange={(e) => setSettings({ ...settings, defaultPostStatus: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="zw-admin-form-group">
              <label className="zw-admin-label">Timezone for Publication & Scheduling</label>
              <input
                type="text"
                className="zw-admin-input"
                placeholder="e.g. UTC, America/New_York, Asia/Kolkata"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              />
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="zw-admin-btn zw-admin-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save General Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. SEO & SYNDICATION TAB (Consolidated from standalone SEO) */}
      {activeTab === 'seo' && (
        <div className="zw-admin-card" style={{ maxWidth: '780px' }}>
          <div className="zw-admin-card-body">
            {/* Context Explanation */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '20px',
                fontSize: '12.5px',
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              💡 <strong>Global Blog SEO:</strong> Meta titles and search keywords for individual articles are edited directly inside each post's editor. This section manages your <strong>site-wide XML sitemap</strong>, <strong>RSS 2.0 feed</strong>, and <strong>Schema.org JSON-LD</strong> crawler endpoints.
            </div>

            {/* Sub-tabs for SEO */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                className={`zw-admin-btn zw-admin-btn-sm ${seoSubTab === 'sitemap' ? 'zw-admin-btn-primary' : 'zw-admin-btn-secondary'}`}
                onClick={() => setSeoSubTab('sitemap')}
              >
                🗺️ XML Sitemap
              </button>
              <button
                type="button"
                className={`zw-admin-btn zw-admin-btn-sm ${seoSubTab === 'rss' ? 'zw-admin-btn-primary' : 'zw-admin-btn-secondary'}`}
                onClick={() => setSeoSubTab('rss')}
              >
                📡 RSS 2.0 Feed
              </button>
              <button
                type="button"
                className={`zw-admin-btn zw-admin-btn-sm ${seoSubTab === 'schema' ? 'zw-admin-btn-primary' : 'zw-admin-btn-secondary'}`}
                onClick={() => setSeoSubTab('schema')}
              >
                📐 Structured Data (JSON-LD)
              </button>
            </div>

            {copyFeedback && (
              <div
                style={{
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  color: '#854d0e',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '12px',
                  display: 'inline-block',
                }}
              >
                ✓ {copyFeedback}
              </div>
            )}

            {loadingSeo ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>Generating SEO data...</p>
            ) : seoSubTab === 'sitemap' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                    Auto-generated XML sitemap incorporating published posts, indexable categories, tags, and authors.
                  </p>
                  <button
                    type="button"
                    className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                    onClick={() => handleCopy(sitemapXml, 'Sitemap XML')}
                  >
                    Copy XML
                  </button>
                </div>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#f8fafc',
                    padding: '16px',
                    borderRadius: '10px',
                    overflowX: 'auto',
                    fontSize: '12px',
                    maxHeight: '360px',
                  }}
                >
                  {sitemapXml}
                </pre>
              </div>
            ) : seoSubTab === 'rss' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                    Standard RSS 2.0 syndication feed for newsletters, feed readers, and aggregators.
                  </p>
                  <button
                    type="button"
                    className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm"
                    onClick={() => handleCopy(rssXml, 'RSS Feed XML')}
                  >
                    Copy RSS
                  </button>
                </div>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#f8fafc',
                    padding: '16px',
                    borderRadius: '10px',
                    overflowX: 'auto',
                    fontSize: '12px',
                    maxHeight: '360px',
                  }}
                >
                  {rssXml}
                </pre>
              </div>
            ) : (
              <div style={{ lineHeight: 1.6, fontSize: '13px', color: '#334155' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Automatic Schema.org JSON-LD Integration
                </h4>
                <p style={{ color: '#64748b', fontSize: '12.5px', marginBottom: '12px' }}>
                  ZwantumBlog automatically emits rich structured data for Google Discover, Top Stories, and Search results:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>📰 Article & BlogPosting</strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Emits headlines, author credits, publisher logos, dates, and cover images.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>🧭 BreadcrumbList</strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Visual breadcrumb navigation hierarchy shown in Google SERPs.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>❓ FAQPage Schema</strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Accordion rich snippets when FAQ question/answer blocks exist.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>🏢 Person & Organization</strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      High-trust E-E-A-T entity signals for verified writers and websites.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MODULES & INTEGRATIONS TAB (Configurable Media, Comments, etc.) */}
      {activeTab === 'modules' && (
        <div className="zw-admin-card" style={{ maxWidth: '680px' }}>
          <form onSubmit={handleSave} className="zw-admin-card-body">
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Module Activation & Host Integrations
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                Enable or disable specific blog modules to seamlessly match your host application architecture.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {/* Built-in Media Library Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ paddingRight: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-media"
                  >
                    🖼️ Standalone Media Library Tab
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Shows the standalone Media manager in the sidebar. <strong>Turn this OFF</strong> if your website already has its own media library/asset management system.
                  </div>
                </div>
                <input
                  id="toggle-media"
                  type="checkbox"
                  checked={settings.enableMedia !== false}
                  onChange={(e) => setSettings({ ...settings, enableMedia: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer', marginTop: '2px' }}
                />
              </div>

              {/* Reader Comments Module */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ paddingRight: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-comments"
                  >
                    💬 Enable Comments on Blog Posts
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Allows readers to submit comments and view discussion threads on blog posts. Turn this <strong>OFF</strong> if you want to disable comment sections on all blog posts and hide the Comments module.
                  </div>
                </div>
                <input
                  id="toggle-comments"
                  type="checkbox"
                  checked={settings.enableComments}
                  onChange={(e) => setSettings({ ...settings, enableComments: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer', marginTop: '2px' }}
                />
              </div>

              {/* Scheduled Publishing */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ paddingRight: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-scheduling"
                  >
                    ⏱️ Scheduled Publishing Timers
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Allows setting future release dates and automated publishing triggers.
                  </div>
                </div>
                <input
                  id="toggle-scheduling"
                  type="checkbox"
                  checked={settings.enableScheduling}
                  onChange={(e) => setSettings({ ...settings, enableScheduling: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer', marginTop: '2px' }}
                />
              </div>

              {/* Revision History */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ paddingRight: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-revisions"
                  >
                    📝 Revision History & Rollbacks
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Saves snapshots of post edits so authors can inspect diffs and restore previous versions.
                  </div>
                </div>
                <input
                  id="toggle-revisions"
                  type="checkbox"
                  checked={settings.enableRevisions}
                  onChange={(e) => setSettings({ ...settings, enableRevisions: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer', marginTop: '2px' }}
                />
              </div>

              {/* 301 Redirects */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ paddingRight: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-redirects"
                  >
                    🔀 Automatic 301 Redirects
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Automatically creates 301 permanent redirects whenever a post slug is modified.
                  </div>
                </div>
                <input
                  id="toggle-redirects"
                  type="checkbox"
                  checked={settings.enableRedirects}
                  onChange={(e) => setSettings({ ...settings, enableRedirects: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer', marginTop: '2px' }}
                />
              </div>
            </div>

            <div style={{ paddingTop: '20px', borderTop: '1px solid #f1f5f9', marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="zw-admin-btn zw-admin-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Module Preferences'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
