/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  createRootDelegation,
  encodeDelegation,
} from '@metamask-private/delegator-core-viem';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import {
  zNativeTokenStreamPermission,
  type Permission,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import type { PermissionConfirmationContext } from '../../ui';
import { NativeTokenStreamConfirmationPage } from '../../ui/confirmations';
import type { OrchestratorArgs, OrchestratorFactoryFunction } from '../types';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PermissionTypeMapping } from './types';

declare module './types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface PermissionTypeMapping {
    'native-token-stream': JsonObject & NativeTokenStreamPermission; // JsonObject & NativeTokenStreamPermission to be compatible with the Snap JSON object type
  }
}

/**
 * Parses a permission request and returns the permission object.
 *
 * @param basePermission - The base permission object.
 * @returns The permission object.
 * @throws An error if the permission in the request is invalid.
 * @throws An error if the permission type is not supported.
 */
const parsePermission = (
  basePermission: Permission,
): NativeTokenStreamPermission => {
  const validateRes = zNativeTokenStreamPermission.safeParse(basePermission);
  if (!validateRes.success) {
    throw new InvalidParamsError(extractZodError(validateRes.error.errors));
  }

  return validateRes.data;
};

/**
 * Validates a permission object data specific to the permission type.
 *
 * @param _permission - The permission object.
 * @returns True if the permission object data is valid.
 * @throws An error if the permission object data is invalid.
 */
const validatePermissionData = (
  _permission: NativeTokenStreamPermission,
): true => {
  // TODO: Implement permission.data validation for the native-token-stream permission type
  return true;
};

/**
 * Factory function to create a permission orchestrator for a native-token-stream permission type.
 *
 * @param args - The orchestrator arguments.
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const nativeTokenStreamPermissionOrchestrator: OrchestratorFactoryFunction<
  'native-token-stream'
> = (args: OrchestratorArgs) => {
  const { accountController } = args;

  return {
    parseAndValidate: async (basePermission: Permission) => {
      const validatedPermission = parsePermission(basePermission);
      validatePermissionData(validatedPermission);

      return validatedPermission as PermissionTypeMapping['native-token-stream'];
    },
    buildPermissionConfirmationPage: (
      context: PermissionConfirmationContext<'native-token-stream'>,
    ) => {
      return (
        <NativeTokenStreamConfirmationPage
          siteOrigin={context.siteOrigin}
          address={context.address}
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
