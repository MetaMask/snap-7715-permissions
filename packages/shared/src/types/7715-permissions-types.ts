import { any, z } from 'zod';

import { zTimestamp } from './7715-permissions-request';
import { extractDescriptorName } from '../utils';

// Rather than only define permissions by name,
// Requestors can optionally make this an object and leave room for forward-extensibility.
export const zTypeDescriptor = z.union([
  z.string(),
  z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
]);
export type TypeDescriptor = z.infer<typeof zTypeDescriptor>;

export const zPermission = z.object({
  type: zTypeDescriptor,

  /**
   * Whether the permission can be adjusted
   */
  isAdjustmentAllowed: z.boolean(),

  /**
   * Data structure varies by permission type.
   */
  data: z.record(any()),
});

export const zRule = z
  .object({
    type: zTypeDescriptor,

    /**
     * Whether the rule can be adjusted
     */
    isAdjustmentAllowed: z.boolean(),

    /**
     * Data structure varies by rule type.
     */
    data: z.record(z.string(), z.any()),
  })
  .refine((rule) => {
    // Rules are generally free-form, but expiry is a special case.
    if (extractDescriptorName(rule.type) === 'expiry') {
      return zTimestamp.safeParse(rule.data.timestamp).success;
    }

    return true;
  });

/**
 * Default message for when no justification is provided
 */
const DEFAULT_JUSTIFICATION_MESSAGE =
  'No justification was provided for the permission';

/**
 * Sanitized justification schema that:
 * - Makes justification optional (null/undefined/empty becomes default message)
 * - Limits length to 120 characters
 * - Trims excessive whitespace and normalizes control characters
 * - Prevents JSON, XML, dangerous control characters, and quotes
 * - Ensures the string is safe for display
 */
/* eslint-disable no-useless-escape, require-unicode-regexp, no-control-regex, no-misleading-character-class */
export const zSanitizedJustification = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    // If null/undefined, return default message
    if (val === null || val === undefined) {
      return DEFAULT_JUSTIFICATION_MESSAGE;
    }
    return val;
  })
  .pipe(
    z
      .string()
      .transform((val) => {
        // Trim and normalize whitespace first
        // Note: trim() also removes the Byte Order Mark (\uFEFF) and other leading/trailing whitespace
        const trimmed = val.trim().replace(/\s+/g, ' ');
        // If empty after trimming, return default message
        if (trimmed.length === 0) {
          return DEFAULT_JUSTIFICATION_MESSAGE;
        }
        return trimmed;
      })
      .pipe(
        z
          .string()
          .min(1, 'Justification cannot be empty')
          .max(120, 'Justification cannot exceed 120 characters')
          .refine(
            (val) => {
              // Check for markup/script patterns (covers HTML, XML, JSON, CSS)
              const dangerousPatterns = [
                /[<>]/, // Any angle brackets (HTML/XML tags)
                /[{}]/, // Any braces (JSON, CSS blocks)
                /[\[\]]/, // Any brackets (JSON arrays, CSS selectors)
                /@(?:import|media|keyframes|font-face|page|charset|namespace|supports|document|viewport|counter-style|font-feature-values|property|layer)\b/, // CSS at-rules
                /expression\s*\(/, // CSS expressions (security risk)
                /behavior\s*:\s*url/, // CSS behaviors (security risk)
                /url\s*\(/, // CSS url() functions
                /on\w+\s*=/, // Event handlers
                /javascript:|data:|vbscript:/, // Dangerous protocols
                /["`]/, // Double quotes and backticks (allow apostrophes for contractions)
                /[\u0000-\u0008\u000E-\u001F\u007F]/, // Control characters (excluding \t, \n, \v, \f)
                /[\u202E\u202D\u202C\u200E\u200F]/, // RTL/LTR override characters
                /[\u200B\u200C\u200D]/, // Zero-width characters (excluding \uFEFF which is removed by trim())
                /[\u0300-\u036F\u1AB0-\u1AFF\u20D0-\u20FF]/, // Combining diacritical marks
                /[\uFF00-\uFFEF]/, // Full-width characters (homograph attacks)
                /&[a-zA-Z]+;/, // HTML entities
                /&#\d+;/, // Numeric HTML entities
                /&#x[0-9a-fA-F]+;/, // Hex HTML entities
                /\\u[0-9a-fA-F]{4}/, // Unicode escape sequences
              ];

              return !dangerousPatterns.some((pattern) => pattern.test(val));
            },
            {
              message: 'Justification contains invalid characters or patterns',
            },
          ),
      ),
  );
/* eslint-enable no-useless-escape, require-unicode-regexp, no-control-regex, no-misleading-character-class */

export const zMetaMaskPermissionData = z.object({
  /**
   * A human-readable explanation of why the permission is being requested.
   * Sanitized to prevent injection attacks and ensure safe display.
   */
  justification: zSanitizedJustification,
});

export type Permission = z.infer<typeof zPermission>;
