import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, SnapsProvider } from '@metamask/snaps-sdk';
import { ManageStateOperation, SnapError } from '@metamask/snaps-sdk';

export type GatorSnapState = {
  activeInterfaceId: string;
};

/**
 * Default GatorSnapState
 */
const defaultState: GatorSnapState = {
  activeInterfaceId: '',
};

export type StateManager = {
  /**
   * Retrieves the current state of the gator snap. .
   *
   * @returns The current state of the gator snap..
   */
  getState: () => Promise<GatorSnapState>;

  /**
   * Persists the given state.
   *
   * @param newState - The new state to set.
   */
  setState: (newState: GatorSnapState) => Promise<void>;
};

/**
 * Creates a state manager for the gator snap.
 *
 * @param snapsProvider - The snaps provider instance.
 * @param encrypted - Whether the state should be encrypted.
 * @returns The state manager instance.
 */
export const createStateManager = (
  snapsProvider: SnapsProvider,
  encrypted = true,
): StateManager => {
  return {
    getState: async (): Promise<GatorSnapState> => {
      try {
        const state = (await snapsProvider.request({
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
      } catch (error: any) {
        throw new SnapError('Failed to get state', error);
      }
    },
    setState: async (newState: GatorSnapState) => {
      try {
        await snapsProvider.request({
          method: 'snap_manageState',
          params: {
            operation: ManageStateOperation.UpdateState,
            newState: newState as unknown as Record<string, Json>,
            encrypted,
          },
        });
      } catch (error: any) {
        throw new SnapError('Failed to set state', error);
      }
    },
  };
};
