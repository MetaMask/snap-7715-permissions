import type { CoreCaveatBuilder } from '@metamask-private/delegator-core-viem';
import type {
  PermissionResponse,
  Permission,
} from '@metamask/7715-permissions-shared/types';
import type { ComponentOrElement } from '@metamask/snaps-sdk';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';
import type { CaipAssetType } from '@metamask/utils';
import type { Address, Hex, OneOf } from 'viem';

import type { PermissionConfirmationContext } from '../ui';
import type { DialogContentEventHandlers } from '../userEventDispatcher';
import type {
  PermissionSpecificRulesMapping,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from './orchestrator';

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

export type Orchestrator<TPermissionType extends SupportedPermissionTypes> = {
  /**
   * Return the CAIP-19 asset type for the given chain ID for the permission type.
   */
  getTokenCaipAssetType: (
    requestedPermission: PermissionTypeMapping[TPermissionType],
    chainId: number,
  ) => CaipAssetType;
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
   * Appends caveats to caveats builder for the permission type.
   * @param permissionContextMeta - The permission context metadata that incudes the attenuated permission and the caveats builder.
   * @returns The an unbuilt caveat builder with caveats added for the permission type.
   */
  appendPermissionCaveats: (
    permissionContextMeta: PermissionContextMeta<TPermissionType>,
  ) => Promise<CoreCaveatBuilder>;

  /**
   * Builds the permission confirmation for the permission type.
   * @param context - The permission confirmation context.
   * @returns The permission confirmation page component.
   */
  buildPermissionConfirmation: (
    context: PermissionConfirmationContext<TPermissionType>,
  ) => ComponentOrElement;

  resolveAttenuatedPermission: (args: {
    requestedPermission: PermissionTypeMapping[TPermissionType];
    requestedExpiry: number;
  }) => Promise<{
    expiry: number;
    permission: PermissionTypeMapping[TPermissionType];
  }>;

  /**
   * Gets the permission specific rules for the permission type. These are default values depending on the permission type.
   * @param permission - The permission to get the specific rules for.
   * @returns The permission specific rules for the permission type.
   */
  getPermissionSpecificRules: (
    permission: PermissionTypeMapping[TPermissionType],
  ) => PermissionSpecificRulesMapping[TPermissionType];

  /**
   * Returns a set of event handlers for the confirmation dialog specific to the permission type.
   * These event handlers are used to handle user input events in the confirmation dialog.
   * @returns An array of event handlers for the confirmation dialog.
   */
  getConfirmationDialogEventHandlers: () => DialogContentEventHandlers[];
};

/**
 * Factory function for creating a permission orchestrator for a given permission type.
 */
export type OrchestratorFactoryFunction<
  TPermissionType extends SupportedPermissionTypes,
> = () => Orchestrator<TPermissionType>;
