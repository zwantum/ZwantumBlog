import React, { useState, useEffect } from 'react';
import '../styles/content.css';
import { useOptionalBlog } from '../context/BlogProvider';
import { TableOfContents, injectHeadingIds } from './TableOfContents';

export interface TiptapNode {
  type?: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  text?: string;
}

export interface BlogContentProps {
  content?: TiptapNode | Record<string, any> | string | null;
  className?: string;
  enableDropCap?: boolean;
  enableTableOfContents?: boolean;
  customRenderers?: Record<string, (node: TiptapNode, index: number) => React.ReactNode>;
}

export const BlogContent: React.FC<BlogContentProps> = ({
  content,
  className = 'zw-blog-prose',
  enableDropCap,
  enableTableOfContents,
  customRenderers = {},
}) => {
  const blog = useOptionalBlog();
  const [contextDropCap, setContextDropCap] = useState(false);
  const [contextToc, setContextToc] = useState(true);

  useEffect(() => {
    if (enableDropCap !== undefined && enableTableOfContents !== undefined) return;
    if (blog) {
      blog.settings
        .get()
        .then((st) => {
          if (st) {
            if (enableDropCap === undefined) {
              setContextDropCap(!!st.enableDropCap);
            }
            if (enableTableOfContents === undefined) {
              setContextToc(st.enableTableOfContents !== false);
            }
          }
        })
        .catch(() => {});
    }
  }, [blog, enableDropCap, enableTableOfContents]);

  if (!content) return null;

  const showDropCap = enableDropCap !== undefined ? enableDropCap : contextDropCap;
  const showToc = enableTableOfContents !== undefined ? enableTableOfContents : contextToc;
  const dropCapClass = showDropCap ? 'has-drop-cap' : '';

  // If passed raw string, check if it's stringified JSON first
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.includes('"type"')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && Array.isArray(parsed.content)) {
          return (
            <>
              {showToc && <TableOfContents content={parsed} />}
              <div className={`zw-blog-content ${className} ${dropCapClass}`}>
                {parsed.content.map((node: TiptapNode, index: number) => renderNode(node, index, customRenderers))}
              </div>
            </>
          );
        }
      } catch {}
    }

    const processedHtml = injectHeadingIds(content);
    return (
      <>
        {showToc && <TableOfContents content={content} />}
        <div
          className={`zw-blog-content ${className} ${dropCapClass}`}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      </>
    );
  }

  const doc = content as TiptapNode;
  if (!doc.content || !Array.isArray(doc.content)) {
    return null;
  }

  return (
    <>
      {showToc && <TableOfContents content={content} />}
      <div className={`zw-blog-content ${className} ${dropCapClass}`}>
        {doc.content.map((node, index) => renderNode(node, index, customRenderers))}
      </div>
    </>
  );
};

