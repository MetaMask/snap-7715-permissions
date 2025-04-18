import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import type { Caveat, CoreCaveatBuilder } from '@metamask/delegation-toolkit';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';
import type { Address, Hex, OneOf } from 'viem';

import type { PermissionConfirmationRenderHandler } from '../confirmation';
import type {
  UserEventDispatcher,
  TokenPricesService,
  AccountControllerInterface,
} from '../core';

/**
 * Mapping of supported permission types to their respective permission types.
 *
 * - In the future, we may want to extend the mapping key to a unique hash to account for permission types that don't have a string literal representation
 * and are defined as `type: { name: z.string(), description: z.string().optional()}`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/consistent-type-definitions
export interface PermissionTypeMapping {}

/**
 * Supported permission types.
 */
export type SupportedPermissionTypes = keyof PermissionTypeMapping;

/**
 * Mapping of the permission confirmation component state
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/consistent-type-definitions
export interface PermissionConfirmationStateMapping {}

/**
 * The result of orchestrating a permission.
 */
export type OrchestrateResult = OneOf<
  | {
      success: true;
      response: JsonObject & PermissionResponse; // JsonObject & PermissionResponse to be compatible with the Snap JSON object type
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

    /**
     * Whether the permission can be adjusted
     */
    isAdjustmentAllowed: boolean;
  };

/**
 * Metadata required for building a 7715 permission context for DeleGator account.
 */
export type PermissionContextMeta<
  TPermissionType extends SupportedPermissionTypes,
> = {
  address: Hex;
  sessionAccount: Hex;
  chainId: number;
  attenuatedPermission: PermissionTypeMapping[TPermissionType];
  caveatBuilder: CoreCaveatBuilder;
};

/**
 * Metadata required for building a permissions context.
 */
export type PermissionsContextBuilderMeta = {
  address: Address;
  sessionAccount: Address;
  caveats: Caveat[];
  chainId: number;
};

/**
 * Dependencies for the orchestrator.
 */
export type OrchestratorDependencies = {
  accountController: AccountControllerInterface;
  tokenPricesService: TokenPricesService;
  permissionConfirmationRenderHandler: PermissionConfirmationRenderHandler;
  userEventDispatcher: UserEventDispatcher;
};

/**
 * Arguments for orchestrating the permission request.
 */
export type OrchestrateArgs<TPermissionType extends SupportedPermissionTypes> =
  {
    validatedPermission: PermissionTypeMapping[TPermissionType];
    sessionAccount: Address;
    chainId: number;
    expiry: number;
    isAdjustmentAllowed: boolean;
  };
