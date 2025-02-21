import type { Json } from '@metamask/snaps-sdk';

import {
  type GatorPermission,
  type GetSnapsResponse,
  type PermissionOffer,
  type RegisteredPermissionOffer,
} from '../../../shared/src/types';
import { getIdFor } from '../../../shared/src/utils';
import { logger } from '../logger';
import { InternalMethod, KERNEL_SNAP_ID } from './origin';

type PermissionOfferLibrary = {
  registerPermissionOffer(permissionToOffer: GatorPermission): Promise<boolean>;
  registerPermissionOfferBatch(
    permissionToOffers: GatorPermission[],
  ): Promise<boolean>;
  getRegisteredOffers(): Promise<RegisteredPermissionOffer[]>;
};

/**
 * Sends a permission offer to the kernel snap "wallet_offerOnchainPermission" JSON-RPC method.
 * @param offer - The permission offer to send.
 * @returns A promise that resolves to true if the offer was successfully sent.
 * Otherwise, it resolves to false.
 * @throws If the offer could not be sent.
 */
const makeOffer = async (offer: PermissionOffer): Promise<boolean> => {
  logger.debug(
    `[Gator snap] Sending permission offer to kernel`,
    JSON.stringify(offer, undefined, 2),
  );
  const response = await snap.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: KERNEL_SNAP_ID,
      request: {
        method: InternalMethod.WalletOfferOnchainPermission,
        params: offer as Json,
      },
    },
  });

  return Boolean(response);
};

/**
 * Checks if the kernel snap is installed.
 * @returns A promise that resolves to true if the kernel snap is installed.
 * Otherwise, it resolves to false.
 */
const checkKernelSnapInstalled = async (): Promise<boolean> => {
  const snaps = (await snap.request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;

  return Boolean(snaps[KERNEL_SNAP_ID]);
};

export const createPermissionOfferLibrary = (): PermissionOfferLibrary => {
  return {
    registerPermissionOffer: async (
      permissionToOffer: GatorPermission,
    ): Promise<boolean> => {
      if (!(await checkKernelSnapInstalled())) {
        logger.error(
          `Kernel snap not installed. Cannot register permission offer.`,
        );
        return false;
      }
      // permId given to kernel for lookup later
      const permId = await getIdFor(permissionToOffer);
      const offer: PermissionOffer = {
        id: permId,
        proposedName: permissionToOffer.proposedName,
        type: permissionToOffer.type,
      };

      return await makeOffer(offer);
    },

    registerPermissionOfferBatch: async (
      permissionToOffers: GatorPermission[],
    ): Promise<boolean> => {
      if (!(await checkKernelSnapInstalled())) {
        logger.error(
          `Kernel snap not installed. Cannot register permission offer.`,
        );
        return false;
      }

      const offers = await Promise.all(
        permissionToOffers.map(async (permissionToOffer) => {
          const permId = await getIdFor(permissionToOffer);
          return {
            id: permId,
            proposedName: permissionToOffer.proposedName,
            type: permissionToOffer.type,
          } as PermissionOffer;
        }),
      );

      type PermissionData = { offer: PermissionOffer; registered: boolean };
      const initialPermissions: PermissionData[] = [];
      const registeredPermissionsWithIds = await offers.reduce(
        async (accPromise, offer) => {
          const acc = await accPromise;
          const registered = await makeOffer(offer);
          return [...acc, { offer, registered }];
        },
        Promise.resolve(initialPermissions),
      );

      // Check if all permissions were registered
      const failedPermissions = registeredPermissionsWithIds.filter(
        (permission) => !permission.registered,
      );

      if (failedPermissions.length > 0) {
        throw new Error(
          `Failed to batch register permissions: ${JSON.stringify(
            failedPermissions,
            undefined,
            2,
          )}`,
        );
      }
      return true;
    },

    getRegisteredOffers: async (): Promise<RegisteredPermissionOffer[]> => {
      try {
        const res = await snap.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: KERNEL_SNAP_ID,
            request: {
              method: InternalMethod.WalletGetRegisteredOnchainPermissionOffers,
              params: [],
            },
          },
        });

        return res as RegisteredPermissionOffer[];
      } catch (error: any) {
        logger.error(
          `Problem registering permissions. Registering with kernel permission gave:`,
          JSON.stringify(error, undefined, 2),
        );
        throw error;
      }
    },
  };
};
