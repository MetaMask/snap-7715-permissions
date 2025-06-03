import { expect } from '@jest/globals';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';

import { PERMISSIONS_PROVIDER_SNAP_ID } from '../../src/permissions';
import {
  findRelevantPermissions,
  parsePermissionOfferParam,
  parsePermissionRequestParam,
} from '../../src/utils/validate';
import {
  MOCK_PERMISSIONS_REQUEST_MULTIPLE,
  MOCK_PERMISSIONS_REQUEST_NON_SUPPORTED,
  MOCK_PERMISSIONS_REQUEST_SINGLE,
} from '../constants';

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

  describe('parsePermissionOfferParam', () => {
    it('should return a validated permissions offer as a PermissionOffer object', async () => {
      const mockOffer = {
        type: 'native-token-transfer',
        id: 'd323523d13f344ed84977a720093e2b5c199565fa872ca9d1fbcfc4317c8ef11',
        proposedName: 'Native Token Transfer',
      };
      expect(parsePermissionOfferParam(mockOffer)).toStrictEqual(mockOffer);
    });

    it('throw error if params is not valid PermissionOffer(case missing required hostId)', async () => {
      expect(() =>
        parsePermissionOfferParam({
          type: 'native-token-transfer',
          proposedName: 'Native Token Transfer',
        }),
      ).toThrow('Failed type validation: id: Required');
    });
  });

  describe('extractPermissionName', () => {
    it('should return the permission name when type is a string', () => {
      const permissionType = 'native-token-transfer';
      const result = extractPermissionName(permissionType);
      expect(result).toBe('native-token-transfer');
    });

    it('should return the permission name when type is an object with a name property', () => {
      const permissionType = {
        name: 'identity-read',
        description: 'Read access to user info',
      };
      const result = extractPermissionName(permissionType);
      expect(result).toBe('identity-read');
    });

    it('should return the permission name even if description is optional', () => {
      const permissionType = {
        name: 'identity-read',
        description: 'Read access to user info',
      };
      const result = extractPermissionName(permissionType);
      expect(result).toBe('identity-read');
    });
  });

  describe('findRelevantPermissions', () => {
    it('should return a empty array if no match is found', async () => {
      const mockHostId = 'test:local';
      const allRegisteredOffers = [
        {
          type: 'erc20-token-transfer',
          hostId: mockHostId,
          hostPermissionId: 'mock-id-erc20-token-transfer',
          proposedName: 'ERC20 Token Transfer',
        },
        {
          type: 'native-token-transfer',
          hostId: mockHostId,
          hostPermissionId: 'mock-id-native-token-transfer',
          proposedName: 'Native Token Transfer',
        },
      ];

      const res = findRelevantPermissions(
        allRegisteredOffers,
        MOCK_PERMISSIONS_REQUEST_NON_SUPPORTED,
      );
      expect(res).toStrictEqual([]);
    });

    it('should return the relevant permissions to grant from the permissions provider snap(i.e gator snap)', async () => {
      const mockHostId = 'local:permission-provider-snap';
      const allRegisteredOffers = [
        {
          type: 'identity',
          hostId: mockHostId,
          hostPermissionId: 'mock-id-identity-transfer',
          proposedName: 'Identity Share',
        },
        {
          type: 'erc20-token-transfer',
          hostId: PERMISSIONS_PROVIDER_SNAP_ID,
          hostPermissionId: 'mock-id-erc20-token-transfer',
          proposedName: 'ERC20 Token Transfer',
        },
        {
          type: 'native-token-transfer',
          hostId: PERMISSIONS_PROVIDER_SNAP_ID,
          hostPermissionId: 'mock-id-native-token-transfer',
          proposedName: 'Native Token Transfer',
        },
      ];

      const res = findRelevantPermissions(
        allRegisteredOffers,
        MOCK_PERMISSIONS_REQUEST_NON_SUPPORTED.concat(
          MOCK_PERMISSIONS_REQUEST_MULTIPLE,
        ),
      );
      expect(res).toStrictEqual(MOCK_PERMISSIONS_REQUEST_MULTIPLE);
    });
  });
});
