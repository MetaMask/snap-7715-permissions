import {
  DELEGATION_ABI_TYPE_COMPONENTS,
  type Delegation,
  type DelegationStruct,
} from '@metamask/delegation-toolkit';
import type { Hex } from 'viem';
import { decodeAbiParameters, toHex } from 'viem';

import type { SerializableDelegation } from '../ui/types';

/**
 * Converts a delegation struct object to a delegation in transit object.
 *
 * @param delegation - The delegation struct object including salt as a BigInt ready for signing.
 * @returns The delegation in transit object with salt as a hex string to be compatible with the Snap context { [prop: string]: Json; } object.
 */
export const convertToSerializableDelegation = (
  delegation: DelegationStruct,
): SerializableDelegation => ({
  ...delegation,
  salt: toHex(delegation.salt),
});

/**
 * Converts a delegation in transit object to a delegation struct object.
 *
 * @param delegation - The delegation in transit object with salt as a hex string to be compatible with the Snap context { [prop: string]: Json; } object.
 * @returns The delegation struct object.
 */
export const convertToDelegationStruct = (
  delegation: SerializableDelegation,
): DelegationStruct => ({
  ...delegation,
  salt: BigInt(delegation.salt),
});

/**
 * Converts a DelegationStruct to a Delegation.
 * The DelegationStruct is the format used in the Delegation Framework.
 *
 * @param delegationStruct - The delegation struct to format.
 * @returns The delegation.
 */
export const convertToDelegation = (
  delegationStruct: DelegationStruct,
): Delegation => {
  return {
    ...delegationStruct,
    salt: toHex(delegationStruct.salt),
  };
};

/**
 * ABI Decodes a permissions context.
 *
 * @param data - The encoded delegation(ie. permissions context).
 * @returns The decoded delegations.
 */
export const decodeDelegation = (data: Hex): Delegation[] => {
  const [decodedDelegationStructs] = decodeAbiParameters(
    [
      {
        components: DELEGATION_ABI_TYPE_COMPONENTS,
        name: 'delegations',
        type: 'tuple[]',
      },
    ],
    data,
  ) as [DelegationStruct[]];

  return decodedDelegationStructs.map(convertToDelegation);
};
