import React, { useState, useEffect, useRef } from 'react';
import { BlogSettings } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';
import { toast } from '../components/Toast';
import { RedirectManager } from './RedirectManager';

const SettingIcons = {
  General: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Seo: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Modules: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  ),
  Sitemap: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  ),
  Rss: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  ),
  Schema: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Info: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Article: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
      <path d="M6 14h6" />
    </svg>
  ),
  Breadcrumb: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Faq: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Organization: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Media: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  Comments: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Revision: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <polyline points="3 3 3 8 8 8" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  ),
  Redirect: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  ),
  DropCap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h8" />
      <path d="M7 5v14" />
      <path d="M13 11h8" />
      <path d="M13 15h8" />
      <path d="M13 19h5" />
    </svg>
  ),
  Autosave: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Backup: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Upload: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  Toc: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  OgImage: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
};

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
    enableDropCap: false,
    enableAutosave: true,
    enableTableOfContents: true,
    enableOgImageGenerator: true,
    timezone: 'UTC',
  });

  const [activeTab, setActiveTab] = useState<'general' | 'modules' | 'redirects' | 'backup'>('general');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Backup & Restore State
  const [exportingBackup, setExportingBackup] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupRestoreMode, setBackupRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [restoreSummary, setRestoreSummary] = useState<{ success: boolean; text: string } | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    client.settings.get().then((data) => {
      setSettings((prev) => ({
        ...prev,
        ...data,
        enableMedia: data.enableMedia !== false,
      }));
    });
  }, [client]);

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
            Configure blog routing, general preferences, module integrations, and backups.
          </p>
        </div>
      </div>

      {/* Primary Settings Navigation Tabs */}
      <div className="zw-admin-tabs" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'general' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('general')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <SettingIcons.General />
          <span>General Settings</span>
        </button>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'modules' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('modules')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <SettingIcons.Modules />
          <span>Modules & Toggles</span>
        </button>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'redirects' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('redirects')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <SettingIcons.Redirect />
          <span>301 Redirects</span>
        </button>
        <button
          type="button"
          className={`zw-admin-tab-btn ${activeTab === 'backup' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('backup')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <SettingIcons.Backup />
          <span>Backup & Recovery</span>
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
          {toastMessage.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
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

      {/* 2. MODULES & INTEGRATIONS TAB (Configurable Media, Comments, etc.) */}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-media"
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>
                      <SettingIcons.Media />
                    </span>
                    <span>Standalone Media Library Tab</span>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-comments"
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>
                      <SettingIcons.Comments />
                    </span>
                    <span>Enable Comments on Blog Posts</span>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-scheduling"
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>
                      <SettingIcons.Clock />
                    </span>
                    <span>Scheduled Publishing Timers</span>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-revisions"
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>
                      <SettingIcons.Revision />
                    </span>
                    <span>Revision History & Rollbacks</span>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-redirects"
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>
                      <SettingIcons.Redirect />
                    </span>
                    <span>Automatic 301 Redirects</span>
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

              {/* Editorial Drop Cap */}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-drop-cap"
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>
                      <SettingIcons.DropCap />
                    </span>
                    <span>Editorial Drop Cap</span>
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Enlarges and styles the first letter of the opening paragraph in blog content for classic editorial typography.
                  </div>
                </div>
                <input
                  id="toggle-drop-cap"
                  type="checkbox"
                  checked={!!settings.enableDropCap}
                  onChange={(e) => setSettings({ ...settings, enableDropCap: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer', marginTop: '2px' }}
                />
              </div>

              {/* Draft Background Autosave */}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-autosave"
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>
                      <SettingIcons.Autosave />
                    </span>
                    <span>Draft Background Autosave</span>
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Periodically saves draft content snapshots in the background while typing so writers never lose progress from accidental tab closures.
                  </div>
                </div>
                <input
                  id="toggle-autosave"
                  type="checkbox"
                  checked={settings.enableAutosave !== false}
                  onChange={(e) => setSettings({ ...settings, enableAutosave: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer', marginTop: '2px' }}
                />
              </div>

              {/* Automated Table of Contents */}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-toc"
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>
                      <SettingIcons.Toc />
                    </span>
                    <span>Automated Table of Contents (TOC)</span>
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Automatically detects H2 and H3 headings in long-form articles and renders an interactive, sticky reading guide with active scroll-spy.
                  </div>
                </div>
                <input
                  id="toggle-toc"
                  type="checkbox"
                  checked={settings.enableTableOfContents !== false}
                  onChange={(e) => setSettings({ ...settings, enableTableOfContents: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer', marginTop: '2px' }}
                />
              </div>

              {/* Automated Social Cards (OG Images) */}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      marginBottom: '3px',
                      cursor: 'pointer',
                    }}
                    htmlFor="toggle-og-image"
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>
                      <SettingIcons.OgImage />
                    </span>
                    <span>Automated Social Share Cards (OG Images)</span>
                  </label>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Automatically generates 1200x630 branded Open Graph cards for articles that lack a manual cover image when shared on social networks.
                  </div>
                </div>
                <input
                  id="toggle-og-image"
                  type="checkbox"
                  checked={settings.enableOgImageGenerator !== false}
                  onChange={(e) => setSettings({ ...settings, enableOgImageGenerator: e.target.checked })}
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

      {/* 4. 301 URL REDIRECTS TAB */}
      {activeTab === 'redirects' && (
        <div style={{ maxWidth: '920px' }}>
          <RedirectManager client={client} />
        </div>
      )}

      {/* 5. BACKUP & DISASTER RECOVERY TAB */}
      {activeTab === 'backup' && (
        <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 1: 1-Click Complete Export */}
          <div className="zw-admin-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#0284c7', display: 'flex', padding: '10px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                  <SettingIcons.Download />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#0f172a' }}>
                    Export Full Blog Archive
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Generate a portable JSON backup file with complete relational integrity.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-primary"
                disabled={exportingBackup}
                onClick={async () => {
                  setExportingBackup(true);
                  try {
                    const data = await client.backup.exportBackup();
                    const jsonStr = JSON.stringify(data, null, 2);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                    link.href = url;
                    link.download = `zwantum-blog-backup-${timestamp}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    setToastMessage({
                      text: `Backup exported successfully (${data.stats.postsCount} posts, ${data.stats.categoriesCount} categories, ${data.stats.authorsCount} authors).`,
                      type: 'success',
                    });
                  } catch (err: any) {
                    setToastMessage({
                      text: `Export failed: ${err.message || err}`,
                      type: 'error',
                    });
                  } finally {
                    setExportingBackup(false);
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '13px' }}
              >
                <SettingIcons.Download />
                <span>{exportingBackup ? 'Packaging Backup...' : 'Download Full Backup (.json)'}</span>
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Included in Backup Archive:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12.5px', color: '#334155' }}>
                <div>• All Posts (Content JSON & HTML)</div>
                <div>• Author Profiles, Avatars & Bios</div>
                <div>• Categories & Hierarchy Tree</div>
                <div>• Tags & Taxonomy Slugs</div>
                <div>• Media Asset Catalog & Public URLs</div>
                <div>• Comments & Feedback Threads</div>
                <div>• Automatic 301 URL Redirects</div>
                <div>• Global Blog Module Settings</div>
              </div>
            </div>
          </div>

          {/* Card 2: Restore from Backup */}
          <div className="zw-admin-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ color: '#8b5cf6', display: 'flex', padding: '10px', background: '#f5f3ff', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                <SettingIcons.Upload />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#0f172a' }}>
                  Restore / Import Blog Backup
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Restore your entire publication from a previously generated JSON backup file.
                </p>
              </div>
            </div>

            {/* File Selector */}
            <div
              style={{
                border: '1.5px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                background: '#f8fafc',
                marginBottom: '18px',
                cursor: 'pointer',
              }}
              onClick={() => backupFileInputRef.current?.click()}
            >
              <input
                ref={backupFileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setBackupFile(file);
                  setRestoreSummary(null);
                }}
              />
              <div style={{ color: '#64748b', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <SettingIcons.Upload />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>
                {backupFile ? backupFile.name : 'Click to select a .json backup file'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {backupFile ? `${(backupFile.size / 1024).toFixed(1)} KB` : 'Supports standard ZwantumBlog backup files'}
              </div>
            </div>

            {/* Enhanced Selectable Radio Cards for Restore Strategy */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                Restore Strategy
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {/* Option 1: Merge & Update */}
                <div
                  onClick={() => setBackupRestoreMode('merge')}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: backupRestoreMode === 'merge' ? '1.5px solid #ffcc00' : '1px solid #e2e8f0',
                    background: backupRestoreMode === 'merge' ? '#fffdf5' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: backupRestoreMode === 'merge' ? '0 2px 8px rgba(255, 204, 0, 0.15)' : 'none',
                  }}
                >
                  <div
                    style={{
                      marginTop: '2px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: backupRestoreMode === 'merge' ? '5px solid #ffcc00' : '2px solid #cbd5e1',
                      background: '#ffffff',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>
                        Merge & Update
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 500, padding: '1px 7px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                        Recommended
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>
                      Restores missing articles and updates existing records without deleting newer content.
                    </div>
                  </div>
                </div>

                {/* Option 2: Full Replace */}
                <div
                  onClick={() => setBackupRestoreMode('replace')}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: backupRestoreMode === 'replace' ? '1.5px solid #ffcc00' : '1px solid #e2e8f0',
                    background: backupRestoreMode === 'replace' ? '#fffdf5' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: backupRestoreMode === 'replace' ? '0 2px 8px rgba(255, 204, 0, 0.15)' : 'none',
                  }}
                >
                  <div
                    style={{
                      marginTop: '2px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: backupRestoreMode === 'replace' ? '5px solid #ffcc00' : '2px solid #cbd5e1',
                      background: '#ffffff',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>
                        Full Replace
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 500, padding: '1px 7px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                        Overwrite
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>
                      Overwrites all matching existing database records with the backup file data.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="zw-admin-btn zw-admin-btn-primary"
                disabled={!backupFile || importingBackup}
                onClick={async () => {
                  if (!backupFile) return;
                  const confirmed = window.confirm(
                    backupRestoreMode === 'replace'
                      ? 'Are you sure you want to proceed with Full Replace restore? Matching existing records will be overwritten.'
                      : 'Are you sure you want to restore and merge the blog data from this backup file?'
                  );
                  if (!confirmed) return;

                  setImportingBackup(true);
                  setRestoreSummary(null);

                  try {
                    const text = await backupFile.text();
                    const parsedData = JSON.parse(text);
                    const result = await client.backup.restoreBackup(parsedData, { mode: backupRestoreMode });

                    if (result.success) {
                      setRestoreSummary({
                        success: true,
                        text: `Restored: ${result.restored.posts} posts, ${result.restored.categories} categories, ${result.restored.tags} tags, ${result.restored.authors} authors, ${result.restored.media} media records.`,
                      });
                      setToastMessage({
                        text: 'Backup restored successfully! All data has been synchronized.',
                        type: 'success',
                      });
                      client.settings.get().then((st) => setSettings((prev) => ({ ...prev, ...st })));
                    } else {
                      setRestoreSummary({
                        success: false,
                        text: `Restored partially with ${result.errors?.length || 0} issues.`,
                      });
                    }
                  } catch (err: any) {
                    setToastMessage({
                      text: `Restore failed: ${err.message || 'Invalid JSON file format'}`,
                      type: 'error',
                    });
                  } finally {
                    setImportingBackup(false);
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '13px' }}
              >
                <SettingIcons.Upload />
                <span>{importingBackup ? 'Restoring Blog Database...' : 'Restore Blog Data'}</span>
              </button>
            </div>

            {/* Restore Result Summary */}
            {restoreSummary && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: restoreSummary.success ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${restoreSummary.success ? '#bbf7d0' : '#fef08a'}`,
                  color: restoreSummary.success ? '#166534' : '#854d0e',
                  fontSize: '13px',
                }}
              >
                <strong>{restoreSummary.success ? 'Restore Complete: ' : 'Restore Notice: '}</strong>
                {restoreSummary.text}
              </div>
            )}
          </div>

          {/* Card 3: Disaster Recovery & Cloud Media Protection */}
          <div className="zw-admin-card" style={{ padding: '20px 24px', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: '#059669', display: 'flex' }}>
                <SettingIcons.ShieldCheck />
              </span>
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>
                Disaster Recovery & Media Storage Safeguards
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.6 }}>
              <strong>Images & Media:</strong> Uploaded images are stored in your hardened cloud storage bucket (Supabase Storage / S3). If the server or database crashes, your media files remain safe in the bucket. Restoring a backup automatically re-connects all image URLs and captions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
