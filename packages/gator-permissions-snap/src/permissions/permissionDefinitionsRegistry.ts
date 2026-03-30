import { InvalidInputError } from '@metamask/snaps-sdk';

import { erc20TokenPeriodicPermissionDefinition } from './erc20TokenPeriodic';
import { erc20TokenRevocationPermissionDefinition } from './erc20TokenRevocation';
import { erc20TokenStreamPermissionDefinition } from './erc20TokenStream';
import type { GetSupportedChainsOptions } from './getSupportedChainsOptions';
import { nativeTokenPeriodicPermissionDefinition } from './nativeTokenPeriodic';
import { nativeTokenStreamPermissionDefinition } from './nativeTokenStream';
import { nativeTokenSwapPermissionDefinition } from './nativeTokenSwap';
import type { RegistryPermissionDefinition } from '../core/types';

export type SupportedGatorPermissionType =
  | 'native-token-stream'
  | 'native-token-periodic'
  | 'native-token-swap'
  | 'erc20-token-periodic'
  | 'erc20-token-revocation'
  | 'erc20-token-stream';

/**
 * All Gator execution permission definitions keyed by permission type name.
 */
export const PERMISSION_DEFINITIONS_BY_TYPE = {
  'native-token-stream': nativeTokenStreamPermissionDefinition,
  'native-token-periodic': nativeTokenPeriodicPermissionDefinition,
  'native-token-swap': nativeTokenSwapPermissionDefinition,
  'erc20-token-periodic': erc20TokenPeriodicPermissionDefinition,
  'erc20-token-revocation': erc20TokenRevocationPermissionDefinition,
  'erc20-token-stream': erc20TokenStreamPermissionDefinition,
} as Record<SupportedGatorPermissionType, RegistryPermissionDefinition>;

/**
 * Resolves the permission definition for a type string.
 *
 * @param permissionType - Extracted permission type name.
 * @returns The definition.
 * @throws InvalidInputError If the type is unknown.
 */
export function getPermissionDefinition(
  permissionType: string,
): RegistryPermissionDefinition {
  const definition =
    PERMISSION_DEFINITIONS_BY_TYPE[
      permissionType as SupportedGatorPermissionType
    ];

  if (!definition) {
    throw new InvalidInputError(
      `Unsupported permission type: ${permissionType}`,
    );
  }

  return definition;
}

/**
 * Returns supported EIP-155 chain IDs for a permission type.
 *
 * @param permissionType - Extracted permission type name.
 * @param options - Optional inputs (e.g. token metadata for native swap).
 * @returns Sorted chain IDs.
 */
export function getSupportedChainsForPermissionType(
  permissionType: string,
  options?: GetSupportedChainsOptions,
): number[] {
  return getPermissionDefinition(permissionType).getSupportedChains(options);
}
