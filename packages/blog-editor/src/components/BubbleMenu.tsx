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
      shouldShow={({ editor: ed, state, from, to }) => {
        if (!ed || ed.isDestroyed || !ed.isEditable) return false;
        if (ed.isActive('image')) return true;
        if (state.selection.empty || from === to) return false;
        return true;
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 8px',
          background: '#0f172a',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          border: '1px solid #334155',
        }}
      >
        {editor.isActive('image') ? (
          <>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, padding: '0 2px' }}>
              Image:
            </span>
            <button
              type="button"
              style={{
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                padding: '4px 10px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
              onClick={() => {
                const currentCaption = (editor.getAttributes('image').caption as string) || '';
                const newCaption = window.prompt('Enter or edit image caption:', currentCaption);
                if (newCaption !== null) {
                  editor
                    .chain()
                    .focus()
                    .updateAttributes('image', { caption: newCaption.trim() || null })
                    .run();
                }
              }}
              title="Add or update editorial caption displayed below this image"
            >
              {(editor.getAttributes('image').caption as string) ? 'Edit Caption' : '+ Add Caption'}
            </button>
            <button
              type="button"
              style={{
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                padding: '4px 10px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
              onClick={() => {
                const currentAlt = (editor.getAttributes('image').alt as string) || '';
                const newAlt = window.prompt('Enter alt text (for SEO & accessibility):', currentAlt);
                if (newAlt !== null) {
                  editor
                    .chain()
                    .focus()
                    .updateAttributes('image', { alt: newAlt.trim() || null })
                    .run();
                }
              }}
              title="Add or update SEO Alt Text"
            >
              Alt Text
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </TiptapBubbleMenu>
  );
};
