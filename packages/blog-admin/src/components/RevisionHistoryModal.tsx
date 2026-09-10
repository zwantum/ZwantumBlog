import React, { useState, useEffect } from 'react';
import { PostRevision, Post } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface RevisionHistoryModalProps {
  postId: string;
  client: BlogClient;
  isOpen: boolean;
  onClose: () => void;
  onRestored: (restoredPost: Post) => void;
}

export const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({
  postId,
  client,
  isOpen,
  onClose,
  onRestored,
}) => {
  const [revisions, setRevisions] = useState<PostRevision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<PostRevision | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      client.revisions
        .getRevisions(postId)
        .then((revs) => {
          setRevisions(revs);
          if (revs.length > 0) setSelectedRevision(revs[0]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, postId, client]);

  if (!isOpen) return null;

  const handleRestore = async () => {
    if (!selectedRevision) return;
    if (!window.confirm('Restore this revision? Your current draft will be automatically backed up.')) return;

    setRestoring(true);
    try {
      const restored = await client.revisions.restoreRevision(postId, selectedRevision.id);
      onRestored(restored);
      onClose();
    } catch (err) {
      alert(`Failed to restore: ${err}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="zw-admin-modal-overlay">
      <div className="zw-admin-modal" style={{ maxWidth: '850px' }}>
        <div className="zw-admin-modal-header">
          <span>Revision History</span>
          <button type="button" className="zw-admin-btn zw-admin-btn-secondary zw-admin-btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="zw-admin-modal-body" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', minHeight: '380px' }}>
          {/* Revisions sidebar list */}
          <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '16px', overflowY: 'auto' }}>
            {loading ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading revisions...</p>
            ) : revisions.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>No previous revisions found.</p>
            ) : (
              revisions.map((r, idx) => {
                const isSelected = selectedRevision?.id === r.id;
                const date = new Date(r.created_at).toLocaleString();
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRevision(r)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      background: isSelected ? '#eef2ff' : '#f8fafc',
                      border: '1px solid',
                      borderColor: isSelected ? '#6366f1' : '#e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                      {idx === 0 ? 'Current / Latest' : `Revision #${revisions.length - idx}`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{date}</div>
                    {r.summary && <div style={{ fontSize: '11px', color: '#4f46e5', marginTop: '4px' }}>{r.summary}</div>}
                  </div>
                );
              })
            )}
          </div>

          {/* Revision Preview Area */}
          <div style={{ overflowY: 'auto' }}>
            {selectedRevision ? (
              <div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#0f172a' }}>{selectedRevision.title}</h3>
                {selectedRevision.excerpt && (
                  <p style={{ fontStyle: 'italic', color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>
                    {selectedRevision.excerpt}
                  </p>
                )}
                <div style={{ border: '1px solid #f1f5f9', background: '#fafafa', borderRadius: '8px', padding: '16px', maxHeight: '280px', overflowY: 'auto', fontSize: '13px' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {JSON.stringify(selectedRevision.content, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8' }}>Select a revision to view its snapshot</p>
            )}
          </div>
        </div>

        <div className="zw-admin-modal-footer">
          <button type="button" className="zw-admin-btn zw-admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="zw-admin-btn zw-admin-btn-primary"
            disabled={!selectedRevision || restoring}
            onClick={handleRestore}
          >
            {restoring ? 'Restoring...' : 'Restore Selected Revision'}
          </button>
        </div>
      </div>
    </div>
  );
};
