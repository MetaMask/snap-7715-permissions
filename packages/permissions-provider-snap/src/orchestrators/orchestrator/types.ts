import type {
  NativeTokenStreamPermission,
  NativeTokenTransferPermission,
} from '@metamask/7715-permissions-shared/types';

/**
 * Mapping of supported permission types to their respective permission types.
 *
 * - In the future, we may want to extend the mapping key to a unique hash to account for permission types that don't have a string literal representation
 * and are defined as `type: { name: z.string(), description: z.string().optional()}`.
 */
type PermissionTypeMapping = {
  'native-token-stream': NativeTokenStreamPermission;
  'native-token-transfer': NativeTokenTransferPermission;
};

/**
 * Supported permission types.
 */
type SupportedPermissionTypes = keyof PermissionTypeMapping;

export type { SupportedPermissionTypes, PermissionTypeMapping };
