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
} from './orchestrator.types';

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
 * @returns A permission orchestrator for the specific permission type.
 */
export const createPermissionOrchestrator = <
  TPermissionType extends SupportedPermissionTypes,
>(
  accountController: MockAccountController,
  permissionConfirmationRenderHandler: PermissionConfirmationRenderHandler<TPermissionType>,
): Orchestrator<TPermissionType> => {
  let passedValidation = false;
  return {
    validate: async (_basePermissionRequest: PermissionRequest) => {
      // TODO: Implement Specific permission validator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/38
      passedValidation = true;
      return true;
    },
    orchestrate: async (
      permission: PermissionTypeMapping[TPermissionType],
      orchestrateMeta: OrchestrateMeta,
    ) => {
      if (!passedValidation) {
        throw new Error(
          'Permission has not been validated, call validate before orchestrate',
        );
      }
      const { chainId, delegate, origin, expiry } = orchestrateMeta;
      const chainIdNum = fromHex(chainId, 'number');

      // Get the user account details
      const [delegator, balance, accountMeta] = await prepareAccountDetails(
        accountController,
        fromHex(chainId, 'number'),
      );

      // Wait for the successful permission confirmation from the user
      const attenuatedUiContext =
        await permissionConfirmationRenderHandler.renderPermissionConfirmation({
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
