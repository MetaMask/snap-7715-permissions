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
  });
});
