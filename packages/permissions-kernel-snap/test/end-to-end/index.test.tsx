import { expect } from '@jest/globals';
import type { RequestOptions, SnapRequest } from '@metamask/snaps-jest';
import { installSnap } from '@metamask/snaps-jest';

describe('Kernel Snap', () => {
  describe('onRpcRequest', () => {
    let snapRequest: (request: RequestOptions) => SnapRequest;

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
          message: 'Method foo not found.',
          stack: expect.any(String),
        });
      });

      it('prevents prototype pollution attacks by rejecting prototype method names', async () => {
        // Test various prototype method names that could be used for prototype pollution
        const prototypeMethods = ['toString', 'valueOf', 'constructor', 'hasOwnProperty', '__proto__'];
        
        for (const method of prototypeMethods) {
          const response = await snapRequest({
            method,
          });

          expect(response).toRespondWithError({
            code: -32601,
            message: `Method ${method} not found.`,
            stack: expect.any(String),
          });
        }
      });
    });

    describe('processing lock', () => {
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

      it('should reject a concurrent request, and allow a later one', async () => {
        const requestBody: RequestOptions = {
          method: 'wallet_requestExecutionPermissions',
          params: [
            {
              chainId: '0x1',
              signer: {
                type: 'account',
                data: {
                  address: '0x1234567890123456789012345678901234567890',
                },
              },
              permission: {
                type: 'native-token-transfer',
                isAdjustmentAllowed: true,
                data: {
                  justification: 'Test permission',
                  allowance: '0x1000',
                },
              },
            },
          ],
        };

        // Fire two requests without awaiting the first
        const first = snapRequest(requestBody);
        const second = snapRequest(requestBody);

        // Assert the second one is rejected with the internal error that wraps LimitExceededError
        const secondResponse = await second;
        expect(secondResponse).toRespondWithError({
          code: -32005,
          message: 'Another request is already being processed.',
          stack: expect.any(String),
        });

        // Allow the first to settle (it may error due to test setup, which is fine)
        await first.catch(() => undefined);

        // Make a third request; it must not fail due to the lock
        const thirdResponse = await snapRequest(requestBody);
        expect(thirdResponse).not.toRespondWithError({
          code: -32005,
          message: 'Another request is already being processed.',
          stack: expect.any(String),
        });
      });
    });
  });
});
