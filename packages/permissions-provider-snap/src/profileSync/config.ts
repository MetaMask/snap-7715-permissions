/* eslint-disable no-restricted-globals */
import { Env } from '@metamask/profile-sync-controller/sdk';

/**
 * Get the environment for the Profile Sync SDK.
 *
 * @returns The environment for the Profile Sync SDK.
 */
export function getSdkEnv(): Env {
  if (process.env.SNAP_ENV === 'local') {
    return Env.DEV;
  }

  return Env.PRD;
}
