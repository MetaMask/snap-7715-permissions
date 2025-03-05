import type { UserInputEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import { CANCEL_BUTTON, GRANT_BUTTON } from '../userInputConstant';

/**
 * Get the active interface context.
 *
 * @param activeInterfaceId - The active interface id.
 * @returns The active interface context.
 */
export const getActiveInterfaceContext = async (activeInterfaceId: string) => {
  const context = await snap.request({
    method: 'snap_getInterfaceContext',
    params: {
      id: activeInterfaceId,
    },
  });

  return context;
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
        value: null,
      },
    });
  } else if (event.name === GRANT_BUTTON) {
    const activeContext = await getActiveInterfaceContext(activeInterfaceId);
    await snap.request({
      method: 'snap_resolveInterface',
      params: {
        id: activeInterfaceId,
        value: activeContext,
      },
    });
  }
};
