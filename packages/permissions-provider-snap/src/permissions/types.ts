import type { PermissionRequestResult } from '../core/types';

/**
 * Generic interface for permission handlers.
 *
 * Permission handlers are responsible for:
 * 1. Handling permission-specific validation
 * 2. Managing permission-specific UI interaction
 * 3. Providing lifecycle hook implementations
 * 4. Converting between request/context/metadata formats
 *
 * @template TRequest - The specific permission request type
 * @template TContext - The context type used for this permission
 * @template TMetadata - The metadata type used for this permission
 */
export type PermissionHandler = {
  /**
   * Handles a permission request, orchestrating the full lifecycle from request to response.
   *
   * @param origin - The origin of the permission request
   * @param permissionRequest - The permission request to handle
   * @returns A permission response object
   */
  handlePermissionRequest(origin: string): Promise<PermissionRequestResult>;
};
