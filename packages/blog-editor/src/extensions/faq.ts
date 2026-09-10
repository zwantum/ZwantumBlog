import { Node, mergeAttributes } from '@tiptap/core';

export const BlogFAQ = Node.create({
  name: 'blogFAQ',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      question: { default: 'Frequently Asked Question?' },
      answer: { default: 'Here is the detailed, informative answer to this question.' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.zw-blog-faq',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            question: element.getAttribute('data-question'),
            answer: element.getAttribute('data-answer'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        class: 'zw-blog-faq',
        'data-question': HTMLAttributes.question,
        'data-answer': HTMLAttributes.answer,
      }),
      ['summary', { class: 'zw-blog-faq-question' }, HTMLAttributes.question || 'FAQ Question'],
      ['div', { class: 'zw-blog-faq-answer' }, HTMLAttributes.answer || ''],
    ];
  },
});
