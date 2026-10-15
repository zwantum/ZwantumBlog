import React, { useState, useEffect, useMemo } from 'react';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  content?: any;
  headings?: TocHeading[];
  title?: string;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  minHeadings?: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extracts plain text from a Tiptap node recursively
 */
function extractTextFromNode(node: any): string {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join('');
  }
  return '';
}

/**
 * Extracts H1, H2, H3, and H4 headings from Tiptap JSON or an HTML string
 */
export function extractHeadings(content: any): TocHeading[] {
  if (!content) return [];

  // If passed as a JSON string, try parsing it
  if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
    try {
      const parsed = JSON.parse(content);
      if (parsed) return extractHeadings(parsed);
    } catch {}
  }

  const headings: TocHeading[] = [];
  const idCounts: Record<string, number> = {};

  const makeUniqueId = (base: string) => {
    const clean = slugify(base) || 'section';
    if (!idCounts[clean]) {
      idCounts[clean] = 1;
      return clean;
    }
    idCounts[clean]++;
    return `${clean}-${idCounts[clean]}`;
  };

  // If HTML string
  if (typeof content === 'string') {
    const regex = /<h([1-4])([^>]*)>(.*?)<\/h\1>/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const level = parseInt(match[1], 10);
      const attrs = match[2];
      const rawHtml = match[3];
      const plainText = rawHtml.replace(/<[^>]+>/g, '').trim();

      if (!plainText) continue;

      // Extract existing id if present
      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const id = idMatch ? idMatch[1] : makeUniqueId(plainText);

      headings.push({ id, text: plainText, level });
    }
    return headings;
  }

  // If Tiptap JSON document or node list (traverse recursively)
  const traverseNodes = (nodes: any[]) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (node && node.type === 'heading') {
        const level = node.attrs?.level || 2;
        if (level >= 1 && level <= 4) {
          const text = extractTextFromNode(node).trim();
          if (text) {
            const id = makeUniqueId(text);
            headings.push({ id, text, level });
          }
        }
      }
      if (node && node.content && Array.isArray(node.content)) {
        traverseNodes(node.content);
      }
    }
  };

  if (content && typeof content === 'object') {
    if (Array.isArray(content.content)) {
      traverseNodes(content.content);
    } else if (Array.isArray(content)) {
      traverseNodes(content);
    }
  }

  return headings;
}

/**
 * Injects deterministic id attributes into H1-H4 tags in an HTML string
 */
export function injectHeadingIds(html: string): string {
  if (!html) return '';
  const idCounts: Record<string, number> = {};

  return html.replace(/<h([1-4])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, innerText) => {
    // If id already exists, keep it
    if (/id=["'][^"']+["']/i.test(attrs)) {
      return match;
    }
    const plainText = innerText.replace(/<[^>]+>/g, '').trim();
    const base = slugify(plainText) || `heading-${level}`;
    let uniqueId = base;
    if (idCounts[base]) {
      idCounts[base]++;
      uniqueId = `${base}-${idCounts[base]}`;
    } else {
      idCounts[base] = 1;
    }
    return `<h${level}${attrs} id="${uniqueId}">${innerText}</h${level}>`;
  });
}

/**
 * Automated Table of Contents Component with Scroll-Spy & Smooth Navigation
 */
export const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  headings: customHeadings,
  title = 'Table of Contents',
  className = '',
  collapsible = true,
  defaultOpen = false,
  minHeadings = 1,
}) => {
  const headings = useMemo(() => {
    if (customHeadings && customHeadings.length > 0) return customHeadings;
    return extractHeadings(content);
  }, [content, customHeadings]);

  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Active heading scroll-spy
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: '0px 0px -65% 0px',
        threshold: 0.1,
      }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < minHeadings) {
    return null;
  }

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveId(id);
      try {
        window.history.pushState(null, '', `#${id}`);
      } catch {}
    }
  };

  return (
    <nav
      className={`zw-blog-toc ${className}`}
      aria-label="Table of contents"
      style={{
        margin: '28px 0',
        padding: '16px 20px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: 'none',
        }}
        onClick={() => collapsible && setIsOpen((prev) => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#b45309"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>
            {title}
          </span>
        </div>

        {collapsible && (
          <button
            type="button"
            aria-label={isOpen ? 'Collapse table of contents' : 'Expand table of contents'}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <ul
          style={{
            margin: '12px 0 0',
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '12px',
          }}
        >
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id;
            const isSubheading = heading.level > 2;

            return (
              <li
                key={heading.id}
                style={{
                  paddingLeft: isSubheading ? '16px' : '0',
                }}
              >
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleScrollTo(e, heading.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: isSubheading ? '12.5px' : '13.5px',
                    color: isActive ? '#b45309' : isSubheading ? '#64748b' : '#334155',
                    fontWeight: isActive ? 600 : isSubheading ? 400 : 500,
                    textDecoration: 'none',
                    lineHeight: 1.4,
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = isSubheading ? '#64748b' : '#334155';
                  }}
                >
                  <span
                    style={{
                      fontSize: isSubheading ? '11px' : '12px',
                      fontWeight: 600,
                      color: isActive ? '#b45309' : '#94a3b8',
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: isSubheading ? '20px' : '18px',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}.
                  </span>
                  <span>{heading.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
};
