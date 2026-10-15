import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export const BlogImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: null,
        parseHTML: (element) => {
          if (element.tagName === 'FIGURE') {
            const figcaption = element.querySelector('figcaption');
            return figcaption ? figcaption.textContent : null;
          }
          return element.getAttribute('data-caption') || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.caption) return {};
          return { 'data-caption': attributes.caption };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.blog-figure',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const img = el.querySelector('img');
          const caption = el.querySelector('figcaption');
          if (!img) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            caption: caption ? caption.textContent : null,
          };
        },
      },
      {
        tag: 'figure',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const img = el.querySelector('img');
          const caption = el.querySelector('figcaption');
          if (!img) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            caption: caption ? caption.textContent : null,
          };
        },
      },
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            src: el.getAttribute('src'),
            alt: el.getAttribute('alt'),
            title: el.getAttribute('title'),
            caption: el.getAttribute('data-caption') || el.getAttribute('title') || null,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, alt, caption } = node.attrs;
    const imgAttrs = mergeAttributes(HTMLAttributes, {
      src,
      alt: alt || '',
      class: 'zw-blog-editor-image',
    });

    if (caption) {
      return [
        'figure',
        { class: 'blog-figure' },
        ['img', imgAttrs],
        ['figcaption', { class: 'blog-figcaption' }, caption],
      ];
    }

    return [
      'figure',
      { class: 'blog-figure' },
      ['img', imgAttrs],
    ];
  },
});
