import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';

export type ActiveDialogType = 'link' | 'video' | 'cta' | 'faq' | 'image' | null;

export interface EditorModalProps {
  type: ActiveDialogType;
  editor: Editor;
  onClose: () => void;
}

export const EditorModal: React.FC<EditorModalProps> = ({ type, editor, onClose }) => {
  if (!type) return null;

  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Link state
  const isLinkActive = editor.isActive('link');
  const [linkUrl, setLinkUrl] = useState(() => (editor.getAttributes('link').href as string) || '');
  const [linkText, setLinkText] = useState(() => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  });
  const [openInNewTab, setOpenInNewTab] = useState(true);

  // Video state
  const [videoUrl, setVideoUrl] = useState('');

  // CTA state
  const [ctaTitle, setCtaTitle] = useState('Consult Our Specialists');
  const [ctaDescription, setCtaDescription] = useState('Speak with our team to find the ideal customized solution.');
  const [ctaButtonText, setCtaButtonText] = useState('Book Consultation');
  const [ctaButtonUrl, setCtaButtonUrl] = useState('#');

  // FAQ state
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  // Image state
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Focus the first input automatically on modal mount
  useEffect(() => {
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [type]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Submit handlers
  const handleLinkSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = linkUrl.trim();
    if (!url) {
      if (isLinkActive) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      }
      onClose();
      return;
    }

    const target = openInNewTab ? '_blank' : null;
    const { selection } = editor.state;

    if (selection.empty && linkText.trim()) {
      // If cursor was collapsed and user provided display text, insert linked text
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: linkText.trim(),
          marks: [{ type: 'link', attrs: { href: url, target } }],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target })
        .run();
    }
    onClose();
  };

  const handleLinkRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  const handleVideoSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = videoUrl.trim();
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
    onClose();
  };

  const handleCtaSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'blogCTA',
        attrs: {
          title: ctaTitle.trim() || 'Consult Our Specialists',
          description: ctaDescription.trim(),
          buttonText: ctaButtonText.trim() || 'Learn More',
          buttonUrl: ctaButtonUrl.trim() || '#',
        },
      })
      .run();
    onClose();
  };

  const handleFaqSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const question = faqQuestion.trim() || 'What are the main principles?';
    const answer =
      faqAnswer.trim() || 'The main principles center on harmony, balance, and spatial flow.';
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'blogFAQ',
        attrs: { question, answer },
      })
      .run();
    onClose();
  };

  const handleImageSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = imageUrl.trim();
    if (url) {
      editor
        .chain()
        .focus()
        .setImage({ src: url, alt: imageAlt.trim() || undefined })
        .run();
    }
    onClose();
  };

  return (
    <div
      className="zw-blog-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="zw-blog-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* ========================================================
            FAQ DIALOG
            ======================================================== */}
        {type === 'faq' && (
          <form onSubmit={handleFaqSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>❓</span> Insert FAQ Accordion
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">FAQ Question</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. What are the key architectural principles?"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  required
                />
              </div>
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">FAQ Answer</label>
                <textarea
                  className="zw-blog-modal-textarea"
                  rows={4}
                  placeholder="e.g. The design highlights clarity, morning sunlight, and spatial flow..."
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  required
                />
                <span className="zw-blog-modal-hint">
                  Displays as an expandable accordion block in your published article.
                </span>
              </div>
            </div>
            <div className="zw-blog-modal-footer">
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                Insert FAQ Block
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            CTA DIALOG
            ======================================================== */}
        {type === 'cta' && (
          <form onSubmit={handleCtaSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>🎯</span> Insert Call-to-Action (CTA) Banner
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Headline / Title</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. Consult Our Specialists"
                  value={ctaTitle}
                  onChange={(e) => setCtaTitle(e.target.value)}
                  required
                />
              </div>
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Description (Optional)</label>
                <input
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. Speak with our team for personalized guidance."
                  value={ctaDescription}
                  onChange={(e) => setCtaDescription(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="zw-blog-modal-field">
                  <label className="zw-blog-modal-label">Button Text</label>
                  <input
                    type="text"
                    className="zw-blog-modal-input"
                    placeholder="e.g. Book Consultation"
                    value={ctaButtonText}
                    onChange={(e) => setCtaButtonText(e.target.value)}
                    required
                  />
                </div>
                <div className="zw-blog-modal-field">
                  <label className="zw-blog-modal-label">Button URL / Link</label>
                  <input
                    type="text"
                    className="zw-blog-modal-input"
                    placeholder="https://yoursite.com/contact"
                    value={ctaButtonUrl}
                    onChange={(e) => setCtaButtonUrl(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="zw-blog-modal-footer">
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                Insert CTA Banner
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            LINK DIALOG
            ======================================================== */}
        {type === 'link' && (
          <form onSubmit={handleLinkSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>🔗</span> {isLinkActive ? 'Edit Link' : 'Insert Link'}
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Destination URL</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  required
                />
              </div>
              {editor.state.selection.empty && (
                <div className="zw-blog-modal-field">
                  <label className="zw-blog-modal-label">Display Text</label>
                  <input
                    type="text"
                    className="zw-blog-modal-input"
                    placeholder="Text to display"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                  />
                </div>
              )}
              <label className="zw-blog-modal-checkbox-row">
                <input
                  type="checkbox"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                />
                <span>Open link in a new tab (<code>target="_blank"</code>)</span>
              </label>
            </div>
            <div className="zw-blog-modal-footer">
              {isLinkActive && (
                <button
                  type="button"
                  className="zw-blog-modal-btn-danger"
                  onClick={handleLinkRemove}
                  title="Remove this link"
                >
                  Unlink
                </button>
              )}
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                {isLinkActive ? 'Update Link' : 'Save Link'}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            YOUTUBE VIDEO DIALOG
            ======================================================== */}
        {type === 'video' && (
          <form onSubmit={handleVideoSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>▶️</span> Embed YouTube Video
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">YouTube Video URL</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
                <span className="zw-blog-modal-hint">
                  Supports standard YouTube URLs, Shorts links, and youtu.be shortlinks.
                </span>
              </div>
            </div>
            <div className="zw-blog-modal-footer">
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                Embed Video
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            IMAGE URL DIALOG
            ======================================================== */}
        {type === 'image' && (
          <form onSubmit={handleImageSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title">
                <span>🖼️</span> Insert Image by URL
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                ✕
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Image Source URL</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="https://images.unsplash.com/... or https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                />
              </div>
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Alt Text (Accessibility & SEO)</label>
                <input
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="Brief description of the image"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>
            </div>
            <div className="zw-blog-modal-footer">
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                Insert Image
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
