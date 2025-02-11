import type { MetaMaskInpageProvider } from '@metamask/providers';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import type { Snap } from '../types';
import { getSnapsProvider } from '../utils';

export type InstalledSnaps = Record<string, Snap>;

type MetaMaskContextType = {
  provider: MetaMaskInpageProvider | null;
  installedSnaps: InstalledSnaps;
  error: Error | null;
  handleSetInstalledSnap: (snap: Snap) => void;
  setError: (error: Error) => void;
};

export const MetaMaskContext = createContext<MetaMaskContextType>({
  provider: null,
  installedSnaps: {},
  error: null,
  handleSetInstalledSnap: () => {
    /* no-op */
  },
  setError: () => {
    /* no-op */
  },
});

/**
 * MetaMask context provider to handle MetaMask and snap status.
 *
 * @param props - React Props.
 * @param props.children - React component to be wrapped by the Provider.
 * @returns JSX.
 */
export const MetaMaskProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<MetaMaskInpageProvider | null>(null);
  const [installedSnaps, setInstalledSnap] = useState<InstalledSnaps>({});
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getSnapsProvider().then(setProvider).catch(console.error);
  }, []);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError(null);
      }, 10000);

      return () => {
        clearTimeout(timeout);
      };
    }

    return undefined;
  }, [error]);

  const handleSetInstalledSnap = (snap: Snap) => {
    setInstalledSnap((prev) => ({ ...prev, [snap.id]: snap }));
  };

  return (
    <MetaMaskContext.Provider
      value={{
        provider,
        error,
        setError,
        installedSnaps,
        handleSetInstalledSnap,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
};

/**
 * Utility hook to consume the MetaMask context.
 *
 * @returns The MetaMask context.
 */
export function useMetaMaskContext() {
  return useContext(MetaMaskContext);
}
