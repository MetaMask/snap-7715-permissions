import {
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

import type {
  DeepRequired,
  TypedPermissionRequest,
  BaseContext,
  BaseMetadata,
} from '../../core/types';

export type Erc20TokenRevocationMetadata = BaseMetadata & {
  validationErrors: {
    expiryError?: string;
  };
};

export type Erc20TokenRevocationContext = BaseContext & {
  // No additional permissionDetails beyond base for revocation
};

export const zErc20TokenRevocationPermission = zPermission.extend({
  type: z.literal('erc20-token-revocation'),
  data: zMetaMaskPermissionData,
});

export type Erc20TokenRevocationPermission = z.infer<
  typeof zErc20TokenRevocationPermission
>;

export type Erc20TokenRevocationPermissionRequest =
  TypedPermissionRequest<Erc20TokenRevocationPermission>;

export type PopulatedErc20TokenRevocationPermission =
  DeepRequired<Erc20TokenRevocationPermission>;
