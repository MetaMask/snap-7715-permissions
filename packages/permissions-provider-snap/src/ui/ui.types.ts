import type { InterfaceContext } from '@metamask/snaps-sdk';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../orchestrators/orchestrator.types';

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
  expiry: number;

  /**
   * The delegation data with attached caveat specific to the permission.
   */
  delegation: {
    readonly delegate: Hex; // The dapp session account(ie. account to receive the delegation).
    readonly delegator: Hex; // The user account(ie. account to sign the delegation).
    caveats: any[];
    salt: Hex;
    authority: Hex;
    signature: Hex;
  };
};

/**
 * The props for specific permission confirmation pages.
 */
export type PermissionConfirmationProps<
  TPermissionType extends SupportedPermissionTypes,
> = JsonObject &
  Pick<
    PermissionConfirmationContext<TPermissionType>,
    'permission' | 'siteOrigin' | 'balance' | 'expiry' | 'delegation'
  >;

/**
 * The meta data required to prepare the permission confirmation page.
 */
export type PreparePermissionConfirmationMeta<
  TPermissionType extends SupportedPermissionTypes,
> = {
  permission: PermissionTypeMapping[TPermissionType];
  delegator: Hex;
  delegate: Hex;
  siteOrigin: string;
  balance: Hex;
  expiry: number;
};
