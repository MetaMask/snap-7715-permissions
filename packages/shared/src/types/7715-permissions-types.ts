import { any, z } from 'zod';

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

export const zMetaMaskPermissionData = z.object({
  /**
   * A human-readable explanation of why the permission is being requested.
   */
  justification: z.string(),
});

export type Permission = z.infer<typeof zPermission>;
