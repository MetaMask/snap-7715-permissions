import { expect } from '@jest/globals';

import {
  parsePermissionRequestParam,
  parsePermissionsResponseParam,
} from '../../src/utils/validate';
import { MOCK_PERMISSIONS_REQUEST_SINGLE } from '../constants';

describe('validate utils', () => {
  describe('parsePermissionRequestParam', () => {
    it('should return validated permissions as a PermissionsRequest object', async () => {
      expect(
        parsePermissionRequestParam(MOCK_PERMISSIONS_REQUEST_SINGLE),
      ).toStrictEqual(MOCK_PERMISSIONS_REQUEST_SINGLE);
    });

    it('throw error if params is not valid PermissionRequest(case missing required permission object)', async () => {
      expect(() =>
        parsePermissionRequestParam([
          {
            chainId: '0x1',
            expiry: 1,
            signer: {
              type: 'account',
              data: {
                address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
              },
            },
          },
        ]),
      ).toThrow('Failed type validation: 0.permission: Required');
    });

    it('throw error if params is empty', async () => {
      expect(() => parsePermissionRequestParam([])).toThrow('params are empty');
    });

    it('throw error if params is invalid type', async () => {
      expect(() => parsePermissionRequestParam('invalid')).toThrow(
        'Failed type validation',
      );
    });
  });

  describe('parsePermissionsResponseParam', () => {
    it('should return validated permissions as a PermissionsResponse object', async () => {
      const validResponse = [
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
            type: 'eth_signTransaction',
            data: {
              allowed: true,
            },
          },
          context: '0x1234',
          accountMeta: [
            {
              factory: '0x016562aA41A8697720ce0943F003141f5dEAe006',
              factoryData: '0x',
            },
          ],
          signerMeta: {
            delegationManager: '0x016562aA41A8697720ce0943F003141f5dEAe006',
          },
        },
      ];
      expect(parsePermissionsResponseParam(validResponse)).toStrictEqual(
        validResponse,
      );
    });

    it('throw error if params is not valid PermissionsResponse', async () => {
      expect(() =>
        parsePermissionsResponseParam([
          {
            chainId: '0x1',
            // Missing permission object
          },
        ]),
      ).toThrow('Failed type validation');
    });

    it('throw error if params is empty', async () => {
      expect(() => parsePermissionsResponseParam([])).toThrow(
        'params are empty',
      );
    });

    it('throw error if params is invalid type', async () => {
      expect(() => parsePermissionsResponseParam('invalid')).toThrow(
        'Failed type validation',
      );
    });
  });
});
