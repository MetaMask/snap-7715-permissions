import { describe, expect, beforeEach, it } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { toHex, parseUnits } from 'viem/utils';

import type { AccountController } from '../../../src/accountController';
import type { ConfirmationDialogFactory } from '../../../src/core/confirmationFactory';
import { TimePeriod } from '../../../src/core/types';
import type { NativeTokenStreamDependencies } from '../../../src/permissions/nativeTokenStream/orchestrator';
import { NativeTokenStreamOrchestrator } from '../../../src/permissions/nativeTokenStream/orchestrator';
import type {
  NativeTokenStreamPermissionRequest,
  NativeTokenStreamContext,
  PopulatedNativeTokenStreamPermission,
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
  rulesToAdd: [],
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

const mockConfirmationDialogFactory: jest.Mocked<ConfirmationDialogFactory> = {
  create: jest.fn(),
} as unknown as jest.Mocked<ConfirmationDialogFactory>;

const mockUserEventDispatcher: jest.Mocked<UserEventDispatcher> = {
  dispatch: jest.fn(),
} as unknown as jest.Mocked<UserEventDispatcher>;

describe('NativeTokenStreamOrchestrator', () => {
  const mockDependencies: jest.Mocked<NativeTokenStreamDependencies> = {
    parseAndValidatePermission: jest.fn(),
    createConfirmationContent: jest.fn(),
    contextToPermissionRequest: jest.fn(),
    permissionRequestToContext: jest.fn(),
    createContextMetadata: jest.fn(),
    populatePermission: jest.fn(),
    appendCaveats: jest.fn(),
  };

  let orchestrator: NativeTokenStreamOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDependencies.parseAndValidatePermission.mockReturnValue(
      mockPermissionRequest,
    );
    mockDependencies.createConfirmationContent.mockReturnValue({
      content: 'mocked content',
    } as any); // we have to type assert this, as it's really a Snaps jsx component
    mockDependencies.contextToPermissionRequest.mockReturnValue(
      mockPermissionRequest,
    );
    mockDependencies.permissionRequestToContext.mockResolvedValue(mockContext);
    mockDependencies.createContextMetadata.mockResolvedValue(mockMetadata);
    mockDependencies.populatePermission.mockReturnValue(
      mockPermissionRequest.permission as any,
    );
    mockDependencies.appendCaveats.mockImplementation(
      (args) => args.caveatBuilder,
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

    orchestrator = new NativeTokenStreamOrchestrator(
      {
        permissionRequest: mockPermissionRequest,
        accountController: mockAccountController,
        tokenPricesService: mockTokenPricesService,
        confirmationDialogFactory: mockConfirmationDialogFactory,
        userEventDispatcher: mockUserEventDispatcher,
      },
      mockDependencies,
    );
  });

  describe('constructor', () => {
    it('should validate the permission request using the provided validator', () => {
      expect(mockDependencies.parseAndValidatePermission).toHaveBeenCalledWith(
        mockPermissionRequest,
      );
    });
  });

  describe('stateChangeHandlers', () => {
    it('should return all required handlers', () => {
      const handlers = orchestrator.stateChangeHandlers;
      expect(handlers).toHaveLength(1);
      if (handlers[0] === undefined) {
        throw new Error('No handlers found');
      }

      const { elementName, eventType, contextMapper } = handlers[0];

      expect(elementName).toBe('justification-show-more');
      expect(eventType).toBe(UserInputEventType.ButtonClickEvent);
      expect(contextMapper).toBeDefined();
    });
  });

  describe('createUiContent', () => {
    it('should use the provided content creator', async () => {
      await orchestrator.createUiContent({
        context: mockContext,
        metadata: mockMetadata,
        origin: 'https://example.com',
        chainId: 1,
        showAddMoreRulesButton: false,
      });

      expect(mockDependencies.createConfirmationContent).toHaveBeenCalledWith({
        context: mockContext,
        metadata: mockMetadata,
        origin: 'https://example.com',
        chainId: 1,
        isJustificationCollapsed: true,
        showAddMoreRulesButton: false,
      });
    });
  });

  describe('createContextMetadata', () => {
    it('should use the provided metadata creator', async () => {
      await orchestrator.createContextMetadata(mockContext);

      expect(mockDependencies.createContextMetadata).toHaveBeenCalledWith({
        context: mockContext,
      });
    });
  });

  describe('buildPermissionContext', () => {
    it('should use the provided context builder with services', async () => {
      await orchestrator.buildPermissionContext({
        permissionRequest: mockPermissionRequest,
      });

      expect(mockDependencies.permissionRequestToContext).toHaveBeenCalledWith({
        permissionRequest: mockPermissionRequest,
        tokenPricesService: mockTokenPricesService,
        accountController: mockAccountController,
      });
    });
  });

  describe('resolvePermissionRequest', () => {
    it('should use the provided request resolver', async () => {
      const args = {
        context: mockContext,
        originalRequest: mockPermissionRequest,
      };

      await (orchestrator as any).resolvePermissionRequest(args);

      expect(mockDependencies.contextToPermissionRequest).toHaveBeenCalledWith(
        args,
      );
    });
  });

  describe('populatePermission', () => {
    it('should use the provided permission populator', async () => {
      const { permission } = mockPermissionRequest;
      await (orchestrator as any).populatePermission({ permission });

      expect(mockDependencies.populatePermission).toHaveBeenCalledWith({
        permission,
      });
    });
  });

  describe('appendCaveats', () => {
    it('should use the provided caveat appender', async () => {
      const permission =
        mockPermissionRequest.permission as PopulatedNativeTokenStreamPermission;
      const mockCaveatBuilder = { addCaveat: jest.fn().mockReturnThis() };

      await (orchestrator as any).appendCaveats(permission, mockCaveatBuilder);

      expect(mockDependencies.appendCaveats).toHaveBeenCalledWith({
        permission,
        caveatBuilder: mockCaveatBuilder,
      });
    });
  });
});
