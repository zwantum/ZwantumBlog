import { Node, mergeAttributes } from '@tiptap/core';

export const BlogCTA = Node.create({
  name: 'blogCTA',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: { default: 'Take the Next Step' },
      description: { default: 'Contact our team or explore our specialized services today.' },
      buttonText: { default: 'Learn More' },
      buttonUrl: { default: '#' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.zw-blog-cta',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            title: element.getAttribute('data-title'),
            description: element.getAttribute('data-description'),
            buttonText: element.getAttribute('data-button-text'),
            buttonUrl: element.getAttribute('data-button-url'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'zw-blog-cta',
        'data-title': HTMLAttributes.title,
        'data-description': HTMLAttributes.description,
        'data-button-text': HTMLAttributes.buttonText,
        'data-button-url': HTMLAttributes.buttonUrl,
      }),
      [
        'div',
        { class: 'zw-blog-cta-content' },
        ['h4', { class: 'zw-blog-cta-title' }, HTMLAttributes.title || 'Take the Next Step'],
        ['p', { class: 'zw-blog-cta-desc' }, HTMLAttributes.description || ''],
      ],
      [
        'a',
        {
          href: HTMLAttributes.buttonUrl || '#',
          class: 'zw-blog-cta-btn',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        HTMLAttributes.buttonText || 'Learn More',
      ],
    ];
  },
});
