import { useEffect } from 'react';

import { gatorSnapOrigin, kernelSnapOrigin } from '../config';
import type { GetSnapsResponse } from '../types';
import { useMetaMaskContext } from './MetamaskContext';
import { useRequest } from './useRequest';

/**
 * A Hook to retrieve useful data from MetaMask.
 * @returns The information.
 */
export const useMetaMask = () => {
  const { provider, handleSetInstalledSnap, installedSnaps } =
    useMetaMaskContext();
  const request = useRequest();

  const snapsDetected = provider !== null;

  /**
   * Get the Snap information from MetaMask.
   */
  const getSnaps = async () => {
    const snaps = (await request({
      method: 'wallet_getSnaps',
    })) as GetSnapsResponse;

    const kernelSnap = snaps[kernelSnapOrigin];
    if (kernelSnap) {
      handleSetInstalledSnap(kernelSnap);
    }
    const gatorSnap = snaps[gatorSnapOrigin];
    if (gatorSnap) {
      handleSetInstalledSnap(gatorSnap);
    }
  };

  useEffect(() => {
    const detect = async () => {
      if (provider) {
        await getSnaps();
      }
    };

    detect().catch(console.error);
  }, [provider]);

  return { snapsDetected, installedSnaps, getSnaps, provider };
};
