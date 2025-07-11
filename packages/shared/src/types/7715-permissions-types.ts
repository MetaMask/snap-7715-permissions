import { any, z } from 'zod';

import { zAddress, zHexStr } from './common';

// Rather than only define permissions by name,
// Requestors can optionally make this an object and leave room for forward-extensibility.
export const zTypeDescriptor = z.union([
  z.string(),
  z.object({
    name: z.string(),
    description: z.string(),
  }),
]);
export type TypeDescriptor = z.infer<typeof zTypeDescriptor>;

export const zPermission = z.object({
  type: zTypeDescriptor,

  /**
   * Data structure varies by permission type.
   */
  data: z.record(any()),

  rules: z.record(any()).optional(),
});

/**
 * Sanitized justification schema that:
 * - Limits length to 120 characters
 * - Trims excessive whitespace
 * - Prevents JSON, XML, control characters, and quotes
 * - Ensures the string is safe for display
 */
export const zSanitizedJustification = z
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
        /@\w+/, // CSS at-rules (@import, @media, etc.)
        /:\s*[a-zA-Z]/, // CSS properties or JSON key-value
        /url\s*\(/, // CSS url() functions
        /on\w+\s*=/, // Event handlers
        /javascript:|data:|vbscript:/, // Dangerous protocols
        /-webkit-|-moz-|-ms-|-o-/, // CSS vendor prefixes
        /['"`]/, // Quotes
        /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/, // Control characters (excluding \t and \n)
        /[\u202E\u202D\u202C\u200E\u200F]/, // RTL/LTR override characters
        /[\u200B\u200C\u200D\uFEFF]/, // Zero-width characters
        /[\u0300-\u036F\u1AB0-\u1AFF\u20D0-\u20FF]/, // Combining diacritical marks
        /[\uFF00-\uFFEF]/, // Full-width characters (homograph attacks)
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/, // Control characters except \t (0x09) and \n (0x0A)
        /&[a-zA-Z]+;/, // HTML entities
        /&#\d+;/, // Numeric HTML entities
        /&#x[0-9a-fA-F]+;/, // Hex HTML entities
        /\\u[0-9a-fA-F]{4}/, // Unicode escape sequences
      ];
      
      return !dangerousPatterns.some(pattern => pattern.test(val));
    },
    {
      message: 'Justification contains invalid characters or patterns (markup, scripts, control characters, or quotes are not allowed)',
    }
  )
  .transform((val) => val.trim().replace(/\s+/g, ' ')) // Trim and normalize whitespace
  .refine(
    (val) => val.length > 0,
    {
      message: 'Justification cannot be empty after sanitization',
    }
  );

export const zMetaMaskPermissionData = z.object({
  /**
   * A human-readable explanation of why the permission is being requested.
   * Sanitized to prevent injection attacks and ensure safe display.
   */
  justification: zSanitizedJustification,
});

export const zNativeTokenTransferPermission = zPermission.extend({
  type: z.literal('native-token-transfer'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      allowance: zHexStr,
    }),
  ),
});

export const zErc20TokenTransferPermission = zPermission.extend({
  type: z.literal('erc20-token-transfer'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      address: zAddress,
      allowance: zHexStr,
    }),
  ),
});

export const zErc721TokenTransferPermission = zPermission.extend({
  type: z.literal('erc721-token-transfer'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      address: zAddress,
      tokenIds: z.array(zHexStr),
    }),
  ),
});

export const zErc1155TokenTransferPermission = zPermission.extend({
  type: z.literal('erc1155-token-transfer'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      address: zAddress,
      allowances: z.record(zHexStr),
    }),
  ),
});

export type NativeTokenTransferPermission = z.infer<
  typeof zNativeTokenTransferPermission
>;

export type Erc20TokenTransferPermission = z.infer<
  typeof zErc20TokenTransferPermission
>;
export type Erc721TokenTransferPermission = z.infer<
  typeof zErc721TokenTransferPermission
>;
export type Erc1155TokenTransferPermission = z.infer<
  typeof zErc1155TokenTransferPermission
>;
export type Permission = z.infer<typeof zPermission>;
