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
 * Mapping of the attenuated rules that users can adjust for that are specific to the permission type.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/consistent-type-definitions
export interface PermissionSpecificRulesMapping {}
