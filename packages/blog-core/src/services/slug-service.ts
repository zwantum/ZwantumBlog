import { BlogDatabaseAdapter } from '@zwantum/blog-types';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with -
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing -
}

export async function generateUniquePostSlug(
  title: string,
  db: BlogDatabaseAdapter,
  excludePostId?: string,
  preferredSlug?: string
): Promise<string> {
  const baseSlug = preferredSlug ? slugify(preferredSlug) : slugify(title) || 'untitled-post';
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.getPostBySlug(candidate);
    if (!existing || (excludePostId && existing.id === excludePostId)) {
      return candidate;
    }
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function handlePostSlugChange(
  postId: string,
  oldSlug: string,
  newSlug: string,
  isPublished: boolean,
  basePath: string,
  db: BlogDatabaseAdapter
): Promise<void> {
  if (oldSlug === newSlug) return;

  // If the post was already published, automatically create 301 redirect to protect backlinks & SEO
  if (isPublished) {
    const sourceUrl = `${basePath}/${oldSlug}`;
    const destinationUrl = `${basePath}/${newSlug}`;

    await db.createRedirect({
      source_url: sourceUrl,
      destination_url: destinationUrl,
      status_code: 301,
      post_id: postId,
    });
  }
}
