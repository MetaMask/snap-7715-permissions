import { describe, expect, beforeEach, it } from '@jest/globals';
import { toHex, parseUnits } from 'viem/utils';

import type { AccountController } from '../../../src/accountController';
import type { PermissionRequestLifecycleOrchestrator } from '../../../src/core/permissionRequestLifecycleOrchestrator';
import { TimePeriod } from '../../../src/core/types';
import type { PermissionRequestResult } from '../../../src/core/types';
import type { NativeTokenStreamDependencies } from '../../../src/permissions/nativeTokenStream/handler';
import { NativeTokenStreamHandler } from '../../../src/permissions/nativeTokenStream/handler';
import type {
  NativeTokenStreamPermissionRequest,
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
} from '../../../src/permissions/nativeTokenStream/types';
import type { TokenPricesService } from '../../../src/services/tokenPricesService';
import type { UserEventDispatcher } from '../../../src/userEventDispatcher';
import { convertReadableDateToTimestamp } from '../../../src/utils/time';

const mockPermissionRequest: NativeTokenStreamPermissionRequest = {
  chainId: '0x1',
  expiry: convertReadableDateToTimestamp('05/01/2024'),
  signer: {
    type: 'account',
    data: {
      address: '0x1',
    },
  },
  permission: {
    type: 'native-token-stream',
    data: {
      initialAmount: toHex(parseUnits('1', 18)), // 1 ETH
      maxAmount: toHex(parseUnits('10', 18)), // 10 ETH
      amountPerSecond: toHex(parseUnits('.5', 18)), // 0.5 ETH per second
      startTime: convertReadableDateToTimestamp('05/01/2024'),
      justification: 'test',
    },
    rules: {},
  },
};

