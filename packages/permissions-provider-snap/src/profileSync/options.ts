import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  AuthSigningOptions,
  AuthStorageOptions,
  LoginResponse,
  StorageOptions,
} from '@metamask/profile-sync-controller/sdk';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import type { StateManager } from '../stateManagement';

export type ProfileSyncOptions = {
  authStorageOptions: AuthStorageOptions;
  keyStorageOptions: StorageOptions;
  authSigningOptions: AuthSigningOptions;
};

/**
 * Creates the profile sync options.
 *
 * @param stateManager - The state manager.
 * @param snapsProvider - The snaps provider.
 * @param messageSigningSnapId - The message signing snap id.
 * @returns The profile sync options.
 */
export const createProfileSyncOptions = (
  stateManager: StateManager,
  snapsProvider: SnapsProvider,
  messageSigningSnapId: string,
): ProfileSyncOptions => {
  /**
   * Auth storage for profile sync authentication session.
   * Uses snap storage to persist authentication session information.
   */
  const authStorageOptions: AuthStorageOptions = {
    getLoginResponse: async () => {
      const state = await stateManager.getState();
      return state.profileSyncAuthenticationSession;
    },
    setLoginResponse: async (response: LoginResponse) => {
      const state = await stateManager.getState();
      await stateManager.setState({
        ...state,
        profileSyncAuthenticationSession: response,
      });
    },
  };

  /**
   * storage key for profile sync.
   * Uses snap storage to persist persist storage key
   */
  const keyStorageOptions: StorageOptions = {
    getStorageKey: async () => {
      const state = await stateManager.getState();
      return state.profileSyncUserStorageKey;
    },
    setStorageKey: async (val: string) => {
      const state = await stateManager.getState();
      await stateManager.setState({
        ...state,
        profileSyncUserStorageKey: val,
      });
    },
  };

  /**
   * Custom signing implementation for profile sync.
   * Uses the message signing snap to sign messages.
   */
  const authSigningOptions: AuthSigningOptions = {
    async signMessage(message: string): Promise<string> {
      try {
        const signature = (await snapsProvider.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: messageSigningSnapId,
            request: {
              method: 'signMessage',
              params: {
                message,
              },
            },
          },
        })) as string;
        return signature;
      } catch (error: any) {
        logger.error('Error getting identifier:', error);
        throw error;
      }
    },
    async getIdentifier(): Promise<string> {
      try {
        const publicKey: string = (await snapsProvider.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: messageSigningSnapId,
            request: {
              method: 'getPublicKey',
              params: {},
            },
          },
        })) as string;
        return publicKey;
      } catch (error: any) {
        logger.error('Error getting identifier:', error);
        throw error;
      }
    },
  };

  return {
    authStorageOptions,
    keyStorageOptions,
    authSigningOptions,
  };
};
