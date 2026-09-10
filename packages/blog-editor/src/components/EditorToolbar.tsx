import React from 'react';
import { Editor } from '@tiptap/react';

export interface EditorToolbarProps {
  editor: Editor | null;
  onOpenMediaLibrary?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, onOpenMediaLibrary }) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter Link URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    if (onOpenMediaLibrary) {
      onOpenMediaLibrary();
      return;
    }
    const url = window.prompt('Enter Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addYoutube = () => {
    const url = window.prompt('Enter YouTube Video URL');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const addCallout = (type: 'info' | 'warning' | 'tip' | 'success') => {
    editor.chain().focus().toggleCallout({ type }).run();
  };

  const addCTA = () => {
    const title = window.prompt('CTA Title', 'Consult Our Specialists');
    const buttonText = window.prompt('Button Text', 'Book Consultation');
    const buttonUrl = window.prompt('Button URL', '#');
    if (title) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'blogCTA',
          attrs: { title, buttonText: buttonText || 'Learn More', buttonUrl: buttonUrl || '#' },
        })
        .run();
    }
  };

  const addFAQ = () => {
    const question = window.prompt('FAQ Question', 'What are the main principles?');
    const answer = window.prompt('FAQ Answer', 'The main principles center on harmony, balance, and spatial flow.');
    if (question && answer) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'blogFAQ',
          attrs: { question, answer },
        })
        .run();
    }
  };

  return (
    <div className="zw-blog-editor-toolbar" role="toolbar" aria-label="Editor Formatting">
      {/* History */}
      <div className="zw-blog-toolbar-group" title="History">
        <button
          type="button"
          className="zw-blog-toolbar-btn"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          ↺
        </button>
        <button
          type="button"
          className="zw-blog-toolbar-btn"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          ↻
        </button>
      </div>

      <div className="zw-blog-toolbar-divider" />

      {/* Headings & Hierarchy */}
      <div className="zw-blog-toolbar-group" title="Headings & Text Structure">
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('paragraph') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Normal Text / Paragraph"
        >
          ¶ Text
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1 (Main Section)"
          style={{ fontWeight: 800 }}
        >
          H1
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2 (Sub-section)"
          style={{ fontWeight: 700 }}
        >
          H2
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3 (Sub-topic)"
          style={{ fontWeight: 600 }}
        >
          H3
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          title="Heading 4 (Minor Heading)"
          style={{ fontWeight: 600 }}
        >
          H4
        </button>
      </div>

      <div className="zw-blog-toolbar-divider" />

      {/* Inline Formatting */}
      <div className="zw-blog-toolbar-group" title="Inline Formatting">
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('code') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight Text"
        >
          ✨ Highlight
        </button>
      </div>

      <div className="zw-blog-toolbar-divider" />

      {/* Lists & Quotes */}
      <div className="zw-blog-toolbar-group" title="Lists & Quotes">
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1. List
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          “ Quote
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          {'{ }'} Code
        </button>
        <button
          type="button"
          className="zw-blog-toolbar-btn"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Divider"
        >
          ― Divider
        </button>
      </div>

      <div className="zw-blog-toolbar-divider" />

      {/* Media & Embeds */}
      <div className="zw-blog-toolbar-group" title="Links & Media">
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('link') ? 'is-active' : ''}`}
          onClick={setLink}
          title="Insert / Edit Link"
        >
          🔗 Link
        </button>
        <button type="button" className="zw-blog-toolbar-btn" onClick={addImage} title="Insert Image from Library or URL">
          🖼️ Image
        </button>
        <button type="button" className="zw-blog-toolbar-btn" onClick={addYoutube} title="Embed YouTube Video">
          ▶️ Video
        </button>
      </div>

      <div className="zw-blog-toolbar-divider" />

      {/* Interactive Components & Blocks */}
      <div className="zw-blog-toolbar-group" title="Custom Dynamic Blocks">
        <button
          type="button"
          className="zw-blog-toolbar-btn"
          onClick={() => addCallout('info')}
          title="Insert Callout Alert"
        >
          💡 Callout
        </button>
        <button type="button" className="zw-blog-toolbar-btn" onClick={addCTA} title="Insert Conversion CTA Banner">
          🎯 CTA
        </button>
        <button type="button" className="zw-blog-toolbar-btn" onClick={addFAQ} title="Insert FAQ Accordion Block">
          ❓ FAQ
        </button>
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('table') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert Data Table (3x3)"
        >
          ▦ Table
        </button>

        {/* Dynamic Context Table Controls if active in table */}
        {editor.isActive('table') && (
          <>
            <button
              type="button"
              className="zw-blog-toolbar-btn"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row Below"
              style={{ fontSize: '11px', background: '#e2e8f0' }}
            >
              + Row
            </button>
            <button
              type="button"
              className="zw-blog-toolbar-btn"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Column Right"
              style={{ fontSize: '11px', background: '#e2e8f0' }}
            >
              + Col
            </button>
            <button
              type="button"
              className="zw-blog-toolbar-btn"
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete Entire Table"
              style={{ fontSize: '11px', color: '#dc2626', background: '#fee2e2' }}
            >
              ✕ Table
            </button>
          </>
        )}
      </div>
    </div>
  );
};
