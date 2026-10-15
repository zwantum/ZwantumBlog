import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BlogEditorConfig, BlogEditorHandle } from '@zwantum/blog-types';
import { getBlogEditorExtensions } from '../extensions';
import { EditorToolbar } from './EditorToolbar';
import { EditorBubbleMenu } from './BubbleMenu';
import { useAutosave } from '../hooks/useAutosave';
import '../styles/editor.css';

export type { BlogEditorHandle } from '@zwantum/blog-types';

export interface BlogEditorProps {
  content?: Record<string, unknown> | string;
  onChange?: (contentJson: Record<string, unknown>, contentHtml: string) => void;
  config?: BlogEditorConfig;
  placeholder?: string;
  readOnly?: boolean;
  onOpenMediaLibrary?: () => void;
  onAutosave?: (contentJson: Record<string, unknown>) => Promise<void> | void;
  enableAutosave?: boolean;
  className?: string;
}

export function formatHtml(html: string): string {
  if (!html) return '';
  try {
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    const tokens = html.replace(/>\s*</g, '><').match(/<[^>]+>|[^<]+/g) || [];
    const selfClosing = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i;

    tokens.forEach((token) => {
      if (token.startsWith('</')) {
        indent = Math.max(0, indent - 1);
        formatted += '\n' + tab.repeat(indent) + token;
      } else if (token.startsWith('<') && !token.startsWith('<!')) {
        formatted += '\n' + tab.repeat(indent) + token;
        const tagName = token.match(/<([a-zA-Z0-9-]+)/)?.[1];
        const isSelf = token.endsWith('/>') || (tagName && selfClosing.test(tagName));
        if (!isSelf) {
          indent++;
        }
      } else {
        const trimmed = token.trim();
        if (trimmed) {
          formatted += trimmed;
        }
      }
    });

    const res = formatted.trim();
    return res || html;
  } catch (err) {
    console.warn('formatHtml error:', err);
    return html;
  }
}

