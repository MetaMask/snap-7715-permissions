import { Env } from '@metamask/profile-sync-controller/sdk';

/**
 * Get the environment for the Profile Sync SDK.
 *
 * @param snapEnv - The environment of the snap.
 * @returns The environment for the Profile Sync SDK.
 */
export function getProfileSyncSdkEnv(snapEnv: string | undefined): Env {
  switch (snapEnv) {
    case 'production':
      return Env.PRD;
    default:
      return Env.DEV;
  }
}
