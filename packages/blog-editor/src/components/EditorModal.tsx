import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';

export type ActiveDialogType = 'link' | 'video' | 'cta' | 'faq' | 'image' | 'citation' | null;

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
  const isImageActive = editor.isActive('image');
  const imageAttrs = isImageActive ? editor.getAttributes('image') : {};
  const [imageUrl, setImageUrl] = useState(() => (imageAttrs.src as string) || '');
  const [imageAlt, setImageAlt] = useState(() => (imageAttrs.alt as string) || '');
  const [imageCaption, setImageCaption] = useState(() => (imageAttrs.caption as string) || '');

  // Citation state
  const isCitationActive = editor.isActive('blogCitation');
  const citationAttrs = editor.getAttributes('blogCitation');
  const [citationUrl, setCitationUrl] = useState(() => (citationAttrs.href as string) || '');
  const [citationText, setCitationText] = useState(() => {
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, ' ');
    if (selected) {
      return selected.replace(/^\[\d+\]\s*/, '').trim();
    }
    return 'Source Reference';
  });
  const [citationNewTab, setCitationNewTab] = useState(true);
  const [citationRel, setCitationRel] = useState<'dofollow' | 'nofollow'>(() => {
    return citationAttrs.rel === 'dofollow' ? 'dofollow' : 'nofollow';
  });

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
      if (editor.isActive('image')) {
        editor
          .chain()
          .focus()
          .updateAttributes('image', {
            src: url,
            alt: imageAlt.trim() || undefined,
            caption: imageCaption.trim() || undefined,
          })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'image',
            attrs: {
              src: url,
              alt: imageAlt.trim() || undefined,
              caption: imageCaption.trim() || undefined,
            },
          })
          .run();
      }
    }
    onClose();
  };

  const handleCitationSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = citationUrl.trim();
    if (!url) {
      if (isCitationActive) {
        editor.chain().focus().extendMarkRange('blogCitation').unsetCitation().run();
      }
      onClose();
      return;
    }

    const target = citationNewTab ? '_blank' : undefined;
    const { selection } = editor.state;
    const cleanedText = citationText.trim().replace(/^\[\d+\]\s*/, '') || 'Source Reference';

    if (selection.empty && cleanedText) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: cleanedText,
          marks: [
            {
              type: 'blogCitation',
              attrs: {
                href: url,
                target,
                rel: citationRel,
                'data-citation': 'true',
                class: 'blog-citation',
              },
            },
          ],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('blogCitation')
        .setCitation({
          href: url,
          target,
          rel: citationRel,
        })
        .run();
    }
    onClose();
  };

  const handleCitationRemove = () => {
    editor.chain().focus().extendMarkRange('blogCitation').unsetCitation().run();
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
              <h3 className="zw-blog-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Insert FAQ Accordion
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
              <h3 className="zw-blog-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="2" r="2" />
                </svg>
                Insert Call-to-Action (CTA) Banner
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
              <h3 className="zw-blog-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {isLinkActive ? 'Edit Link' : 'Insert Link'}
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
              <h3 className="zw-blog-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Embed YouTube Video
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
              <h3 className="zw-blog-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {isImageActive ? 'Edit Image & Caption' : 'Insert Image by URL'}
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Caption (Optional)</label>
                <input
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="Editorial caption displayed under the image"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                />
                <span className="zw-blog-modal-hint">
                  Renders semantically inside a &lt;figure&gt; with a &lt;figcaption&gt; block.
                </span>
              </div>
            </div>
            <div className="zw-blog-modal-footer">
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                {isImageActive ? 'Update Image' : 'Insert Image'}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            CITATION DIALOG
            ======================================================== */}
        {type === 'citation' && (
          <form onSubmit={handleCitationSubmit}>
            <div className="zw-blog-modal-header">
              <h3 className="zw-blog-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {isCitationActive ? 'Edit Reference Citation' : 'Insert Reference Citation'}
              </h3>
              <button type="button" className="zw-blog-modal-close" onClick={onClose} title="Close (Esc)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="zw-blog-modal-body">
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Citation Label / Text</label>
                <input
                  ref={firstInputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  className="zw-blog-modal-input"
                  placeholder="e.g. Nature Astronomy (2024)"
                  value={citationText}
                  onChange={(e) => setCitationText(e.target.value)}
                  required
                />
                <span className="zw-blog-modal-hint">
                  The cited phrase or source name highlighted in the text.
                </span>
              </div>

              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">Reference URL</label>
                <input
                  type="url"
                  className="zw-blog-modal-input"
                  placeholder="https://doi.org/... or https://pubmed.ncbi.nlm.nih.gov/..."
                  value={citationUrl}
                  onChange={(e) => setCitationUrl(e.target.value)}
                  required
                />
              </div>

              {/* SEO Link Relation Radio (DoFollow vs NoFollow) */}
              <div className="zw-blog-modal-field">
                <label className="zw-blog-modal-label">SEO Link Relation (rel)</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <label className="zw-blog-modal-checkbox-row" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="citationRel"
                      value="nofollow"
                      checked={citationRel === 'nofollow'}
                      onChange={() => setCitationRel('nofollow')}
                    />
                    <span><strong>NoFollow</strong> (Recommended for external sources)</span>
                  </label>
                  <label className="zw-blog-modal-checkbox-row" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="citationRel"
                      value="dofollow"
                      checked={citationRel === 'dofollow'}
                      onChange={() => setCitationRel('dofollow')}
                    />
                    <span><strong>DoFollow</strong></span>
                  </label>
                </div>
              </div>

              <label className="zw-blog-modal-checkbox-row">
                <input
                  type="checkbox"
                  checked={citationNewTab}
                  onChange={(e) => setCitationNewTab(e.target.checked)}
                />
                <span>Open in a new tab (<code>target="_blank"</code>)</span>
              </label>

              {/* Live Visual Preview Badge */}
              <div
                style={{
                  marginTop: '6px',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Preview:</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      lineHeight: '1.25',
                      padding: '2px 7px',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '4px',
                      color: '#1d4ed8',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ color: '#2563eb', fontWeight: 700 }}>[1]</span>
                    <span>{citationText || 'Citation'}</span>
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: citationRel === 'nofollow' ? '#fef3c7' : '#dcfce7',
                    color: citationRel === 'nofollow' ? '#92400e' : '#166534',
                  }}
                >
                  rel="{citationRel}"
                </span>
              </div>
            </div>

            <div className="zw-blog-modal-footer">
              {isCitationActive && (
                <button
                  type="button"
                  className="zw-blog-modal-btn-danger"
                  onClick={handleCitationRemove}
                  title="Remove this citation"
                >
                  Remove Citation
                </button>
              )}
              <button type="button" className="zw-blog-modal-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="zw-blog-modal-btn-primary">
                {isCitationActive ? 'Update Citation' : 'Insert Citation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
