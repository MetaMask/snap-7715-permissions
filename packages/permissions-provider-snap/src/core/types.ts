import {
  PermissionRequest,
  Permission,
} from '@metamask/7715-permissions-shared/types';

export type TypedPermissionRequest<TPermission extends Permission> =
  PermissionRequest & {
    permission: TPermission;
  };

/**
 * Base interface for all context objects used in confirmation dialogs.
 * Each permission type will extend this with their specific context needs.
 */
export type BaseContext = {
  expiry: string;
  isAdjustmentAllowed: boolean;
};

/**
 * Base interface for all permission objects.
 * Each permission type will extend this with their specific permission data.
 */
export type BasePermission = {
  type: string;
  data: {
    justification: string;
    [key: string]: any;
  };
  rules?: Record<string, any>;
};

/**
 * Makes all properties in an object type required recursively.
 * This includes nested objects and arrays.
 */
export type DeepRequired<TParent> = TParent extends (infer U)[]
  ? DeepRequired<U>[]
  : TParent extends object
    ? {
        [P in keyof TParent]-?: DeepRequired<TParent[P]>;
      }
    : TParent;

export type HydratedPermissionRequest<
  TPermissionRequest extends PermissionRequest,
> = TPermissionRequest & {
  isAdjustmentAllowed: boolean;
  permission: DeepRequired<TPermissionRequest['permission']>;
};
