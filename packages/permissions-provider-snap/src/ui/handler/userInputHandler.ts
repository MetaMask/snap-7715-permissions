import type { Permission } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type { SupportedPermissionTypes } from '../../orchestrators';
import type { PermissionConfirmationContext } from '../types';
import { CANCEL_BUTTON, GRANT_BUTTON } from '../userInputConstant';
import type { AttenuatedResponse } from './renderHandler';

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
 * @param activeContext - The active context.
 * @returns True if snap_resolveInterface is called to resolve the interface.
 */
export const shouldInterfaceResolveHandler = async (
  event: UserInputEvent,
  activeInterfaceId: string,
  activeContext: PermissionConfirmationContext<SupportedPermissionTypes>,
): Promise<boolean> => {
  if (event.type !== UserInputEventType.ButtonClickEvent) {
    throw new Error('Invalid event type');
  }

  const attenuatedResponse: AttenuatedResponse<SupportedPermissionTypes> = {
    attenuatedPermission: activeContext.permission,
    attenuatedExpiry: activeContext.expiry,
    isConfirmed: false,
  };
  let didInterfaceResolve = false;

  if (event.name === CANCEL_BUTTON) {
    await snap.request({
      method: 'snap_resolveInterface',
      params: {
        id: activeInterfaceId,
        value: attenuatedResponse,
      },
    });
    didInterfaceResolve = true;
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
    didInterfaceResolve = true;
  }

  return didInterfaceResolve;
};
