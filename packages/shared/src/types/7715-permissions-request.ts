import { z } from 'zod';

import { zPermission, zRule, zTimestamp } from './7715-permissions-types';
import { zAddress, zHexStr } from './common';
import { extractDescriptorName } from '../utils';

export const zPermissionRequest = z.object({
  /**
   * hex-encoding of uint256 defined the chain with EIP-155
   */
  chainId: zHexStr,

  /**
   *
   * The account being targeted for this permission request.
   * It is optional to let the user choose which account to grant permission for.
   */
  from: zAddress.optional().nullable(),

  /**
   * An account that can be granted with permissions as in ERC-7710
   */
  to: zAddress,

  /**
   * Defines the allowed behavior the signer can do on behalf of the account.
   */
  permission: zPermission,

  /**
   * Defines the allowed behavior the signer can do on behalf of the account.
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
