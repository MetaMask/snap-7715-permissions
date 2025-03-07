import type { Permission } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type {
  AttenuatedResponse,
  SupportedPermissionTypes,
} from '../../orchestrators';
import type { PermissionConfirmationContext } from '../types';
import { CANCEL_BUTTON, GRANT_BUTTON } from '../userInputConstant';

/**
 * Get the active interface context.
 *
 * @param activeInterfaceId - The active interface id.
 * @returns The active interface context.
 */
export const getActiveInterfaceContext = async (activeInterfaceId: string) => {
  const activeContext = await snap.request({
    method: 'snap_getInterfaceContext',
    params: {
      id: activeInterfaceId,
    },
  });

  if (!activeContext) {
    throw new Error('No active context found');
  }

  if (!activeContext.permission) {
    throw new Error('No permission found in context');
  }

  // safely cast the permission type
  const permissionType = extractPermissionName(
    (activeContext.permission as Permission).type,
  ) as SupportedPermissionTypes;
  return activeContext as PermissionConfirmationContext<typeof permissionType>;
};

/**
 * Handle button click events to update the interface.
 *
 * @param event - The button click event.
 * @param activeInterfaceId - The active interface id.
 */
export const buttonClickEventHandler = async (
  event: UserInputEvent,
  activeInterfaceId: string,
) => {
  if (event.type !== UserInputEventType.ButtonClickEvent) {
    throw new Error('Invalid event type');
  }

  const activeContext = await getActiveInterfaceContext(activeInterfaceId);
  const attenuatedResponse: AttenuatedResponse<SupportedPermissionTypes> = {
    attenuatedPermission: activeContext.permission,
    attenuatedExpiry: activeContext.expiry,
    isConfirmed: false,
  };

  if (event.name === CANCEL_BUTTON) {
    await snap.request({
      method: 'snap_resolveInterface',
      params: {
        id: activeInterfaceId,
        value: attenuatedResponse,
      },
    });
  } else if (event.name === GRANT_BUTTON) {
    await snap.request({
      method: 'snap_resolveInterface',
      params: {
        id: activeInterfaceId,
        value: {
          ...attenuatedResponse,
          isConfirmed: true,
        },
      },
    });
  }
};
