import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';

import type { MessageKey } from '../../utils/i18n';

/**
 * Permission response with display-formatted fields (e.g. `maxAmount` as "1.5 ETH" instead of Hex).
 * Use only for UI display. Do not pass to code that expects raw Hex (e.g. formatUnitsFromHex, hexToNumber).
 */
export type FormattedPermissionForDisplay = Omit<
  PermissionResponse,
  'permission'
> & {
  permission: Omit<PermissionResponse['permission'], 'data'> & {
    data: Record<string, unknown>;
  };
};

/**
 * Configuration for displaying existing permissions.
 */
export type ExistingPermissionDisplayConfig = {
  /** The existing permissions to display (with formatted values for UI only) */
  existingPermissions: FormattedPermissionForDisplay[];
  /** The translation key for the dialog title */
  title: MessageKey;
  /** The translation key for the comparison description */
  description: MessageKey;
  /** The translation key for the acknowledgement button */
  buttonLabel: MessageKey;
};
