import {
  createRootDelegation,
  encodeDelegation,
} from '@metamask-private/delegator-core-viem';
import type { Permission } from '@metamask/7715-permissions-shared/types';
import type { Hex } from 'viem';
import { fromHex } from 'viem';

import { type MockAccountController } from '../accountController.mock';
import { type PermissionConfirmationRenderHandler } from '../ui';
import {
  convertToDelegationStruct,
  convertToSerializableDelegation,
} from '../utils';
import type {
  OrchestrateMeta,
  OrchestrateResult,
  Orchestrator,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from './types';

/**
 * Prepare the account details for the permission picker UI.
 * @param accountController - An account controller instance.
 * @param chainId - The chain ID.
 * @returns The account address, balance.
 */
export const prepareAccountDetails = async (
  accountController: MockAccountController,
  chainId: number,
): Promise<[Hex, Hex]> => {
  return await Promise.all([
    accountController.getAccountAddress({
      chainId,
    }),
    accountController.getAccountBalance({
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
    parseAndValidate: async (basePermission: Permission) => {
      // TODO: Implement Specific permission validator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/38
      return basePermission as PermissionTypeMapping[typeof permissionType];
    },
    orchestrate: async (orchestrateMeta: OrchestrateMeta<TPermissionType>) => {
      const { chainId, delegate, origin, expiry, permission } = orchestrateMeta;
      const chainIdNum = fromHex(chainId, 'number');

      // Get the user account details
      const [delegator, balance] = await prepareAccountDetails(
        accountController,
        fromHex(chainId, 'number'),
      );

      // TODO: Use the delegation builder to attach the correct caveats specific to the permission type: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/41
      const delegationToBuild = convertToSerializableDelegation(
        createRootDelegation(delegate, delegator, []),
      );

      // Prepare specific context and UI
      const [context, permissionConfirmationPage] =
        permissionConfirmationRenderHandler.getPermissionConfirmationPage(
          {
            permission,
            delegator,
            delegate,
            siteOrigin: origin,
            balance,
            expiry,
            chainId: chainIdNum,
            delegation: delegationToBuild,
          },
          permissionType,
        );

      // Wait for the successful permission confirmation reponse from the user
      const {
        attenuatedPermission,
        attenuatedDelegation,
        attenuatedExpiry,
        isConfirmed,
      } =
        await permissionConfirmationRenderHandler.getConfirmedAttenuatedPermission(
          context,
          permissionConfirmationPage,
          permissionType,
        );

      if (!isConfirmed) {
        return {
          success: false,
          reason: 'User rejected the permissions request',
        };
      }

      // TODO: Pass this to the delegation builder to sign and build the permission context
      // Sign the delegation and encode it to create the permissioncContext
      const signedDelegation = await accountController.signDelegation({
        chainId: chainIdNum,
        delegation: convertToDelegationStruct(attenuatedDelegation), // has the delegation with caveat attached specific to the permission
      });
      const permissionContext = encodeDelegation([signedDelegation]);

      const accountMeta = await accountController.getAccountMetadata({
        chainId: chainIdNum,
      });

      return {
        success: true,
        response: {
          chainId,
          account: delegator,
          expiry: attenuatedExpiry,
          signer: {
            type: 'account',
            data: {
              address: delegate,
            },
          },
          permission: attenuatedPermission,
          context: permissionContext,
          accountMeta:
            accountMeta.factory && accountMeta.factoryData
              ? [accountMeta]
              : undefined,
          signerMeta: {
            delegationManager: '0x000000_delegation_manager', // TODO: Update to use actual values instead of mock values
          },
        },
      } as OrchestrateResult;
    },
  };
};
