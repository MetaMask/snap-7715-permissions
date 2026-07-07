import { describe, expect, it, jest } from '@jest/globals';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type { TokenBalanceAndMetadata } from '../../src/clients/types';
import type { AccountController } from '../../src/core/accountController';
import { ExistingPermissionsState } from '../../src/core/existingpermissions/existingPermissionsState';
import { PermissionHandler } from '../../src/core/permissionHandler';
import type { PermissionRequestLifecycleOrchestrator } from '../../src/core/permissionRequestLifecycleOrchestrator';
import type {
  BaseContext,
  DeepRequired,
  LifecycleOrchestrationHandlers,
  PermissionHandlerDependencies,
  RuleDefinition,
} from '../../src/core/types';
import type { TokenMetadataService } from '../../src/services/tokenMetadataService';
import type { TokenPricesService } from '../../src/services/tokenPricesService';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../../src/userEventDispatcher';
import type { MessageKey } from '../../src/utils/i18n';

const mockAddress = '0x1234567890123456789012345678901234567890' as const;
const mockAssetAddress = '0x38c4A4F071d33d6Cf83e2e81F12D9B5D30E611F3' as const;
const mockOrigin = 'https://example.com';
const mockTokenBalanceFiat = '$1000';

type TestRequestType = PermissionRequest;
type TestContextType = BaseContext;
type TestMetadataType = object;
type TestPermissionType = TestRequestType['permission'];
type TestPopulatedPermissionType = DeepRequired<TestPermissionType>;
type TestLifecycleHandlersType = LifecycleOrchestrationHandlers<
  TestRequestType,
  TestContextType,
  TestMetadataType,
  TestPermissionType,
  TestPopulatedPermissionType
>;

const mockPermissionRequest: PermissionRequest = {
  chainId: '0x1',
  to: mockAddress,
  permission: {
    type: 'native-token-stream',
    data: {
      amountPerSecond: '0x1',
      startTime: 1234567890,
      justification: 'test',
    },
    isAdjustmentAllowed: false,
  },
  rules: [],
};

const mockContext: TestContextType = {
  justification:
    'Test justification text that is longer than twenty characters',
  tokenMetadata: {
    symbol: 'ETH',
    decimals: 18,
    iconDataBase64: null,
  },
  accountAddressCaip10: `eip155:1:${mockAddress}`,
  tokenAddressCaip19: `eip155:1/erc20:${mockAssetAddress}`,
  expiry: {
    timestamp: 1234567890,
  },
  isAdjustmentAllowed: false,
};

