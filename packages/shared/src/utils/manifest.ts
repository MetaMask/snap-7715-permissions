import type { SnapManifest } from '../types/manifest';

/**
 * Helper function to define a Snap manifest with type safety.
 * This allows for environment-based configuration while maintaining type checking.
 *
 * @param manifest - The snap manifest configuration.
 * @returns The manifest object.
 */
export function defineSnapManifest(manifest: SnapManifest): SnapManifest {
  return manifest;
}
