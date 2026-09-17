import { Post, BlogConfig } from '@zwantum/blog-types';
import { stripHtml } from './utils';

export interface GeneratedMetadata {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  rssFeedUrl?: string;
  openGraph?: {
    title: string;
    description: string;
    url: string;
    siteName?: string;
    images: Array<{ url: string; alt?: string; width?: number; height?: number }>;
    type: string;
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
  };
  twitter?: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    images: string[];
    creator?: string;
  };
  alternates?: {
    canonical: string;
    types?: Record<string, string>;
  };
}

export function generatePostMetadata(post: Post, config?: BlogConfig): GeneratedMetadata {
  const siteName = config?.seo?.siteName || 'Website';
  const siteUrl = (config?.seo?.siteUrl || '').replace(/\/$/, '');
  const basePath = config?.basePath || '/blog';
  const postUrl = `${siteUrl}${basePath}/${post.slug}`;

  const postSeo = post.seo;

  // Title fallback: {manual_title} OR "{post.title} | {siteName}"
  const plainTitle = stripHtml(post.title);
  const title = postSeo?.meta_title?.trim()
    ? postSeo.meta_title
    : `${plainTitle} | ${siteName}`;

  // Description fallback: {manual_desc} OR {post.excerpt} OR truncated post title
  const description = postSeo?.meta_description?.trim()
    ? postSeo.meta_description
    : post.excerpt?.trim() || plainTitle;

  // Canonical fallback: {manual_canonical} OR generated URL
  const canonical = postSeo?.canonical_url?.trim()
    ? postSeo.canonical_url
    : postUrl;

  // Robots fallback
  const robots = postSeo?.robots || 'index,follow';

  // Images fallback: SEO OG image OR post featured image OR default OG image
  const imageUrl =
    postSeo?.og_image_url ||
    post.featured_image?.url ||
    config?.seo?.defaultOgImage ||
    '';

  const imageAlt = post.featured_image?.alt_text || plainTitle;

  // OG Title & Description
  const ogTitle = postSeo?.og_title?.trim() || plainTitle;
  const ogDescription = postSeo?.og_description?.trim() || description;

  // Twitter Title & Description
  const twitterTitle = postSeo?.twitter_title?.trim() || ogTitle;
  const twitterDescription = postSeo?.twitter_description?.trim() || ogDescription;
  const twitterImage = postSeo?.twitter_image_url?.trim() || imageUrl;
  const twitterCard = (postSeo?.twitter_card as 'summary' | 'summary_large_image') || 'summary_large_image';

  const feedUrl = siteUrl ? `${siteUrl}${basePath}/rss.xml` : `${basePath}/rss.xml`;

  return {
    title,
    description,
    canonical,
    robots,
    rssFeedUrl: feedUrl,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: postUrl,
      siteName,
      type: 'article',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      authors: post.author ? [post.author.name] : undefined,
      tags: post.tags?.map((t) => t.name),
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: imageAlt,
              width: post.featured_image?.width || 1200,
              height: post.featured_image?.height || 630,
            },
          ]
        : [],
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      images: twitterImage ? [twitterImage] : [],
      creator: config?.seo?.defaultTwitterHandle,
    },
    alternates: {
      canonical,
      types: {
        'application/rss+xml': feedUrl,
      },
    },
  };
}

/**
 * Returns standard HTML <link rel="alternate" type="application/rss+xml" ...> tag
 * for RSS auto-discovery in browsers and feed readers.
 */
export function getRssDiscoveryLinkTag(config?: BlogConfig): string {
  const siteUrl = (config?.seo?.siteUrl || '').replace(/\/$/, '');
  const basePath = config?.basePath || '/blog';
  const siteName = config?.seo?.siteName || 'Blog';
  const feedUrl = siteUrl ? `${siteUrl}${basePath}/rss.xml` : `${basePath}/rss.xml`;
  return `<link rel="alternate" type="application/rss+xml" title="${siteName} Feed" href="${feedUrl}" />`;
}

