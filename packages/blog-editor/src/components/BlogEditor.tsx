import React, { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BlogEditorConfig } from '@zwantum/blog-types';
import { getBlogEditorExtensions } from '../extensions';
import { EditorToolbar } from './EditorToolbar';
import { EditorBubbleMenu } from './BubbleMenu';
import { useAutosave } from '../hooks/useAutosave';
import '../styles/editor.css';

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

export const BlogEditor: React.FC<BlogEditorProps> = ({
  content,
  onChange,
  config,
  readOnly = false,
  onOpenMediaLibrary,
  onAutosave,
  enableAutosave = true,
  className = '',
}) => {
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
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as Record<string, unknown>;
      const html = editor.getHTML();

      // Calculate counts
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);

      if (onChange) {
        onChange(json, html);
      }
    },
  });

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

  // Keep content in sync if editor content changes from external source (e.g. revision restore)
  useEffect(() => {
    if (editor && content && !editor.isFocused) {
      editor.commands.setContent(content);
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

      <div className="zw-blog-editor-content">
        <EditorContent editor={editor} />
      </div>

      <div className="zw-blog-editor-footer">
        <div className="zw-blog-editor-stats">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>~{readingTime} min read</span>
        </div>

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
  );
};