const mockContext: NativeTokenStreamContext = {
  expiry: '05/01/2024',
  isAdjustmentAllowed: true,
  accountDetails: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`,
    balance: toHex(parseUnits('10', 18)),
    balanceFormattedAsCurrency: '$🐊10.00',
  },
  permissionDetails: {
    initialAmount: '1',
    maxAmount: '10',
    timePeriod: TimePeriod.WEEKLY,
    startTime: '05/01/2024',
    amountPerPeriod: '302400',
  },
};

const mockMetadata: NativeTokenStreamMetadata = {
  amountPerSecond: '0.5',
  validationErrors: {},
};

// Mock services that are used in the constructor
const mockTokenPricesService: jest.Mocked<TokenPricesService> = {
  getCryptoToFiatConversion: jest.fn().mockResolvedValue('$🐊10.00'),
} as unknown as jest.Mocked<TokenPricesService>;

const mockAccountController: jest.Mocked<AccountController> = {
  getAccountAddress: jest.fn(),
  getAccountBalance: jest.fn(),
  getAccountMetadata: jest.fn(),
  getDelegationManager: jest.fn(),
} as unknown as jest.Mocked<AccountController>;

const mockUserEventDispatcher: jest.Mocked<UserEventDispatcher> = {
  dispatch: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
} as unknown as jest.Mocked<UserEventDispatcher>;

const mockOrchestrator: jest.Mocked<PermissionRequestLifecycleOrchestrator> = {
  orchestrate: jest.fn(),
} as unknown as jest.Mocked<PermissionRequestLifecycleOrchestrator>;

describe('NativeTokenStreamHandler', () => {
  const mockDependencies: jest.Mocked<NativeTokenStreamDependencies> = {
    validateRequest: jest.fn(),
    buildContext: jest.fn(),
    deriveMetadata: jest.fn(),
    createConfirmationContent: jest.fn(),
    applyContext: jest.fn(),
    populatePermission: jest.fn(),
    appendCaveats: jest.fn(),
  };

  let handler: NativeTokenStreamHandler;
  let mockLifecycleHandlers: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDependencies.validateRequest.mockReturnValue(mockPermissionRequest);
    mockDependencies.createConfirmationContent.mockReturnValue({
      content: 'mocked content',
    } as any); // we have to type assert this, as it's really a Snaps jsx component
    mockDependencies.applyContext.mockReturnValue(
      Promise.resolve(mockPermissionRequest),
    );
    mockDependencies.buildContext.mockResolvedValue(mockContext);
    mockDependencies.deriveMetadata.mockResolvedValue(mockMetadata);
    mockDependencies.populatePermission.mockResolvedValue(
      mockPermissionRequest.permission as any,
    );
    mockDependencies.appendCaveats.mockResolvedValue(
      {} as any, // Mock resolved promise of CoreCaveatBuilder
    );
    mockAccountController.getAccountAddress.mockResolvedValue(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    );
    mockAccountController.getAccountBalance.mockResolvedValue(
      toHex(parseUnits('10', 18)),
    );
    mockAccountController.getAccountMetadata.mockResolvedValue({
      factory: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      factoryData: '0x1234567890',
    });
    mockAccountController.getDelegationManager.mockResolvedValue(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    );

    mockOrchestrator.orchestrate.mockResolvedValue({
      approved: true,
      response: {} as any,
    } as PermissionRequestResult);

    // Create a mock for the lifecycle handlers that gets passed to the orchestrator
    mockLifecycleHandlers = {
      validateRequest: jest.fn(),
      buildContext: jest.fn(),
      deriveMetadata: jest.fn(),
      createConfirmationContent: jest.fn(),
      applyContext: jest.fn(),
      populatePermission: jest.fn(),
      appendCaveats: jest.fn(),
      onConfirmationCreated: jest.fn(),
      onConfirmationResolved: jest.fn(),
    };

    // Setup orchestrator mock to capture the handlers
    mockOrchestrator.orchestrate.mockImplementation(
      async (_origin, _request, handlers) => {
        // Store the handlers for later inspection
        mockLifecycleHandlers = handlers;
        return Promise.resolve({
          approved: true,
          response: {} as any,
        } as PermissionRequestResult);
      },
    );

    handler = new NativeTokenStreamHandler(
      {
        accountController: mockAccountController,
        tokenPricesService: mockTokenPricesService,
        userEventDispatcher: mockUserEventDispatcher,
        orchestrator: mockOrchestrator,
        permissionRequest: mockPermissionRequest,
      },
      mockDependencies,
    );
  });

  describe('handlePermissionRequest', () => {
    it('should orchestrate the permission request using the orchestrator', async () => {
      const origin = 'https://example.com';
      await handler.handlePermissionRequest(origin);

      expect(mockOrchestrator.orchestrate).toHaveBeenCalledWith(
        origin,
        mockPermissionRequest,
        expect.any(Object),
      );
    });

    it('should throw error if permission request is handled twice', async () => {
      const origin = 'https://example.com';
      await handler.handlePermissionRequest(origin);

      await expect(handler.handlePermissionRequest(origin)).rejects.toThrow(
        'Permission request already handled',
      );
    });
  });

  describe('lifecycle handlers', () => {
    it('should pass the correct handlers to the orchestrator', async () => {
      const origin = 'https://example.com';
      await handler.handlePermissionRequest(origin);

      // Verify all required handlers are present
      expect(mockLifecycleHandlers).toHaveProperty('validateRequest');
      expect(mockLifecycleHandlers).toHaveProperty('buildContext');
      expect(mockLifecycleHandlers).toHaveProperty('deriveMetadata');
      expect(mockLifecycleHandlers).toHaveProperty('createConfirmationContent');
      expect(mockLifecycleHandlers).toHaveProperty('applyContext');
      expect(mockLifecycleHandlers).toHaveProperty('populatePermission');
      expect(mockLifecycleHandlers).toHaveProperty('appendCaveats');
      expect(mockLifecycleHandlers).toHaveProperty('onConfirmationCreated');
      expect(mockLifecycleHandlers).toHaveProperty('onConfirmationResolved');
    });

    it('should use the buildContext handler with services', async () => {
      const origin = 'https://example.com';
      await handler.handlePermissionRequest(origin);

      // Call the buildContext handler directly
      await mockLifecycleHandlers.buildContext(mockPermissionRequest);

      expect(mockDependencies.buildContext).toHaveBeenCalledWith({
        permissionRequest: mockPermissionRequest,
        tokenPricesService: mockTokenPricesService,
        accountController: mockAccountController,
      });
    });

    it('should use the createConfirmationContent handler with UI state', async () => {
      const origin = 'https://example.com';
      await handler.handlePermissionRequest(origin);

      const args = {
        context: mockContext,
        metadata: mockMetadata,
        origin: 'https://example.com',
        chainId: 1,
      };

      await mockLifecycleHandlers.createConfirmationContent(args);

      expect(mockDependencies.createConfirmationContent).toHaveBeenCalledWith({
        ...args,
        isJustificationCollapsed: true,
        showAddMoreRulesButton: false,
      });
    });

    it('should register event handlers in onConfirmationCreated', async () => {
      const origin = 'https://example.com';
      await handler.handlePermissionRequest(origin);

      const updateContext = jest.fn();

      // Call the onConfirmationCreated handler directly
      mockLifecycleHandlers.onConfirmationCreated({
        interfaceId: 'test-interface',
        initialContext: mockContext,
        updateContext,
      });

      // Verify user event handlers are registered
      expect(mockUserEventDispatcher.on).toHaveBeenCalled();
    });

    it('should deregister event handlers in onConfirmationResolved', async () => {
      const origin = 'https://example.com';
      await handler.handlePermissionRequest(origin);

      const updateContext = jest.fn();

      // First register handlers
      mockLifecycleHandlers.onConfirmationCreated({
        interfaceId: 'test-interface',
        initialContext: mockContext,
        updateContext,
      });

      // Then resolve and check they're deregistered
      mockLifecycleHandlers.onConfirmationResolved();

      expect(mockUserEventDispatcher.off).toHaveBeenCalled();
    });
  });
});