function renderNode(
  node: TiptapNode,
  index: number,
  customRenderers: Record<string, (node: TiptapNode, index: number) => React.ReactNode>
): React.ReactNode {
  if (node.type && customRenderers[node.type]) {
    return customRenderers[node.type](node, index);
  }

  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 2;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const rawText = (node.content || []).map((c) => c.text || '').join('');
      const headingId =
        rawText
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '') || `section-${index}`;
      return (
        <Tag key={index} id={headingId}>
          {renderChildren(node.content, customRenderers)}
        </Tag>
      );
    }

    case 'paragraph': {
      return <p key={index}>{renderChildren(node.content, customRenderers)}</p>;
    }

    case 'bulletList': {
      return <ul key={index}>{renderChildren(node.content, customRenderers)}</ul>;
    }

    case 'orderedList': {
      return (
        <ol key={index} start={node.attrs?.start || 1}>
          {renderChildren(node.content, customRenderers)}
        </ol>
      );
    }

    case 'listItem': {
      return <li key={index}>{renderChildren(node.content, customRenderers)}</li>;
    }

    case 'taskList': {
      return <ul key={index} className="zw-blog-task-list">{renderChildren(node.content, customRenderers)}</ul>;
    }

    case 'taskItem': {
      const checked = !!node.attrs?.checked;
      return (
        <li key={index} className="zw-blog-task-item" style={{ listStyleType: 'none' }}>
          <input type="checkbox" checked={checked} readOnly style={{ marginRight: '8px' }} />
          {renderChildren(node.content, customRenderers)}
        </li>
      );
    }

    case 'blockquote': {
      return <blockquote key={index}>{renderChildren(node.content, customRenderers)}</blockquote>;
    }

    case 'codeBlock': {
      const language = node.attrs?.language || '';
      return (
        <pre key={index} data-language={language}>
          <code>{renderChildren(node.content, customRenderers)}</code>
        </pre>
      );
    }

    case 'horizontalRule': {
      return <hr key={index} />;
    }

    case 'image': {
      const captionText = node.attrs?.caption || node.attrs?.title;
      return (
        <figure key={index} className="blog-figure zw-blog-image-figure">
          <img
            src={node.attrs?.src}
            alt={node.attrs?.alt || ''}
            title={node.attrs?.title || ''}
            loading="lazy"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
          />
          {captionText && (
            <figcaption className="blog-figcaption" style={{ fontSize: '0.85em', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
              {captionText}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'figure': {
      return (
        <figure key={index} className={`blog-figure ${node.attrs?.class || ''}`}>
          {renderChildren(node.content, customRenderers)}
        </figure>
      );
    }

    case 'figcaption': {
      return (
        <figcaption key={index} className={`blog-figcaption ${node.attrs?.class || ''}`}>
          {renderChildren(node.content, customRenderers)}
        </figcaption>
      );
    }

    case 'img': {
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt || ''}
          title={node.attrs?.title || ''}
          className={node.attrs?.class || ''}
          loading="lazy"
          style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
        />
      );
    }

    case 'youtube': {
      return (
        <div key={index} className="zw-blog-youtube-embed" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, margin: '1.5em 0' }}>
          <iframe
            src={node.attrs?.src}
            title="Embedded Video"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, borderRadius: '8px' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    case 'blogCallout': {
      const type = node.attrs?.type || 'info';
      return (
        <div key={index} className={`zw-blog-callout zw-blog-callout--${type}`}>
          {renderChildren(node.content, customRenderers)}
        </div>
      );
    }

    case 'blogCTA': {
      return (
        <div key={index} className="zw-blog-cta">
          <div className="zw-blog-cta-content">
            <h4 className="zw-blog-cta-title">{node.attrs?.title || 'Take the Next Step'}</h4>
            {node.attrs?.description && <p className="zw-blog-cta-desc">{node.attrs.description}</p>}
          </div>
          <a href={node.attrs?.buttonUrl || '#'} className="zw-blog-cta-btn" target="_blank" rel="noopener noreferrer">
            {node.attrs?.buttonText || 'Learn More'}
          </a>
        </div>
      );
    }

    case 'blogFAQ': {
      return (
        <details key={index} className="zw-blog-faq">
          <summary className="zw-blog-faq-question">{node.attrs?.question}</summary>
          <div className="zw-blog-faq-answer">{node.attrs?.answer}</div>
        </details>
      );
    }

    case 'table': {
      return (
        <div key={index} className="zw-blog-table-wrap" style={{ overflowX: 'auto', margin: '1.8em 0', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <tbody>{renderChildren(node.content, customRenderers)}</tbody>
          </table>
        </div>
      );
    }

    case 'tableRow': {
      return (
        <tr key={index} style={{ borderBottom: '1px solid #cbd5e1' }}>
          {renderChildren(node.content, customRenderers)}
        </tr>
      );
    }

    case 'tableHeader': {
      const colSpan = node.attrs?.colspan || undefined;
      const rowSpan = node.attrs?.rowspan || undefined;
      const colwidth = node.attrs?.colwidth;
      const width = Array.isArray(colwidth) && colwidth[0] ? `${colwidth[0]}px` : undefined;
      return (
        <th
          key={index}
          colSpan={colSpan}
          rowSpan={rowSpan}
          style={{
            border: '1px solid #cbd5e1',
            padding: '12px 16px',
            background: '#f8fafc',
            fontWeight: 600,
            color: '#0f172a',
            width,
          }}
        >
          {renderChildren(node.content, customRenderers)}
        </th>
      );
    }

    case 'tableCell': {
      const colSpan = node.attrs?.colspan || undefined;
      const rowSpan = node.attrs?.rowspan || undefined;
      const colwidth = node.attrs?.colwidth;
      const width = Array.isArray(colwidth) && colwidth[0] ? `${colwidth[0]}px` : undefined;
      return (
        <td
          key={index}
          colSpan={colSpan}
          rowSpan={rowSpan}
          style={{
            border: '1px solid #cbd5e1',
            padding: '12px 16px',
            color: '#334155',
            background: '#ffffff',
            width,
          }}
        >
          {renderChildren(node.content, customRenderers)}
        </td>
      );
    }

    default: {
      return <div key={index}>{renderChildren(node.content, customRenderers)}</div>;
    }
  }
}

function renderChildren(
  children?: TiptapNode[],
  customRenderers: Record<string, (node: TiptapNode, index: number) => React.ReactNode> = {}
): React.ReactNode {
  if (!children || !Array.isArray(children)) return null;

  return children.map((child, idx) => {
    if (child.type === 'text' && typeof child.text === 'string') {
      return applyMarks(child.text, child.marks, idx);
    }
    return renderNode(child, idx, customRenderers);
  });
}

function applyMarks(
  text: string,
  marks?: Array<{ type: string; attrs?: Record<string, any> }>,
  key?: number
): React.ReactNode {
  if (!marks || marks.length === 0) return text;

  return marks.reduce<React.ReactNode>((acc, mark, markIdx) => {
    const k = `${key}-${markIdx}`;
    switch (mark.type) {
      case 'bold':
        return <strong key={k}>{acc}</strong>;
      case 'italic':
        return <em key={k}>{acc}</em>;
      case 'underline':
        return <u key={k}>{acc}</u>;
      case 'strike':
        return <s key={k}>{acc}</s>;
      case 'code':
        return <code key={k}>{acc}</code>;
      case 'highlight':
        return (
          <mark key={k} style={{ backgroundColor: mark.attrs?.color || '#fef08a', padding: '0 2px' }}>
            {acc}
          </mark>
        );
      case 'link':
        return (
          <a
            key={k}
            href={mark.attrs?.href}
            target={mark.attrs?.target || '_blank'}
            rel="noopener noreferrer"
            style={{ color: '#4f46e5', textDecoration: 'underline' }}
          >
            {acc}
          </a>
        );
      case 'blogCitation':
      case 'citation':
        return (
          <a
            key={k}
            href={mark.attrs?.href || '#'}
            target={mark.attrs?.target || '_blank'}
            rel={mark.attrs?.rel === 'dofollow' ? 'noopener' : 'nofollow noopener'}
            data-citation="true"
            className="blog-citation"
          >
            {acc}
          </a>
        );
      default:
        return acc;
    }
  }, text);
}
