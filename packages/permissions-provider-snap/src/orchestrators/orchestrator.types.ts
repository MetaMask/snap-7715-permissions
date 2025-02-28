import type {
  PermissionRequest,
  PermissionResponse,
  NativeTokenStreamPermission,
  NativeTokenTransferPermission,
} from '@metamask/7715-permissions-shared/types';
import type { Address, Hex } from 'viem';

/**
 * Supported permission types.
 */
export type SupportedPermissionTypes =
  | 'native-token-stream'
  | 'native-token-transfer';

/**
 * Mapping of supported permission types to their respective permission types.
 *
 * - In the future, we may want to extend the mapping key to a unique hash to account for permission types that don't have a string literal representation
 * and are defined as `type: { name: z.string(), description: z.string().optional()}`.
 */
export type PermissionTypeMapping = {
  'native-token-stream': NativeTokenStreamPermission;
  'native-token-transfer': NativeTokenTransferPermission;
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
   * Validates the base permission request for the permission type.
   *
   * @param basePermissionRequest - The base permission request to validate.
   * @returns True if the base permission for the permission type is valid otherwise throws an error.
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
    permission: PermissionTypeMapping[TPermissionType],
    orchestrateMeta: OrchestrateMeta,
  ) => Promise<PermissionResponse | null>;
};
