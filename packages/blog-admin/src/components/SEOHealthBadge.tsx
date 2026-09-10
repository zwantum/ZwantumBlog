import React, { useState } from 'react';
import { SEOHealthReport } from '@zwantum/blog-types';

export interface SEOHealthBadgeProps {
  report: SEOHealthReport;
  compact?: boolean;
}

export const SEOHealthBadge: React.FC<SEOHealthBadgeProps> = ({ report, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  let badgeColor = '#10b981'; // Green
  let badgeBg = '#dcfce7';
  if (report.score < 50) {
    badgeColor = '#ef4444';
    badgeBg = '#fee2e2';
  } else if (report.score < 80) {
    badgeColor = '#f59e0b';
    badgeBg = '#fef3c7';
  }

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          background: badgeBg,
          color: badgeColor,
        }}
      >
        SEO: {report.score}/100
      </span>
    );
  }

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          cursor: 'pointer',
          background: '#f8fafc',
          borderBottom: expanded ? '1px solid #e2e8f0' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: badgeBg,
              color: badgeColor,
              fontWeight: 800,
              fontSize: '12px',
            }}
          >
            {report.score}
          </span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>SEO Health Check</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {report.passedCount} passed • {report.warningCount} recommendations
            </div>
          </div>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b' }}>{expanded ? '▲ Hide' : '▼ Details'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '12px 16px', maxHeight: '280px', overflowY: 'auto' }}>
          {report.checks.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '12px',
                marginBottom: '8px',
                lineHeight: 1.4,
              }}
            >
              <span>{c.passed ? '✓' : c.type === 'error' ? '❌' : '⚠️'}</span>
              <div>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{c.label}: </span>
                <span style={{ color: '#475569' }}>{c.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
