/**
 * Per-permission configuration for shared confirmation shell capabilities.
 */
export type ConfirmationShellConfig = {
  accountSelector: boolean;
  tokenBalance: boolean;
  accountUpgradeBanner: boolean;
  existingPermissionsReview: boolean;
};

/** Default shell capabilities enabled for all permission types. */
export const DEFAULT_CONFIRMATION_SHELL_CONFIG: ConfirmationShellConfig = {
  accountSelector: true,
  tokenBalance: true,
  accountUpgradeBanner: true,
  existingPermissionsReview: true,
};
