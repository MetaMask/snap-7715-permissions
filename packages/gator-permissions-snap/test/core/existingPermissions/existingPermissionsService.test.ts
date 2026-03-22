import {
  describe,
  it,
  beforeEach,
  afterEach,
  expect,
  jest,
} from '@jest/globals';
import type { Permission } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/utils';
import { bytesToHex } from '@metamask/utils';

import type { TokenBalanceAndMetadata } from '../../../src/clients/types';
import {
  ExistingPermissionsService,
  ExistingPermissionsState,
} from '../../../src/core/existingpermissions/existingPermissionsService';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../../../src/profileSync/profileSync';
import type {
  TokenMetadata,
  TokenMetadataService,
} from '../../../src/services/tokenMetadataService';

// Helper to generate random addresses
const randomAddress = (): Hex => {
  const randomBytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToHex(randomBytes);
};

// Helper to create a mock StoredGrantedPermission
const createMockStoredPermission = (
  chainId: string = '0x1',
  from: string = randomAddress(),
  siteOrigin: string = 'https://example.com',
  isRevoked: boolean = false,
): StoredGrantedPermission => ({
  permissionResponse: {
    chainId: chainId as Hex,
    from: from as Hex,
    to: randomAddress(),
    context: '0x',
    dependencies: [],
    delegationManager: randomAddress(),
    permission: {
      type: 'test-permission',
      data: { test: true },
      isAdjustmentAllowed: true,
    },
    rules: [],
  },
  siteOrigin,
  revocationMetadata: isRevoked
    ? { txHash: '0x123', recordedAt: Math.floor(Date.now() / 1000) }
    : undefined,
});

