import { expect } from '@jest/globals';
import { assertIsAlertDialog, installSnap } from '@metamask/snaps-jest';
import type { Json } from '@metamask/snaps-sdk';

import type { PermissionsRequest } from '../../../shared/src/types';
import { InternalMethod } from '../../src/permissions';
import { EmptyRegistryPage, NoOffersFoundPage } from '../../src/ui';

describe('Kernel Snap', () => {
  describe('onRpcRequest', () => {
    const MOCK_PERMISSIONS_PROVIDER_SNAP_ID = 'local:http://localhost:8083';
    const MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO = 'local:http://localhost:8084';
    const createMockNativeTrasferRegisteredPermissionOffer = (
      hostId: string,
    ) => ({
      type: 'native-token-transfer',
      hostId,
      hostPermissionId:
        'd323523d13f344ed84977a720093e2b5c199565fa872ca9d1fbcfc4317c8ef11',
      proposedName: 'Native Token Transfer',
    });
    const MOCK_PERMISSIONS_REQUEST_SINGLE: PermissionsRequest = [
      {
        chainId: '0x1',
        expiry: 1,
        signer: {
          type: 'account',
          data: {
            address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
          },
        },
        permission: {
          type: 'native-token-transfer',
          data: {
            justification: 'shh...permission 1',
            allowance: '0x1DCD6500',
          },
        },
      },
    ];
    const MOCK_PERMISSIONS_REQUEST_NON_SUPPORTED: PermissionsRequest = [
      {
        chainId: '0x1',
        expiry: 1,
        signer: {
          type: 'account',
          data: {
            address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
          },
        },
        permission: {
          type: 'non-supported-permission-type',
          data: {
            justification: 'shh...permission 1',
            allowance: '0x1DCD6500',
          },
        },
      },
    ];

    describe('wallet_getRegisteredOnchainPermissionOffers', () => {
      it('Return the default registered permission offers for a snapHost', async () => {
        const { request } = await installSnap({
          options: {
            state: {
              permissionOfferRegistry: {
                [MOCK_PERMISSIONS_PROVIDER_SNAP_ID]: [
                  createMockNativeTrasferRegisteredPermissionOffer(
                    MOCK_PERMISSIONS_PROVIDER_SNAP_ID,
                  ),
                ],
              },
            },
          },
        });

        const response = request({
          method: InternalMethod.WalletGetRegisteredOnchainPermissionOffers,
          origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID,
        });

        expect(await response).toRespondWith([
          createMockNativeTrasferRegisteredPermissionOffer(
            MOCK_PERMISSIONS_PROVIDER_SNAP_ID,
          ),
        ]);
      });
    });

    describe('wallet_offerOnchainPermission', () => {
      it('Return register a permission offer given from a permission provider snap', async () => {
        const { request } = await installSnap({
          options: {
            state: {
              permissionOfferRegistry: {
                [MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO]: [],
              },
            },
          },
        });

        // register the offer
        const registerRes = request({
          method: InternalMethod.WalletOfferOnchainPermission,
          origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
          params: {
            type: 'native-token-transfer',
            id: 'd323523d13f344ed84977a720093e2b5c199565fa872ca9d1fbcfc4317c8ef11',
            proposedName: 'Native Token Transfer',
          },
        });
        expect(await registerRes).toRespondWith(true);

        // check that the offer is registered
        const fetchRes = request({
          method: InternalMethod.WalletGetRegisteredOnchainPermissionOffers,
          origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
        });

        expect(await fetchRes).toRespondWith([
          createMockNativeTrasferRegisteredPermissionOffer(
            MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
          ),
        ]);
      });

      it('Should not store duplicate permission offer given from a permission provider snap', async () => {
        const { request } = await installSnap({
          options: {
            state: {
              permissionOfferRegistry: {
                [MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO]: [
                  createMockNativeTrasferRegisteredPermissionOffer(
                    MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
                  ),
                ],
              },
            },
          },
        });

        // register the duplicate offer
        const registerRes = request({
          method: InternalMethod.WalletOfferOnchainPermission,
          origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
          params: {
            type: 'native-token-transfer',
            id: 'd323523d13f344ed84977a720093e2b5c199565fa872ca9d1fbcfc4317c8ef11',
            proposedName: 'Native Token Transfer',
          },
        });
        expect(await registerRes).toRespondWith(true);

        // check that the no addtional offer was stored on the registry
        const fetchRes = request({
          method: InternalMethod.WalletGetRegisteredOnchainPermissionOffers,
          origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
        });

        expect(await fetchRes).toRespondWith([
          createMockNativeTrasferRegisteredPermissionOffer(
            MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
          ),
        ]);
      });
    });

    describe('wallet_grantPermissions', () => {
      it('Return snap_dialog alert UI rendering the EmptyRegistryPage when the permissions registry is empty', async () => {
        const { request } = await installSnap({
          options: {
            state: {
              permissionOfferRegistry: {},
            },
          },
        });

        const response = request({
          method: InternalMethod.WalletGrantPermissions,
          params: MOCK_PERMISSIONS_REQUEST_SINGLE as Json[],
        });

        const ui = await response.getInterface();
        assertIsAlertDialog(ui);
        expect(ui).toRender(EmptyRegistryPage());

        await ui.ok();

        expect(await response).toRespondWith(null);
      });

      it('Return snap_dialog alert UI rendering the NoOffersFoundPage when dApp request a permision type that has not been offered to the permissions registry by a permissions provider', async () => {
        const { request } = await installSnap({
          options: {
            state: {
              permissionOfferRegistry: {
                [MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO]: [
                  createMockNativeTrasferRegisteredPermissionOffer(
                    MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
                  ),
                ],
              },
            },
          },
        });

        const response = request({
          origin: 'http:localhost:8000',
          method: InternalMethod.WalletGrantPermissions,
          params: MOCK_PERMISSIONS_REQUEST_NON_SUPPORTED as Json[],
        });

        const ui = await response.getInterface();
        assertIsAlertDialog(ui);
        expect(ui).toRender(
          NoOffersFoundPage(
            'http:localhost:8000',
            MOCK_PERMISSIONS_REQUEST_NON_SUPPORTED,
          ),
        );

        await ui.ok();

        expect(await response).toRespondWith(null);
      });
    });

    it('throws an error if the requested method does not exist', async () => {
      const { request } = await installSnap();

      const response = await request({
        method: 'foo',
      });

      expect(response).toRespondWithError({
        code: -32603,
        message: 'Method foo not found.',
        stack: expect.any(String),
      });
    });
  });
});
