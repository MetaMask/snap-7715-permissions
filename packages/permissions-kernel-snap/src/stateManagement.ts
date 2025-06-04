import type { PermissionOfferRegistry } from '@metamask/7715-permissions-shared/types';
import type { Json } from '@metamask/snaps-sdk';
import { ManageStateOperation, SnapError } from '@metamask/snaps-sdk';

export type KernelState = {
  permissionOfferRegistry: PermissionOfferRegistry;
};

export type StateManager = {
  /**
   * Retrieves the current state of the kernel .
   *
   * @returns The current state of the kernel.
   */
  getState: () => Promise<KernelState>;

  /**
   * Persists the given state.
   *
   * @param newState - The new state to set.
   */
  setState: (newState: KernelState) => Promise<void>;
};

export const createStateManager = (encrypted = true): StateManager => {
  return {
    getState: async (): Promise<KernelState> => {
      try {
        const state = (await snap.request({
          method: 'snap_manageState',
          params: { operation: ManageStateOperation.GetState, encrypted },
        })) as KernelState | null;

        if (!state) {
          return {
            permissionOfferRegistry: {},
          };
        }

        return state;
      } catch (error: any) {
        throw new SnapError('Failed to get state', error);
      }
    },
    setState: async (newState: KernelState) => {
      try {
        await snap.request({
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
