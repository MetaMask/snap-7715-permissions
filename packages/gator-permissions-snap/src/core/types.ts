import type {
  PermissionRequest,
  Permission,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { Hex, Caveat } from '@metamask/delegation-core';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import type { AccountController } from '../accountController';
import type { TokenMetadataService } from '../services/tokenMetadataService';
import type { TokenPricesService } from '../services/tokenPricesService';
import type { UserEventDispatcher } from '../userEventDispatcher';
import type { DelegationContracts } from './chainMetadata';
import type { PermissionRequestLifecycleOrchestrator } from './permissionRequestLifecycleOrchestrator';

/**
 * Represents the result of a permission request.
 * Can be either approved with a response or rejected with a reason.
 */
export type PermissionRequestResult =
  | { approved: true; response: PermissionResponse }
  | { approved: false; reason: string };

/**
 * Represents a Permission request with an explicitly typed permission field.
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
 * Base context for all token permissions.
 * This includes the account details and token metadata.
 */
export type BaseTokenPermissionContext = BaseContext & {
  accountDetails: {
    address: Hex;
    balanceFormattedAsCurrency: string;
    balance: Hex; // it would be nice if this was Hex, but must be Json serializable for Snaps JSX
  };
  tokenMetadata: {
    decimals: number;
    symbol: string;
    iconDataBase64: string | null;
  };
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
  parseAndValidatePermission: (request: PermissionRequest) => TRequest;
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
  createPermissionCaveats: (args: {
    permission: TPopulatedPermission;
    contracts: DelegationContracts;
  }) => Promise<Caveat[]>;

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

export type IconData = {
  iconDataBase64: string;
  iconAltText: string;
};

export type RuleData = {
  value: string | undefined;
  isVisible: boolean;
  tooltip?: string | undefined;
  iconData?: IconData | undefined;
  error?: string | undefined;
  options?: string[] | undefined;
  isAdjustmentAllowed: boolean;
};

/**
 * Defines a rule that can be applied to a permission request.
 * @template TContext - The type of context object used during request processing
 * @template TMetadata - The type of metadata object used for request processing
 */
export type RuleDefinition<
  TContext extends BaseContext = BaseContext,
  TMetadata extends object = object,
> = {
  name: string;
  isOptional?: boolean;
  label: string;
  type: RuleType;
  getRuleData: (config: { context: TContext; metadata: TMetadata }) => RuleData;
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
 * @template TRequest - The specific permission request type
 * @template TContext - The context type used for this permission
 * @template TMetadata - The metadata type used for this permission
 */
export type PermissionHandlerType = {
  /**
   * Handles a permission request, orchestrating the full lifecycle from request to response.
   * @param origin - The origin of the permission request
   * @returns A permission response object
   */
  handlePermissionRequest(origin: string): Promise<PermissionRequestResult>;
};

/**
 * Defines the structure and dependencies for a permission type.
 * @template TRequest - The type of permission request.
 * @template TContext - The type of context object used during request processing.
 * @template TMetadata - The type of metadata object used for request processing.
 * @template TPermission - The type of permission object.
 * @template TPopulatedPermission - The type of populated permission object with all required fields.
 */
export type PermissionDefinition<
  TRequest extends PermissionRequest = PermissionRequest,
  TContext extends BaseContext = BaseContext,
  TMetadata extends object = object,
  TPermission extends TRequest['permission'] = TRequest['permission'],
  TPopulatedPermission extends
    DeepRequired<TPermission> = DeepRequired<TPermission>,
> = {
  rules: RuleDefinition<TContext, TMetadata>[];
  title: string;
  dependencies: PermissionHandlerDependencies<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >;
};

/**
 * Parameters required to construct a PermissionHandler instance.
 * @template TRequest - The type of permission request being handled.
 * @template TContext - The type of context object used during request processing.
 * @template TMetadata - The type of metadata object used for request processing.
 * @template TPermission - The type of permission object.
 * @template TPopulatedPermission - The type of populated permission object with all required fields.
 */
export type PermissionHandlerParams<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends object,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
> = {
  accountController: AccountController;
  userEventDispatcher: UserEventDispatcher;
  orchestrator: PermissionRequestLifecycleOrchestrator;
  permissionRequest: PermissionRequest;
  dependencies: PermissionHandlerDependencies<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >;
  tokenPricesService: TokenPricesService;
  tokenMetadataService: TokenMetadataService;
  rules: RuleDefinition<TContext, TMetadata>[];
  title: string;
};

/**
 * Dependencies required for a PermissionHandler to process permission requests.
 * @template TRequest - The type of permission request being handled.
 * @template TContext - The type of context object used during request processing.
 * @template TMetadata - The type of metadata object used for request processing.
 * @template TPermission - The type of permission object from the request.
 * @template TPopulatedPermission - The type of fully populated permission object.
 */
export type PermissionHandlerDependencies<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends object,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
> = {
  parseAndValidatePermission: (request: PermissionRequest) => TRequest;
  buildContext: (args: {
    permissionRequest: TRequest;
    tokenPricesService: TokenPricesService;
    accountController: AccountController;
    tokenMetadataService: TokenMetadataService;
  }) => Promise<TContext>;
  deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  createConfirmationContent: (args: {
    context: TContext;
    metadata: TMetadata;
    origin: string;
    chainId: number;
    isJustificationCollapsed: boolean;
    showAddMoreRulesButton: boolean;
  }) => Promise<GenericSnapElement>;
  applyContext: (args: {
    context: TContext;
    originalRequest: TRequest;
  }) => Promise<TRequest>;
  populatePermission: (args: {
    permission: TPermission;
  }) => Promise<TPopulatedPermission>;
  createPermissionCaveats: (args: {
    permission: TPopulatedPermission;
    contracts: DelegationContracts;
  }) => Promise<Caveat[]>;
};