export function generateAuthorMetadata(author: import('@zwantum/blog-types').Author, config?: BlogConfig): GeneratedMetadata {
  const siteName = config?.seo?.siteName || 'Website';
  const siteUrl = (config?.seo?.siteUrl || '').replace(/\/$/, '');
  const authorPath = config?.authorsPath || `${config?.basePath || '/blog'}/author`;
  const authorUrl = `${siteUrl}${authorPath}/${author.slug}`;

  const title = author.seo?.metaTitle?.trim()
    ? author.seo.metaTitle
    : `${author.name}${author.designation ? ` - ${author.designation}` : ''} | ${siteName}`;

  const description = author.seo?.metaDescription?.trim()
    ? author.seo.metaDescription
    : author.bio?.trim() || `Read articles and contributions by ${author.name} on ${siteName}.`;

  const canonical = author.seo?.canonicalUrl?.trim() || authorUrl;
  const robots = author.seo?.noIndex ? 'noindex,nofollow' : (author.seo?.robots || 'index,follow');
  const imageUrl = author.seo?.ogImage || author.profile_image_url || config?.seo?.defaultOgImage;

  const images = imageUrl
    ? [{ url: imageUrl, alt: author.name, width: 400, height: 400 }]
    : [];

  return {
    title,
    description,
    canonical,
    robots,
    openGraph: {
      title: author.seo?.ogTitle || title,
      description: author.seo?.ogDescription || description,
      url: canonical,
      siteName,
      images,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: author.seo?.ogTitle || title,
      description: author.seo?.ogDescription || description,
      images: imageUrl ? [imageUrl] : [],
      creator: author.social_links?.twitter,
    },
    alternates: {
      canonical,
    },
  };
}

export function generateTagMetadata(tag: import('@zwantum/blog-types').Tag, config?: BlogConfig): GeneratedMetadata {
  const siteName = config?.seo?.siteName || 'Website';
  const siteUrl = (config?.seo?.siteUrl || '').replace(/\/$/, '');
  const tagPath = `${config?.basePath || '/blog'}/tag`;
  const tagUrl = `${siteUrl}${tagPath}/${tag.slug}`;

  const title = tag.seo_title?.trim()
    ? tag.seo_title
    : `#${tag.name} - Topics & Articles | ${siteName}`;

  const description = tag.seo_description?.trim()
    ? tag.seo_description
    : tag.description?.trim() || `Explore articles and updates tagged with #${tag.name} on ${siteName}.`;

  const canonical = tag.canonical_url?.trim() || tagUrl;
  const isNoIndex = tag.no_index || (tag.robots && tag.robots.includes('noindex'));
  const robots = isNoIndex ? 'noindex,follow' : (tag.robots || 'index,follow');

  return {
    title,
    description,
    canonical,
    robots,
    alternates: {
      canonical,
    },
  };
}

export function generateCategoryMetadata(category: import('@zwantum/blog-types').Category, config?: BlogConfig): GeneratedMetadata {
  const siteName = config?.seo?.siteName || 'Website';
  const siteUrl = (config?.seo?.siteUrl || '').replace(/\/$/, '');
  const categoryPath = `${config?.basePath || '/blog'}/category`;
  const categoryUrl = `${siteUrl}${categoryPath}/${category.slug}`;

  const title = category.seo_title?.trim()
    ? category.seo_title
    : `${category.name} - Articles & Guides | ${siteName}`;

  const description = category.seo_description?.trim()
    ? category.seo_description
    : category.description?.trim() || `Browse articles, guides, and tutorials in ${category.name} on ${siteName}.`;

  const canonical = category.canonical_url?.trim() || categoryUrl;
  const isNoIndex = category.no_index || (category.robots && category.robots.includes('noindex'));
  const robots = isNoIndex ? 'noindex,follow' : (category.robots || 'index,follow');

  return {
    title,
    description,
    canonical,
    robots,
    alternates: {
      canonical,
    },
  };
}

