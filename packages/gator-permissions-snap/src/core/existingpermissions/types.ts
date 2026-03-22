import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';

import type { MessageKey } from '../../utils/i18n';

/**
 * Configuration for displaying existing permissions.
 */
export type ExistingPermissionDisplayConfig = {
  /** The existing permissions to display (with formatted values for UI only) */
  existingPermissions: PermissionResponse[];
  /** The translation key for the dialog title */
  title: MessageKey;
  /** The translation key for the comparison description */
  description: MessageKey;
  /** The translation key for the acknowledgement button */
  buttonLabel: MessageKey;
};
