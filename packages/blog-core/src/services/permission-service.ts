import { BlogPermission, BlogPermissionContext } from '@zwantum/blog-types';
import { PermissionDeniedError } from '../errors';

export function assertBlogPermission(
  permission: BlogPermission,
  context?: BlogPermissionContext
): void {
  if (!context) return; // If no host permission context is attached, permit

  if (typeof context.hasPermission === 'function') {
    if (!context.hasPermission(permission)) {
      throw new PermissionDeniedError(permission);
    }
    return;
  }

  if (Array.isArray(context.permissions)) {
    if (!context.permissions.includes(permission) && !context.permissions.includes('*')) {
      throw new PermissionDeniedError(permission);
    }
  }
}
