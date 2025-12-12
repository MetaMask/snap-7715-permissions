import { describe, expect, it, jest } from '@jest/globals';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { UserInputEventType } from '@metamask/snaps-sdk';
import type { TokenBalanceAndMetadata } from 'src/clients/types';

import type { AccountController } from '../../src/core/accountController';
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

const mockAddress = '0x1234567890123456789012345678901234567890' as const;
const mockAddress2 = '0x1234567890123456789012345678901234567891' as const;
const mockAssetAddress = '0x38c4A4F071d33d6Cf83e2e81F12D9B5D30E611F3' as const;
const mockInterfaceId = 'test-interface-id';
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
  signer: {
    type: 'account',
    data: {
      address: mockAddress,
    },
  },
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
    isAdjustmentAllowed: true,
  },
  isAdjustmentAllowed: false,
};

const mockTokenBalanceAndMetadata: TokenBalanceAndMetadata = {
  balance: 1000000000000000000n,
  symbol: 'ETH',
  decimals: 18,
};
const mockMetadata: TestMetadataType = {};

const setupTest = () => {
  const title = 'Test permission';
  const subtitle = 'This site wants a test permission.';

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
  }) => {
    boundEvents.set(`${elementName}:${eventType}:${interfaceId}`, handler);

    return {
      unbind: () => {
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
  }) => {
    return boundEvents.get(
      `${args.elementName}:${args.eventType}:${args.interfaceId}`,
    );
  };

  const getUnboundEvent = (args: {
    elementName: string;
    eventType: string;
    interfaceId: string;
  }) => {
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
  const rules: RuleDefinition<any, any>[] = [];

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

  const getLifecycleHandlers = () => {
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

    it('resolves the address if one is not provided', async () => {
      const {
        permissionHandler,
        accountController,
        getLifecycleHandlers,
        dependencies,
        tokenMetadataService,
      } = setupTest();

      accountController.getAccountAddresses.mockResolvedValue([
        mockAddress,
        mockAddress2,
      ]);

      await permissionHandler.handlePermissionRequest(mockOrigin);

      const lifecycleHandlers = getLifecycleHandlers();

      await lifecycleHandlers.buildContext({
        ...mockPermissionRequest,
        // it's already undefined, but we make sure here
        address: undefined,
      });

      expect(accountController.getAccountAddresses).toHaveBeenCalledTimes(1);

      const permissionRequestWithResolvedAddress = {
        ...mockPermissionRequest,
        address: mockAddress,
      };

      expect(dependencies.buildContext).toHaveBeenCalledWith({
        permissionRequest: permissionRequestWithResolvedAddress,
        tokenMetadataService,
      });
    });

    it.each([mockAddress, mockAddress2])(
      'accepts the address if one is provided',
      async (specifiedAddress) => {
        const {
          permissionHandler,
          accountController,
          getLifecycleHandlers,
          dependencies,
          tokenMetadataService,
        } = setupTest();

        accountController.getAccountAddresses.mockResolvedValue([
          mockAddress,
          mockAddress2,
        ]);

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        await lifecycleHandlers.buildContext({
          ...mockPermissionRequest,
          address: specifiedAddress,
        });

        expect(accountController.getAccountAddresses).toHaveBeenCalledTimes(1);

        const permissionRequestWithResolvedAddress = {
          ...mockPermissionRequest,
          address: specifiedAddress,
        };

        expect(dependencies.buildContext).toHaveBeenCalledWith({
          permissionRequest: permissionRequestWithResolvedAddress,
          tokenMetadataService,
        });
      },
    );

    it('rejects the address if it is not one of the addresses available for the account', async () => {
      const { permissionHandler, accountController, getLifecycleHandlers } =
        setupTest();

      accountController.getAccountAddresses.mockResolvedValue([
        mockAddress,
        mockAddress2,
      ]);

      await permissionHandler.handlePermissionRequest(mockOrigin);

      const lifecycleHandlers = getLifecycleHandlers();

      await expect(
        lifecycleHandlers.buildContext({
          ...mockPermissionRequest,
          address: '0x9876543210987654321098765432109876543210',
        }),
      ).rejects.toThrow('Requested address not found');

      expect(accountController.getAccountAddresses).toHaveBeenCalledTimes(1);
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
    describe('createConfirmationContent', () => {
      it('calls createConfirmationContent to produce the permission specific content', async () => {
        const { permissionHandler, getLifecycleHandlers, dependencies } =
          setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        await lifecycleHandlers.createConfirmationContent({
          context: mockContext,
          metadata: mockMetadata,
          origin: mockOrigin,
          chainId: 1,
        });

        expect(dependencies.createConfirmationContent).toHaveBeenCalledWith({
          context: mockContext,
          metadata: mockMetadata,
        });
      });

      it('creates a PermissionHandlerContent', async () => {
        const { permissionHandler, getLifecycleHandlers } = setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        const result = await lifecycleHandlers.createConfirmationContent({
          context: mockContext,
          metadata: mockMetadata,
          origin: mockOrigin,
          chainId: 1,
        });

        expect(result).toBeDefined();
        expect(result.type).toBe('Box');
      });
    });

    describe('onConfirmationCreated', () => {
      it('registers event handlers for account selection and justification toggle', async () => {
        const {
          permissionHandler,
          getLifecycleHandlers,
          getBoundEvent,
          updateContext,
        } = setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        lifecycleHandlers.onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: true,
        });

        const accountSelectorBoundEvent = getBoundEvent({
          elementName: 'account-selector',
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        const showMoreButtonBoundEvent = getBoundEvent({
          elementName: 'show-more-justification',
          eventType: 'ButtonClickEvent',
          interfaceId: mockInterfaceId,
        });

        expect(accountSelectorBoundEvent).toBeDefined();
        expect(showMoreButtonBoundEvent).toBeDefined();
      });

      it('loads the balance for the selected account', async () => {
        const {
          permissionHandler,
          getLifecycleHandlers,
          tokenMetadataService,
          updateContext,
        } = setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        lifecycleHandlers.onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: true,
        });

        expect(
          tokenMetadataService.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: mockAssetAddress,
        });
      });

      it('updates the context when the account is changed', async () => {
        const {
          permissionHandler,
          getLifecycleHandlers,
          getBoundEvent,
          updateContext,
        } = setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        lifecycleHandlers.onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: true,
        });

        const accountSelectorChangeHandler = getBoundEvent({
          elementName: 'account-selector',
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        expect(accountSelectorChangeHandler).toBeDefined();

        const mockAddress2Caip10 = `eip155:1:${mockAddress2}`;

        await accountSelectorChangeHandler?.({
          event: {
            value: { addresses: [mockAddress2Caip10] } as any,
            name: 'account-selector',
            type: UserInputEventType.InputChangeEvent,
          },
          interfaceId: mockInterfaceId,
        });

        const expectedUpdatedContext = {
          ...mockContext,
          accountAddressCaip10: mockAddress2Caip10,
        };

        expect(updateContext).toHaveBeenCalledWith({
          updatedContext: expectedUpdatedContext,
        });
      });

      it('updates the balance when the account is changed', async () => {
        const {
          permissionHandler,
          getLifecycleHandlers,
          getBoundEvent,
          tokenMetadataService,
          updateContext,
        } = setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        lifecycleHandlers.onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: true,
        });

        const accountSelectorChangeHandler = getBoundEvent({
          elementName: 'account-selector',
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        expect(accountSelectorChangeHandler).toBeDefined();

        const mockAddress2Caip10 = `eip155:1:${mockAddress2}`;

        await accountSelectorChangeHandler?.({
          event: {
            value: { addresses: [mockAddress2Caip10] } as any,
            name: 'account-selector',
            type: UserInputEventType.InputChangeEvent,
          },
          interfaceId: mockInterfaceId,
        });

        expect(
          tokenMetadataService.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(2);

        expect(
          tokenMetadataService.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress2,
          assetAddress: mockAssetAddress,
        });
      });

      it('renders the balance in the confirmation content', async () => {
        const { permissionHandler, getLifecycleHandlers, updateContext } =
          setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        lifecycleHandlers.onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: true,
        });

        const confirmationContent =
          await lifecycleHandlers.createConfirmationContent({
            context: mockContext,
            metadata: mockMetadata,
            origin: mockOrigin,
            chainId: 1,
          });
        expect(confirmationContent).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": [
                {
                  "key": null,
                  "props": {
                    "children": "Test permission",
                    "size": "lg",
                  },
                  "type": "Heading",
                },
                {
                  "key": null,
                  "props": {
                    "children": "This site wants a test permission.",
                  },
                  "type": "Text",
                },
              ],
            },
            "type": "Box",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "alignment": "space-between",
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Account",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "color": "muted",
                                      "name": "question",
                                      "size": "inherit",
                                    },
                                    "type": "Icon",
                                  },
                                  "content": {
                                    "key": null,
                                    "props": {
                                      "children": "The account from which the permission is being granted.",
                                    },
                                    "type": "Text",
                                  },
                                },
                                "type": "Tooltip",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "chainIds": [
                          "eip155:1",
                        ],
                        "name": "account-selector",
                        "switchGlobalAccount": false,
                        "value": "eip155:1:0x1234567890123456789012345678901234567890",
                      },
                      "type": "AccountSelector",
                    },
                    false,
                    {
                      "key": null,
                      "props": {
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {},
                            "type": "Skeleton",
                          },
                          {
                            "key": null,
                            "props": {},
                            "type": "Skeleton",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "alignment": "space-between",
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "Reason",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": {
                                "key": null,
                                "props": {
                                  "color": "muted",
                                  "name": "question",
                                  "size": "inherit",
                                },
                                "type": "Icon",
                              },
                              "content": {
                                "key": null,
                                "props": {
                                  "children": "Reason given by the recipient for requesting this permission.",
                                },
                                "type": "Text",
                              },
                            },
                            "type": "Tooltip",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Test justificatio...",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "alignment": "end",
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "children": "Show",
                                      "name": "show-more-justification",
                                    },
                                    "type": "Button",
                                  },
                                  "direction": "horizontal",
                                },
                                "type": "Box",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "horizontal",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": [
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Recipient",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The site requesting the permission",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "https://example.com",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Network",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The network on which the permission is being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "Ethereum Mainnet",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Token",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The token being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "children": "ETH",
                                    "href": "https://etherscan.io/address/0x38c4A4F071d33d6Cf83e2e81F12D9B5D30E611F3",
                                  },
                                  "type": "Link",
                                },
                                "content": "0x38c4A...611F3",
                              },
                              "type": "Tooltip",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
          undefined,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
      });

      it('updates the balance in the confirmation content when the account is changed', async () => {
        const {
          permissionHandler,
          getLifecycleHandlers,
          getBoundEvent,
          tokenPricesService,
          updateContext,
        } = setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        lifecycleHandlers.onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: true,
        });

        const accountSelectorChangeHandler = getBoundEvent({
          elementName: 'account-selector',
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        expect(accountSelectorChangeHandler).toBeDefined();

        const mockAddress2Caip10 = `eip155:1:${mockAddress2}`;

        tokenPricesService.getCryptoToFiatConversion.mockResolvedValue('$2000');

        await accountSelectorChangeHandler?.({
          event: {
            value: { addresses: [mockAddress2Caip10] } as any,
            name: 'account-selector',
            type: UserInputEventType.InputChangeEvent,
          },
          interfaceId: mockInterfaceId,
        });

        const confirmationContent =
          await lifecycleHandlers.createConfirmationContent({
            context: mockContext,
            metadata: mockMetadata,
            origin: mockOrigin,
            chainId: 1,
          });

        expect(confirmationContent).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": [
                {
                  "key": null,
                  "props": {
                    "children": "Test permission",
                    "size": "lg",
                  },
                  "type": "Heading",
                },
                {
                  "key": null,
                  "props": {
                    "children": "This site wants a test permission.",
                  },
                  "type": "Text",
                },
              ],
            },
            "type": "Box",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "alignment": "space-between",
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Account",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "color": "muted",
                                      "name": "question",
                                      "size": "inherit",
                                    },
                                    "type": "Icon",
                                  },
                                  "content": {
                                    "key": null,
                                    "props": {
                                      "children": "The account from which the permission is being granted.",
                                    },
                                    "type": "Text",
                                  },
                                },
                                "type": "Tooltip",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "chainIds": [
                          "eip155:1",
                        ],
                        "name": "account-selector",
                        "switchGlobalAccount": false,
                        "value": "eip155:1:0x1234567890123456789012345678901234567890",
                      },
                      "type": "AccountSelector",
                    },
                    {
                      "key": null,
                      "props": {
                        "children": "This account will be upgraded to a smart account to complete this permission.",
                        "color": "warning",
                        "size": "sm",
                      },
                      "type": "Text",
                    },
                    {
                      "key": null,
                      "props": {
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {},
                            "type": "Skeleton",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "1",
                                " available",
                              ],
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "alignment": "space-between",
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "Reason",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": {
                                "key": null,
                                "props": {
                                  "color": "muted",
                                  "name": "question",
                                  "size": "inherit",
                                },
                                "type": "Icon",
                              },
                              "content": {
                                "key": null,
                                "props": {
                                  "children": "Reason given by the recipient for requesting this permission.",
                                },
                                "type": "Text",
                              },
                            },
                            "type": "Tooltip",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Test justificatio...",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "alignment": "end",
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "children": "Show",
                                      "name": "show-more-justification",
                                    },
                                    "type": "Button",
                                  },
                                  "direction": "horizontal",
                                },
                                "type": "Box",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "horizontal",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": [
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Recipient",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The site requesting the permission",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "https://example.com",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Network",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The network on which the permission is being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "Ethereum Mainnet",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Token",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The token being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "children": "ETH",
                                    "href": "https://etherscan.io/address/0x38c4A4F071d33d6Cf83e2e81F12D9B5D30E611F3",
                                  },
                                  "type": "Link",
                                },
                                "content": "0x38c4A...611F3",
                              },
                              "type": "Tooltip",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
          undefined,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
      });

      it('renders skeletons while the balance is loading', async () => {
        const {
          permissionHandler,
          getLifecycleHandlers,
          getBoundEvent,
          tokenMetadataService,
          tokenPricesService,
          updateContext,
        } = setupTest();

        let resolveTokenBalancePromise: () => void = () => {
          throw new Error('Function should never be called');
        };
        const tokenBalancePromise = new Promise<TokenBalanceAndMetadata>(
          (resolve) => {
            resolveTokenBalancePromise = () =>
              resolve(mockTokenBalanceAndMetadata);
          },
        );

        tokenMetadataService.getTokenBalanceAndMetadata.mockReturnValue(
          tokenBalancePromise,
        );

        let resolveFiatBalancePromise: () => void = () => {
          throw new Error('Function should never be called');
        };
        const fiatBalancePromise = new Promise<string>((resolve) => {
          resolveFiatBalancePromise = () => resolve(mockTokenBalanceFiat);
        });
        tokenPricesService.getCryptoToFiatConversion.mockReturnValue(
          fiatBalancePromise,
        );

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        lifecycleHandlers.onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: true,
        });

        const accountSelectorChangeHandler = getBoundEvent({
          elementName: 'account-selector',
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        expect(accountSelectorChangeHandler).toBeDefined();

        const mockAddress2Caip10 = `eip155:1:${mockAddress2}`;

        await accountSelectorChangeHandler?.({
          event: {
            value: { addresses: [mockAddress2Caip10] } as any,
            name: 'account-selector',
            type: UserInputEventType.InputChangeEvent,
          },
          interfaceId: mockInterfaceId,
        });

        // called twice:
        // 1. with the context updated to include the new account address
        // 2. after the account upgrade status is fetched for the new account
        expect(updateContext).toHaveBeenCalledTimes(2);
        expect(updateContext).toHaveBeenCalledWith({
          updatedContext: {
            ...mockContext,
            accountAddressCaip10: mockAddress2Caip10,
          },
        });

        const confirmationContent =
          await lifecycleHandlers.createConfirmationContent({
            context: mockContext,
            metadata: mockMetadata,
            origin: mockOrigin,
            chainId: 1,
          });

        // skeletons in place of both the token balance and fiat balance
        expect(confirmationContent).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": [
                {
                  "key": null,
                  "props": {
                    "children": "Test permission",
                    "size": "lg",
                  },
                  "type": "Heading",
                },
                {
                  "key": null,
                  "props": {
                    "children": "This site wants a test permission.",
                  },
                  "type": "Text",
                },
              ],
            },
            "type": "Box",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "alignment": "space-between",
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Account",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "color": "muted",
                                      "name": "question",
                                      "size": "inherit",
                                    },
                                    "type": "Icon",
                                  },
                                  "content": {
                                    "key": null,
                                    "props": {
                                      "children": "The account from which the permission is being granted.",
                                    },
                                    "type": "Text",
                                  },
                                },
                                "type": "Tooltip",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "chainIds": [
                          "eip155:1",
                        ],
                        "name": "account-selector",
                        "switchGlobalAccount": false,
                        "value": "eip155:1:0x1234567890123456789012345678901234567890",
                      },
                      "type": "AccountSelector",
                    },
                    {
                      "key": null,
                      "props": {
                        "children": "This account will be upgraded to a smart account to complete this permission.",
                        "color": "warning",
                        "size": "sm",
                      },
                      "type": "Text",
                    },
                    {
                      "key": null,
                      "props": {
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {},
                            "type": "Skeleton",
                          },
                          {
                            "key": null,
                            "props": {},
                            "type": "Skeleton",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "alignment": "space-between",
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "Reason",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": {
                                "key": null,
                                "props": {
                                  "color": "muted",
                                  "name": "question",
                                  "size": "inherit",
                                },
                                "type": "Icon",
                              },
                              "content": {
                                "key": null,
                                "props": {
                                  "children": "Reason given by the recipient for requesting this permission.",
                                },
                                "type": "Text",
                              },
                            },
                            "type": "Tooltip",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Test justificatio...",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "alignment": "end",
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "children": "Show",
                                      "name": "show-more-justification",
                                    },
                                    "type": "Button",
                                  },
                                  "direction": "horizontal",
                                },
                                "type": "Box",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "horizontal",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": [
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Recipient",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The site requesting the permission",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "https://example.com",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Network",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The network on which the permission is being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "Ethereum Mainnet",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Token",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The token being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "children": "ETH",
                                    "href": "https://etherscan.io/address/0x38c4A4F071d33d6Cf83e2e81F12D9B5D30E611F3",
                                  },
                                  "type": "Link",
                                },
                                "content": "0x38c4A...611F3",
                              },
                              "type": "Tooltip",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
          undefined,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);

        // resolve the token balance, which triggers a re-render
        resolveTokenBalancePromise();

        // allow the event loop to run the re-render
        await new Promise((resolve) => setTimeout(resolve, 0));

        const confirmationContentWithBalance =
          await lifecycleHandlers.createConfirmationContent({
            context: mockContext,
            metadata: mockMetadata,
            origin: mockOrigin,
            chainId: 1,
          });

        // concrete token balance, skeleton for fiat balance
        expect(confirmationContentWithBalance).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": [
                {
                  "key": null,
                  "props": {
                    "children": "Test permission",
                    "size": "lg",
                  },
                  "type": "Heading",
                },
                {
                  "key": null,
                  "props": {
                    "children": "This site wants a test permission.",
                  },
                  "type": "Text",
                },
              ],
            },
            "type": "Box",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "alignment": "space-between",
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Account",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "color": "muted",
                                      "name": "question",
                                      "size": "inherit",
                                    },
                                    "type": "Icon",
                                  },
                                  "content": {
                                    "key": null,
                                    "props": {
                                      "children": "The account from which the permission is being granted.",
                                    },
                                    "type": "Text",
                                  },
                                },
                                "type": "Tooltip",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "chainIds": [
                          "eip155:1",
                        ],
                        "name": "account-selector",
                        "switchGlobalAccount": false,
                        "value": "eip155:1:0x1234567890123456789012345678901234567890",
                      },
                      "type": "AccountSelector",
                    },
                    {
                      "key": null,
                      "props": {
                        "children": "This account will be upgraded to a smart account to complete this permission.",
                        "color": "warning",
                        "size": "sm",
                      },
                      "type": "Text",
                    },
                    {
                      "key": null,
                      "props": {
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {},
                            "type": "Skeleton",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "1",
                                " available",
                              ],
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "alignment": "space-between",
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "Reason",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": {
                                "key": null,
                                "props": {
                                  "color": "muted",
                                  "name": "question",
                                  "size": "inherit",
                                },
                                "type": "Icon",
                              },
                              "content": {
                                "key": null,
                                "props": {
                                  "children": "Reason given by the recipient for requesting this permission.",
                                },
                                "type": "Text",
                              },
                            },
                            "type": "Tooltip",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Test justificatio...",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "alignment": "end",
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "children": "Show",
                                      "name": "show-more-justification",
                                    },
                                    "type": "Button",
                                  },
                                  "direction": "horizontal",
                                },
                                "type": "Box",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "horizontal",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": [
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Recipient",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The site requesting the permission",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "https://example.com",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Network",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The network on which the permission is being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "Ethereum Mainnet",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Token",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The token being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "children": "ETH",
                                    "href": "https://etherscan.io/address/0x38c4A4F071d33d6Cf83e2e81F12D9B5D30E611F3",
                                  },
                                  "type": "Link",
                                },
                                "content": "0x38c4A...611F3",
                              },
                              "type": "Tooltip",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
          undefined,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);

        // resolve the fiat balance, which triggers a re-render
        resolveFiatBalancePromise();

        // allow the event loop to run the re-render
        await new Promise((resolve) => setTimeout(resolve, 0));

        const confirmationContentWithFiatBalance =
          await lifecycleHandlers.createConfirmationContent({
            context: mockContext,
            metadata: mockMetadata,
            origin: mockOrigin,
            chainId: 1,
          });

        // concrete token balance, concrete fiat balance
        expect(confirmationContentWithFiatBalance).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": [
                {
                  "key": null,
                  "props": {
                    "children": "Test permission",
                    "size": "lg",
                  },
                  "type": "Heading",
                },
                {
                  "key": null,
                  "props": {
                    "children": "This site wants a test permission.",
                  },
                  "type": "Text",
                },
              ],
            },
            "type": "Box",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "alignment": "space-between",
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Account",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "color": "muted",
                                      "name": "question",
                                      "size": "inherit",
                                    },
                                    "type": "Icon",
                                  },
                                  "content": {
                                    "key": null,
                                    "props": {
                                      "children": "The account from which the permission is being granted.",
                                    },
                                    "type": "Text",
                                  },
                                },
                                "type": "Tooltip",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "chainIds": [
                          "eip155:1",
                        ],
                        "name": "account-selector",
                        "switchGlobalAccount": false,
                        "value": "eip155:1:0x1234567890123456789012345678901234567890",
                      },
                      "type": "AccountSelector",
                    },
                    {
                      "key": null,
                      "props": {
                        "children": "This account will be upgraded to a smart account to complete this permission.",
                        "color": "warning",
                        "size": "sm",
                      },
                      "type": "Text",
                    },
                    {
                      "key": null,
                      "props": {
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "$1000",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "1",
                                " available",
                              ],
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
                "key": null,
                "props": {
                  "alignment": "space-between",
                  "children": [
                    {
                      "key": null,
                      "props": {
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "Reason",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": {
                                "key": null,
                                "props": {
                                  "color": "muted",
                                  "name": "question",
                                  "size": "inherit",
                                },
                                "type": "Icon",
                              },
                              "content": {
                                "key": null,
                                "props": {
                                  "children": "Reason given by the recipient for requesting this permission.",
                                },
                                "type": "Text",
                              },
                            },
                            "type": "Tooltip",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    {
                      "key": null,
                      "props": {
                        "children": {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Test justificatio...",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "alignment": "end",
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "children": "Show",
                                      "name": "show-more-justification",
                                    },
                                    "type": "Button",
                                  },
                                  "direction": "horizontal",
                                },
                                "type": "Box",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "horizontal",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": [
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Recipient",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The site requesting the permission",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "https://example.com",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Network",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The network on which the permission is being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": "Ethereum Mainnet",
                              },
                              "type": "Text",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "alignment": "space-between",
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": [
                                  {
                                    "key": null,
                                    "props": {
                                      "children": "Token",
                                    },
                                    "type": "Text",
                                  },
                                  {
                                    "key": null,
                                    "props": {
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "color": "muted",
                                          "name": "question",
                                          "size": "inherit",
                                        },
                                        "type": "Icon",
                                      },
                                      "content": {
                                        "key": null,
                                        "props": {
                                          "children": "The token being requested",
                                        },
                                        "type": "Text",
                                      },
                                    },
                                    "type": "Tooltip",
                                  },
                                ],
                                "direction": "horizontal",
                              },
                              "type": "Box",
                            },
                            null,
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            null,
                            {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "children": "ETH",
                                    "href": "https://etherscan.io/address/0x38c4A4F071d33d6Cf83e2e81F12D9B5D30E611F3",
                                  },
                                  "type": "Link",
                                },
                                "content": "0x38c4A...611F3",
                              },
                              "type": "Tooltip",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
          undefined,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
      });

      it('cancels the balance loading when the account is changed', async () => {
        const {
          permissionHandler,
          getLifecycleHandlers,
          getBoundEvent,
          tokenMetadataService,
          updateContext,
        } = setupTest();

        let resolveTokenBalancePromise: () => void = () => {
          throw new Error('Function should never be called');
        };
        const tokenBalancePromise = new Promise<TokenBalanceAndMetadata>(
          (resolve) => {
            resolveTokenBalancePromise = () =>
              resolve(mockTokenBalanceAndMetadata);
          },
        );

        tokenMetadataService.getTokenBalanceAndMetadata.mockReturnValueOnce(
          tokenBalancePromise,
        );

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        lifecycleHandlers.onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: true,
        });

        const accountSelectorChangeHandler = getBoundEvent({
          elementName: 'account-selector',
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        expect(accountSelectorChangeHandler).toBeDefined();

        const mockAddress2Caip10 = `eip155:1:${mockAddress2}`;

        await accountSelectorChangeHandler?.({
          event: {
            value: { addresses: [mockAddress2Caip10] } as any,
            name: 'account-selector',
            type: UserInputEventType.InputChangeEvent,
          },
          interfaceId: mockInterfaceId,
        });

        resolveTokenBalancePromise();
        await new Promise((resolve) => setTimeout(resolve, 0));

        // update context is called 4 times:
        // 1. After the account is changed
        // 2. After the account upgrade status is fetched for the new account
        // 3. After the token balance is resolved for the second account
        // 4. After the fiat balance is resolved for the second account
        // if we didn't cancel the original balance loading, there would be another 2 instances
        // 5. After the original token balance is resolved for the first account
        // 6. After the original fiat balance is resolved for the first account
        expect(updateContext).toHaveBeenCalledTimes(4);
      });

      it('unbinds the event handlers when the confirmation is resolved', async () => {
        const {
          permissionHandler,
          getLifecycleHandlers,
          getUnboundEvent,
          getBoundEvent,
          updateContext,
        } = setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const { onConfirmationResolved, onConfirmationCreated } =
          getLifecycleHandlers();

        onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: true,
        });

        const accountSelectorBoundEvent = getBoundEvent({
          elementName: 'account-selector',
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        const showMoreButtonBoundEvent = getBoundEvent({
          elementName: 'show-more-justification',
          eventType: 'ButtonClickEvent',
          interfaceId: mockInterfaceId,
        });

        expect(accountSelectorBoundEvent).toBeDefined();
        expect(showMoreButtonBoundEvent).toBeDefined();

        onConfirmationResolved?.();

        const accountSelectorUnboundEvent = getUnboundEvent({
          elementName: 'account-selector',
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        const showMoreButtonUnboundEvent = getUnboundEvent({
          elementName: 'show-more-justification',
          eventType: 'ButtonClickEvent',
          interfaceId: mockInterfaceId,
        });

        expect(accountSelectorUnboundEvent).toBeDefined();
        expect(showMoreButtonUnboundEvent).toBeDefined();
      });

      it('does not bind rule handlers when isAdjustmentAllowed is false but allows account selection', async () => {
        const {
          permissionHandler,
          getLifecycleHandlers,
          getBoundEvent,
          updateContext,
        } = setupTest();

        await permissionHandler.handlePermissionRequest(mockOrigin);

        const lifecycleHandlers = getLifecycleHandlers();

        lifecycleHandlers.onConfirmationCreated?.({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          updateContext,
          isAdjustmentAllowed: false, // Adjustment not allowed
        });

        // Try to get a rule input handler - it should not exist when adjustment is not allowed
        const ruleInputHandler = getBoundEvent({
          elementName: 'amountPerSecond', // Example rule input field
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        // The rule handler should not be bound when adjustment is not allowed
        expect(ruleInputHandler).toBeUndefined();

        // But account selector should still be bound (it's allowed even when adjustment is not allowed)
        const accountSelectorHandler = getBoundEvent({
          elementName: 'account-selector',
          eventType: 'InputChangeEvent',
          interfaceId: mockInterfaceId,
        });

        expect(accountSelectorHandler).toBeDefined();
      });
    });
  });
});
