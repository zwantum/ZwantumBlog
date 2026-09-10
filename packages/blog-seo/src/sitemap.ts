import { Post, Category, Tag, Author, BlogConfig } from '@zwantum/blog-types';

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemapEntries(options: {
  posts: Post[];
  categories?: Category[];
  tags?: Tag[];
  authors?: Author[];
  config?: BlogConfig;
}): SitemapEntry[] {
  const { posts, categories = [], tags = [], authors = [], config } = options;
  const siteUrl = (config?.seo?.siteUrl || '').replace(/\/$/, '');
  const basePath = config?.basePath || '/blog';

  const entries: SitemapEntry[] = [];

  // Blog landing index page
  entries.push({
    url: `${siteUrl}${basePath}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 0.9,
  });

  // Published posts that aren't noindex
  for (const post of posts) {
    if (post.status !== 'published') continue;
    if (post.seo?.robots?.includes('noindex')) continue;

    entries.push({
      url: `${siteUrl}${basePath}/${post.slug}`,
      lastModified: post.updated_at || post.published_at || new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: post.is_featured ? 0.9 : 0.7,
    });
  }

  // Active categories that aren't noindex
  const catPath = config?.categoriesPath || `${basePath}/category`;
  for (const cat of categories) {
    if (!cat.is_active || cat.robots?.includes('noindex')) continue;
    entries.push({
      url: `${siteUrl}${catPath}/${cat.slug}`,
      lastModified: cat.updated_at || new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  // Active tags that aren't noindex
  const tagPath = config?.tagsPath || `${basePath}/tag`;
  for (const tag of tags) {
    if (tag.robots?.includes('noindex')) continue;
    entries.push({
      url: `${siteUrl}${tagPath}/${tag.slug}`,
      lastModified: tag.updated_at || new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  // Authors
  const authPath = config?.authorsPath || `${basePath}/author`;
  for (const auth of authors) {
    if (!auth.is_active || auth.seo?.robots?.includes('noindex')) continue;
    entries.push({
      url: `${siteUrl}${authPath}/${auth.slug}`,
      lastModified: auth.updated_at || new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  }

  return entries;
}

export function generateSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      let xml = `  <url>\n    <loc>${escapeXml(e.url)}</loc>\n`;
      if (e.lastModified) {
        xml += `    <lastmod>${e.lastModified}</lastmod>\n`;
      }
      if (e.changeFrequency) {
        xml += `    <changefreq>${e.changeFrequency}</changefreq>\n`;
      }
      if (e.priority !== undefined) {
        xml += `    <priority>${e.priority.toFixed(1)}</priority>\n`;
      }
      xml += '  </url>';
      return xml;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
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
