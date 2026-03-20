import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';
import type { Hex } from '@metamask/utils';
import { bytesToHex } from '@metamask/utils';

import type { TokenBalanceAndMetadata } from '../../../src/clients/types';
import type { DialogInterface } from '../../../src/core/dialogInterface';
import { ExistingPermissionsService } from '../../../src/core/existingpermissions/existingPermissionsService';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../../../src/profileSync/profileSync';
import type {
  TokenMetadata,
  TokenMetadataService,
} from '../../../src/services/tokenMetadataService';
import type { UserEventDispatcher } from '../../../src/userEventDispatcher';

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
  let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;
  let mockTokenMetadataService: jest.Mocked<TokenMetadataService>;
  let mockDialogInterface: jest.Mocked<DialogInterface>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock ProfileSyncManager
    mockProfileSyncManager = {
      getAllGrantedPermissions: jest.fn(),
    } as unknown as jest.Mocked<ProfileSyncManager>;

    // Setup mock UserEventDispatcher
    mockUserEventDispatcher = {
      on: jest.fn().mockReturnValue({
        unbind: jest.fn(),
        dispatcher: {} as any,
      }),
    } as unknown as jest.Mocked<UserEventDispatcher>;

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

    // Setup mock DialogInterface
    mockDialogInterface = {
      show: jest.fn(async (_ui: any, _onClose?: () => void) => 'interface-id'),
      interfaceId: 'interface-id',
    } as unknown as jest.Mocked<DialogInterface>;

    // Create service with mocks
    service = new ExistingPermissionsService({
      profileSyncManager: mockProfileSyncManager,
      userEventDispatcher: mockUserEventDispatcher,
      tokenMetadataService: mockTokenMetadataService,
    });
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
    });
  });

  describe('showExistingPermissions()', () => {
    it('should return early if no existing permissions', async () => {
      // Action
      const result = await service.showExistingPermissions({
        dialogInterface: mockDialogInterface,
        existingPermissions: undefined,
      });

      // Assert
      expect(result).toStrictEqual({ wasCancelled: false });
      expect(mockDialogInterface.show).not.toHaveBeenCalled();
    });

    it('should return early if empty permission array', async () => {
      // Action
      const result = await service.showExistingPermissions({
        dialogInterface: mockDialogInterface,
        existingPermissions: [],
      });

      // Assert
      expect(result).toStrictEqual({ wasCancelled: false });
      expect(mockDialogInterface.show).not.toHaveBeenCalled();
    });

    it('should return early if all permissions are invalid', async () => {
      const invalidPermission1 = createMockStoredPermission();
      invalidPermission1.permissionResponse.from = undefined as any;

      const invalidPermission2 = createMockStoredPermission();
      invalidPermission2.permissionResponse.chainId = undefined as any;

      // Action
      const result = await service.showExistingPermissions({
        dialogInterface: mockDialogInterface,
        existingPermissions: [invalidPermission1, invalidPermission2],
      });

      // Assert: returns early without showing dialog
      expect(result).toStrictEqual({ wasCancelled: false });
      expect(mockDialogInterface.show).not.toHaveBeenCalled();
    });

    it('should show content after formatting permissions', async () => {
      const permission = createMockStoredPermission();

      // Mock dialog.show to capture the callback and resolve immediately
      mockDialogInterface.show.mockImplementation(async (_ui, _onClose) => {
        return 'interface-id';
      });

      // Action
      const resultPromise = service.showExistingPermissions({
        dialogInterface: mockDialogInterface,
        existingPermissions: [permission],
      });

      // Allow async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: content should be shown once
      expect(mockDialogInterface.show).toHaveBeenCalledTimes(1);

      // Get the call
      const call = mockDialogInterface.show.mock.calls[0];
      expect(call).toBeDefined();

      // Clean up: trigger dialog close to resolve the promise
      const onCloseCallback = call?.[1];
      onCloseCallback?.();

      await resultPromise;
    });

    it('should call getTokenMetadata when permission has token amount fields', async () => {
      const permission = createMockStoredPermission();
      permission.permissionResponse.permission = {
        type: 'erc20-token-stream',
        data: {
          maxAmount: '0xde0b6b3a7640000' as Hex, // 1 ETH in hex
          startTime: Math.floor(Date.now() / 1000),
        },
        isAdjustmentAllowed: true,
      };

      mockDialogInterface.show.mockResolvedValue('interface-id');

      const resultPromise = service.showExistingPermissions({
        dialogInterface: mockDialogInterface,
        existingPermissions: [permission],
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockTokenMetadataService.getTokenMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: 1,
          account: permission.permissionResponse.from,
        }),
      );

      const onCloseCallback = mockDialogInterface.show.mock.calls[0]?.[1];
      onCloseCallback?.();

      await resultPromise;
    });

    it('should filter out invalid permissions from display', async () => {
      const validPermission = createMockStoredPermission();
      const invalidPermissionNoFrom = { ...createMockStoredPermission() };
      invalidPermissionNoFrom.permissionResponse.from = undefined as any;

      mockDialogInterface.show.mockResolvedValue('interface-id');

      // Action
      const resultPromise = service.showExistingPermissions({
        dialogInterface: mockDialogInterface,
        existingPermissions: [validPermission, invalidPermissionNoFrom],
      });

      // Allow async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: dialog was shown (skeleton + real content attempt)
      expect(mockDialogInterface.show).toHaveBeenCalled();

      // Trigger dialog close
      const onCloseCallback = mockDialogInterface.show.mock.calls[0]?.[1];
      onCloseCallback?.();

      await resultPromise;
    });

    it('should register button handler for user confirmation', async () => {
      const permission = createMockStoredPermission();

      mockDialogInterface.show.mockResolvedValue('interface-id');

      // Action
      const resultPromise = service.showExistingPermissions({
        dialogInterface: mockDialogInterface,
        existingPermissions: [permission],
      });

      // Allow async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert: button handler was registered
      expect(mockUserEventDispatcher.on).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: UserInputEventType.ButtonClickEvent,
        }),
      );

      // Clean up
      const onCloseCallback = mockDialogInterface.show.mock.calls[0]?.[1];
      onCloseCallback?.();

      await resultPromise;
    });

    it('should handle errors gracefully without crashing', async () => {
      const permission = createMockStoredPermission();
      permission.permissionResponse.permission = {
        type: 'erc20-token-stream',
        data: {
          maxAmount: '0xde0b6b3a7640000' as Hex,
          startTime: Math.floor(Date.now() / 1000),
        },
        isAdjustmentAllowed: true,
      };
      mockTokenMetadataService.getTokenMetadata.mockRejectedValue(
        new Error('Token metadata fetch failed'),
      );

      mockDialogInterface.show.mockResolvedValue('interface-id');

      // Action - should not throw when getTokenMetadata fails (dialog stays with skeleton)
      const resultPromise = service.showExistingPermissions({
        dialogInterface: mockDialogInterface,
        existingPermissions: [permission],
      });

      // Allow async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Trigger dialog close
      const onCloseCallback = mockDialogInterface.show.mock.calls[0]?.[1];
      onCloseCallback?.();

      // Assert: should complete without throwing
      const result = await resultPromise;
      expect(result).toStrictEqual(expect.objectContaining({}));
    });
  });
});
