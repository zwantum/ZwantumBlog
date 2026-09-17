/**
 * Strip HTML tags from a string and return plain text.
 * Used to sanitize post titles for SEO <title>, slugs, and alt-text
 * while allowing rich HTML to remain in the stored title field for display.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Decode common entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractPlainTextFromTiptap(node: unknown): string {
  if (!node || typeof node !== 'object') return '';

  const n = node as Record<string, unknown>;
  let text = '';

  if (n.type === 'text' && typeof n.text === 'string') {
    text += n.text;
  }

  if (Array.isArray(n.content)) {
    for (const child of n.content) {
      const childText = extractPlainTextFromTiptap(child);
      if (childText) {
        text += (text ? ' ' : '') + childText;
      }
    }
  }

  return text;
}

export function calculateContentMetrics(content: Record<string, unknown> | string): {
  wordCount: number;
  readingTime: number;
} {
  let plainText = '';
  if (typeof content === 'string') {
    plainText = content.replace(/<[^>]*>/g, ' '); // simple html tag strip
  } else if (content && typeof content === 'object') {
    plainText = extractPlainTextFromTiptap(content);
  }

  const words = plainText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const wordCount = words.length;
  // Standard reading speed ~ 200 words per minute
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    wordCount,
    readingTime,
  };
}
