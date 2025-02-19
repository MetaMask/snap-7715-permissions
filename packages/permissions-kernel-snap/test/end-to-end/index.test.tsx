import { expect } from '@jest/globals';
import type { RequestOptions, SnapRequest } from '@metamask/snaps-jest';
import { assertIsAlertDialog, installSnap } from '@metamask/snaps-jest';
import type { Json } from '@metamask/snaps-sdk';

import { InternalMethod } from '../../src/permissions';
import { EmptyRegistryPage, NoOffersFoundPage } from '../../src/ui';
import {
  MOCK_PERMISSIONS_REQUEST_SINGLE,
  MOCK_PERMISSIONS_REQUEST_NON_SUPPORTED,
} from '../constants';

describe('Kernel Snap', () => {
  describe('onRpcRequest', () => {
    const MOCK_PERMISSIONS_PROVIDER_SNAP_ID = 'local:http://localhost:8083';
    const MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO = 'local:http://localhost:8084';
    const createMockNativeTransferRegisteredPermissionOffer = (
      hostId: string,
    ) => ({
      type: 'native-token-transfer',
      hostId,
      hostPermissionId:
        'd323523d13f344ed84977a720093e2b5c199565fa872ca9d1fbcfc4317c8ef11',
      proposedName: 'Native Token Transfer',
    });

    let snapRequest: (request: RequestOptions) => SnapRequest;

    describe('wallet_getRegisteredOnchainPermissionOffers', () => {
      beforeEach(async () => {
        const { request } = await installSnap({
          options: {
            state: {
              permissionOfferRegistry: {
                [MOCK_PERMISSIONS_PROVIDER_SNAP_ID]: [
                  createMockNativeTransferRegisteredPermissionOffer(
                    MOCK_PERMISSIONS_PROVIDER_SNAP_ID,
                  ),
                ],
              },
            },
          },
        });

        snapRequest = request;
      });
      it('returns the default registered permission offers for a snapHost', async () => {
        const response = snapRequest({
          method: InternalMethod.WalletGetRegisteredOnchainPermissionOffers,
          origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID,
        });

        expect(await response).toRespondWith([
          createMockNativeTransferRegisteredPermissionOffer(
            MOCK_PERMISSIONS_PROVIDER_SNAP_ID,
          ),
        ]);
      });
    });

    describe('wallet_offerOnchainPermission', () => {
      beforeEach(async () => {
        const { request } = await installSnap({
          options: {
            state: {
              permissionOfferRegistry: {
                [MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO]: [
                  createMockNativeTransferRegisteredPermissionOffer(
                    MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
                  ),
                ],
              },
            },
          },
        });

        snapRequest = request;
      });

      it('returns the registered permission offers given from a permission provider snap', async () => {
        const fetchRes = snapRequest({
          method: InternalMethod.WalletGetRegisteredOnchainPermissionOffers,
          origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
        });

        expect(await fetchRes).toRespondWith([
          createMockNativeTransferRegisteredPermissionOffer(
            MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
          ),
        ]);
      });

      it('Should not store duplicate permission offer given from a permission provider snap', async () => {
        // register the duplicate offer
        const registerRes = snapRequest({
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
        const fetchRes = snapRequest({
          method: InternalMethod.WalletGetRegisteredOnchainPermissionOffers,
          origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
        });

        expect(await fetchRes).toRespondWith([
          createMockNativeTransferRegisteredPermissionOffer(
            MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
          ),
        ]);
      });
    });

    describe('wallet_grantPermissions', () => {
      beforeEach(async () => {
        const { request } = await installSnap({
          options: {
            state: {
              permissionOfferRegistry: {},
            },
          },
        });

        snapRequest = request;
      });

      it('returns a snap_dialog alert UI rendering the EmptyRegistryPage when the permissions registry is empty', async () => {
        const response = snapRequest({
          method: InternalMethod.WalletGrantPermissions,
          params: MOCK_PERMISSIONS_REQUEST_SINGLE as Json[],
        });

        const ui = await response.getInterface();
        assertIsAlertDialog(ui);
        expect(ui).toRender(EmptyRegistryPage());

        await ui.ok();

        expect(await response).toRespondWith(null);
      });

      it('returns a snap_dialog alert UI rendering the NoOffersFoundPage when dApp request a permission type that has not been offered to the permissions registry by a permissions provider', async () => {
        // add offer to the registry since registry is empty for this test setup
        const registerRes = snapRequest({
          method: InternalMethod.WalletOfferOnchainPermission,
          origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID_TWO,
          params: {
            type: 'native-token-transfer',
            id: 'd323523d13f344ed84977a720093e2b5c199565fa872ca9d1fbcfc4317c8ef11',
            proposedName: 'Native Token Transfer',
          },
        });
        expect(await registerRes).toRespondWith(true);

        const response = snapRequest({
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

    describe('error', () => {
      beforeEach(async () => {
        const { request } = await installSnap({
          options: {
            state: {
              permissionOfferRegistry: {},
            },
          },
        });

        snapRequest = request;
      });

      it('throws an error if the requested method does not exist', async () => {
        const response = await snapRequest({
          method: 'foo',
        });

        expect(response).toRespondWithError({
          code: -32601,
          message: 'The method does not exist / is not available.',
          stack: expect.any(String),
        });
      });
    });
  });
});
