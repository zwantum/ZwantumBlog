export class BlogError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string = 'BLOG_ERROR', status: number = 400) {
    super(message);
    this.name = 'BlogError';
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PostNotFoundError extends BlogError {
  constructor(identifier: string) {
    super(`Post with identifier "${identifier}" was not found`, 'POST_NOT_FOUND', 404);
    this.name = 'PostNotFoundError';
  }
}

export class DuplicateSlugError extends BlogError {
  constructor(slug: string, entity: string = 'Post') {
    super(`${entity} with slug "${slug}" already exists`, 'DUPLICATE_SLUG', 409);
    this.name = 'DuplicateSlugError';
  }
}

export class InvalidPostError extends BlogError {
  public validationErrors?: string[];
  constructor(message: string, validationErrors?: string[]) {
    super(message, 'INVALID_POST', 422);
    this.name = 'InvalidPostError';
    this.validationErrors = validationErrors;
  }
}

export class CategoryNotFoundError extends BlogError {
  constructor(identifier: string) {
    super(`Category "${identifier}" not found`, 'CATEGORY_NOT_FOUND', 404);
    this.name = 'CategoryNotFoundError';
  }
}

export class TagNotFoundError extends BlogError {
  constructor(identifier: string) {
    super(`Tag "${identifier}" not found`, 'TAG_NOT_FOUND', 404);
    this.name = 'TagNotFoundError';
  }
}

export class AuthorNotFoundError extends BlogError {
  constructor(identifier: string) {
    super(`Author "${identifier}" not found`, 'AUTHOR_NOT_FOUND', 404);
    this.name = 'AuthorNotFoundError';
  }
}

export class PermissionDeniedError extends BlogError {
  constructor(permission: string) {
    super(`Permission denied: required "${permission}"`, 'PERMISSION_DENIED', 403);
    this.name = 'PermissionDeniedError';
  }
}

export class SchedulingError extends BlogError {
  constructor(message: string) {
    super(message, 'SCHEDULING_ERROR', 400);
    this.name = 'SchedulingError';
  }
}
