import type { DelegationStruct } from '@metamask-private/delegator-core-viem';
import type { InterfaceContext } from '@metamask/snaps-sdk';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import type {
  PermissionConfirmationStateMapping,
  PermissionSpecificRulesMapping,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../orchestrators';

/**
 * The state of the permission dialog components.
 */
export type State<TPermissionType extends SupportedPermissionTypes> =
  PermissionConfirmationStateMapping[TPermissionType];

/**
 * The delegation in transit object with salt as a hex string to be compatible with the Snap context { [prop: string]: Json; } object.
 */
export type SerializableDelegation = Omit<DelegationStruct, 'salt'> & {
  readonly delegate: Hex;
  readonly delegator: Hex;
  salt: Hex;
};

/**
 * The custom Snap context object for the permission confirmation page that will be passed to onUserInput when the user interacts with the interface.
 * The following actions are expected to be performed on the context object:
 * - User attenuation reflected on the context object(ie. adjusting the permission data).
 * - Dynamic updates to delegation data reflected on the context object.
 * - Immutable values expected not to change are set to readonly.
 */
export type PermissionConfirmationContext<
  TPermissionType extends SupportedPermissionTypes,
> = InterfaceContext & {
  permission: PermissionTypeMapping[TPermissionType];
  permissionSpecificRules: PermissionSpecificRulesMapping[TPermissionType];
  readonly address: Hex;
  readonly siteOrigin: string;
  readonly balance: Hex;
  readonly valueFormattedAsCurrency: string;
  readonly chainId: number;
  expiry: number;
  state: State<TPermissionType>;
};

/**
 * The props for specific permission confirmation pages.
 */
export type PermissionConfirmationProps<
  TPermissionType extends SupportedPermissionTypes,
> = JsonObject &
  Pick<
    PermissionConfirmationContext<TPermissionType>,
    | 'permission'
    | 'address'
    | 'siteOrigin'
    | 'balance'
    | 'valueFormattedAsCurrency'
    | 'expiry'
    | 'chainId'
    | 'permissionSpecificRules'
    | 'state'
  >;

/**
 * The props for the permission rules.
 */
export type PermissionSpecificRulesProps<
  TPermissionType extends SupportedPermissionTypes,
> = JsonObject & {
  permissionSpecificRules: PermissionSpecificRulesMapping[TPermissionType];
  expiry: number;
};
