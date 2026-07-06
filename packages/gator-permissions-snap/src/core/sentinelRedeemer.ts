import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError } from '@metamask/snaps-sdk';
import type { Hex } from '@metamask/utils';

/**
 * Confirmed prod Sentinel redeemer accounts. These are used on all chains with
 * gasless transactions enabled until the Sentinel networks endpoint exposes
 * redeemer accounts directly.
 */
export const SENTINEL_REDEEMER_ADDRESSES = [
  '0xb01caea8c6c47bbf4f4b4c5080ca642043359c2e',
  '0xc066ac5d385419b1a8c43a0e146fa439837a8b8c',
  '0xb42f812a44c22cc6b861478900401ee759ebead6',
] as const satisfies readonly Hex[];

export const SENTINEL_SUPPORTED_CHAINS = [
  0x1, // Ethereum Mainnet
  0xa, // OP Mainnet
  0x38, // BNB Smart Chain Mainnet
  0x89, // Polygon Mainnet
  0xa4b1, // Arbitrum One
  0xa86a, // Avalanche C-Chain
  0xe708, // Linea Mainnet
  0x2105, // Base
  0x531, // Sei Network
  0x8f, // Monad
  0x10e6, // MegaETH Mainnet
  0x1079, // Tempo Mainnet Presto
  0x13b2, // Arc
  0xaa36a7, // Ethereum Sepolia
  0x14a34, // Base Sepolia
] as const satisfies readonly number[];

const UNISWAP_HOSTNAME = 'uniswap.org';

const isSentinelRedeemerRuleRequiredForOriginAndChain = ({
  origin,
  chainId,
}: {
  origin: string;
  chainId: number;
}): boolean => {
  if (!SENTINEL_SUPPORTED_CHAINS.includes(chainId)) {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    return (
      hostname === UNISWAP_HOSTNAME || hostname.endsWith(`.${UNISWAP_HOSTNAME}`)
    );
  } catch {
    return false;
  }
};

const getRedeemerRule = (
  rules: PermissionRequest['rules'],
): PermissionRequest['rules'][number] | undefined =>
  rules?.find((rule) => extractDescriptorName(rule.type) === 'redeemer');

/**
 * Ensures Uniswap permission requests can only be redeemed by Sentinel.
 *
 * @param options - Normalization options.
 * @param options.origin - Site origin that requested the permission.
 * @param options.permissionRequest - Validated permission request.
 * @param options.chainId - Numeric EIP-155 chain ID.
 * @returns The original request, or a copy with a Sentinel redeemer rule added.
 * @throws If a Uniswap request includes unsupported redeemer addresses.
 */
export function normalizePermissionRequestWithSentinelRedeemerRule<
  TRequest extends PermissionRequest,
>({
  origin,
  permissionRequest,
  chainId,
}: {
  origin: string;
  permissionRequest: TRequest;
  chainId: number;
}): TRequest {
  if (!isSentinelRedeemerRuleRequiredForOriginAndChain({ origin, chainId })) {
    return permissionRequest;
  }

  const sentinelRedeemerAddressSet = new Set(
    SENTINEL_REDEEMER_ADDRESSES.map((address) => address.toLowerCase()),
  );
  const redeemerRule = getRedeemerRule(permissionRequest.rules);
  const requestedRedeemerAddresses = redeemerRule?.data.addresses as
    | string[]
    | undefined;

  if (
    requestedRedeemerAddresses !== undefined &&
    (!Array.isArray(requestedRedeemerAddresses) ||
      requestedRedeemerAddresses.length === 0)
  ) {
    throw new InvalidInputError(
      'Invalid redeemer rule: must include a non-empty addresses array',
    );
  }

  if (requestedRedeemerAddresses) {
    const unsupportedAddress = requestedRedeemerAddresses.find(
      (address) => !sentinelRedeemerAddressSet.has(address.toLowerCase()),
    );

    if (unsupportedAddress) {
      throw new InvalidInputError(
        `Redeemer rule includes addresses other than allowed values: ${unsupportedAddress}. Permissions granted on this domain may only be redeemed via MetaMask Sentinel.`,
      );
    }

    return permissionRequest;
  }

  return {
    ...permissionRequest,
    rules: [
      ...(permissionRequest.rules ?? []),
      {
        type: 'redeemer',
        data: { addresses: [...SENTINEL_REDEEMER_ADDRESSES] },
      },
    ],
  };
}
