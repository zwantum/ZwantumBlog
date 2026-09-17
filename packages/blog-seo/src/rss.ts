import { Post, BlogConfig } from '@zwantum/blog-types';
import { stripHtml } from './utils';

export function generateRssFeedXml(options: {
  posts: Post[];
  config?: BlogConfig;
  feedTitle?: string;
  feedDescription?: string;
}): string {
  const { posts, config } = options;
  const siteUrl = (config?.seo?.siteUrl || '').replace(/\/$/, '');
  const basePath = config?.basePath || '/blog';
  const siteName = config?.seo?.siteName || 'ZwantumBlog';

  const title = options.feedTitle || `${siteName} Feed`;
  const description = options.feedDescription || `Latest articles from ${siteName}`;
  const feedUrl = `${siteUrl}${basePath}/rss.xml`;
  const blogUrl = `${siteUrl}${basePath}`;

  const publishedPosts = posts
    .filter((p) => p.status === 'published')
    .slice(0, 50);

  const items = publishedPosts
    .map((post) => {
      const postUrl = `${siteUrl}${basePath}/${post.slug}`;
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date(post.created_at).toUTCString();
      const authorStr = post.author?.name ? `<dc:creator><![CDATA[${stripHtml(post.author.name)}]]></dc:creator>` : '';
      const categories = post.categories?.map((c) => `<category><![CDATA[${stripHtml(c.name)}]]></category>`).join('\n      ') || '';
      const enclosure = post.featured_image?.url
        ? `<enclosure url="${escapeXml(post.featured_image.url)}" length="${post.featured_image.file_size || 0}" type="${post.featured_image.mime_type || 'image/jpeg'}" />`
        : '';

      const cleanTitle = stripHtml(post.title);
      const cleanExcerpt = stripHtml(post.excerpt || post.title);

      return `    <item>
      <title><![CDATA[${cleanTitle}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${cleanExcerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${authorStr}
      ${categories}
      ${enclosure}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <link>${blogUrl}</link>
    <description><![CDATA[${description}]]></description>
    <language>en-us</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
