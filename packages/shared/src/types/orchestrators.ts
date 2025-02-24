import type {
  Erc20TokenTransferPermissionRequest,
  NativeTokenTransferPermissionRequest,
  PermissionRequest,
} from './7715-permissions-request';
import type { PermissionResponse } from './7715-permissions-response';

type ValidateFn = (
  basePermissionRequest: PermissionRequest,
) => Promise<boolean>;

type OrchestrateFn<PerTyp> = (
  permission: PerTyp,
) => Promise<PermissionResponse | null>;

type SupportedPermissionTypes =
  | 'erc-20-token-transfer'
  | 'native-token-transfer';

export type NativePermissionTypePermissionOrchestrator = {
  /**
   * The permission type.
   */
  permissionType: SupportedPermissionTypes;

  /**
   * Validates the base permission for a native token transfer.
   *
   * @param basePermission - The base permission to validate.
   * @returns Whether the base permission is valid.
   * @throws If the base permission is invalid given the permission type.
   */
  validate: ValidateFn;

  /**
   * Orchestrates the permission request for a native token transfer.
   *
   * @param nativeTokenTransferPermissionRequest - The permission request for a native token transfer.
   * @returns The permission response.
   * @throws If the permission request cannot be orchestrated(ie. user denies the request, internal error, etc).
   */
  orchestrate: OrchestrateFn<NativeTokenTransferPermissionRequest>;
};

export type Erc20PermissionTypePermissionOrchestrator = {
  /**
   * The permission type.
   */
  permissionType: SupportedPermissionTypes;

  /**
   * Validates the base permission for an erc-20 token transfer.
   *
   * @param basePermission - The base permission to validate.
   * @returns Whether the base permission is valid.
   * @throws If the base permission is invalid given the permission type.
   */
  validate: ValidateFn;

  /**
   * Orchestrates the permission request for an erc-20 token transfer.
   *
   * @param nativeTokenTransferPermissionRequest - The permission request for an erc-20 token transfer.
   * @returns The permission response.
   * @throws If the permission request cannot be orchestrated(ie. user denies the request, internal error, etc).
   */
  orchestrate: OrchestrateFn<Erc20TokenTransferPermissionRequest>;
};

/**
 * Mapping of supported permission ochestrators with param and return types.
 *
 * - In the future, we may want to extend the mapping key to a unique hash to account for permission types that don't have a string literal representation
 * and are defined as `type: { name: z.string(), description: z.string().optional()}`.
 */
export type PermissionOrchestratorTypeMapping = {
  ['native-token-transfer']: {
    params: NativeTokenTransferPermissionRequest;
    return: NativePermissionTypePermissionOrchestrator;
  };
  ['erc-20-token-transfer']: {
    params: Erc20TokenTransferPermissionRequest;
    return: Erc20PermissionTypePermissionOrchestrator;
  };
};

/**
 * Keys of the permission orchestrator mapping for supported permission types.
 */
export type PermissionOrchestratorKeys =
  keyof PermissionOrchestratorTypeMapping;
