/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  createRootDelegation,
  encodeDelegation,
} from '@metamask-private/delegator-core-viem';
import { type Permission } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import type { Hex } from 'viem';

import { type MockAccountController } from '../accountController.mock';
import type { PermissionConfirmationContext } from '../ui';
import { NativeTokenStreamConfirmationPage } from '../ui/confirmations';
import {
  zodObjectMapper,
  type Orchestrator,
  type PermissionTypeMapping,
  type SupportedPermissionTypes,
} from './types';

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
 * Factory function to create a permission orchestrator for a native-token-stream permission type.
 *
 * @param accountController - An account controller instance.
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const createNativeTokenStreamPermissionOrchestrator = (
  // TODO: Remove mock accountController: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/54
  accountController: MockAccountController,
): Orchestrator<'native-token-stream'> => {
  return {
    parseAndValidate: async (basePermission: Permission) => {
      const validatedPermission = parsePermission(
        basePermission,
        'native-token-stream',
      );
      validatePermissionData(validatedPermission, 'native-token-stream');

      return validatedPermission;
    },
    buildPermissionConfirmationPage: (
      context: PermissionConfirmationContext<'native-token-stream'>,
    ) => {
      return (
        <NativeTokenStreamConfirmationPage
          siteOrigin={context.siteOrigin}
          account={context.account}
          permission={context.permission}
          balance={context.balance}
          expiry={context.expiry}
          chainId={context.chainId}
        />
      );
    },
    buildPermissionContext: async (
      account: Hex,
      sessionAccount: Hex,
      chainId: number,
      _attenuatedPermission: PermissionTypeMapping['native-token-stream'],
    ) => {
      // TODO: Use the delegation builder to attach the correct caveats specific to the permission type
      // https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/41
      const delegation = createRootDelegation(sessionAccount, account, []);

      // Sign the delegation and encode it to create the permissioncContext
      const signedDelegation = await accountController.signDelegation({
        chainId,
        delegation,
      });
      const permissionContext = encodeDelegation([signedDelegation]);
      return permissionContext;
    },
  };
};
