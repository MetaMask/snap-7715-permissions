import { expect } from '@jest/globals';
import type { RequestOptions, SnapRequest } from '@metamask/snaps-jest';
import { installSnap } from '@metamask/snaps-jest';

describe('Kernel Snap', () => {
  let snapRequest: (request: RequestOptions) => SnapRequest;
  beforeEach(async () => {
    const { request } = await installSnap({
      options: {
        state: {
          activeInterfaceId: '',
        },
      },
    });

    snapRequest = request;
  });
  describe('onRpcRequest', () => {
    describe('error', () => {
      it('throws an error if the origin of the request is not the kernel snap', async () => {
        const response = await snapRequest({
          method: 'foo',
          origin: 'npm:@metamask/not-kernel',
        });

        expect(response).toRespondWithError({
          code: -32600,
          message: `Origin 'npm:@metamask/not-kernel' is not allowed to call 'foo'`,
          stack: expect.any(String),
        });
      });

      it('throws an error if the origin is not metamask for getGrantedPermissions', async () => {
        const response = await snapRequest({
          method: 'permissionsProvider_getGrantedPermissions',
          origin: 'npm:@metamask/not-metamask',
        });

        expect(response).toRespondWithError({
          code: -32600,
          message: `Origin 'npm:@metamask/not-metamask' is not allowed to call 'permissionsProvider_getGrantedPermissions'`,
          stack: expect.any(String),
        });
      });
    });

    describe('success', () => {
      it('should return empty array when no permissions are granted', async () => {
        const response = await snapRequest({
          method: 'permissionsProvider_getGrantedPermissions',
          origin: 'metamask',
        });

        expect(response).toRespondWith([]);
      });

      it('should accept filtering parameters', async () => {
        const response = await snapRequest({
          method: 'permissionsProvider_getGrantedPermissions',
          origin: 'metamask',
          params: {
            isRevoked: false,
            siteOrigin: 'https://example.com',
          },
        });

        expect(response).toRespondWith([]);
      });
    });
  });
});
