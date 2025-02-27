import { encodeDelegation } from '@metamask-private/delegator-core-viem';
import type {
  NativeTokenStreamPermission,
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { Hex } from 'viem';
import { fromHex } from 'viem';

import { type MockAccountController } from '../accountContoller.mock';
import { renderPermissionConfirmation } from '../ui';
import { convertToDelegationStruct } from '../utils';
import type { OrchestrateMeta, Orchestrator } from './orchestrator.types';

/**
 * Prepare the account details for the permission picker UI.
 * @param _accountController - An account controller instance.
 * @param chainId - The chain ID.
 * @returns The account address, balance and initCode.
 */
export const prepareAccountDetails = async (
  _accountController: MockAccountController,
  chainId: number,
): Promise<
  [
    Hex,
    Hex,
    {
      factory: Hex | undefined;
      factoryData: Hex | undefined;
    },
  ]
> => {
  return await Promise.all([
    _accountController.getAccountAddress({
      chainId,
    }),
    _accountController.getAccountBalance({
      chainId,
    }),
    _accountController.getAccountMetadata({
      chainId,
    }),
  ]);
};

/**
 * Factory function for create a native token stream permission orchestrator.
 *
 * @param _snapsProvider - A snaps provider instance.
 * @param _accountController - An account controller instance.
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const createNativeTokenStreamPermissionOrchestrator = (
  _snapsProvider: SnapsProvider,
  _accountController: MockAccountController,
): Orchestrator<'native-token-stream'> => {
  return {
    permissionType: 'native-token-stream',
    validate: async (_basePermissionRequest: PermissionRequest) => {
      // TODO: Implement Specific permission validator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/38
      return true;
    },
    orchestrate: async (
      _nativeTokenStreamPermission: NativeTokenStreamPermission,
      orchestrateMeta: OrchestrateMeta,
    ) => {
      const { chainId, delegate, origin, expiry } = orchestrateMeta;
      const chainIdNum = fromHex(chainId, 'number');

      // Get the user account details
      const [delegator, balance, accountMeta] = await prepareAccountDetails(
        _accountController,
        fromHex(chainId, 'number'),
      );

      // Wait for the successful permission confirmation from the user
      const attenuatedUiContext = await renderPermissionConfirmation(
        _snapsProvider,
        {
          permission: _nativeTokenStreamPermission,
          delegator,
          delegate,
          siteOrigin: origin,
          balance,
          expiry,
          chainId: chainIdNum,
        },
      );

      // Sign the delegation and encode it to create the permissioncContext
      const signedDelegation = await _accountController.signDelegation({
        chainId: chainIdNum,
        delegation: convertToDelegationStruct(attenuatedUiContext.delegation), // has the delegation with caveat attached specific to the permission
      });
      const permissionContext = encodeDelegation([signedDelegation]);

      return {
        chainId,
        account: delegator,
        expiry,
        signer: {
          type: 'account',
          data: {
            address: delegate,
          },
        },
        permission: _nativeTokenStreamPermission,
        context: permissionContext,
        accountMeta:
          accountMeta.factory && accountMeta.factoryData
            ? [accountMeta]
            : undefined,
        signerMeta: {
          delegationManager: '0x000000_delegation_manager', // TODO: Update to use actual values instead of mock values
        },
      } as PermissionResponse;
    },
  };
};
