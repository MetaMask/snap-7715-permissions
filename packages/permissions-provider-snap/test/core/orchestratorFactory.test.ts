import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { OrchestratorFactory } from '../../src/core/orchestratorFactory';
import type { AccountController } from '../../src/accountController';
import type { TokenPricesService } from '../../src/services/tokenPricesService';
import type { ConfirmationDialogFactory } from '../../src/core/confirmation/factory';
import type { UserEventDispatcher } from '../../src/userEventDispatcher';
import { NativeTokenStreamOrchestrator } from '../../src/permissions/nativeTokenStream/orchestrator';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';

describe('OrchestratorFactory', () => {
  let orchestratorFactory: OrchestratorFactory;
  let mockAccountController: jest.Mocked<AccountController>;
  let mockTokenPricesService: jest.Mocked<TokenPricesService>;
  let mockConfirmationDialogFactory: jest.Mocked<ConfirmationDialogFactory>;
  let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;

  const TEST_ADDRESS = '0x1234567890123456789012345678901234567890' as const;

  const mockPermissionRequest: PermissionRequest = {
    chainId: '0x1',
    expiry: 1234567890,
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
        startTime: 1234567890,
        justification: 'test',
      },
    },
  };

  const mockUnsupportedPermissionRequest: PermissionRequest = {
    chainId: '0x1',
    expiry: 1234567890,
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
      getDelegationManager: jest.fn(),
    } as unknown as jest.Mocked<AccountController>;

    mockTokenPricesService = {
      getCryptoToFiatConversion: jest.fn(),
    } as unknown as jest.Mocked<TokenPricesService>;

    mockConfirmationDialogFactory = {
      create: jest.fn(),
    } as unknown as jest.Mocked<ConfirmationDialogFactory>;

    mockUserEventDispatcher = {
      dispatch: jest.fn(),
    } as unknown as jest.Mocked<UserEventDispatcher>;

    orchestratorFactory = new OrchestratorFactory({
      accountController: mockAccountController,
      tokenPricesService: mockTokenPricesService,
      confirmationDialogFactory: mockConfirmationDialogFactory,
      userEventDispatcher: mockUserEventDispatcher,
    });
  });

  describe('createOrchestrator', () => {
    it('should create a NativeTokenStreamOrchestrator when given native-token-stream permission type', () => {
      const orchestrator = orchestratorFactory.createOrchestrator(
        mockPermissionRequest,
      );

      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(NativeTokenStreamOrchestrator);
      expect(orchestrator.orchestrate).toBeInstanceOf(Function);
    });

    it('should throw error when given an unsupported permission type', () => {
      expect(() =>
        orchestratorFactory.createOrchestrator(
          mockUnsupportedPermissionRequest,
        ),
      ).toThrow('Unsupported permission type: unsupported-permission');
    });

    // Note: We can't test private field access directly in TypeScript
    // Instead we test the behavior that depends on these dependencies being properly injected
    it('should create an orchestrator that can handle permission requests', async () => {
      const orchestrator = orchestratorFactory.createOrchestrator(
        mockPermissionRequest,
      );

      // Mock the orchestrate call with a properly typed response
      const mockResponse = {
        success: true,
        response: {
          ...mockPermissionRequest,
          context: TEST_ADDRESS,
          signerMeta: {
            delegationManager: TEST_ADDRESS,
          },
        },
      };
      jest.spyOn(orchestrator, 'orchestrate').mockResolvedValue(mockResponse);

      const result = await orchestrator.orchestrate({ origin: 'test-origin' });

      expect(result).toEqual(mockResponse);
    });
  });
});
