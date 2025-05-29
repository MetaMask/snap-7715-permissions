import { useEffect, useState } from 'react';

import {
  gatorSnapOrigin,
  kernelSnapOrigin,
  messageSigningSnapOrigin,
} from '../config';
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

  const [isFlask, setIsFlask] = useState(false);

  const snapsDetected = provider !== null;

  /**
   * Detect if the version of MetaMask is Flask.
   */
  const detectFlask = async () => {
    const clientVersion = await request({
      method: 'web3_clientVersion',
    });

    const isFlaskDetected = (clientVersion as string[])?.includes('flask');

    setIsFlask(isFlaskDetected);
  };

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
    const messageSigningSnap = snaps[messageSigningSnapOrigin];
    if (messageSigningSnap) {
      handleSetInstalledSnap(messageSigningSnap);
    }
  };

  useEffect(() => {
    const detect = async () => {
      if (provider) {
        await detectFlask();
        await getSnaps();
      }
    };

    detect().catch(console.error);
  }, [provider]);

  return { isFlask, snapsDetected, installedSnaps, getSnaps, provider };
};
