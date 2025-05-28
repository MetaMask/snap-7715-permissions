import type {
  PermissionRequest,
  Permission,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import type { UserEventDispatcher } from '../userEventDispatcher';

/**
 * Represents the result of a permission request.
 * Can be either approved with a response or rejected with a reason.
 */
export type PermissionRequestResult =
  | { approved: true; response: PermissionResponse }
  | { approved: false; reason: string };

/**
 * Represents a Permissionrequest with an explicitly typed permission field.
 *
 * @template TPermission - The specific permission type of the permission field.
 */
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
  justification: string;
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

/**
 * An enum representing the time periods for which the stream rate can be calculated.
 */
export enum TimePeriod {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}

/**
 * Properties required for confirmation dialogs.
 *
 * @property ui - The UI element to be displayed in the confirmation dialog
 * @property snaps - The Snaps provider instance for interacting with the Snaps API
 * @property userEventDispatcher - The dispatcher for handling user events during confirmation
 */
export type ConfirmationProps = {
  ui: GenericSnapElement;
  snaps: SnapsProvider;
  userEventDispatcher: UserEventDispatcher;
};

/**
 * Type definition for lifecycle orchestration handlers that manage the flow of permission requests.
 *
 * @template TRequest - The type of permission request being handled
 * @template TContext - The type of context object used during request processing
 * @template TMetadata - The type of metadata object used for request processing
 * @template TPermission - The type of permission object from the request
 * @template TPopulatedPermission - The type of fully populated permission object
 */
export type LifecycleOrchestrationHandlers<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends object,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
> = {
  validateRequest: (request: TRequest) => TRequest;
  buildContext: (request: TRequest) => Promise<TContext>;
  deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  createConfirmationContent: (args: {
    context: TContext;
    metadata: TMetadata;
    origin: string;
    chainId: number;
  }) => Promise<GenericSnapElement>;
  applyContext: (args: {
    context: TContext;
    originalRequest: TRequest;
  }) => Promise<TRequest>;
  populatePermission: (args: {
    permission: TPermission;
  }) => Promise<TPopulatedPermission>;
  appendCaveats: (args: {
    permission: TPopulatedPermission;
    caveatBuilder: CoreCaveatBuilder;
  }) => Promise<CoreCaveatBuilder>;

  /**
   * Optional callback that is invoked when a confirmation dialog is created.
   * @param confirmationCreatedArgs - Arguments containing the interface ID and a function to update the context
   */
  onConfirmationCreated?: (confirmationCreatedArgs: {
    interfaceId: string;
    initialContext: TContext;
    updateContext: (updateContextArgs: {
      updatedContext: TContext;
    }) => Promise<void>;
  }) => void;

  /**
   * Optional callback that is invoked when a confirmation dialog is resolved.
   * Can be used to clean up any resources or state.
   */
  onConfirmationResolved?: () => void;
};

/**
 * Represents the type of rule input field.
 */
export type RuleType = 'number' | 'text' | 'dropdown';

/**
 * Defines a rule that can be applied to a permission request.
 *
 * @template TContext - The type of context object used during request processing
 * @template TMetadata - The type of metadata object used for request processing
 */
export type RuleDefinition<
  TContext extends BaseContext = BaseContext,
  TMetadata extends object = object,
> = {
  label: string;
  name: string;
  tooltip?: string | undefined;
  isOptional?: boolean;
  type: RuleType;
  value: (context: TContext) => string | undefined;
  error?: (metadata: TMetadata) => string | undefined;
  options?: string[];
  isVisible?: (context: TContext) => boolean;
  // todo: it would be nice if we could make the value type more specific
  updateContext: (context: TContext, value: any) => TContext;
};

/**
 * Generic interface for permission handlers.
 *
 * Permission handlers are responsible for:
 * 1. Handling permission request, orchestrating the full lifecycle from request to response.
 * 2. Managing permission-specific UI interaction
 * 3. Providing lifecycle hook implementations
 * 4. Converting between request/context/metadata formats
 *
 * @template TRequest - The specific permission request type
 * @template TContext - The context type used for this permission
 * @template TMetadata - The metadata type used for this permission
 */
export type PermissionHandlerType = {
  /**
   * Handles a permission request, orchestrating the full lifecycle from request to response.
   *
   * @param origin - The origin of the permission request
   * @param permissionRequest - The permission request to handle
   * @returns A permission response object
   */
  handlePermissionRequest(origin: string): Promise<PermissionRequestResult>;
};
