import React from 'react';
import { BubbleMenu as TiptapBubbleMenu, Editor } from '@tiptap/react';

export interface EditorBubbleMenuProps {
  editor: Editor | null;
}

export const EditorBubbleMenu: React.FC<EditorBubbleMenuProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <TiptapBubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150 }}
      className="zw-blog-bubble-menu"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 6px',
          background: '#1e293b',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
      <button
        type="button"
        style={{
          background: editor.isActive('bold') ? '#475569' : 'transparent',
          color: '#ffffff',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>
      <button
        type="button"
        style={{
          background: editor.isActive('italic') ? '#475569' : 'transparent',
          color: '#ffffff',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontStyle: 'italic',
        }}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </button>
      <button
        type="button"
        style={{
          background: editor.isActive('underline') ? '#475569' : 'transparent',
          color: '#ffffff',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </button>
      <button
        type="button"
        style={{
          background: editor.isActive('highlight') ? '#475569' : 'transparent',
          color: '#fef08a',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        HL
      </button>
      </div>
    </TiptapBubbleMenu>
  );
};
