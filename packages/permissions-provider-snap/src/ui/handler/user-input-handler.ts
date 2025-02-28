import type { UserInputEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import { createStateManager } from '../../stateManagement';
import { CANCEL_BUTTON, GRANT_BUTTON } from '../user-input.contant';

/**
 * Get the active interface context.
 *
 * @returns The active interface context.
 */
export const getActiveInterfaceContext = async () => {
  const stateManager = createStateManager(snap);
  const { activeInterfaceId } = await stateManager.getState();
  const context = await snap.request({
    method: 'snap_getInterfaceContext',
    params: {
      id: activeInterfaceId,
    },
  });

  return { activeInterfaceId, activeContext: context };
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
    const { activeContext } = await getActiveInterfaceContext();
    await snap.request({
      method: 'snap_resolveInterface',
      params: {
        id: activeInterfaceId,
        value: activeContext,
      },
    });
  }
};
