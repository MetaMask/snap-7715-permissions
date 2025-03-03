import type { DelegationStruct } from '@metamask-private/delegator-core-viem';
import { toHex } from 'viem';

import type { DelegationInTransit } from '../ui/types';

/**
 * Converts a delegation struct object to a delegation in transit object.
 *
 * @param delegation - The delegation struct object including salt as a BigInt ready for signing.
 * @returns The delegation in transit object with salt as a hex string to be compatible with the Snap context { [prop: string]: Json; } object.
 */
export const convertToDelegationInTransit = (
  delegation: DelegationStruct,
): DelegationInTransit =>
  ({
    ...delegation,
    salt: toHex(delegation.salt),
  } as DelegationInTransit);

/**
 * Converts a delegation in transit object to a delegation struct object.
 *
 * @param delegation - The delegation in transit object with salt as a hex string to be compatible with the Snap context { [prop: string]: Json; } object.
 * @returns The delegation struct object.
 */
export const convertToDelegationStruct = (
  delegation: DelegationInTransit,
): DelegationStruct => ({
  ...delegation,
  salt: BigInt(delegation.salt),
});
