import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BlogEditorConfig } from '@zwantum/blog-types';
import { getBlogEditorExtensions } from '../extensions';
import { EditorToolbar } from './EditorToolbar';
import { EditorBubbleMenu } from './BubbleMenu';
import { useAutosave } from '../hooks/useAutosave';
import '../styles/editor.css';

export interface BlogEditorHandle {
  flush: () => { html: string; json: Record<string, unknown>; isEmpty: boolean };
  getHTML: () => string;
  getJSON: () => Record<string, unknown>;
  focus: () => void;
  isEmpty: () => boolean;
}

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

  // Expose imperative handle for synchronous flush & snapshot extraction
  useImperativeHandle(ref, () => ({
    flush: () => {
      if (!editor) {
        return {
          html: '',
          json: { type: 'doc', content: [{ type: 'paragraph' }] },
          isEmpty: true,
        };
      }
      const json = editor.getJSON() as Record<string, unknown>;
      const html = editor.getHTML();
      const text = editor.getText();
      const isEmpty = !text.trim() || html === '<p></p>' || html === '';
      return { html, json, isEmpty };
    },
    getHTML: () => (editor ? editor.getHTML() : ''),
    getJSON: () => (editor ? (editor.getJSON() as Record<string, unknown>) : { type: 'doc', content: [{ type: 'paragraph' }] }),
    focus: () => {
      editor?.commands.focus();
    },
    isEmpty: () => {
      if (!editor) return true;
      const text = editor.getText();
      const html = editor.getHTML();
      return !text.trim() || html === '<p></p>' || html === '';
    },
  }), [editor]);

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
    if (editor && content && !editor.isFocused) {
      const currentStr = JSON.stringify(editor.getJSON());
      const incomingStr = JSON.stringify(content);
      if (currentStr !== incomingStr) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  return (
    <div className={`zw-blog-editor-container ${className}`}>
      {!readOnly && (
        <>
          <EditorToolbar editor={editor} onOpenMediaLibrary={onOpenMediaLibrary} />
          <EditorBubbleMenu editor={editor} />
        </>
      )}

      <div
        className="zw-blog-editor-content"
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.commands.focus('end');
          }
        }}
        style={{ cursor: 'text' }}
      >
        <EditorContent editor={editor} />
      </div>

      <div className="zw-blog-editor-footer">
        <div className="zw-blog-editor-stats">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>~{readingTime} min read</span>
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

          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Powered by <strong style={{ color: '#475569' }}>Zwantum</strong>
          </span>
        </div>
      </div>
    </div>
  );
});

BlogEditor.displayName = 'BlogEditor';
