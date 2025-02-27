import type { UserInputEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import { getInterfaceIdState } from '../stateManagement';
import type { GrantPermissionContext } from '../ui';
import { CANCEL_BUTTON, GRANT_BUTTON } from '../ui';

/**
 * Get the active interface context.
 *
 * @returns The active interface context.
 */
export const getActiveInterfaceContext = async () => {
  const activeInterfaceId = await getInterfaceIdState();
  const context = await snap.request({
    method: 'snap_getInterfaceContext',
    params: {
      id: activeInterfaceId,
    },
  });

  return { activeInterfaceId, context: context as GrantPermissionContext };
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

  if (event.name === CANCEL_BUTTON) {
    await snap.request({
      method: 'snap_resolveInterface',
      params: {
        id: activeInterfaceId,
        value: false,
      },
    });
  } else if (event.name === GRANT_BUTTON) {
    await snap.request({
      method: 'snap_resolveInterface',
      params: {
        id: activeInterfaceId,
        value: true,
      },
    });
  }
};
