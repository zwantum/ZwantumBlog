import { Mark, mergeAttributes } from '@tiptap/core';

export interface CitationOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blogCitation: {
      setCitation: (attributes: { href: string; target?: string; rel?: string }) => ReturnType;
      toggleCitation: (attributes: { href: string; target?: string; rel?: string }) => ReturnType;
      unsetCitation: () => ReturnType;
    };
  }
}

export const BlogCitation = Mark.create<CitationOptions>({
  name: 'blogCitation',
  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
      target: {
        default: '_blank',
      },
      rel: {
        default: 'nofollow',
      },
      'data-citation': {
        default: 'true',
      },
      class: {
        default: 'blog-citation',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-citation="true"]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const relAttr = el.getAttribute('rel') || '';
          return {
            href: el.getAttribute('href'),
            target: el.getAttribute('target') || '_blank',
            rel: relAttr.includes('dofollow') ? 'dofollow' : 'nofollow',
          };
        },
      },
      {
        tag: 'a.blog-citation',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const relAttr = el.getAttribute('rel') || '';
          return {
            href: el.getAttribute('href'),
            target: el.getAttribute('target') || '_blank',
            rel: relAttr.includes('dofollow') ? 'dofollow' : 'nofollow',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const rel = HTMLAttributes.rel === 'dofollow' ? 'noopener' : 'nofollow noopener';
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-citation': 'true',
        class: 'blog-citation',
        target: HTMLAttributes.target || '_blank',
        rel,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCitation:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleCitation:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetCitation:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
