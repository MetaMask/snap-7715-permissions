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

const UNISWAP_HOSTNAME = 'uniswap.org';

const isUniswapOrigin = (origin: string): boolean => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === UNISWAP_HOSTNAME || hostname.endsWith(`.${UNISWAP_HOSTNAME}`)
    );
  } catch {
    return false;
  }
};

const getSentinelRedeemerAddressesForChain = (
  _chainId: number,
): readonly Hex[] => {
  return SENTINEL_REDEEMER_ADDRESSES;
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
export function normalizeSentinelRedeemerRuleForOrigin({
  origin,
  permissionRequest,
  chainId,
}: {
  origin: string;
  permissionRequest: PermissionRequest;
  chainId: number;
}): PermissionRequest {
  if (!isUniswapOrigin(origin)) {
    return permissionRequest;
  }

  const sentinelRedeemerAddresses =
    getSentinelRedeemerAddressesForChain(chainId);
  const sentinelRedeemerAddressSet = new Set(
    sentinelRedeemerAddresses.map((address) => address.toLowerCase()),
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
        `Redeemer rule includes unsupported Sentinel redeemer address: ${unsupportedAddress}`,
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
        data: { addresses: [...sentinelRedeemerAddresses] },
      },
    ],
  };
}
