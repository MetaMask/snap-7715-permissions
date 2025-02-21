import type { TypeDescriptor } from '../types/7715-permissions-types';

/**
 * Extracts the name of a permission from a permission type.
 *
 * @param type - The type of permission to extract the name from.
 * @returns The name of the permission.
 */
export const extractPermissionName = (type: TypeDescriptor): string => {
  if (typeof type === 'object') {
    return type.name;
  }
  return type;
};
