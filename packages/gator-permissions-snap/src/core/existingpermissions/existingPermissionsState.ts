/**
 * Status of existing permissions for a site with respect to the currently requested permission.
 * Drives banner severity and whether the confirmation flow prefetches stored grants for this origin.
 */
export enum ExistingPermissionsState {
  None = 'None',
  DissimilarPermissions = 'DissimilarPermissions',
  SimilarPermissions = 'SimilarPermissions',
}
