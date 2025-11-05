import { z } from 'zod';

import { zAddress, zHexStr } from './common';

/**
 * Parameters for getGrantedPermissions(). All fields are optional and used for filtering.
 */
export const zGetGrantedPermissionsParam = z.object({
  isRevoked: z.boolean().optional(),
  siteOrigin: z.string().optional(),
  chainId: zHexStr.optional(),
  delegationManager: zAddress.optional(),
});

export type GetGrantedPermissionsParam = z.infer<
  typeof zGetGrantedPermissionsParam
>;
