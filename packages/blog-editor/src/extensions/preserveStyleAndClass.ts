import { Extension } from '@tiptap/core';

export const PreserveStyleAndClass = Extension.create({
  name: 'preserveStyleAndClass',

  addGlobalAttributes() {
    return [
      {
        types: [
          'heading',
          'paragraph',
          'table',
          'tableRow',
          'tableCell',
          'tableHeader',
          'blockquote',
          'bulletList',
          'orderedList',
          'listItem',
        ],
        attributes: {
          style: {
            default: null,
            parseHTML: (element) => element.getAttribute('style') || null,
            renderHTML: (attributes) => {
              if (!attributes.style) return {};
              return { style: attributes.style };
            },
          },
          class: {
            default: null,
            parseHTML: (element) => element.getAttribute('class') || null,
            renderHTML: (attributes) => {
              if (!attributes.class) return {};
              return { class: attributes.class };
            },
          },
        },
      },
    ];
  },
});
