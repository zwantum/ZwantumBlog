import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { EditorModal, ActiveDialogType } from './EditorModal';

export interface EditorToolbarProps {
  editor: Editor | null;
  onOpenMediaLibrary?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, onOpenMediaLibrary }) => {
  if (!editor) return null;

  const [activeModal, setActiveModal] = useState<ActiveDialogType>(null);

  const setLink = () => {
    setActiveModal('link');
  };

  const addImage = () => {
    if (onOpenMediaLibrary) {
      onOpenMediaLibrary();
      return;
    }
    setActiveModal('image');
  };

  const addYoutube = () => {
    setActiveModal('video');
  };

  const addCallout = (type: 'info' | 'warning' | 'tip' | 'success') => {
    editor.chain().focus().toggleCallout({ type }).run();
  };

  const addCTA = () => {
    setActiveModal('cta');
  };

  const addFAQ = () => {
    setActiveModal('faq');
  };

  const getCurrentHeading = (): string => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    if (editor.isActive('heading', { level: 6 })) return 'h6';
    return 'p';
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'p') {
      editor.chain().focus().setParagraph().run();
    } else if (val.startsWith('h')) {
      const level = parseInt(val.replace('h', ''), 10) as 1 | 2 | 3 | 4 | 5 | 6;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const getCurrentFontSize = (): string => {
    return (editor.getAttributes('fontSize') as any)?.size || '';
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    if (!size) {
      (editor.chain().focus() as any).unsetFontSize().run();
    } else {
      (editor.chain().focus() as any).setFontSize(size).run();
    }
  };

  const handleToggleList = (type: 'bulletList' | 'orderedList') => {
    const { state, view } = editor;
    const { selection, doc } = state;
    let from = selection.from;
    let to = selection.to;

    try {
      const $from = selection.$from;
      const $to = selection.$to;
      from = Math.min(from, $from.start($from.depth));
      to = Math.max(to, $to.end($to.depth));
    } catch {
      // fallback
    }

    const breakPoints: { pos: number; len: number; depth: number }[] = [];
    doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'hardBreak') {
        const $pos = doc.resolve(pos);
        let depth = 1;
        for (let d = $pos.depth; d > 0; d--) {
          if ($pos.node(d).type.name === 'listItem') {
            depth = $pos.depth - d + 1;
            break;
          }
        }
        breakPoints.push({ pos, len: node.nodeSize, depth });
      } else if (node.isText && node.text && node.text.includes('\n')) {
        const text = node.text;
        const $pos = doc.resolve(pos);
        let depth = 1;
        for (let d = $pos.depth; d > 0; d--) {
          if ($pos.node(d).type.name === 'listItem') {
            depth = $pos.depth - d + 1;
            break;
          }
        }
        for (let i = 0; i < text.length; i++) {
          if (text[i] === '\n') {
            breakPoints.push({ pos: pos + i, len: 1, depth });
          }
        }
      }
    });

    if (breakPoints.length > 0) {
      breakPoints.sort((a, b) => b.pos - a.pos);

      const tr = state.tr;
      const initialFrom = from;
      const initialTo = to;

      breakPoints.forEach(({ pos, len, depth }) => {
        tr.delete(pos, pos + len);
        try {
          tr.split(pos, depth);
        } catch {
          try {
            tr.split(pos, 1);
          } catch {
            // Cannot split at position
          }
        }
      });

      const wasInBullet = editor.isActive('bulletList');
      const wasInOrdered = editor.isActive('orderedList');

      const newFrom = Math.max(0, tr.mapping.map(initialFrom));
      const newTo = Math.min(tr.doc.content.size, tr.mapping.map(initialTo));

      view.dispatch(tr);

      const chain = editor.chain().focus();
      try {
        chain.setTextSelection({ from: newFrom, to: newTo });
      } catch {
        // fallback
      }

      if (type === 'bulletList' && wasInBullet) {
        chain.run();
        return;
      }
      if (type === 'orderedList' && wasInOrdered) {
        chain.run();
        return;
      }

      if (type === 'bulletList') {
        chain.toggleBulletList().run();
      } else {
        chain.toggleOrderedList().run();
      }
      return;
    }

    if (type === 'bulletList') {
      editor.chain().focus().toggleBulletList().run();
    } else {
      editor.chain().focus().toggleOrderedList().run();
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

      {/* Headings & Font Size in Dropdowns */}
      <div className="zw-blog-toolbar-group" title="Text Style & Headings">
        <select
          className="zw-blog-toolbar-select"
          value={getCurrentHeading()}
          onChange={handleHeadingChange}
          title="Heading / Text Hierarchy"
        >
          <option value="p">¶ Paragraph</option>
          <option value="h1">H1 - Heading 1</option>
          <option value="h2">H2 - Heading 2</option>
          <option value="h3">H3 - Heading 3</option>
          <option value="h4">H4 - Heading 4</option>
          <option value="h5">H5 - Heading 5</option>
          <option value="h6">H6 - Heading 6</option>
        </select>

        <select
          className="zw-blog-toolbar-select"
          value={getCurrentFontSize()}
          onChange={handleFontSizeChange}
          title="Font Size"
        >
          <option value="">Font Size</option>
          <option value="12px">12px (Small)</option>
          <option value="14px">14px (Body)</option>
          <option value="16px">16px (Base)</option>
          <option value="18px">18px (Medium)</option>
          <option value="20px">20px (Large)</option>
          <option value="24px">24px (XL)</option>
          <option value="28px">28px (2XL)</option>
          <option value="32px">32px (3XL)</option>
          <option value="36px">36px (4XL)</option>
        </select>
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
        {/* Bullet List Icon */}
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          onClick={() => handleToggleList('bulletList')}
          title="Bullet List"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.8" fill="currentColor" />
            <circle cx="4" cy="12" r="1.8" fill="currentColor" />
            <circle cx="4" cy="18" r="1.8" fill="currentColor" />
          </svg>
        </button>

        {/* Numbered / Ordered List Icon */}
        <button
          type="button"
          className={`zw-blog-toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          onClick={() => handleToggleList('orderedList')}
          title="Numbered List"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1.5v4" />
            <path d="M3.5 10h2.5" />
            <path d="M3.5 14.5c.3-.5.9-.8 1.5-.8.8 0 1.5.5 1.5 1.2 0 .6-.4 1-1 1.4L3.5 18h3" />
          </svg>
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

      {/* Modern In-Editor Modal Dialogs (Link, Video, CTA, FAQ, Image) */}
      <EditorModal
        type={activeModal}
        editor={editor}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};
