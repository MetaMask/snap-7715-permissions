import type {
  PermissionRequest,
  PermissionResponse,
  NativeTokenStreamPermission,
} from '@metamask/7715-permissions-shared/types';
import type { Address, Hex } from 'viem';

/**
 * Supported permission types.
 */
export type SupportedPermissionTypes = 'native-token-stream';

/**
 * Mapping of supported permission orchestrators orchestrateFn parameter types.
 *
 * - In the future, we may want to extend the mapping key to a unique hash to account for permission types that don't have a string literal representation
 * and are defined as `type: { name: z.string(), description: z.string().optional()}`.
 */
type OrchestrateFnParamsMapping = {
  'native-token-stream': NativeTokenStreamPermission;
};

/**
 * Mapping of supported permission orchestrators return types for the permission factory to return the correct orchestrator.
 *
 * - In the future, we may want to extend the mapping key to a unique hash to account for permission types that don't have a string literal representation
 * and are defined as `type: { name: z.string(), description: z.string().optional()}`.
 */
export type PermissionOrchestratorReturnMapping = {
  'native-token-stream': Orchestrator<'native-token-stream'>;
};

/**
 * Metadata required for orchestrating a permission.
 */
export type OrchestrateMeta = {
  /**
   * The chain id of the permission in hex format.
   *
   */
  chainId: Hex;

  /**
   * The address of the delegate that will be granted the permission(ie. the dapp's session account address).
   */
  delegate: Address;

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
   * The permission type.
   */
  permissionType: TPermissionType;

  /**
   * Validates the base permission request for the permission type.
   *
   * @param basePermission - The base permission to validate.
   * @returns True if the base permission is valid otherwise throws an error.
   * @throws If the base permission request is invalid given the permission type.
   */
  validate: (basePermissionRequest: PermissionRequest) => Promise<true>;

  /**
   * Orchestrates the permission request for the permission type.
   *
   * @param permission - The permission to orchestrate.
   * @returns The permission response.
   * @throws If the permission request cannot be orchestrated(ie. user denies the request, internal error, etc).
   */
  orchestrate: (
    permission: OrchestrateFnParamsMapping[TPermissionType],
    orchestrateMeta: OrchestrateMeta,
  ) => Promise<PermissionResponse | null>;
};
