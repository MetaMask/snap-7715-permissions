import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  AuthSigningOptions,
  AuthStorageOptions,
  LoginResponse,
  UserProfile,
} from '@metamask/profile-sync-controller/sdk';
import {
  AuthType,
  JwtBearerAuth,
  Platform,
} from '@metamask/profile-sync-controller/sdk';

import type { StateManager } from '../stateManagement';
import { getSdkEnv } from './config';

export type ProfileSyncManager = {
  getUserProfile: () => Promise<UserProfile | null>;
};

export type ProfileSyncManagerConfig = {
  stateManager: StateManager;
};

/**
 * Creates a profile sync manager.
 *
 * @param config - The profile sync manager config.
 * @returns A profile sync manager.
 */
export function createProfileSyncManager(
  config: ProfileSyncManagerConfig,
): ProfileSyncManager {
  const { stateManager } = config;

  /**
   * Session storage for profile sync authentication session.
   * Uses snap storage to persist authentication session information.
   */
  const sessionStorage: AuthStorageOptions = {
    getLoginResponse: async () => {
      const state = await stateManager.getState();
      return state.profileSyncAuthenticationSession;
    },
    setLoginResponse: async (val: LoginResponse) => {
      const state = await stateManager.getState();
      await stateManager.setState({
        ...state,
        profileSyncAuthenticationSession: val,
      });
    },
  };

  // TODO: Request to message signing snap to sign messages is failing.
  // We need to update the message signing snap `endowment:rpc` to allow
  // request from the gator snap: https://github.com/MetaMask/message-signing-snap/blob/main/snap.manifest.json#L30
  /**
   * Custom signing implementation for profile sync.
   * Uses the message signing snap to sign messages.
   */
  const customSigning: AuthSigningOptions = {
    async signMessage(message: string): Promise<string> {
      try {
        const signature: string = (await snap.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: 'npm:@metamask/message-signing-snap',
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
        return '';
      }
    },
    async getIdentifier(): Promise<string> {
      try {
        const publicKey: string = (await snap.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: 'npm:@metamask/message-signing-snap',
            request: {
              method: 'getPublicKey',
              params: {},
            },
          },
        })) as string;
        return publicKey;
      } catch (error: any) {
        logger.error('Error getting identifier:', error);
        return '';
      }
    },
  };

  /**
   * Creates a new JwtBearerAuth instance.
   * Uses the session storage and custom signing implementation.
   */
  const auth = new JwtBearerAuth(
    {
      type: AuthType.SRP,
      platform: Platform.EXTENSION,
      env: getSdkEnv(),
    },
    {
      storage: sessionStorage, // set session storage
      signing: customSigning, // set signing override,
    },
  );

  /**
   * Retrieves the user profile.
   *
   * @returns The user profile.
   */
  async function getUserProfile(): Promise<UserProfile | null> {
    try {
      await auth.getAccessToken();
      const profile = await auth.getUserProfile(); // retrieve the user profile information
      return profile;
    } catch (error) {
      logger.error('Error fetching access token:', error);
      return null;
    }
  }

  return { getUserProfile };
}
