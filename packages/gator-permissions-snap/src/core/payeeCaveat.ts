import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import type { Caveat, Hex } from '@metamask/delegation-core';
import {
  createAllowedCalldataTerms,
  createAllowedTargetsTerms,
  createLogicalOrWrapperTerms,
} from '@metamask/delegation-core';

import type { DelegationContracts } from './chainMetadata';

const ERC20_PERMISSION_TYPES = new Set([
  'erc20-token-stream',
  'erc20-token-periodic',
]);

const NATIVE_PERMISSION_TYPES = new Set([
  'native-token-stream',
  'native-token-periodic',
]);

/**
 * Pads an Ethereum address to 32 bytes (left-padded with zeros).
 * @param address - The address to pad.
 * @returns The 32-byte padded address.
 */
function padAddressTo32Bytes(address: Hex): Hex {
  return `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;
}

/**
 * Builds an allowedCalldataEnforcer caveat restricting the ERC-20 `to` parameter.
 * @param address - The allowed payee address.
 * @param contracts - Delegation enforcer contract addresses.
 * @returns A caveat for the allowedCalldataEnforcer.
 */
function buildErc20PayeeCaveat(
  address: Hex,
  contracts: DelegationContracts,
): Caveat {
  return {
    enforcer: contracts.allowedCalldataEnforcer,
    terms: createAllowedCalldataTerms({
      startIndex: 4,
      value: padAddressTo32Bytes(address),
    }),
    args: '0x00',
  };
}

/**
 * Builds an allowedTargetsEnforcer caveat restricting the native token recipient.
 * @param address - The allowed payee address.
 * @param contracts - Delegation enforcer contract addresses.
 * @returns A caveat for the allowedTargetsEnforcer.
 */
function buildNativePayeeCaveat(
  address: Hex,
  contracts: DelegationContracts,
): Caveat {
  return {
    enforcer: contracts.allowedTargetsEnforcer,
    terms: createAllowedTargetsTerms({ targets: [address] }),
    args: '0x00',
  };
}

/**
 * Appends payee-restricting caveats when the permission request includes a payee rule.
 *
 * For a single payee address, the enforcer is used directly.
 * For multiple addresses, individual caveats are wrapped in a LogicalOrWrapperEnforcer.
 *
 * @param options - Arguments for appending the caveat.
 * @param options.rules - Resolved permission request rules from the grant flow.
 * @param options.contracts - Delegation enforcer addresses for the active chain.
 * @param options.caveats - Mutable caveat array to append to.
 * @param options.permissionType - The permission type name (e.g. 'erc20-token-stream').
 */
export function appendPayeeCaveatIfPresent({
  rules,
  contracts,
  caveats,
  permissionType,
}: {
  rules: PermissionRequest['rules'];
  contracts: DelegationContracts;
  caveats: Caveat[];
  permissionType: string;
}): void {
  const payeeRule = rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'payee',
  );
  const rawAddresses = payeeRule?.data?.addresses as Hex[] | undefined;
  if (!Array.isArray(rawAddresses) || rawAddresses.length === 0) {
    return;
  }

  const isErc20 = ERC20_PERMISSION_TYPES.has(permissionType);
  const isNative = NATIVE_PERMISSION_TYPES.has(permissionType);

  if (!isErc20 && !isNative) {
    return;
  }

  const buildCaveat = isErc20 ? buildErc20PayeeCaveat : buildNativePayeeCaveat;

  if (rawAddresses.length === 1) {
    caveats.push(buildCaveat(rawAddresses[0] as Hex, contracts));
    return;
  }

  const caveatGroups = rawAddresses.map((address) => [
    buildCaveat(address, contracts),
  ]);

  caveats.push({
    enforcer: contracts.logicalOrWrapperEnforcer,
    terms: createLogicalOrWrapperTerms({ caveatGroups }),
    args: '0x',
  });
}