export const BlogEditor = forwardRef<BlogEditorHandle, BlogEditorProps>(({
  content,
  onChange,
  config,
  readOnly = false,
  onOpenMediaLibrary,
  onAutosave,
  enableAutosave = true,
  className = '',
}, ref) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Dual-mode source code editor states
  const [isCodeView, setIsCodeView] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const codeGutterRef = useRef<HTMLDivElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const extensions = useMemo(() => getBlogEditorExtensions(config), [config]);

  const initialContent = useMemo(() => {
    if (!content) return { type: 'doc', content: [{ type: 'paragraph' }] };
    return content;
  }, [content]);

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'tiptap ProseMirror focus:outline-none',
        style: 'min-height: 280px; outline: none;',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as Record<string, unknown>;
      const html = editor.getHTML();

      // Calculate counts
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);

      setCurrentJson(json);

      if (onChange) {
        onChange(json, html);
      }
    },
  });

  // Synchronize Code View on Scroll
  const handleCodeScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (codeGutterRef.current) {
      codeGutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Toggle between WYSIWYG Visual view and Raw HTML Source Code view
  const handleToggleCodeView = () => {
    if (!editor) return;

    if (!isCodeView) {
      // Switching to HTML View: serialize document to clean indented HTML
      try {
        const html = editor.getHTML() || '';
        let formatted = '';
        try {
          formatted = formatHtml(html);
        } catch {
          formatted = html;
        }
        setCodeContent(formatted || html || '<p></p>');
      } catch (err) {
        console.error('Failed to get HTML from editor:', err);
        setCodeContent('<p></p>');
      }
      setIsCodeView(true);
    } else {
      // Switching back to Visual View: parse edited HTML back into TipTap
      try {
        editor.commands.setContent(codeContent || '<p></p>', false);
        const json = editor.getJSON() as Record<string, unknown>;
        const html = editor.getHTML();
        setCurrentJson(json);
        if (onChange) {
          onChange(json, html);
        }
      } catch (err) {
        console.error('Failed to parse HTML back to editor:', err);
      }
      setIsCodeView(false);
    }
  };

  // Expose imperative handle for synchronous flush & snapshot extraction & image insertion
  useImperativeHandle(ref, () => ({
    flush: () => {
      if (!editor) {
        return {
          html: '',
          json: { type: 'doc', content: [{ type: 'paragraph' }] },
          isEmpty: true,
        };
      }
      // If currently in code view, commit the edited HTML to TipTap first
      if (isCodeView) {
        editor.commands.setContent(codeContent, false);
      }
      const json = editor.getJSON() as Record<string, unknown>;
      const html = editor.getHTML();
      const text = editor.getText();
      const isEmpty = !text.trim() || html === '<p></p>' || html === '';
      return { html, json, isEmpty };
    },
    getHTML: () => {
      if (isCodeView) return codeContent;
      return editor ? editor.getHTML() : '';
    },
    getJSON: () => (editor ? (editor.getJSON() as Record<string, unknown>) : { type: 'doc', content: [{ type: 'paragraph' }] }),
    focus: () => {
      if (isCodeView) {
        codeTextareaRef.current?.focus();
      } else {
        editor?.commands.focus();
      }
    },
    isEmpty: () => {
      if (!editor) return true;
      if (isCodeView) return !codeContent.trim();
      const text = editor.getText();
      const html = editor.getHTML();
      return !text.trim() || html === '<p></p>' || html === '';
    },
    insertImage: (src: string, alt?: string, caption?: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: {
          src,
          alt: alt || '',
          caption: caption || undefined,
        },
      }).run();
    },
  }), [editor, isCodeView, codeContent]);

  // Calculate reading time
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Autosave setup
  const [currentJson, setCurrentJson] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (editor) {
      setCurrentJson(editor.getJSON() as Record<string, unknown>);
    }
  }, [editor]);

  const { isSaving, lastSaved } = useAutosave({
    data: currentJson,
    onSave: async (json) => {
      if (onAutosave) {
        await onAutosave(json);
      }
    },
    enabled: enableAutosave && !!onAutosave && !readOnly,
    debounceMs: 3000,
  });

  // Keep content in sync only if incoming content differs from current editor state
  useEffect(() => {
    if (editor && content && !editor.isFocused && !isCodeView) {
      const currentStr = JSON.stringify(editor.getJSON());
      const incomingStr = JSON.stringify(content);
      if (currentStr !== incomingStr) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor, isCodeView]);

  const codeLines = useMemo(() => {
    if (!codeContent || typeof codeContent !== 'string') return ['1'];
    const lines = codeContent.split('\n');
    return lines.length > 0 ? lines : ['1'];
  }, [codeContent]);

  return (
    <div className={`zw-blog-editor-container ${className}`}>
      {!readOnly && (
        <>
          <EditorToolbar
            editor={editor}
            onOpenMediaLibrary={onOpenMediaLibrary}
            isCodeView={isCodeView}
            onToggleCodeView={handleToggleCodeView}
          />
          {/* Keep EditorBubbleMenu mounted inside DOM to prevent TipTap plugin unmount crash */}
          <div style={{ display: isCodeView ? 'none' : 'block' }}>
            <EditorBubbleMenu editor={editor} />
          </div>
        </>
      )}

      {/* CRUCIAL (Crash Prevention): TipTap EditorContent is NEVER unmounted. It is kept mounted in DOM with display: none */}
      <div
        className="zw-blog-editor-content"
        style={{ display: isCodeView ? 'none' : 'block', cursor: 'text' }}
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.commands.focus('end');
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Dual-Mode HTML Source Code View Panel */}
      {isCodeView && (
        <div
          className="zw-blog-code-view-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#0f172a',
            color: '#f8fafc',
            borderTop: '1px solid #1e293b',
            minHeight: '420px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="zw-blog-code-view-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: '#1e293b',
              borderBottom: '1px solid #334155',
            }}
          >
            <div
              className="zw-blog-code-view-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              <span style={{ fontSize: '14px', color: '#38bdf8', fontFamily: 'monospace' }}>&lt;/&gt;</span>
              <span>HTML Source Code</span>
            </div>

            <div className="zw-blog-code-view-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={`zw-blog-code-action-btn ${isWordWrap ? 'is-active' : ''}`}
                onClick={() => setIsWordWrap((prev) => !prev)}
                title="Toggle Word Wrap"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isWordWrap ? '#ffffff' : '#cbd5e1',
                  background: isWordWrap ? '#0284c7' : '#334155',
                  border: isWordWrap ? '1px solid #38bdf8' : '1px solid #475569',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Wrap: {isWordWrap ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                className="zw-blog-code-action-btn"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(codeContent);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }
                }}
                title="Copy HTML to clipboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  background: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                {isCopied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: '#86efac' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy HTML
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            className="zw-blog-code-view-editor"
            style={{
              display: 'flex',
              position: 'relative',
              height: '420px',
              minHeight: '380px',
              overflow: 'hidden',
              background: '#0f172a',
            }}
          >
            {/* Line Numbers Gutter */}
            <div
              ref={codeGutterRef}
              className="zw-blog-code-gutter"
              aria-hidden="true"
              style={{
                width: '52px',
                padding: '16px 8px 16px 4px',
                background: '#090d16',
                borderRight: '1px solid #1e293b',
                color: '#64748b',
                fontFamily: 'monospace, Consolas, "Courier New", Courier',
                fontSize: '13px',
                lineHeight: '1.6',
                textAlign: 'right',
                userSelect: 'none',
                overflowY: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              {codeLines.map((_, i) => (
                <div key={i} className="zw-blog-code-gutter-line" style={{ minHeight: '20.8px' }}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Input Area */}
            <textarea
              ref={codeTextareaRef}
              className={`zw-blog-code-textarea ${isWordWrap ? 'wrap' : 'nowrap'}`}
              value={codeContent}
              onChange={(e) => {
                const val = e.target.value;
                setCodeContent(val);
                // Real-time word and char count updates in code mode
                setCharCount(val.length);
                const words = val.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
                setWordCount(words);
              }}
              onScroll={handleCodeScroll}
              spellCheck={false}
              placeholder="<!-- Write or paste valid HTML source code here -->"
              style={{
                flex: 1,
                padding: '16px',
                background: '#0f172a',
                color: '#f1f5f9',
                border: 'none',
                outline: 'none',
                fontFamily: 'monospace, Consolas, "Courier New", Courier',
                fontSize: '13px',
                lineHeight: '1.6',
                resize: 'none',
                overflowY: 'auto',
                tabSize: 2,
                boxSizing: 'border-box',
                whiteSpace: isWordWrap ? 'pre-wrap' : 'pre',
                wordBreak: isWordWrap ? 'break-all' : 'normal',
                overflowX: isWordWrap ? 'hidden' : 'auto',
              }}
            />
          </div>
        </div>
      )}

      <div className="zw-blog-editor-footer">
        <div className="zw-blog-editor-stats">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>~{readingTime} min read</span>
          {isCodeView && <span style={{ color: '#0284c7', fontWeight: 600 }}>{codeLines.length} lines (HTML)</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {enableAutosave && onAutosave && (
            <div className="zw-blog-editor-autosave">
              <span className={`zw-autosave-dot ${isSaving ? 'saving' : ''}`} />
              <span>
                {isSaving
                  ? 'Autosaving changes...'
                  : lastSaved
                  ? `Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'All changes saved'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

BlogEditor.displayName = 'BlogEditor';
