import type { LoginResponse } from '@metamask/profile-sync-controller/sdk';
import type { Json, SnapsProvider } from '@metamask/snaps-sdk';
import { ManageStateOperation, SnapError } from '@metamask/snaps-sdk';

export type GatorPermissionsState = {
  profileSyncAuthenticationSession: LoginResponse | null;
};

export type StateManager = {
  getState: () => Promise<GatorPermissionsState>;
  setState: (newState: GatorPermissionsState) => Promise<void>;
};

/**
 * Creates a state manager for the Gator Permissions snap.
 *
 * @param snapsProvider - The snaps provider to use.
 * @param encrypted - Whether the state should be encrypted.
 * @returns A state manager for the Gator Permissions snap.
 */
export function createStateManager(
  snapsProvider: SnapsProvider,
  encrypted = true,
): StateManager {
  /**
   * Retrieves the current state of the kernel .
   *
   * @returns The current state of the kernel.
   */
  async function getState(): Promise<GatorPermissionsState> {
    try {
      const state = (await snapsProvider.request({
        method: 'snap_manageState',
        params: { operation: ManageStateOperation.GetState, encrypted },
      })) as GatorPermissionsState | null;

      if (!state) {
        return {
          profileSyncAuthenticationSession: null,
        };
      }

      return state;
    } catch (error: any) {
      throw new SnapError('Failed to get state', error);
    }
  }

  /**
   * Persists the given state.
   *
   * @param newState - The new state to set.
   */
  async function setState(newState: GatorPermissionsState) {
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
  }

  return {
    getState,
    setState,
  };
}
