import { z } from 'zod';

import { SUPPORTED_RULE_TYPES } from './7715-permissions-supported';
import { zPermission, zRule, zTimestamp } from './7715-permissions-types';
import { zAddress, zHexStr } from './common';
import { extractDescriptorName } from '../utils';

export const zAccountSigner = z.object({
  type: z.literal('account'),
  data: z.object({
    address: zAddress,
  }),
});

/**
 * An account that can be granted with permissions as in ERC-7710.
 */
export type AccountSigner = z.infer<typeof zAccountSigner>;

export const zWalletSigner = z.object({
  type: z.literal('wallet'),
  data: z.object({}),
});

/**
 * A wallet is the signer for these permissions
 * `data` is not necessary for this signer type as the wallet is both the signer and grantor of these permissions.
 */
export type WalletSigner = z.infer<typeof zWalletSigner>;

export const zPermissionRequest = z
  .object({
    /**
     * hex-encoding of uint256 defined the chain with EIP-155
     */
    chainId: zHexStr,

    /**
     *
     * The account being targeted for this permission request.
     * It is optional to let the user choose which account to grant permission for.
     */
    address: zAddress.optional().nullable(),

    /**
     * An account that can be granted with permissions as in ERC-7710
     */
    signer: zAccountSigner,

    /**
     * The type of action the signer is permitted to perform (e.g., native token transfer, contract call).
     */
    permission: zPermission,

    /**
     * Constraints that limit how the permission can be used (e.g., expiry time).
     */
    rules: z.array(zRule).superRefine((rules, ctx) => {
      // Check for duplicate rule types
      const ruleTypes = rules.map((rule) => extractDescriptorName(rule.type));
      const uniqueRuleTypes = new Set(ruleTypes);

      if (uniqueRuleTypes.size !== ruleTypes.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate rule types are not allowed',
        });
      }
    }),
  })
  .superRefine((data, ctx) => {
    // Validate that each rule type is supported for the permission type
    const permissionType = extractDescriptorName(data.permission.type);
    const supportedRules =
      SUPPORTED_RULE_TYPES[permissionType as keyof typeof SUPPORTED_RULE_TYPES];

    // If permission type is not in SUPPORTED_RULE_TYPES, skip rule validation
    // (unknown permission types are handled elsewhere)
    if (!supportedRules) {
      return;
    }

    for (const rule of data.rules) {
      const ruleType = extractDescriptorName(rule.type);
      if (
        !supportedRules.includes(ruleType as (typeof supportedRules)[number])
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Rule type "${ruleType}" is not supported for permission type "${permissionType}". Supported: ${supportedRules.join(', ') || 'none'}`,
          path: ['rules'],
        });
      }
    }
  });
export const zPermissionsRequest = z.array(zPermissionRequest);

export type PermissionRequest = z.infer<typeof zPermissionRequest>;
export type PermissionsRequest = z.infer<typeof zPermissionsRequest>;

export const zRequestExecutionPermissionsParam = z.object({
  permissionsRequest: zPermissionsRequest,
  siteOrigin: z.string(),
});

/**
 * This is the parameters for the requestExecutionPermissions method.
 * It is used by the kernel to forward request to permission provider snaps.
 */
export type RequestExecutionPermissionsParam = z.infer<
  typeof zRequestExecutionPermissionsParam
>;

/**
 * Zod validation for startTime to ensure it's today or later.
 * @param value - Unix timestamp in seconds.
 * @returns True if the start time is today or later, false otherwise.
 */
const validateStartTimeZod = (value: number): boolean => {
  const now = new Date();
  const startOfTodayLocal = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );

  return value >= Math.floor(startOfTodayLocal.getTime() / 1000);
};

export const zStartTime = zTimestamp
  .nullable()
  .optional()
  .refine(
    (value) => {
      if (value === undefined || value === null) {
        return true;
      }
      return validateStartTimeZod(value);
    },
    {
      message: 'Start time must be today or later',
    },
  );
