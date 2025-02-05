import type { Snap } from '../types';
import { useMetaMaskContext } from './MetamaskContext';
import { useRequest } from './useRequest';

/**
 * Utility hook to wrap the `wallet_requestSnaps` method.
 *
 * @param snapId - The requested Snap ID. Defaults to the snap ID specified in the
 * config.
 * @param version - The requested version.
 * @returns The `wallet_requestSnaps` wrapper.
 */
export const useRequestSnap = (snapId: string, version?: string) => {
  const request = useRequest();
  const { handleSetInstalledSnap } = useMetaMaskContext();

  /**
   * Request the Snap.
   */
  const requestSnap = async () => {
    const snaps = (await request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: version ? { version } : {},
      },
    })) as Record<string, Snap>;
    if (!snaps) {
      return;
    }

    // Updates the `installedSnap` context variable since we just installed the Snap.
    const requestedSnap = snaps[snapId];
    if (!requestedSnap) {
      return;
    }
    handleSetInstalledSnap(requestedSnap);
  };

  return requestSnap;
};