const mockTokenBalanceAndMetadata: TokenBalanceAndMetadata = {
  balance: 1000000000000000000n,
  symbol: 'ETH',
  decimals: 18,
};
const mockMetadata: TestMetadataType = {};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const setupTest = (options?: { rules?: RuleDefinition<any, any>[] }) => {
  const title = 'permissionRequestTitle' as MessageKey;
  const subtitle = 'permissionRequestSubtitle' as MessageKey;

  const boundEvents = new Map<string, UserEventHandler<UserInputEventType>>();
  const unboundEvents = new Map<string, UserEventHandler<UserInputEventType>>();

  // eslint-disable-next-line prefer-const
  let userEventDispatcher: jest.Mocked<UserEventDispatcher>;
  const bindEvent = ({
    elementName,
    eventType,
    interfaceId,
    handler,
  }: {
    elementName: string;
    eventType: string;
    interfaceId: string;
    handler: UserEventHandler<UserInputEventType>;
  }): { unbind: () => void; dispatcher: jest.Mocked<UserEventDispatcher> } => {
    boundEvents.set(`${elementName}:${eventType}:${interfaceId}`, handler);

    return {
      unbind: (): void => {
        unboundEvents.set(
          `${elementName}:${eventType}:${interfaceId}`,
          handler,
        );
      },
      dispatcher: userEventDispatcher,
    };
  };

  const getBoundEvent = (args: {
    elementName: string;
    eventType: string;
    interfaceId: string;
  }): UserEventHandler<UserInputEventType> | undefined => {
    return boundEvents.get(
      `${args.elementName}:${args.eventType}:${args.interfaceId}`,
    );
  };

  const getUnboundEvent = (args: {
    elementName: string;
    eventType: string;
    interfaceId: string;
  }): UserEventHandler<UserInputEventType> | undefined => {
    return unboundEvents.get(
      `${args.elementName}:${args.eventType}:${args.interfaceId}`,
    );
  };

  const accountController = {
    signDelegation: jest.fn(),
    getAccountAddresses: jest.fn(),
    getAccountUpgradeStatus: jest.fn(),
    upgradeAccount: jest.fn(),
  } as unknown as jest.Mocked<AccountController>;

  accountController.getAccountUpgradeStatus.mockResolvedValue({
    isUpgraded: false,
  });

  userEventDispatcher = {
    on: jest.fn(bindEvent),
    off: jest.fn(),
    createUserInputEventHandler: jest.fn(),
    waitForPendingHandlers: jest.fn(),
  } as unknown as jest.Mocked<UserEventDispatcher>;
  const orchestrator = {
    orchestrate: jest.fn(),
  } as unknown as jest.Mocked<PermissionRequestLifecycleOrchestrator>;
  const permissionRequest = mockPermissionRequest;
  const dependencies = {
    buildContext: jest.fn(),
    createConfirmationContent: jest.fn(),
    parseAndValidatePermission: jest.fn(),
    applyContext: jest.fn(),
    populatePermission: jest.fn(),
    createPermissionCaveats: jest.fn(),
    deriveMetadata: jest.fn(),
  } as jest.Mocked<
    PermissionHandlerDependencies<
      TestRequestType,
      TestContextType,
      TestMetadataType,
      TestPermissionType,
      TestPopulatedPermissionType
    >
  >;
  const tokenPricesService = {
    getCryptoToFiatConversion: jest.fn(async () =>
      Promise.resolve(mockTokenBalanceFiat),
    ),
  } as unknown as jest.Mocked<TokenPricesService>;
  const tokenMetadataService = {
    getTokenBalanceAndMetadata: jest.fn(async () =>
      Promise.resolve(mockTokenBalanceAndMetadata),
    ),
    fetchIconDataAsBase64: jest.fn(),
  } as unknown as jest.Mocked<TokenMetadataService>;
  const rules: RuleDefinition<any, any>[] = options?.rules ?? [];

  const permissionHandlerDependencies = {
    title,
    subtitle,
    accountController,
    userEventDispatcher,
    orchestrator,
    permissionRequest,
    dependencies,
    tokenPricesService,
    tokenMetadataService,
    rules,
  };

  const permissionHandler = new PermissionHandler(
    permissionHandlerDependencies,
  );

  const getLifecycleHandlers = (): TestLifecycleHandlersType => {
    const call = orchestrator.orchestrate.mock.calls[0];
    if (!call) {
      throw new Error('No call found');
    }
    return call[2] as TestLifecycleHandlersType;
  };

  const updateContext =
    jest.fn<(args: { updatedContext: TestContextType }) => Promise<void>>();

  return {
    permissionHandler,
    getLifecycleHandlers,
    updateContext,
    getBoundEvent,
    getUnboundEvent,
    ...permissionHandlerDependencies,
  };
};

