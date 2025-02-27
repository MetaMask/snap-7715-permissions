import type { CaveatStruct } from '@metamask-private/delegator-core-viem';
import type { InterfaceContext } from '@metamask/snaps-sdk';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../orchestrators/orchestrator.types';

/**
 * The delegation in transit object with salt as a hex string to be compatible with the Snap context { [prop: string]: Json; } object.
 */
export type DelegationInTransit = {
  delegate: Hex;
  delegator: Hex;
  authority: Hex;
  caveats: CaveatStruct[];
  salt: Hex;
  signature: Hex;
};

/**
 * The custom Snap context object for the permission confirmation page that will be passed to onUserInput when the user interacts with the interface.
 * The following actions are expected to be performed on the context object:
 * - User attenuation reflected on the context object(ie. adjusting the permission data).
 * - Dynamic updates to delegation data reflected on the context object.
 * - Immutable vaules expected not to change are set to readonly.
 */
export type PermissionConfirmationContext<
  TPermissionType extends SupportedPermissionTypes,
> = InterfaceContext & {
  permission: PermissionTypeMapping[TPermissionType];
  readonly siteOrigin: string;
  readonly balance: Hex;
  readonly chainId: number;
  expiry: number;
  delegation: DelegationInTransit;
};

/**
 * The props for specific permission confirmation pages.
 */
export type PermissionConfirmationProps<
  TPermissionType extends SupportedPermissionTypes,
> = JsonObject &
  Pick<
    PermissionConfirmationContext<TPermissionType>,
    'permission' | 'siteOrigin' | 'balance' | 'expiry' | 'chainId'
  >;

/**
 * The meta data required to prepare the permission confirmation page.
 */
export type PreparePermissionConfirmationMeta<
  TPermissionType extends SupportedPermissionTypes,
> = {
  readonly permission: PermissionTypeMapping[TPermissionType];
  readonly delegator: Hex;
  readonly delegate: Hex;
  readonly siteOrigin: string;
  readonly balance: Hex;
  readonly expiry: number;
  readonly chainId: number;
};
