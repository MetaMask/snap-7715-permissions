import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

import { InternalMethod } from '../src/permissions';
import { TEST_CASE_DEFAULT_STATE, TEST_CASE_SNAP_HOST_ID } from './utils';

describe('onRpcRequest', () => {
  describe('wallet_getRegisteredOnchainPermissionOffers', () => {
    it('Return the default registered permission offers for a snapHost', async () => {
      const { request } = await installSnap();

      const response = request({
        method: InternalMethod.WalletGetRegisteredOnchainPermissionOffers,
        origin: TEST_CASE_SNAP_HOST_ID,
      });

      expect(await response).toRespondWith(
        TEST_CASE_DEFAULT_STATE.permissionOfferRegistry[TEST_CASE_SNAP_HOST_ID],
      );
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
