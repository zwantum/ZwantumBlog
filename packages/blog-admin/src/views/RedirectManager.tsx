import React, { useState, useEffect, useCallback } from 'react';
import { BlogClient } from '@zwantum/blog-core';
import { BlogRedirect, CreateRedirectInput, RedirectStatusCode } from '@zwantum/blog-types';

export interface RedirectManagerProps {
  client: BlogClient;
  className?: string;
}

export const RedirectManager: React.FC<RedirectManagerProps> = ({ client, className = '' }) => {
  const [redirects, setRedirects] = useState<BlogRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCode, setFilterCode] = useState<'all' | '301' | '302'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Redirect Form State
  const [sourceUrl, setSourceUrl] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [statusCode, setStatusCode] = useState<RedirectStatusCode>(301);
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Success / Info Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadRedirects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.redirects.getAll({ page: 1, limit: 1000 });
      setRedirects(res?.data || []);
    } catch (err: any) {
      console.error('Failed to load redirects:', err);
      showToast('Could not fetch redirects', 'error');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadRedirects();
  }, [loadRedirects]);

  // Create Redirect Handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanSource = sourceUrl.trim();
    const cleanDest = destinationUrl.trim();

    if (!cleanSource) {
      setFormError('Source URL is required');
      return;
    }
    if (!cleanDest) {
      setFormError('Destination URL is required');
      return;
    }
    if (cleanSource === cleanDest) {
      setFormError('Source URL cannot be identical to Destination URL');
      return;
    }

    try {
      setCreating(true);
      await client.redirects.create({
        source_url: cleanSource.startsWith('/') || cleanSource.startsWith('http') ? cleanSource : `/${cleanSource}`,
        destination_url: cleanDest.startsWith('/') || cleanDest.startsWith('http') ? cleanDest : `/${cleanDest}`,
        status_code: statusCode,
      });

      showToast(`Redirect for "${cleanSource}" created successfully!`);
      setSourceUrl('');
      setDestinationUrl('');
      setStatusCode(301);
      setShowAddModal(false);
      loadRedirects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create redirect. A rule for this source URL may already exist.');
    } finally {
      setCreating(false);
    }
  };

  // Delete Redirect Handler
  const handleDelete = async (id: string, source: string) => {
    if (!window.confirm(`Delete 301 redirect rule for "${source}"?`)) return;

    try {
      setDeletingId(id);
      await client.redirects.delete(id);
      setRedirects((prev) => prev.filter((r) => r.id !== id));
      showToast(`Redirect rule deleted`);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete redirect', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Redirects
  const filteredRedirects = redirects.filter((r) => {
    const matchesSearch =
      !searchQuery.trim() ||
      r.source_url.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      r.destination_url.toLowerCase().includes(searchQuery.toLowerCase().trim());

    const matchesCode =
      filterCode === 'all' ||
      (filterCode === '301' && r.status_code === 301) ||
      (filterCode === '302' && r.status_code === 302);

    return matchesSearch && matchesCode;
  });

  const totalHits = redirects.reduce((sum, r) => sum + (r.hit_count || 0), 0);
  const count301 = redirects.filter((r) => r.status_code === 301).length;

  return (
    <div className={`zw-admin-redirect-manager ${className}`}>
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: toast.type === 'success' ? '#166534' : '#b91c1c',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {toast.type === 'success' ? (
              <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            )}
          </svg>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header & Primary Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>
            301 URL Redirect Manager
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Safeguard your backlinks, search engine indexing, and domain authority when slugs change.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '8px',
            background: '#ffcc00',
            color: '#0f172a',
            border: 'none',
            fontWeight: 500,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(255, 204, 0, 0.3)',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add 301 Redirect</span>
        </button>
      </div>

      {/* Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ padding: '14px 18px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Total Active Rules</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>{redirects.length}</div>
        </div>

        <div style={{ padding: '14px 18px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Permanent (301)</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#166534' }}>{count301}</div>
        </div>

        <div style={{ padding: '14px 18px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Traffic Hits Preserved</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#0284c7' }}>{totalHits.toLocaleString()}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            background: '#fafbfc',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search source or destination URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '12.5px',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#ffffff',
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(['all', '301', '302'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setFilterCode(code)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: filterCode === code ? '1px solid #ffcc00' : '1px solid #e2e8f0',
                  background: filterCode === code ? '#fffdf0' : '#ffffff',
                  color: filterCode === code ? '#0f172a' : '#64748b',
                  fontSize: '12px',
                  fontWeight: filterCode === code ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                {code === 'all' ? 'All Types' : `${code} Redirect`}
              </button>
            ))}
          </div>
        </div>

        {/* Redirects Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Source (Old URL)</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Destination (New URL)</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Hits</th>
                <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    Loading redirects...
                  </td>
                </tr>
              ) : filteredRedirects.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <div style={{ maxWidth: '380px', margin: '0 auto' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                        <polyline points="15 14 20 9 15 4" />
                        <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
                      </svg>
                      <div style={{ fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                        {searchQuery ? 'No matching redirects found' : 'No redirect rules registered yet'}
                      </div>
                      <p style={{ fontSize: '12px', margin: 0, color: '#94a3b8' }}>
                        Automatic 301 redirects are created whenever an active article&apos;s slug is updated, or you can manually add custom rules above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRedirects.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s ease' }}>
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 500, fontFamily: 'monospace', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#dc2626' }}>↳</span>
                        <span>{r.source_url}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#0369a1', fontFamily: 'monospace', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#16a34a' }}>→</span>
                        <span>{r.destination_url}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: r.status_code === 301 ? '#f0fdf4' : '#eff6ff',
                          color: r.status_code === 301 ? '#166534' : '#1d4ed8',
                          border: `1px solid ${r.status_code === 301 ? '#bbf7d0' : '#bfdbfe'}`,
                        }}
                      >
                        {r.status_code} {r.status_code === 301 ? 'Permanent' : 'Temporary'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                      <span style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px', fontWeight: 500 }}>
                        {r.hit_count || 0} hits
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id, r.source_url)}
                        disabled={deletingId === r.id}
                        title="Delete redirect rule"
                        style={{
                          border: 'none',
                          background: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Redirect Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                Add Custom URL Redirect
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '20px' }}>
              {formError && (
                <div style={{ marginBottom: '14px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12.5px', color: '#b91c1c' }}>
                  {formError}
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Source URL (Old Path) *
                </label>
                <input
                  type="text"
                  placeholder="/blog/old-article-slug"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  The old link or incoming URL visitors try to reach.
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Destination URL (New Path) *
                </label>
                <input
                  type="text"
                  placeholder="/blog/new-article-slug"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                  Where the visitor and search engine bots should be sent.
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Redirect Type
                </label>
                <select
                  value={statusCode}
                  onChange={(e) => setStatusCode(parseInt(e.target.value, 10) as RedirectStatusCode)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                  }}
                >
                  <option value={301}>301 — Permanent (Recommended for SEO & article renames)</option>
                  <option value={302}>302 — Temporary (For temporary maintenance or promos)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ffcc00',
                    color: '#0f172a',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {creating ? 'Saving...' : 'Create Redirect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
