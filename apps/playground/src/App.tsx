import { useState, useMemo } from 'react';
import { createBlogClient } from '@zwantum/blog-core';
import { BlogProvider } from '@zwantum/blog-react';
import { MemoryDatabaseAdapter } from '@zwantum/blog-core';
import { MemoryStorageAdapter } from '@zwantum/blog-storage';

import { EditorialDesign } from './designs/EditorialDesign';
import { MinimalNewsDesign } from './designs/MinimalNewsDesign';
import { HostDashboard } from './dashboard/HostDashboard';

export default function App() {
  const [viewMode, setViewMode] = useState<'editorial' | 'minimal' | 'dashboard'>('dashboard');

  // Unified singleton blog client instance for the playground session
  const blogClient = useMemo(() => {
    const db = new MemoryDatabaseAdapter(true); // Seed with sample posts
    const storage = new MemoryStorageAdapter();
    return createBlogClient({ db, storage });
  }, []);

  return (
    <BlogProvider client={blogClient}>
      <div>
        {/* FLOATING SHOWCASE SWITCHER (NON-INTRUSIVE BOTTOM PILL) */}
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '5px 8px',
            borderRadius: '30px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('dashboard')}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: viewMode === 'dashboard' ? '#ffcc00' : 'transparent',
              color: viewMode === 'dashboard' ? '#0f172a' : '#94a3b8',
              fontWeight: viewMode === 'dashboard' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setViewMode('editorial')}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: viewMode === 'editorial' ? '#ffcc00' : 'transparent',
              color: viewMode === 'editorial' ? '#0f172a' : '#94a3b8',
              fontWeight: viewMode === 'editorial' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Design A
          </button>
          <button
            type="button"
            onClick={() => setViewMode('minimal')}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              background: viewMode === 'minimal' ? '#ffcc00' : 'transparent',
              color: viewMode === 'minimal' ? '#0f172a' : '#94a3b8',
              fontWeight: viewMode === 'minimal' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Design B
          </button>
        </div>

        {/* ACTIVE VIEW */}
        {viewMode === 'editorial' && <EditorialDesign />}
        {viewMode === 'minimal' && <MinimalNewsDesign />}
        {viewMode === 'dashboard' && <HostDashboard client={blogClient} />}
      </div>
    </BlogProvider>
  );
}
