import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';
import type { Json } from '@metamask/snaps-sdk';

import { InternalMethod } from '../src/permissions';

describe('onRpcRequest', () => {
  const MOCK_PERMISSIONS_PROVIDER_SNAP_ID = 'test:http://localhost:8081';
  const MOCK_NATIVE_TOKEN_TRANSFER_PERMISSION = {
    type: 'native-token-transfer',
    hostId: MOCK_PERMISSIONS_PROVIDER_SNAP_ID,
    hostPermissionId:
      'd323523d13f344ed84977a720093e2b5c199565fa872ca9d1fbcfc4317c8ef11',
    proposedName: 'Native Token Transfer',
  };
  const E2E_TEST_CASE_DEFAULT_STATE: Record<string, Json> = {
    permissionOfferRegistry: {
      [MOCK_PERMISSIONS_PROVIDER_SNAP_ID]: [
        MOCK_NATIVE_TOKEN_TRANSFER_PERMISSION,
      ],
    },
  };

  describe('wallet_getRegisteredOnchainPermissionOffers', () => {
    it('Return the default registered permission offers for a snapHost', async () => {
      const { request } = await installSnap({
        options: {
          state: E2E_TEST_CASE_DEFAULT_STATE,
        },
      });

      const response = request({
        method: InternalMethod.WalletGetRegisteredOnchainPermissionOffers,
        origin: MOCK_PERMISSIONS_PROVIDER_SNAP_ID,
      });

      expect(await response).toRespondWith([
        MOCK_NATIVE_TOKEN_TRANSFER_PERMISSION,
      ]);
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
