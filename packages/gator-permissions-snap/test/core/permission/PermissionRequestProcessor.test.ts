import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';

import type { AccountController } from '../../../src/core/accountController';
import { ConfirmationShellFactory } from '../../../src/core/permission/ConfirmationShellFactory';
import { PermissionRequestProcessor } from '../../../src/core/permission/PermissionRequestProcessor';
import { createPermissionRegistry } from '../../../src/core/permission/registerPermissionModules';
import type { PermissionGrantPipeline } from '../../../src/core/PermissionGrantPipeline';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';
import type { TokenPricesService } from '../../../src/services/tokenPricesService';
import type { UserEventDispatcher } from '../../../src/userEventDispatcher';

describe('PermissionRequestProcessor', () => {
  let permissionRequestProcessor: PermissionRequestProcessor;
  let mockPipeline: jest.Mocked<PermissionGrantPipeline>;
  let mockAccountController: jest.Mocked<AccountController>;
  let mockTokenPricesService: jest.Mocked<TokenPricesService>;
  let mockTokenMetadataService: jest.Mocked<TokenMetadataService>;
  let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;

  const TEST_ADDRESS = '0x1234567890123456789012345678901234567890' as const;

  const mockPermissionRequest: PermissionRequest = {
    chainId: '0x1',
    to: TEST_ADDRESS,
    permission: {
      type: 'native-token-stream',
      isAdjustmentAllowed: false,
      data: {
        amountPerSecond: '0x1',
        startTime: Math.floor(Date.now() / 1000) + 86400,
        justification: 'test',
      },
    },
    rules: [],
  };

  const mockUnsupportedPermissionRequest: PermissionRequest = {
    chainId: '0x1',
    to: TEST_ADDRESS,
    permission: {
      type: 'unsupported-permission',
      isAdjustmentAllowed: false,
      data: {},
    },
    rules: [],
  };

  const mockTokenApprovalRevocationPermissionRequest: PermissionRequest = {
    chainId: '0x1',
    to: TEST_ADDRESS,
    permission: {
      type: 'token-approval-revocation',
      isAdjustmentAllowed: false,
      data: {
        erc20Approve: true,
        erc721Approve: false,
        erc721SetApprovalForAll: false,
        permit2Approve: false,
        permit2Lockdown: false,
        permit2InvalidateNonces: false,
        justification: 'test',
      },
    },
    rules: [],
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
      on: jest.fn(),
      off: jest.fn(),
      createUserInputEventHandler: jest.fn(),
      waitForPendingHandlers: jest.fn(),
    } as unknown as jest.Mocked<UserEventDispatcher>;

    mockPipeline = {
      run: jest.fn(),
    } as unknown as jest.Mocked<PermissionGrantPipeline>;

    const confirmationShellFactory = new ConfirmationShellFactory({
      accountController: mockAccountController,
      userEventDispatcher: mockUserEventDispatcher,
      tokenMetadataService: mockTokenMetadataService,
      tokenPricesService: mockTokenPricesService,
    });

    permissionRequestProcessor = new PermissionRequestProcessor({
      registry: createPermissionRegistry(),
      pipeline: mockPipeline,
      confirmationShellFactory,
      tokenMetadataService: mockTokenMetadataService,
    });
  });

  describe('process', () => {
    it('delegates native-token-stream requests to the grant pipeline', async () => {
      mockPipeline.run.mockResolvedValue({
        approved: true,
        response: {} as never,
      });

      await permissionRequestProcessor.process(
        'https://example.com',
        mockPermissionRequest,
      );

      expect(mockPipeline.run).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: 'https://example.com',
          permissionRequest: mockPermissionRequest,
          lifecycleHandlers: expect.objectContaining({
            parseAndValidatePermission: expect.any(Function),
            buildContext: expect.any(Function),
            deriveMetadata: expect.any(Function),
            createConfirmationContent: expect.any(Function),
            createSkeletonConfirmationContent: expect.any(Function),
            onConfirmationCreated: expect.any(Function),
            onConfirmationResolved: expect.any(Function),
          }),
        }),
      );
    });

    it('processes token-approval-revocation requests', async () => {
      mockPipeline.run.mockResolvedValue({
        approved: true,
        response: {} as never,
      });

      await permissionRequestProcessor.process(
        'https://example.com',
        mockTokenApprovalRevocationPermissionRequest,
      );

      expect(mockPipeline.run).toHaveBeenCalledTimes(1);
    });

    it('processes every registered permission type', async () => {
      const registry = createPermissionRegistry();
      mockPipeline.run.mockResolvedValue({
        approved: true,
        response: {} as never,
      });

      for (const type of registry.getSupportedTypes()) {
        const request: PermissionRequest = {
          ...mockPermissionRequest,
          permission: {
            ...mockPermissionRequest.permission,
            type,
          },
        };

        await permissionRequestProcessor.process(
          'https://example.com',
          request,
        );
      }

      expect(mockPipeline.run).toHaveBeenCalledTimes(
        registry.getSupportedTypes().length,
      );
    });

    it('throws an error when given an unsupported permission type', async () => {
      await expect(
        permissionRequestProcessor.process(
          'https://example.com',
          mockUnsupportedPermissionRequest,
        ),
      ).rejects.toThrow('Unsupported permission type: unsupported-permission');
    });
  });
});
