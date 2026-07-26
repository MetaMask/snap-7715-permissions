import type {
  PermissionRequest,
  Permission,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { Hex, Delegation } from '@metamask/delegation-core';
import type { CaipAccountId, CaipAssetType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import type { UserEventDispatcher } from '../userEventDispatcher';
import type { DialogInterface } from './dialogInterface';
import type { TimeoutFactory } from './timeoutFactory';
import type { MessageKey } from '../utils/i18n';

/**
 * Represents the result of a permission request.
 * Can be either approved with a response or rejected with a reason via isApproved.
 */
export type PermissionRequestResult =
  | { isApproved: true; response: PermissionResponse }
  | { isApproved: false; reason: string };

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
  expiry:
    | {
        timestamp: number;
      }
    | undefined;
  isAdjustmentAllowed: boolean;
  justification: string;
  accountAddressCaip10: CaipAccountId;
  tokenAddressCaip19: CaipAssetType;
  tokenMetadata: {
    decimals: number;
    symbol: string;
    iconDataBase64: string | null;
  };
  /**
   * Allowed redeemer addresses from the dapp-provided redeemer rule (read-only in the UI).
   */
  redeemerAddresses?: string[] | undefined;
  /**
   * Allowed payee addresses from the dapp-provided payee rule (read-only in the UI).
   */
  payeeAddresses?: string[] | undefined;
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
        [P in keyof TParent]-?: DeepRequired<
          Exclude<TParent[P], undefined | null>
        >;
      }
    : Exclude<TParent, undefined | null>;

/**
 * An enum representing the time periods for which the stream rate can be calculated.
 */
export enum TimePeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Properties required for confirmation dialogs.
 * dialogInterface - The dialog interface manager for showing content
 * ui - The UI element to be displayed in the confirmation dialog
 * userEventDispatcher - The dispatcher for handling user events during confirmation
 * onBeforeGrant - Validation callback that runs before grant is confirmed
 */
export type ConfirmationProps = {
  dialogInterface: DialogInterface;
  ui: SnapElement;
  userEventDispatcher: UserEventDispatcher;
  onBeforeGrant: () => Promise<boolean>;
  timeoutFactory: TimeoutFactory;
};

/**
 * Represents the type of rule input field.
 */
export type RuleType = 'number' | 'text' | 'dropdown' | 'datetime';

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
  isEditable: boolean;
  /** For datetime rules: whether to disable selection of past dates. Defaults to false. */
  allowPastDate?: boolean | undefined;
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
  label: MessageKey;
  type: RuleType;
  getRuleData: (config: { context: TContext; metadata: TMetadata }) => RuleData;
  // todo: it would be nice if we could make the value type more specific
  updateContext: (context: TContext, value: any) => TContext;
  /** When provided, called to get content shown when the field is toggled off. */
  contentWhenDisabled?: () => string;
};

/**
 * Options for signing a delegation.
 */
export type SignDelegationOptions = {
  chainId: number;
  delegation: Omit<Delegation, 'signature'>;
  address: Hex;
  origin: string;
  justification: string;
};

/**
 * Factory arguments for smart account deployment.
 */
export type FactoryArgs = {
  factory: Hex | undefined;
  factoryData: Hex | undefined;
};
