import { erc7710BundlerActions } from '@metamask/smart-accounts-kit/actions';
import { useMemo } from 'react';
import { createClient, http } from 'viem';
import type { Chain } from 'viem';
import {
  createBundlerClient,
  createPaymasterClient,
} from 'viem/account-abstraction';

// a static bundler rpc url is required for build
const STATIC_BUNDLER_RPC_URL =
  'https://api.pimlico.io/v2/11155111/rpc?apikey=<api-key>';

type GasPrice = {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

type PimlicoRpcSchema = [
  {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Method: 'pimlico_getUserOperationGasPrice';
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Parameters: undefined;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ReturnType: {
      fast: GasPrice;
      standard: GasPrice;
      slow: GasPrice;
    };
  },
];

/**
 * Creates and manages bundler client for smart account interactions.
 *
 * @param params - The configuration parameters.
 * @param params.chain - The blockchain chain to connect to.
 * @param params.bundlerRpcUrl - The RPC URL for the bundler service.
 * @returns The bundler client and related clients.
 */
export const useBundlerClient = ({
  chain,
  bundlerRpcUrl,
}: {
  chain: Chain;
  bundlerRpcUrl: string | undefined;
}) => {
  const clients = useMemo(() => {
    const transport = http(bundlerRpcUrl ?? STATIC_BUNDLER_RPC_URL);

    const paymasterClient = createPaymasterClient({
      transport,
    });

    const bundlerClient = createBundlerClient({
      transport,
      chain,
      paymaster: paymasterClient,
    }).extend(erc7710BundlerActions());

    const pimlicoClient = createClient<
      typeof transport,
      undefined,
      undefined,
      PimlicoRpcSchema
    >({
      chain,
      transport,
    });

    const getFeePerGas = async () => {
      const { fast } = await pimlicoClient.request({
        method: 'pimlico_getUserOperationGasPrice',
      });

      return fast;
    };

    return {
      paymasterClient,
      bundlerClient,
      getFeePerGas,
    };
  }, [chain]);

  return clients;
};
