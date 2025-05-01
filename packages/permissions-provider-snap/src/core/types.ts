import type {
  PermissionRequest,
  Permission,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider, UserInputEventType } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import type {
  UserEventDispatcher,
  UserInputEventByType,
} from 'src/userEventDispatcher';

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
 * Also removes undefined from union types.
 */
export type DeepRequired<TParent> = TParent extends (infer U)[]
  ? DeepRequired<U>[]
  : TParent extends object
    ? {
        [P in keyof TParent]-?: DeepRequired<Exclude<TParent[P], undefined>>;
      }
    : Exclude<TParent, undefined>;

export type HydratedPermissionRequest<
  TPermissionRequest extends PermissionRequest,
> = TPermissionRequest & {
  isAdjustmentAllowed: boolean;
  permission: DeepRequired<TPermissionRequest['permission']>;
};

/**
 * An enum representing the time periods for which the stream rate can be calculated.
 */
export enum TimePeriod {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}

export type AdditionalField = {
  label: string;
  value: string;
  tooltip?: string;
  iconUrl?: string;
};

export type ConfirmationProps = {
  title: string;
  justification: string;
  origin: string;
  network: string;
  ui: GenericSnapElement;
  snaps: SnapsProvider;
  userEventDispatcher: UserEventDispatcher;
  additionalFields?: AdditionalField[];
};

export type StateChangeHandler<TContext> = {
  elementName: string;
  valueMapper?: (
    event: UserInputEventByType<UserInputEventType.InputChangeEvent>,
  ) => string | boolean;
  contextMapper: (context: TContext, value: string | boolean) => TContext;
};

export type Orchestrator = {
  orchestrate: (args: { origin: string }) => Promise<{
    success: boolean;
    response?: PermissionResponse;
    reason?: string;
  }>;
};