describe('ExistingPermissionsService', () => {
  let service: ExistingPermissionsService;
  let mockProfileSyncManager: jest.Mocked<ProfileSyncManager>;
  let mockTokenMetadataService: jest.Mocked<TokenMetadataService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    // Setup mock ProfileSyncManager
    mockProfileSyncManager = {
      getAllGrantedPermissions: jest.fn(),
    } as unknown as jest.Mocked<ProfileSyncManager>;

    // Setup mock TokenMetadataService - formatPermissionWithTokenMetadata uses getTokenMetadata
    const tokenMetadata: TokenMetadata = { decimals: 18, symbol: 'ETH' };
    mockTokenMetadataService = {
      getTokenMetadata: jest
        .fn<() => Promise<TokenMetadata>>()
        .mockResolvedValue(tokenMetadata),
      getTokenBalanceAndMetadata: jest
        .fn<() => Promise<TokenBalanceAndMetadata>>()
        .mockResolvedValue({
          ...tokenMetadata,
          balance: 0n,
        }),
    } as unknown as jest.Mocked<TokenMetadataService>;

    // Create service with mocks
    service = new ExistingPermissionsService({
      profileSyncManager: mockProfileSyncManager,
      tokenMetadataService: mockTokenMetadataService,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getExistingPermissions()', () => {
    it('should return all permissions for origin across all chains', async () => {
      // Setup: permissions on chains A, B, C
      const origin = 'https://example.com';
      const account = randomAddress();
      const permissionA = createMockStoredPermission('0x1', account, origin);
      const permissionB = createMockStoredPermission('0x89', account, origin);
      const permissionC = createMockStoredPermission('0xa4b1', account, origin);
      const otherOriginPermission = createMockStoredPermission(
        '0x1',
        account,
        'https://other.com',
      );

      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue([
        permissionA,
        permissionB,
        permissionC,
        otherOriginPermission,
      ]);

      // Action
      const result = await service.getExistingPermissions(origin);

      // Assert: returns permissions from all chains, not just requested chain
      expect(result).toHaveLength(3);
      expect(result).toContain(permissionA);
      expect(result).toContain(permissionB);
      expect(result).toContain(permissionC);
      expect(result).not.toContain(otherOriginPermission);
    });

    it('should filter out revoked permissions', async () => {
      const origin = 'https://example.com';
      const account = randomAddress();
      const activePermission = createMockStoredPermission(
        '0x1',
        account,
        origin,
        false,
      );
      const revokedPermission = createMockStoredPermission(
        '0x89',
        account,
        origin,
        true,
      );

      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue([
        activePermission,
        revokedPermission,
      ]);

      // Action
      const result = await service.getExistingPermissions(origin);

      // Assert: only active permissions returned
      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual(activePermission);
    });

    it('should return empty array when no matching permissions exist', async () => {
      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue([]);

      // Action
      const result = await service.getExistingPermissions(
        'https://example.com',
      );

      // Assert
      expect(result).toStrictEqual([]);
    });

    it('should handle errors gracefully and return empty array', async () => {
      mockProfileSyncManager.getAllGrantedPermissions.mockRejectedValue(
        new Error('Storage error'),
      );

      // Action
      const result = await service.getExistingPermissions(
        'https://example.com',
      );

      // Assert: returns empty array instead of throwing
      expect(result).toStrictEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'ExistingPermissionsService.getExistingPermissions() failed',
        expect.objectContaining({
          siteOrigin: 'https://example.com',
          error: 'Storage error',
        }),
      );
    });
  });

  describe('getExistingPermissionsStatus()', () => {
    it('should return None when no existing permissions exist', async () => {
      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue([]);

      const requestedPermission: Permission = {
        type: 'erc20-token-stream',
        data: {},
        isAdjustmentAllowed: true,
      };

      const status = await service.getExistingPermissionsStatus(
        'https://example.com',
        requestedPermission,
      );

      expect(status).toBe(ExistingPermissionsState.None);
    });

    it('should return SimilarPermissions when matching categories exist', async () => {
      const permission = createMockStoredPermission();
      permission.permissionResponse.permission = {
        type: 'erc20-token-stream',
        data: {},
        isAdjustmentAllowed: true,
      };

      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue([
        permission,
      ]);

      const requestedPermission: Permission = {
        type: 'native-token-stream',
        data: {},
        isAdjustmentAllowed: true,
      };

      const status = await service.getExistingPermissionsStatus(
        'https://example.com',
        requestedPermission,
      );

      expect(status).toBe(ExistingPermissionsState.SimilarPermissions);
    });

    it('should return DissimilarPermissions when categories do not match', async () => {
      const permission = createMockStoredPermission();
      permission.permissionResponse.permission = {
        type: 'erc20-token-stream',
        data: {},
        isAdjustmentAllowed: true,
      };

      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue([
        permission,
      ]);

      const requestedPermission: Permission = {
        type: 'native-token-periodic',
        data: {},
        isAdjustmentAllowed: true,
      };

      const status = await service.getExistingPermissionsStatus(
        'https://example.com',
        requestedPermission,
      );

      expect(status).toBe(ExistingPermissionsState.DissimilarPermissions);
    });

    it('should not treat types that merely contain "stream" as stream category', async () => {
      const permission = createMockStoredPermission();
      permission.permissionResponse.permission = {
        type: 'custom-streaming-permission',
        data: {},
        isAdjustmentAllowed: true,
      };

      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue([
        permission,
      ]);

      const requestedPermission: Permission = {
        type: 'native-token-stream',
        data: {},
        isAdjustmentAllowed: true,
      };

      const status = await service.getExistingPermissionsStatus(
        'https://example.com',
        requestedPermission,
      );

      expect(status).toBe(ExistingPermissionsState.DissimilarPermissions);
    });

    it('should return None on error', async () => {
      mockProfileSyncManager.getAllGrantedPermissions.mockRejectedValue(
        new Error('Storage error'),
      );

      const requestedPermission: Permission = {
        type: 'erc20-token-stream',
        data: {},
        isAdjustmentAllowed: true,
      };

      const status = await service.getExistingPermissionsStatus(
        'https://example.com',
        requestedPermission,
      );

      expect(status).toBe(ExistingPermissionsState.None);
    });
  });

  describe('createExistingPermissionsContent()', () => {
    it('should format permissions and build content', async () => {
      const permission = createMockStoredPermission();

      const content = await service.createExistingPermissionsContent([
        permission,
      ]);

      expect(content).toBeDefined();
      expect(mockTokenMetadataService.getTokenMetadata).not.toHaveBeenCalled();
    });

    it('should call getTokenMetadata when permission has token amount fields', async () => {
      const from = randomAddress();
      const permission = createMockStoredPermission('0x1', from);
      permission.permissionResponse.permission = {
        type: 'erc20-token-stream',
        data: {
          maxAmount: '0xde0b6b3a7640000',
          tokenAddress: randomAddress(),
          justification: 'test',
        },
        isAdjustmentAllowed: true,
      };

      const content = await service.createExistingPermissionsContent([
        permission,
      ]);

      expect(content).toBeDefined();
      expect(mockTokenMetadataService.getTokenMetadata).toHaveBeenCalled();
    });

    it('should handle empty permission array', async () => {
      const content = await service.createExistingPermissionsContent([]);

      expect(content).toBeDefined();
    });
  });
});
