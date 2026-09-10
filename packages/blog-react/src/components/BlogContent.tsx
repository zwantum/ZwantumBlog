import React from 'react';

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
  customRenderers?: Record<string, (node: TiptapNode, index: number) => React.ReactNode>;
}

export const BlogContent: React.FC<BlogContentProps> = ({
  content,
  className = 'zw-blog-prose',
  customRenderers = {},
}) => {
  if (!content) return null;

  // If passed raw HTML string, fallback to dangerouslySetInnerHTML safely
  if (typeof content === 'string') {
    return <div className={className} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const doc = content as TiptapNode;
  if (!doc.content || !Array.isArray(doc.content)) {
    return null;
  }

  return (
    <div className={`zw-blog-content ${className}`}>
      {doc.content.map((node, index) => renderNode(node, index, customRenderers))}
    </div>
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
      return <Tag key={index}>{renderChildren(node.content, customRenderers)}</Tag>;
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
      return (
        <figure key={index} className="zw-blog-image-figure">
          <img
            src={node.attrs?.src}
            alt={node.attrs?.alt || ''}
            title={node.attrs?.title || ''}
            loading="lazy"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
          />
          {node.attrs?.title && <figcaption style={{ fontSize: '0.85em', color: '#64748b', marginTop: '6px' }}>{node.attrs.title}</figcaption>}
        </figure>
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
        <div key={index} className="zw-blog-table-wrap" style={{ overflowX: 'auto', margin: '1.2em 0' }}>
          <table>
            <tbody>{renderChildren(node.content, customRenderers)}</tbody>
          </table>
        </div>
      );
    }

    case 'tableRow': {
      return <tr key={index}>{renderChildren(node.content, customRenderers)}</tr>;
    }

    case 'tableHeader': {
      return <th key={index}>{renderChildren(node.content, customRenderers)}</th>;
    }

    case 'tableCell': {
      return <td key={index}>{renderChildren(node.content, customRenderers)}</td>;
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
      default:
        return acc;
    }
  }, text);
}
