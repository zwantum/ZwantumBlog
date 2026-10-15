import { Post, BlogConfig } from '@zwantum/blog-types';
import { stripHtml } from './utils';

export interface OgImageOptions {
  title: string;
  excerpt?: string;
  siteName?: string;
  category?: string;
  authorName?: string;
  authorDesignation?: string;
  readingTime?: string;
  date?: string;
  domain?: string;
  primaryColor?: string;
  accentColor?: string;
}

/**
 * Escapes characters for safe inclusion in SVG XML
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Word-wraps text into multiple lines for SVG <tspan> elements
 */
function wrapText(text: string, maxCharsPerLine: number = 32, maxLines: number = 3): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // If text exceeded max lines, append ellipsis to last line
  if (lines.length === maxLines && words.length > lines.join(' ').split(/\s+/).length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:!?]?$/, '...');
  }

  return lines;
}

/**
 * Generates an ultra-crisp, branded 1200x630 SVG social card
 */
export function generateOgImageSvg(options: OgImageOptions): string {
  const {
    title,
    excerpt = '',
    siteName = 'Zwantum Blog',
    category = 'Article',
    authorName = 'Editorial Team',
    authorDesignation = '',
    readingTime = '4 min read',
    date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    domain = 'zwantum.com',
    primaryColor = '#ffcc00',
    accentColor = '#f59e0b',
  } = options;

  const cleanTitle = stripHtml(title) || 'Untitled Article';
  const cleanExcerpt = stripHtml(excerpt);
  const titleLines = wrapText(cleanTitle, 30, 3);
  const excerptLines = cleanExcerpt ? wrapText(cleanExcerpt, 58, 2) : [];

  const authorInitials = authorName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  // Start Y position for title
  const titleStartY = 240;
  const titleLineHeight = 64;

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bg-grad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="60%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#0a0f1d" />
    </linearGradient>

    <!-- Radiant Ambient Glows -->
    <radialGradient id="glow-gold" cx="1000" cy="100" r="450" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow-bottom" cx="200" cy="550" r="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>

    <!-- Card Inner Border Gradient -->
    <linearGradient id="border-grad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
      <stop offset="50%" stop-color="rgba(255, 204, 0, 0.3)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.08)" />
    </linearGradient>

    <!-- Avatar Gradient -->
    <linearGradient id="avatar-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${accentColor}" />
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="url(#bg-grad)" />
  <rect width="1200" height="630" fill="url(#glow-gold)" />
  <rect width="1200" height="630" fill="url(#glow-bottom)" />

  <!-- Outer Frame & Inset Grid Lines -->
  <rect x="40" y="40" width="1120" height="550" rx="24" stroke="url(#border-grad)" stroke-width="2" fill="none" />
  
  <!-- Subtle Background Grid Motif -->
  <g opacity="0.04" stroke="#ffffff" stroke-width="1">
    <line x1="40" y1="180" x2="1160" y2="180" />
    <line x1="40" y1="460" x2="1160" y2="460" />
    <line x1="400" y1="40" x2="400" y2="590" />
    <line x1="800" y1="40" x2="800" y2="590" />
  </g>

  <!-- Header: Site Brand + Category Badge -->
  <g transform="translate(80, 85)">
    <!-- Site Brand -->
    <g>
      <circle cx="16" cy="16" r="16" fill="${primaryColor}" />
      <path d="M12 10L20 16L12 22" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <text x="44" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="19" font-weight="700" fill="#f8fafc" letter-spacing="0.05em">
        ${escapeXml(siteName.toUpperCase())}
      </text>
    </g>

    <!-- Category Pill -->
    <g transform="translate(820, 0)">
      <rect x="0" y="0" width="180" height="34" rx="17" fill="rgba(255, 204, 0, 0.12)" stroke="rgba(255, 204, 0, 0.35)" stroke-width="1.5" />
      <text x="90" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="12" font-weight="700" fill="${primaryColor}" text-anchor="middle" letter-spacing="0.08em">
        ${escapeXml(category.toUpperCase())}
      </text>
    </g>
  </g>

  <!-- Main Article Title (Multiline) -->
  <text x="80" y="${titleStartY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="48" font-weight="700" fill="#ffffff" letter-spacing="-0.025em">
    ${titleLines
      .map(
        (line, i) =>
          `<tspan x="80" dy="${i === 0 ? 0 : titleLineHeight}">${escapeXml(line)}</tspan>`
      )
      .join('')}
  </text>

  <!-- Excerpt Subtext (if space allows) -->
  ${
    excerptLines.length > 0 && titleLines.length <= 2
      ? `<text x="80" y="${titleStartY + titleLines.length * titleLineHeight + 10}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="20" font-weight="400" fill="#94a3b8" letter-spacing="-0.01em">
        ${excerptLines
          .map(
            (line, i) =>
              `<tspan x="80" dy="${i === 0 ? 0 : 28}">${escapeXml(line)}</tspan>`
          )
          .join('')}
      </text>`
      : ''
  }

  <!-- Footer Area: Author Profile, Metadata & Domain -->
  <g transform="translate(80, 485)">
    <!-- Author Monogram Avatar -->
    <rect x="0" y="0" width="56" height="56" rx="28" fill="url(#avatar-grad)" />
    <text x="28" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="20" font-weight="700" fill="#0f172a" text-anchor="middle">
      ${escapeXml(authorInitials || 'ZB')}
    </text>

    <!-- Author Info -->
    <text x="72" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="18" font-weight="600" fill="#f8fafc">
      ${escapeXml(authorName)}
    </text>
    <text x="72" y="46" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="14" font-weight="400" fill="#94a3b8">
      ${escapeXml(authorDesignation || date)} • ${escapeXml(readingTime)}
    </text>

    <!-- Right-aligned Domain Badge -->
    <g transform="translate(860, 16)">
      <text x="140" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="16" font-weight="500" fill="#64748b" text-anchor="end">
        ${escapeXml(domain)}
      </text>
    </g>
  </g>
</svg>`;
}

/**
 * Encodes SVG string into a ready-to-use Data URI
 */
export function generateOgImageDataUri(options: OgImageOptions): string {
  const svg = generateOgImageSvg(options);
  if (typeof globalThis !== 'undefined' && (globalThis as any).Buffer) {
    return `data:image/svg+xml;base64,${(globalThis as any).Buffer.from(svg).toString('base64')}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Automatically creates an OG image data URI or URL for a post
 */
export function getPostOgImage(post: Post, config?: BlogConfig): string {
  // If post has manual OG image or featured image, use it
  if (post.seo?.og_image_url) {
    return post.seo.og_image_url;
  }
  if (post.featured_image?.url) {
    return post.featured_image.url;
  }

  const siteName = config?.seo?.siteName || 'Zwantum Blog';
  const siteUrl = config?.seo?.siteUrl || '';
  const domain = siteUrl ? siteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : 'zwantum.com';

  const category = post.categories?.[0]?.name || 'Article';
  const readingTime = post.reading_time ? `${post.reading_time} min read` : '3 min read';

  return generateOgImageDataUri({
    title: post.title,
    excerpt: post.excerpt || undefined,
    siteName,
    category,
    authorName: post.author?.name || 'Zwantum Editorial',
    authorDesignation: post.author?.designation || undefined,
    readingTime,
    domain,
  });
}
