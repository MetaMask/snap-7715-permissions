/* eslint-disable @typescript-eslint/no-throw-literal */
import type { CoreCaveatBuilder } from '@metamask-private/delegator-core-viem';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import {
  zNativeTokenStreamPermission,
  type Permission,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';

import type { PermissionConfirmationContext } from '../../ui';
import { NativeTokenStreamConfirmationPage } from '../../ui/confirmations';
import type {
  OrchestratorFactoryFunction,
  PermissionContextMeta,
} from '../types';
import type { PermissionTypeMapping } from './types';

declare module './types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-shadow
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
 * @param permission - The permission object.
 * @returns True if the permission object data is valid.
 * @throws Error if the initial amount is not greater than 0.
 * @throws Error if the max amount is not greater than 0.
 * @throws Error if the max amount is less than the initial amount.
 * @throws Error if the amount per second is not a positive number.
 * @throws Error if the start time is not a positive number.
 */
const validatePermissionData = (
  permission: NativeTokenStreamPermission,
): true => {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  if (BigInt(maxAmount) <= 0n) {
    throw new InvalidParamsError(
      'Invalid maxAmount: must be a positive number',
    );
  }

  if (initialAmount) {
    if (BigInt(initialAmount) <= 0n) {
      throw new InvalidParamsError(
        'Invalid initialAmount: must be greater than zero',
      );
    }

    if (maxAmount < initialAmount) {
      throw new InvalidParamsError(
        'Invalid maxAmount: must be greater than initialAmount',
      );
    }
  }

  if (BigInt(amountPerSecond) <= 0n) {
    throw new InvalidParamsError(
      'Invalid amountPerSecond: must be a positive number',
    );
  }

  if (startTime <= 0) {
    throw new InvalidParamsError(
      'Invalid startTime: must be a positive number',
    );
  }

  if (startTime !== Math.floor(startTime)) {
    throw new InvalidParamsError('Invalid startTime: must be an integer');
  }

  return true;
};

/**
 * Factory function to create a permission orchestrator for a native-token-stream permission type.
 *
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const nativeTokenStreamPermissionOrchestrator: OrchestratorFactoryFunction<
  'native-token-stream'
> = () => {
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
    appendPermissionCaveats: async (
      permissionContextMeta: PermissionContextMeta<'native-token-stream'>,
    ) => {
      const { attenuatedPermission, caveatBuilder } = permissionContextMeta;
      // TODO: Using native token allowance enforcers, for now, until native token stream enforcer is available in delegator-sdk
      const updatedCaveatBuilder: CoreCaveatBuilder = caveatBuilder.addCaveat(
        'nativeTokenTransferAmount',
        BigInt(attenuatedPermission.data.initialAmount ?? 0),
      );

      return updatedCaveatBuilder;
    },
  };
};
