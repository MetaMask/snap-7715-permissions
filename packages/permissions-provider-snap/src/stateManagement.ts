import { logger } from '@metamask/7715-permissions-shared/utils';
import { ManageStateOperation } from '@metamask/snaps-sdk';

export type GatorSnapState = {
  activeInterfaceId: string;
};

/**
 * Default GatorSnapState
 */
const defaultState: GatorSnapState = {
  activeInterfaceId: '',
};

/**
 * Retrieves the current state of the gator snap.
 *
 * @returns The current state of the keyring.
 */
const getState = async (): Promise<GatorSnapState> => {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: ManageStateOperation.GetState },
  })) as any;

  if (!state) {
    logger.debug(
      '[SNAP] Initializing state:',
      JSON.stringify(defaultState, undefined, 2),
    );
    return defaultState;
  }

  return state;
};

/**
 * Retrieves the current state of the InterfaceId.
 *
 * @returns The current state of the InterfaceId.
 */
export const getInterfaceIdState = async (): Promise<string> => {
  const state = await getState();
  return state.activeInterfaceId;
};

/**
 * Persists the given InterfaceId state to the snap state.
 *
 * @param newActiveInterfaceId - New active InterfaceId state to persist.
 */
export const saveInterfaceIdState = async (newActiveInterfaceId: string) => {
  const state = await getState();
  const newState = {
    ...state,
    activeInterfaceId: newActiveInterfaceId,
  };

  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: ManageStateOperation.UpdateState,
      newState,
    },
  });
};

/**
 * Clear the given snap state.
 *
 */
export const clearState = async () => {
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: ManageStateOperation.ClearState,
    },
  });
};
