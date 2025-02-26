import type {
  NativeTokenStreamPermission,
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { Hex } from 'viem';
import { fromHex } from 'viem';

import { type MockAccountController } from '../accountController';
import { type PermissionConfirmationContext } from '../ui';
import type { OrchestrateMeta, Orchestrator } from './orchestrator.types';
import { handleConfirmationRender } from './render-handler';

/**
 * Prepare the account details for the permission picker UI.
 * @param _accountController - An account controller instance.
 * @param chainId - The chain ID.
 * @returns The account address, balance and initCode.
 */
const prepareAccountDetails = async (
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
    _accountController.getAccountMetadata(),
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

      // Get the user account details
      const [delegator, balance, accountMeta] = await prepareAccountDetails(
        _accountController,
        fromHex(chainId, 'number'),
      );

      // Render permission picker UI to capture user attunation and acceptance/rejection
      const perContext: PermissionConfirmationContext = {
        permission: _nativeTokenStreamPermission,
        siteOrigin: origin,
        balance,
        expiry,
        delegation: {
          delegator,
          delegate,
          caveats: [],
          salt: '0x1',
          authority: '0x000000_authority',
          signature: '0x',
        },
      };

      // TODO: Extract the delegations from the reponse returnd by the permission picker UI
      await handleConfirmationRender(_snapsProvider, perContext);
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

        // TODO: Update to use actual values instead of mock values
        permission: _nativeTokenStreamPermission,
        context: '0x000000_encoded_signed_delegation',
        accountMeta:
          accountMeta.factory && accountMeta.factoryData
            ? [accountMeta]
            : undefined,
        signerMeta: {
          delegationManager: '0x000000_delegation_manager',
        },
      } as PermissionResponse;
    },
  };
};
