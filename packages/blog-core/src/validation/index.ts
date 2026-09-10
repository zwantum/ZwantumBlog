import { PostCreateInput, PostUpdateInput, CategoryInput, TagInput, AuthorInput } from '@zwantum/blog-types';
import { InvalidPostError } from '../errors';

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function validatePostInput(input: PostCreateInput | PostUpdateInput, isUpdate: boolean = false): void {
  const errors: string[] = [];

  if (!isUpdate && (!input.title || !input.title.trim())) {
    errors.push('Post title is required');
  }

  if (input.slug !== undefined && input.slug !== null) {
    if (!input.slug.trim()) {
      errors.push('Post slug cannot be empty');
    } else if (!validateSlug(input.slug)) {
      errors.push('Post slug must consist of lowercase letters, numbers, and single hyphens (e.g. "my-first-post")');
    }
  }

  if (input.scheduled_at) {
    const scheduledDate = new Date(input.scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      errors.push('Invalid scheduled_at date format');
    }
  }

  if (input.status === 'scheduled' && !input.scheduled_at) {
    errors.push('A scheduled_at date is required when post status is set to "scheduled"');
  }

  if (errors.length > 0) {
    throw new InvalidPostError(`Validation failed for post: ${errors.join(', ')}`, errors);
  }
}

export function validateCategoryInput(input: CategoryInput): void {
  const errors: string[] = [];

  if (!input.name || !input.name.trim()) {
    errors.push('Category name is required');
  }

  if (input.slug && !validateSlug(input.slug)) {
    errors.push('Category slug must consist of lowercase letters, numbers, and single hyphens');
  }

  if (errors.length > 0) {
    throw new Error(`Category validation failed: ${errors.join(', ')}`);
  }
}

export function validateTagInput(input: TagInput): void {
  const errors: string[] = [];

  if (!input.name || !input.name.trim()) {
    errors.push('Tag name is required');
  }

  if (input.slug && !validateSlug(input.slug)) {
    errors.push('Tag slug must consist of lowercase letters, numbers, and single hyphens');
  }

  if (errors.length > 0) {
    throw new Error(`Tag validation failed: ${errors.join(', ')}`);
  }
}

export function validateAuthorInput(input: AuthorInput): void {
  if (!input.name || !input.name.trim()) {
    throw new Error('Author name is required');
  }
}
