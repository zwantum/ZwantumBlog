import { describe, it, expect } from 'vitest';
import {
  generatePostMetadata,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  evaluateSEOHealth,
  generateSitemapEntries,
  generateSitemapXml,
  generateRssFeedXml,
  getRssDiscoveryLinkTag,
} from '../src';
import { Post } from '@zwantum/blog-types';

describe('ZwantumBlog SEO Engine', () => {
  const samplePost: Post = {
    id: 'post-1',
    title: 'Harmonious Bedroom Directions According to Vastu',
    slug: 'harmonious-bedroom-directions-vastu',
    excerpt: 'Aligning your sleeping quarters to foster restful recovery and peaceful energy.',
    content: { type: 'doc', content: [] },
    status: 'published',
    content_type: 'article',
    is_featured: true,
    reading_time: 4,
    word_count: 480,
    custom_fields: {},
    published_at: '2026-09-01T10:00:00.000Z',
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-02T12:00:00.000Z',
    author: {
      id: 'a1',
      name: 'Dr. Aarav Sharma',
      slug: 'dr-aarav-sharma',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    featured_image: {
      id: 'm1',
      filename: 'bedroom.jpg',
      original_name: 'bedroom.jpg',
      url: 'https://example.com/bedroom.jpg',
      alt_text: 'Symmetrical serene bedroom layout',
      mime_type: 'image/jpeg',
      file_size: 250000,
      storage_provider: 'supabase',
      storage_path: 'bedroom.jpg',
      created_at: '',
      updated_at: '',
    },
    seo: {
      meta_title: 'Harmonious Bedroom Directions | Vastu Guide',
      meta_description: 'Align your bedroom according to classical spatial principles for peaceful sleep.',
      focus_keyword: 'bedroom directions',
      robots: 'index,follow',
      schema_type: 'Article',
    },
  };

  it('generates accurate metadata with OpenGraph and Twitter fallbacks', () => {
    const meta = generatePostMetadata(samplePost, {
      basePath: '/blog',
      seo: { siteName: 'Vastu Sanctuary', siteUrl: 'https://vastu.com' },
    });

    expect(meta.title).toBe('Harmonious Bedroom Directions | Vastu Guide');
    expect(meta.canonical).toBe('https://vastu.com/blog/harmonious-bedroom-directions-vastu');
    expect(meta.rssFeedUrl).toBe('https://vastu.com/blog/rss.xml');
    expect(meta.alternates?.types?.['application/rss+xml']).toBe('https://vastu.com/blog/rss.xml');
    expect(meta.openGraph.siteName).toBe('Vastu Sanctuary');
    expect(meta.openGraph.images[0].url).toBe('https://example.com/bedroom.jpg');
    expect(meta.openGraph.images[0].alt).toBe('Symmetrical serene bedroom layout');
    expect(meta.twitter.card).toBe('summary_large_image');

    const rssLink = getRssDiscoveryLinkTag({
      basePath: '/blog',
      seo: { siteName: 'Vastu Sanctuary', siteUrl: 'https://vastu.com' },
    });
    expect(rssLink).toBe('<link rel="alternate" type="application/rss+xml" title="Vastu Sanctuary Feed" href="https://vastu.com/blog/rss.xml" />');
  });

  it('generates valid JSON-LD schema for Article and BreadcrumbList', () => {
    const articleSchema = generateArticleSchema(samplePost, {
      basePath: '/blog',
      seo: { siteName: 'Vastu Sanctuary', siteUrl: 'https://vastu.com' },
    });

    expect(articleSchema['@context']).toBe('https://schema.org');
    expect(articleSchema['@type']).toBe('Article');
    expect((articleSchema.author as any).name).toBe('Dr. Aarav Sharma');

    const breadcrumbs = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://vastu.com' },
      { name: 'Blog', url: 'https://vastu.com/blog' },
      { name: samplePost.title, url: 'https://vastu.com/blog/harmonious-bedroom-directions-vastu' },
    ]);

    expect(breadcrumbs['@type']).toBe('BreadcrumbList');
    expect((breadcrumbs.itemListElement as any[]).length).toBe(3);
  });

  it('evaluates SEO health and reports scores with actionable diagnostic items', () => {
    const report = evaluateSEOHealth(samplePost);

    expect(report.score).toBeGreaterThan(80);
    expect(report.passedCount).toBeGreaterThan(5);

    const titleCheck = report.checks.find((c) => c.id.startsWith('title'));
    expect(titleCheck?.passed).toBe(true);

    const keywordCheck = report.checks.find((c) => c.id === 'keyword_title');
    expect(keywordCheck?.passed).toBe(true);
  });

  it('generates valid sitemap and RSS XML feeds', () => {
    const entries = generateSitemapEntries({
      posts: [samplePost],
      config: { basePath: '/blog', seo: { siteUrl: 'https://vastu.com' } },
    });

    const sitemapXml = generateSitemapXml(entries);
    expect(sitemapXml).toContain('<loc>https://vastu.com/blog/harmonious-bedroom-directions-vastu</loc>');
    expect(sitemapXml).toContain('<urlset');

    const htmlPost: Post = {
      ...samplePost,
      title: '10 Ways to <i>Succeed</i> with <span style="color:red">Vastu</span>',
      excerpt: 'Learn <strong>practical</strong> tips for harmony.',
    };

    const rssXml = generateRssFeedXml({
      posts: [htmlPost],
      config: { basePath: '/blog', seo: { siteUrl: 'https://vastu.com', siteName: 'Vastu Living' } },
    });

    // Titles and excerpts in RSS must strip raw HTML tags
    expect(rssXml).toContain('<title><![CDATA[10 Ways to Succeed with Vastu]]></title>');
    expect(rssXml).toContain('<description><![CDATA[Learn practical tips for harmony.]]></description>');
    expect(rssXml).toContain('<rss version="2.0"');
    expect(rssXml).toContain('<atom:link href="https://vastu.com/blog/rss.xml" rel="self" type="application/rss+xml" />');
  });
});
