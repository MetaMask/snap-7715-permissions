import { encodeDelegation } from '@metamask-private/delegator-core-viem';
import type {
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { Hex } from 'viem';
import { fromHex } from 'viem';

import { type MockAccountController } from '../accountContoller.mock';
import type { PermissionConfirmationRenderHandler } from '../ui';
import { convertToDelegationStruct } from '../utils';
import type {
  OrchestrateMeta,
  Orchestrator,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from './types';

/**
 * Prepare the account details for the permission picker UI.
 * @param accountController - An account controller instance.
 * @param chainId - The chain ID.
 * @returns The account address, balance and initCode.
 */
export const prepareAccountDetails = async (
  accountController: MockAccountController,
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
    accountController.getAccountAddress({
      chainId,
    }),
    accountController.getAccountBalance({
      chainId,
    }),
    accountController.getAccountMetadata({
      chainId,
    }),
  ]);
};

/**
 * Factory function to create a permission orchestrator for a specific permission type.
 *
 * @param accountController - An account controller instance.
 * @param permissionConfirmationRenderHandler - The permission confirmation render handler.
 * @param permissionType - The permission type.
 * @returns A permission orchestrator for the specific permission type.
 */
export const createPermissionOrchestrator = <
  TPermissionType extends SupportedPermissionTypes,
>(
  accountController: MockAccountController,
  permissionConfirmationRenderHandler: PermissionConfirmationRenderHandler,
  permissionType: TPermissionType,
): Orchestrator<TPermissionType> => {
  return {
    parseAndValidate: async (_basePermission: PermissionRequest) => {
      // TODO: Implement Specific permission validator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/38
      return {} as PermissionTypeMapping[TPermissionType];
    },
    orchestrate: async (orchestrateMeta: OrchestrateMeta<TPermissionType>) => {
      const { chainId, delegate, origin, expiry, permission } = orchestrateMeta;
      const chainIdNum = fromHex(chainId, 'number');

      // Get the user account details
      const [delegator, balance, accountMeta] = await prepareAccountDetails(
        accountController,
        fromHex(chainId, 'number'),
      );

      // Wait for the successful permission confirmation from the user
      const attenuatedUiContext =
        await permissionConfirmationRenderHandler.renderPermissionConfirmation<
          typeof permissionType
        >({
          permission,
          delegator,
          delegate,
          siteOrigin: origin,
          balance,
          expiry,
          chainId: chainIdNum,
        });

      // Sign the delegation and encode it to create the permissioncContext
      const signedDelegation = await accountController.signDelegation({
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
        permission,
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
