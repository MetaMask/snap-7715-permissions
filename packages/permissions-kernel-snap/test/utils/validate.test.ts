import { expect } from '@jest/globals';

import { parsePermissionRequestParam } from '../../src/utils/validate';
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
  });
});
