import { Post, PostFilterInput, PaginationParams, BlogConfig, PaginatedResult } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';
import { generatePostMetadata as buildMetadata, generateArticleSchema } from '@zwantum/blog-seo';

export async function getPost(slug: string, client: BlogClient): Promise<Post | null> {
  return client.posts.getBySlug(slug);
}

export async function getPosts(
  filters: PostFilterInput & PaginationParams,
  client: BlogClient
): Promise<PaginatedResult<Post>> {
  return client.posts.list({
    status: 'published',
    ...filters,
  });
}

export async function getBlogMetadata(
  slug: string,
  client: BlogClient,
  configOverride?: BlogConfig
) {
  const post = await client.posts.getBySlug(slug);
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const config = configOverride || client.config;
  const meta = buildMetadata(post, config);

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: meta.canonical,
    },
    robots: meta.robots,
    openGraph: meta.openGraph
      ? {
          title: meta.openGraph.title,
          description: meta.openGraph.description,
          url: meta.openGraph.url,
          siteName: meta.openGraph.siteName,
          type: 'article',
          publishedTime: meta.openGraph.publishedTime,
          modifiedTime: meta.openGraph.modifiedTime,
          authors: meta.openGraph.authors,
          tags: meta.openGraph.tags,
          images: meta.openGraph.images.map((img) => ({
            url: img.url,
            alt: img.alt,
            width: img.width,
            height: img.height,
          })),
        }
      : undefined,
    twitter: meta.twitter
      ? {
          card: meta.twitter.card,
          title: meta.twitter.title,
          description: meta.twitter.description,
          images: meta.twitter.images,
          creator: meta.twitter.creator,
        }
      : undefined,
  };
}

export async function getBlogSchema(
  slug: string,
  client: BlogClient,
  configOverride?: BlogConfig
): Promise<Record<string, unknown> | null> {
  const post = await client.posts.getBySlug(slug);
  if (!post) return null;

  return generateArticleSchema(post, configOverride || client.config);
}
