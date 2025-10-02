import { z } from 'zod';

import { zPermission, zRule } from './7715-permissions-types';
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
export type WalletSigner = z.infer<typeof zAccountSigner>;

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
  address: zAddress.optional().nullable(),

  /**
   * An account that can be granted with permissions as in ERC-7710
   */
  signer: zAccountSigner,

  /**
   * Defines the allowed behavior the signer can do on behalf of the account.
   */
  permission: zPermission,

  /**
   * Defines the allowed behavior the signer can do on behalf of the account.
   */
  rules: z.array(zRule).refine(
    (rules) => {
      const hasExpiryRule = rules.some(
        (rule) => extractDescriptorName(rule.type) === 'expiry',
      );

      if (!hasExpiryRule) {
        return false;
      }

      const ruleTypes = rules.map((rule) => rule.type);

      const uniqueRuleTypes = new Set(ruleTypes);
      if (uniqueRuleTypes.size !== ruleTypes.length) {
        return false;
      }

      return true;
    },
    {
      message: 'Failed rule validation: Expiry rule is missing or invalid',
    },
  ),
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
 * A timestamp in seconds.
 */
export const zTimestamp = z.number().int().positive();

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
