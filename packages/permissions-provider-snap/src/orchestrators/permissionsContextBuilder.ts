import type { Caveat } from '@metamask/delegation-toolkit';
import {
  createDelegation,
  encodeDelegation,
} from '@metamask/delegation-toolkit';
import type { Address, Hex } from 'viem';

import type { AccountControllerInterface } from '../accountController';

/**
 * Metadata required for building a permissions context.
 */
export type PermissionsContextBuilderMeta = {
  address: Address;
  sessionAccount: Address;
  caveats: Caveat[];
  chainId: number;
};

/**
 * Permissions context builder.
 */
export type PermissionsContextBuilder = {
  buildPermissionsContext: (
    permissionsContextBuilderMeta: PermissionsContextBuilderMeta,
  ) => Promise<Hex>;
};

/**
 * Creates a permissions context builder.
 *
 * @param accountController - An account controller instance.
 * @returns A permissions context builder.
 */
export const createPermissionsContextBuilder = (
  accountController: AccountControllerInterface,
): PermissionsContextBuilder => {
  return {
    buildPermissionsContext: async (
      permissionsContextBuilderMeta: PermissionsContextBuilderMeta,
    ) => {
      const { address, sessionAccount, caveats, chainId } =
        permissionsContextBuilderMeta;

      const signedDelegation = await accountController.signDelegation({
        chainId,
        delegation: createDelegation({
          to: sessionAccount,
          from: address,
          caveats,
        }),
      });

      return encodeDelegation([signedDelegation]);
    },
  };
};
