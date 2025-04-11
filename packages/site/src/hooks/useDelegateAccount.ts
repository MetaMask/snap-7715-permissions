import {
  Implementation,
  type MetaMaskSmartAccount,
  toMetaMaskSmartAccount,
} from '@metamask/delegation-toolkit';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import type { Chain } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

/**
 * Creates and manages a delegate account for smart account interactions.
 * This account is used for permissions delegation with Metamask.
 *
 * @param options - The configuration options.
 * @param options.chain - The blockchain chain to connect to.
 * @returns The delegate account state and related data.
 */
export const useDelegateAccount = ({ chain }: { chain: Chain }) => {
  const [delegateAccount, setDelegateAccount] =
    useState<MetaMaskSmartAccount | null>();

  useEffect(() => {
    const initializeDelegateAccount = async () => {
      if (!delegateAccount) {
        const pk = generatePrivateKey();
        const account = privateKeyToAccount(pk) as any;

        const publicClient = createPublicClient({
          chain,
          transport: http(),
        });

        const smartAccount = await toMetaMaskSmartAccount({
          implementation: Implementation.MultiSig,
          signatory: [{ account }],
          deployParams: [[account.address], 1n],
          deploySalt: '0x',
          client: publicClient,
        });

        setDelegateAccount(smartAccount);
      }
    };

    initializeDelegateAccount().catch((error) => {
      console.error('Error initializing delegate account:', error);
    });
  }, [chain, delegateAccount]);

  return { delegateAccount };
};
