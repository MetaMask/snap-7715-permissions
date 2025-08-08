import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';

import type { AccountController } from '../../src/accountController';
import { PermissionHandler } from '../../src/core/permissionHandler';
import { PermissionHandlerFactory } from '../../src/core/permissionHandlerFactory';
import type { PermissionRequestLifecycleOrchestrator } from '../../src/core/permissionRequestLifecycleOrchestrator';
import type { TokenMetadataService } from '../../src/services/tokenMetadataService';
import type { TokenPricesService } from '../../src/services/tokenPricesService';
import type { UserEventDispatcher } from '../../src/userEventDispatcher';

describe('PermissionHandlerFactory', () => {
  let permissionHandlerFactory: PermissionHandlerFactory;
  let mockAccountController: jest.Mocked<AccountController>;
  let mockTokenPricesService: jest.Mocked<TokenPricesService>;
  let mockTokenMetadataService: jest.Mocked<TokenMetadataService>;
  let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;
  let mockOrchestrator: jest.Mocked<PermissionRequestLifecycleOrchestrator>;

  const TEST_ADDRESS = '0x1234567890123456789012345678901234567890' as const;

  const mockPermissionRequest: PermissionRequest = {
    chainId: '0x1',
    expiry: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    signer: {
      type: 'account',
      data: {
        address: TEST_ADDRESS,
      },
    },
    permission: {
      type: 'native-token-stream',
      data: {
        amountPerSecond: '0x1',
        startTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        justification: 'test',
      },
    },
  };

  const mockUnsupportedPermissionRequest: PermissionRequest = {
    chainId: '0x1',
    expiry: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    signer: {
      type: 'account',
      data: {
        address: TEST_ADDRESS,
      },
    },
    permission: {
      type: 'unsupported-permission',
      data: {},
    },
  };

  beforeEach(() => {
    mockAccountController = {
      getAccountAddress: jest.fn(),
      getAccountBalance: jest.fn(),
      getAccountMetadata: jest.fn(),
    } as unknown as jest.Mocked<AccountController>;

    mockTokenPricesService = {
      getCryptoToFiatConversion: jest.fn(),
    } as unknown as jest.Mocked<TokenPricesService>;

    mockTokenMetadataService = {
      getTokenBalanceAndMetadata: jest.fn(),
    } as unknown as jest.Mocked<TokenMetadataService>;

    mockUserEventDispatcher = {
      dispatch: jest.fn(),
    } as unknown as jest.Mocked<UserEventDispatcher>;

    mockOrchestrator = {
      registerHandler: jest.fn(),
    } as unknown as jest.Mocked<PermissionRequestLifecycleOrchestrator>;

    permissionHandlerFactory = new PermissionHandlerFactory({
      accountController: mockAccountController,
      tokenPricesService: mockTokenPricesService,
      tokenMetadataService: mockTokenMetadataService,
      userEventDispatcher: mockUserEventDispatcher,
      orchestrator: mockOrchestrator,
    });
  });

  describe('createPermissionHandler', () => {
    it('should create a PermissionHandler when given native-token-stream permission type', () => {
      const handler = permissionHandlerFactory.createPermissionHandler(
        mockPermissionRequest,
      );

      expect(handler).toBeDefined();
      expect(handler).toBeInstanceOf(PermissionHandler);
    });

    it('should throw an error when given an unsupported permission type', () => {
      expect(() =>
        permissionHandlerFactory.createPermissionHandler(
          mockUnsupportedPermissionRequest,
        ),
      ).toThrow('Unsupported permission type: unsupported-permission');
    });
  });
});