describe('PermissionHandler', () => {
  describe('constructor', () => {
    it('creates a PermissionHandler', () => {
      const { permissionHandler } = setupTest();

      expect(permissionHandler).toBeInstanceOf(PermissionHandler);
    });
  });

  describe('handlePermissionRequest', () => {
    it('calls orchestrate on the orchestrator', async () => {
      const { permissionHandler, orchestrator, permissionRequest } =
        setupTest();

      await permissionHandler.handlePermissionRequest(mockOrigin);

      expect(orchestrator.orchestrate).toHaveBeenCalledWith(
        mockOrigin,
        permissionRequest,
        expect.any(Object),
      );
    });

    it('provides the lifecycle handlers to the orchestrator', async () => {
      const { permissionHandler, orchestrator, getLifecycleHandlers } =
        setupTest();

      await permissionHandler.handlePermissionRequest(mockOrigin);

      expect(orchestrator.orchestrate).toHaveBeenCalledTimes(1);

      const lifecycleHandlers = getLifecycleHandlers();

      expect(lifecycleHandlers).toHaveProperty('parseAndValidatePermission');
      expect(lifecycleHandlers).toHaveProperty('applyContext');
      expect(lifecycleHandlers).toHaveProperty('populatePermission');
      expect(lifecycleHandlers).toHaveProperty('createPermissionCaveats');
      expect(lifecycleHandlers).toHaveProperty('deriveMetadata');
      expect(lifecycleHandlers).toHaveProperty('buildContext');
      expect(lifecycleHandlers).toHaveProperty('createConfirmationContent');
      expect(lifecycleHandlers).toHaveProperty(
        'createSkeletonConfirmationContent',
      );
      expect(lifecycleHandlers).toHaveProperty('onConfirmationCreated');
      expect(lifecycleHandlers).toHaveProperty('onConfirmationResolved');

      expect(typeof lifecycleHandlers.parseAndValidatePermission).toBe(
        'function',
      );
      expect(typeof lifecycleHandlers.applyContext).toBe('function');
      expect(typeof lifecycleHandlers.populatePermission).toBe('function');
      expect(typeof lifecycleHandlers.createPermissionCaveats).toBe('function');
      expect(typeof lifecycleHandlers.deriveMetadata).toBe('function');
      expect(typeof lifecycleHandlers.buildContext).toBe('function');
      expect(typeof lifecycleHandlers.createConfirmationContent).toBe(
        'function',
      );
      expect(typeof lifecycleHandlers.createSkeletonConfirmationContent).toBe(
        'function',
      );
      expect(typeof lifecycleHandlers.onConfirmationCreated).toBe('function');
      expect(typeof lifecycleHandlers.onConfirmationResolved).toBe('function');
    });

    it('delegates buildContext to permission dependencies with the resolved request', async () => {
      const {
        permissionHandler,
        getLifecycleHandlers,
        dependencies,
        tokenMetadataService,
      } = setupTest();

      await permissionHandler.handlePermissionRequest(mockOrigin);

      const lifecycleHandlers = getLifecycleHandlers();
      const requestWithFrom = {
        ...mockPermissionRequest,
        from: mockAddress,
      };

      await lifecycleHandlers.buildContext(requestWithFrom);

      expect(dependencies.buildContext).toHaveBeenCalledWith({
        permissionRequest: requestWithFrom,
        tokenMetadataService,
      });
    });

    it('throws error when called multiple times', async () => {
      const { permissionHandler } = setupTest();

      await permissionHandler.handlePermissionRequest(mockOrigin);

      await expect(
        permissionHandler.handlePermissionRequest(mockOrigin),
      ).rejects.toThrow('Permission request already handled');
    });
  });

  describe('lifecycleHandlers', () => {
    it('delegates confirmation shell methods through lifecycle handlers', async () => {
      const { permissionHandler, getLifecycleHandlers, dependencies } =
        setupTest();

      await permissionHandler.handlePermissionRequest(mockOrigin);

      const lifecycleHandlers = getLifecycleHandlers();

      await lifecycleHandlers.createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
        origin: mockOrigin,
        chainId: 1,
        scanDappUrlResult: null,
        scanAddressResult: null,
        existingPermissionsStatus: ExistingPermissionsState.None,
        isGrantDisabled: false,
      });

      expect(dependencies.createConfirmationContent).toHaveBeenCalledWith({
        context: mockContext,
        metadata: mockMetadata,
      });
    });
  });
});
