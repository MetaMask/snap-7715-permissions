import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { type Permission } from '@metamask/7715-permissions-shared/types';
import type { ComponentOrElement } from '@metamask/snaps-sdk';
import type { Address, Hex, OneOf } from 'viem';

import type { MockAccountController } from '../accountController.mock';
import type { PermissionConfirmationContext } from '../ui';
import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from './orchestrator';

/**
 * The attenuated response after the user confirms the permission request.
 */
export type AttenuatedResponse<
  TPermissionType extends SupportedPermissionTypes,
> = {
  isConfirmed: boolean;
  attenuatedPermission: PermissionTypeMapping[TPermissionType];
  attenuatedExpiry: number;
};

/**
 * The result of orchestrating a permission.
 */
export type OrchestrateResult = OneOf<
  | {
      success: true;
      response: PermissionResponse;
    }
  | {
      success: false;
      reason: string;
    }
>;

/**
 * Metadata required for orchestrating a permission.
 */
export type OrchestrateMeta<TPermissionType extends SupportedPermissionTypes> =
  {
    permission: PermissionTypeMapping[TPermissionType];

    /**
     * The chain id of the permission in hex format.
     *
     */
    chainId: Hex;

    /**
     * The address of the delegate that will be granted the permission(ie. the dapp's session account address).
     */
    sessionAccount: Address;

    /**
     * The origin of the permission request(ie. the dapp's origin).
     */
    origin: string;

    /**
     * unix timestamp in seconds when the granted permission is set to expire.
     *
     * @example Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
     */
    expiry: number;
  };

export type Orchestrator<TPermissionType extends SupportedPermissionTypes> = {
  /**
   * Validates the base permission request for the permission type.
   *
   * @param basePermission - The base permission to validate.
   * @returns The parsed and validated permission.
   * @throws If the base permission request is invalid given the permission type.
   */
  parseAndValidate: (
    basePermission: Permission,
  ) => Promise<PermissionTypeMapping[TPermissionType]>;

  /**
   * Builds the delegation object for the permission type.
   * @param account - The account address.
   * @param sessionAccount - The session account address.
   * @param chainId - The chain ID.
   * @param attenuatedPermission - The attenuated permission object.
   * @returns The 7715 permision context(ie. encoded signed delegation).
   */
  buildPermissionContext: (
    account: Hex,
    sessionAccount: Hex,
    chainId: number,
    attenuatedPermission: PermissionTypeMapping[TPermissionType],
  ) => Promise<Hex>;

  /**
   * Builds the permission confirmation page for the permission type.
   * @param context - The permission confirmation context.
   * @returns The permission confirmation page component.
   */
  buildPermissionConfirmationPage: (
    context: PermissionConfirmationContext<TPermissionType>,
  ) => ComponentOrElement;
};

/**
 * The orchestrator args.
 */
export type OrchestratorArgs = {
  // TODO: Remove mock accountController: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/54
  accountController: MockAccountController;
};

/**
 * Factory function for creating a permission orchestrator for a given permission type.
 */
export type OrchestratorFactoryFunction<
  TPermissionType extends SupportedPermissionTypes,
> = (args: OrchestratorArgs) => Orchestrator<TPermissionType>;
