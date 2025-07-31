import type {
  PermissionRequest,
  Permission,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { Hex, Caveat, Delegation } from '@metamask/delegation-core';
import type { CaipAssetType, SnapsProvider } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import type { TokenMetadataService } from '../services/tokenMetadataService';
import type { UserEventDispatcher } from '../userEventDispatcher';
import type { DelegationContracts } from './chainMetadata';
import type { PermissionRequestLifecycleOrchestrator } from './permissionRequestLifecycleOrchestrator';
import type { TokenPricesService } from '../services/tokenPricesService';

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
  accountAddressCaip10: Caip10Address;
  tokenAddressCaip19: CaipAssetType;
  tokenMetadata: {
    decimals: number;
    symbol: string;
    iconDataBase64: string | null;
  };
};

export type BaseMetadata = {
  validationErrors?: object;
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
 * @property isGrantDisabled - Whether the user can grant the permission
 * @property snaps - The Snaps provider instance for interacting with the Snaps API
 * @property userEventDispatcher - The dispatcher for handling user events during confirmation
 */
export type ConfirmationProps = {
  ui: SnapElement;
  isGrantDisabled: boolean;
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
  createSkeletonConfirmationContent: () => Promise<SnapElement>;
  createConfirmationContent: (args: {
    context: TContext;
    metadata: TMetadata;
    origin: string;
    chainId: number;
  }) => Promise<SnapElement>;
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
  accountController: AccountControllerInterface;
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
    tokenMetadataService: TokenMetadataService;
  }) => Promise<TContext>;
  deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  createConfirmationContent: (args: {
    context: TContext;
    metadata: TMetadata;
  }) => Promise<SnapElement>;
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

/**
 * Base options required for account operations.
 */
export type AccountOptionsBase = {
  // really this needs to be of type SupportedChainId, but it makes it hard for callers to validate
  chainId: number;
};

/**
 * Options for signing a delegation.
 */
export type SignDelegationOptions = AccountOptionsBase & {
  delegation: Omit<Delegation, 'signature'>;
  address: Hex;
};

/**
 * Factory arguments for smart account deployment.
 */
export type FactoryArgs = {
  factory: Hex | undefined;
  factoryData: Hex | undefined;
};

// we explicitly name these types, so that we can have named parameters in the
// Caip10Address type, without having to use generics.
type Namespace = string;
type Reference = string;
type Address = Hex;

export type Caip10Address = `${Namespace}:${Reference}:${Address}`;

/**
 * Interface for account controller implementations.
 */
export type AccountControllerInterface = {
  /**
   * Signs a delegation using the smart account.
   */
  signDelegation(options: SignDelegationOptions): Promise<Delegation>;

  /**
   * Retrieves the account addresses available for this current account.
   */
  getAccountAddresses(options: AccountOptionsBase): Promise<Caip10Address[]>;
};
