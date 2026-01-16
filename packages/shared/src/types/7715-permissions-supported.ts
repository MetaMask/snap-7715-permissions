import { z } from 'zod';

import { zHexStr } from './common';

/**
 * Supported 7715 rule types for each permission type.
 * This is the single source of truth for which rules can be applied to each permission.
 */
export const SUPPORTED_RULE_TYPES = {
  'native-token-stream': ['expiry'],
  'native-token-periodic': ['expiry'],
  'erc20-token-stream': ['expiry'],
  'erc20-token-periodic': ['expiry'],
  'erc20-token-revocation': ['expiry'],
} as const;

/**
 * Schema for supported permission info containing chainIds and ruleTypes.
 */
export const zSupportedPermissionInfo = z.object({
  /**
   * The chain IDs where this permission type is supported.
   */
  chainIds: z.array(zHexStr),

  /**
   * The rule types that can be applied to this permission.
   */
  ruleTypes: z.array(z.string()),
});

export type SupportedPermissionInfo = z.infer<typeof zSupportedPermissionInfo>;

/**
 * Schema for the response of wallet_getSupportedExecutionPermissions.
 * An object keyed on supported permission types including chainIds and ruleTypes.
 */
export const zGetSupportedPermissionsResult = z.record(
  z.string(),
  zSupportedPermissionInfo,
);

export type GetSupportedPermissionsResult = z.infer<
  typeof zGetSupportedPermissionsResult
>;
