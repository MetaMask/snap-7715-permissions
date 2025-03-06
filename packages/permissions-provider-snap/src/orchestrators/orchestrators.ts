/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  createRootDelegation,
  encodeDelegation,
} from '@metamask-private/delegator-core-viem';
import {
  zNativeTokenStreamPermission,
  type Permission,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import type { Hex } from 'viem';
import { fromHex } from 'viem';

import { type MockAccountController } from '../accountController.mock';
import { type PermissionConfirmationRenderHandler } from '../ui';
import { convertToSerializableDelegation } from '../utils';
import type {
  OrchestrateMeta,
  OrchestrateResult,
  Orchestrator,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from './types';

/**
 * Maps permission types to their corresponding Zod object validators.
 */
const zodObjectMapper = {
  'native-token-stream': zNativeTokenStreamPermission,
};

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
 * Parses a permission request and returns the permission object.
 *
 * @param basePermission - The base permission object.
 * @param permissionType - The permission type.
 * @returns The permission object.
 * @throws An error if the permission in the request is invalid.
 * @throws An error if the permission type is not supported.
 */
const parsePermission = <TPermissionType extends SupportedPermissionTypes>(
  basePermission: Permission,
  permissionType: TPermissionType,
): PermissionTypeMapping[TPermissionType] => {
  const zValidatorKey = permissionType as keyof typeof zodObjectMapper;
  const zValidator = zodObjectMapper[zValidatorKey];
  if (!zValidator) {
    throw new Error(
      `Validation for Permission type ${permissionType} is not supported`,
    );
  }

  const validateRes = zValidator.safeParse(basePermission);
  if (!validateRes.success) {
    throw new InvalidParamsError(extractZodError(validateRes.error.errors));
  }

  return validateRes.data as PermissionTypeMapping[typeof permissionType];
};

/**
 * Validates a permission object data specific to the permission type.
 *
 * @param _permission - The permission object.
 * @param _permissionType - The permission type.
 * @returns True if the permission object data is valid.
 * @throws An error if the permission object data is invalid.
 */
const validatePermissionData = <
  TPermissionType extends SupportedPermissionTypes,
>(
  _permission: PermissionTypeMapping[TPermissionType],
  _permissionType: TPermissionType,
): true => {
  // TODO: Implement permission.data validation for the native-token-stream permission type
  return true;
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
      const validatedPermission = parsePermission(
        basePermission,
        permissionType,
      );
      validatePermissionData(validatedPermission, permissionType);

      return validatedPermission;
    },
    orchestrate: async (orchestrateMeta: OrchestrateMeta<TPermissionType>) => {
      const { chainId, sessionAccount, origin, expiry, permission } =
        orchestrateMeta;
      const chainIdNum = fromHex(chainId, 'number');

      // Get the user account details
      const [account, balance] = await prepareAccountDetails(
        accountController,
        fromHex(chainId, 'number'),
      );

      // TODO: Use the delegation builder to attach the correct caveats specific to the permission type: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/41
      const delegationToBuild = convertToSerializableDelegation(
        createRootDelegation(sessionAccount, account, []),
      );

      // Prepare specific context and UI
      const [context, permissionConfirmationPage] =
        permissionConfirmationRenderHandler.getPermissionConfirmationPage(
          {
            permission,
            account,
            siteOrigin: origin,
            balance,
            expiry,
            chainId: chainIdNum,
            delegation: delegationToBuild,
          },
          permissionType,
        );

      // Wait for the successful permission confirmation reponse from the user
      const { attenuatedPermission, attenuatedExpiry, isConfirmed } =
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

      // TODO: Use the delegation builder to attach the correct caveats specific
      // to the permission type, derived from the attenuatedPermission and
      // expiry:
      // https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/41
      const delegation = createRootDelegation(sessionAccount, account, []);

      // Sign the delegation and encode it to create the permissioncContext
      const signedDelegation = await accountController.signDelegation({
        chainId: chainIdNum,
        delegation,
      });
      const permissionContext = encodeDelegation([signedDelegation]);

      const accountMeta = await accountController.getAccountMetadata({
        chainId: chainIdNum,
      });

      return {
        success: true,
        response: {
          chainId,
          account,
          expiry: attenuatedExpiry,
          signer: {
            type: 'account',
            data: {
              address: sessionAccount,
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
