import { Post, BreadcrumbItem, BlogConfig } from '@zwantum/blog-types';

export function generateArticleSchema(post: Post, config?: BlogConfig): Record<string, unknown> {
  const siteUrl = (config?.seo?.siteUrl || '').replace(/\/$/, '');
  const basePath = config?.basePath || '/blog';
  const postUrl = `${siteUrl}${basePath}/${post.slug}`;
  const siteName = config?.seo?.siteName || 'Website';

  const schemaType = post.seo?.schema_type || 'BlogPosting';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    headline: post.seo?.meta_title || post.title,
    description: post.seo?.meta_description || post.excerpt || post.title,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    inLanguage: 'en-US',
  };

  if (post.featured_image?.url) {
    schema.image = [post.featured_image.url];
  } else if (post.seo?.og_image_url) {
    schema.image = [post.seo.og_image_url];
  }

  if (post.author) {
    schema.author = {
      '@type': 'Person',
      name: post.author.name,
      url: post.author.slug ? `${siteUrl}${config?.authorsPath || '/blog/author'}/${post.author.slug}` : undefined,
      jobTitle: post.author.designation || undefined,
    };
  }

  schema.publisher = {
    '@type': 'Organization',
    name: siteName,
    url: siteUrl || undefined,
    logo: config?.seo?.defaultOgImage
      ? {
          '@type': 'ImageObject',
          url: config.seo.defaultOgImage,
        }
      : undefined,
  };

  if (post.tags && post.tags.length > 0) {
    schema.keywords = post.tags.map((t) => t.name).join(', ');
  }

  if (post.categories && post.categories.length > 0) {
    schema.articleSection = post.categories[0].name;
  }

  // Merge custom schema overrides if present
  if (post.seo?.custom_schema && Object.keys(post.seo.custom_schema).length > 0) {
    return { ...schema, ...post.seo.custom_schema };
  }

  return schema;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateAuthorSchema(author: import('@zwantum/blog-types').Author, config?: BlogConfig): Record<string, unknown> {
  const siteUrl = (config?.seo?.siteUrl || '').replace(/\/$/, '');
  const authorPath = config?.authorsPath || `${config?.basePath || '/blog'}/author`;
  const authorUrl = `${siteUrl}${authorPath}/${author.slug}`;

  const sameAs: string[] = [];
  if (author.social_links) {
    Object.values(author.social_links).forEach((url) => {
      if (url && typeof url === 'string') sameAs.push(url);
    });
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: authorUrl,
    description: author.bio || undefined,
    jobTitle: author.designation || undefined,
    image: author.profile_image_url || undefined,
  };

  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

