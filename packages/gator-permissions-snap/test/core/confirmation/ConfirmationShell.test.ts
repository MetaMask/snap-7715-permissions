import { describe, expect, it, jest } from '@jest/globals';
import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { InternalError, UserInputEventType } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/snaps-sdk';
import { Text } from '@metamask/snaps-sdk/jsx';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import { AddressScanResultType } from '../../../src/clients/trustSignalsClient';
import type { AccountController } from '../../../src/core/accountController';
import { ConfirmationShell } from '../../../src/core/confirmation/ConfirmationShell';
import { ExistingPermissionsState } from '../../../src/core/existingpermissions/existingPermissionsState';
import { METAMASK_FACILITATOR_ADDRESSES } from '../../../src/core/facilitatorAddresses';
import type { BaseContext, RuleDefinition } from '../../../src/core/types';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../../../src/userEventDispatcher';
import type { MessageKey } from '../../../src/utils/i18n';
import {
  createMockTokenMetadataCoordinator,
  createTestBaseContext,
} from '../../testContext';

const mockAddress = '0x1234567890123456789012345678901234567890' as const;
const mockAddress2 = '0x1234567890123456789012345678901234567891' as const;
const mockAssetAddress = '0x38c4A4F071d33d6Cf83e2e81F12D9B5D30E611F3' as const;
const mockInterfaceId = 'test-interface-id';
const mockOrigin = 'https://example.com';
const mockTokenBalanceFiat = '$1000';

type TestContextType = BaseContext;
type TestMetadataType = object;

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

const mockBalanceCaip19 = `eip155:1/erc20:${mockAssetAddress}` as CaipAssetType;
const mockBalanceTokenCaip19 = (): CaipAssetType => mockBalanceCaip19;

const mockContext: TestContextType = createTestBaseContext({
  justification:
    'Test justification text that is longer than twenty characters',
  accountAddressCaip10: `eip155:1:${mockAddress}`,
  expiry: {
    timestamp: 1234567890,
  },
  isAdjustmentAllowed: false,
});
const mockMetadata: TestMetadataType = {};

const mockBodyContent = Text({
  children: 'Permission body',
}) as unknown as SnapElement;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const setupTest = (options?: { rules?: RuleDefinition<any, any>[] }) => {
  const title = 'permissionRequestTitle' as MessageKey;
  const subtitle = 'permissionRequestSubtitle' as MessageKey;
  const rules = options?.rules ?? [];

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

  const tokenMetadataCoordinator = createMockTokenMetadataCoordinator({
    metadata: {
      symbol: 'ETH',
      decimals: 18,
      iconDataBase64: null,
    },
    balance: { formatted: '1', fiat: mockTokenBalanceFiat },
  });

  const syncCoordinator = jest.fn((context: TestContextType) => {
    tokenMetadataCoordinator.sync({
      accountCaip10: context.accountAddressCaip10,
      tokenCaip19s: [mockBalanceCaip19],
      balanceCaip19: mockBalanceCaip19,
    });
  });

  const renderBody = jest.fn(async () => Promise.resolve(mockBodyContent));

  const confirmationShell = new ConfirmationShell({
    userEventDispatcher,
    accountController,
    tokenMetadataCoordinator,
    title,
    subtitle,
    permissionRequest: mockPermissionRequest,
    tokenCaip19s: [mockBalanceTokenCaip19],
    balanceTokenCaip19: mockBalanceTokenCaip19,
    renderBody,
  });

  const updateContext =
    jest.fn<(args: { updatedContext: TestContextType }) => Promise<void>>();

  const onExistingPermissionsViewChange = jest.fn(async () =>
    Promise.resolve(),
  );

  const bindSessionEvents = (
    overrides: Partial<{
      initialContext: TestContextType;
    }> = {},
  ): void => {
    confirmationShell.bindSessionEvents({
      interfaceId: mockInterfaceId,
      initialContext: overrides.initialContext ?? mockContext,
      rules,
      updateContext,
      onExistingPermissionsViewChange,
      tokenMetadataCoordinator,
      syncCoordinator,
    });
  };

  return {
    confirmationShell,
    renderBody,
    updateContext,
    onExistingPermissionsViewChange,
    rules,
    getBoundEvent,
    getUnboundEvent,
    tokenMetadataCoordinator,
    syncCoordinator,
    bindSessionEvents,
    accountController,
    userEventDispatcher,
  };
};

describe('ConfirmationShell', () => {
  describe('createSkeletonContent', () => {
    it('creates skeleton confirmation content', () => {
      const { confirmationShell } = setupTest();

      const result = confirmationShell.createSkeletonContent();

      expect(result).toBeDefined();
      expect(result.type).toBe('Container');
    });
  });

  describe('createConfirmationContent', () => {
    it('calls createConfirmationContent to produce the permission specific content', async () => {
      const { confirmationShell, renderBody } = setupTest();
      await confirmationShell.createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
        origin: mockOrigin,
        chainId: 1,
        scanDappUrlResult: null,
        scanAddressResult: null,
        existingPermissionsStatus: ExistingPermissionsState.None,
        isGrantDisabled: false,
      });

      expect(renderBody).toHaveBeenCalledWith({
        context: mockContext,
        metadata: mockMetadata,
        tokenMetadata: expect.anything(),
      });
    });

    it('uses translated fallback for address warning when scanAddressResult.label is empty', async () => {
      const { confirmationShell } = setupTest();
      const result = await confirmationShell.createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
        origin: mockOrigin,
        chainId: 1,
        scanDappUrlResult: null,
        scanAddressResult: {
          resultType: AddressScanResultType.Malicious,
          label: '',
        },
        existingPermissionsStatus: ExistingPermissionsState.None,
        isGrantDisabled: false,
      });

      // When label is empty, confirmationShellContent should use t('maliciousAddressLabel')
      const serialized = JSON.stringify(result);
      expect(serialized).toContain('Malicious address');
    });

    it('renders redeemer addresses as redeemers when no payee rule is present', async () => {
      const { confirmationShell } = setupTest();
      const result = await confirmationShell.createConfirmationContent({
        context: {
          ...mockContext,
          redeemerAddresses: ['0x1111111111111111111111111111111111111111'],
        },
        metadata: mockMetadata,
        origin: mockOrigin,
        chainId: 1,
        scanDappUrlResult: null,
        scanAddressResult: null,
        existingPermissionsStatus: ExistingPermissionsState.None,
        isGrantDisabled: false,
      });

      const serialized = JSON.stringify(result);
      expect(serialized).toContain('Redeemers');
      expect(serialized).not.toContain('Facilitators');
    });

    it('renders known MetaMask facilitator redeemer addresses as a MetaMask facilitator redeemer', async () => {
      const { confirmationShell } = setupTest();
      const result = await confirmationShell.createConfirmationContent({
        context: {
          ...mockContext,
          redeemerAddresses: [...METAMASK_FACILITATOR_ADDRESSES],
        },
        metadata: mockMetadata,
        origin: mockOrigin,
        chainId: 1,
        scanDappUrlResult: null,
        scanAddressResult: null,
        existingPermissionsStatus: ExistingPermissionsState.None,
        isGrantDisabled: false,
      });

      const serialized = JSON.stringify(result);
      expect(serialized).toContain('Redeemers');
      expect(serialized).toContain('MetaMask facilitator');
      expect(serialized).toContain(
        'Only these addresses may redeem this permission.',
      );
      expect(serialized).not.toContain('Facilitators');
    });

    it('does not render arbitrary redeemer addresses as facilitators when a payee rule is present', async () => {
      const { confirmationShell } = setupTest();
      const result = await confirmationShell.createConfirmationContent({
        context: {
          ...mockContext,
          redeemerAddresses: ['0x1111111111111111111111111111111111111111'],
          payeeAddresses: ['0x2222222222222222222222222222222222222222'],
        },
        metadata: mockMetadata,
        origin: mockOrigin,
        chainId: 1,
        scanDappUrlResult: null,
        scanAddressResult: null,
        existingPermissionsStatus: ExistingPermissionsState.None,
        isGrantDisabled: false,
      });

      const serialized = JSON.stringify(result);
      expect(serialized).toContain('Redeemers');
      expect(serialized).not.toContain('Facilitators');
    });
  });

  describe('bindSessionEvents', () => {
    it('registers event handlers for account selection and justification toggle', async () => {
      const rule: RuleDefinition<TestContextType, TestMetadataType> = {
        name: 'amountPerSecond',
        label: 'amountLabel',
        type: 'number',
        getRuleData: () => ({
          value: '0x1',
          isVisible: true,
          isEditable: false,
        }),
        updateContext: (context) => context,
      };
      const { getBoundEvent, bindSessionEvents } = setupTest({
        rules: [rule],
      });
      bindSessionEvents();

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

    it('throws if bindSessionEvents is called more than once', () => {
      const {
        confirmationShell,
        rules,
        updateContext,
        onExistingPermissionsViewChange,
        tokenMetadataCoordinator,
        syncCoordinator,
        bindSessionEvents,
      } = setupTest();

      bindSessionEvents();

      expect(() =>
        confirmationShell.bindSessionEvents({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          rules,
          updateContext,
          onExistingPermissionsViewChange,
          tokenMetadataCoordinator,
          syncCoordinator,
        }),
      ).toThrow(InternalError);
      expect(() =>
        confirmationShell.bindSessionEvents({
          interfaceId: mockInterfaceId,
          initialContext: mockContext,
          rules,
          updateContext,
          onExistingPermissionsViewChange,
          tokenMetadataCoordinator,
          syncCoordinator,
        }),
      ).toThrow('ConfirmationShell.bindSessionEvents() called more than once');
    });

    it('loads the balance for the selected account', async () => {
      const { syncCoordinator, bindSessionEvents } = setupTest();
      bindSessionEvents();

      expect(syncCoordinator).toHaveBeenCalled();
    });

    it('updates the context when the account is changed', async () => {
      const { getBoundEvent, updateContext, bindSessionEvents } = setupTest();
      bindSessionEvents();

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
      const { getBoundEvent, syncCoordinator, bindSessionEvents } = setupTest();
      bindSessionEvents();

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

      expect(syncCoordinator).toHaveBeenCalledTimes(2);
    });

    it('renders the balance in the confirmation content', async () => {
      const { confirmationShell, bindSessionEvents } = setupTest();
      bindSessionEvents();

      const confirmationContent =
        await confirmationShell.createConfirmationContent({
          context: mockContext,
          metadata: mockMetadata,
          origin: mockOrigin,
          chainId: 1,
          scanDappUrlResult: null,
          scanAddressResult: null,
          existingPermissionsStatus: ExistingPermissionsState.None,
          isGrantDisabled: false,
        });
      expect(confirmationContent).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": [
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
                          "children": "Permission request",
                          "size": "lg",
                        },
                        "type": "Heading",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": "This site wants permissions to spend your tokens.",
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
                                      " ",
                                      "available",
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
                false,
                false,
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
                                    "children": "Justification",
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
                                        "children": "Justification given by the recipient for requesting this permission.",
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
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Test justification text that is longer than twenty characters",
                                  },
                                  "type": "Text",
                                },
                                null,
                              ],
                              "direction": "vertical",
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
                                            "children": "Request from",
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
                                      "alignment": "end",
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
                                      "children": {
                                        "key": null,
                                        "props": {
                                          "children": "0x12345...67890",
                                        },
                                        "type": "Text",
                                      },
                                      "content": "0x1234567890123456789012345678901234567890",
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
                                      "alignment": "end",
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
                      [
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
                      null,
                      null,
                    ],
                  },
                  "type": "Section",
                },
                {
                  "key": null,
                  "props": {
                    "children": "Permission body",
                  },
                  "type": "Text",
                },
              ],
              "direction": "vertical",
            },
            "type": "Box",
          },
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "children": [
            {
              "key": null,
              "props": {
                "children": "Cancel",
                "name": "cancel-button",
                "variant": "destructive",
              },
              "type": "Button",
            },
            {
              "key": null,
              "props": {
                "children": "Grant",
                "disabled": false,
                "name": "grant-button",
                "variant": "primary",
              },
              "type": "Button",
            },
          ],
        },
        "type": "Footer",
      },
    ],
  },
  "type": "Container",
}
`);
    });

    it('updates the balance in the confirmation content when the account is changed', async () => {
      const {
        confirmationShell,
        getBoundEvent,
        tokenMetadataCoordinator,
        bindSessionEvents,
      } = setupTest();
      bindSessionEvents();

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

      expect(tokenMetadataCoordinator.sync).toHaveBeenCalled();

      const confirmationContent =
        await confirmationShell.createConfirmationContent({
          context: mockContext,
          metadata: mockMetadata,
          origin: mockOrigin,
          chainId: 1,
          scanDappUrlResult: null,
          scanAddressResult: null,
          existingPermissionsStatus: ExistingPermissionsState.None,
          isGrantDisabled: false,
        });

      expect(JSON.stringify(confirmationContent)).toContain('available');
    });

    it('renders skeletons while the balance is loading', async () => {
      const loadingCoordinator = createMockTokenMetadataCoordinator({
        balance: undefined,
      });
      const confirmationShell = new ConfirmationShell({
        userEventDispatcher: {
          on: jest.fn(() => ({ unbind: jest.fn(), dispatcher: {} })),
          off: jest.fn(),
          createUserInputEventHandler: jest.fn(),
          waitForPendingHandlers: jest.fn(),
        } as unknown as jest.Mocked<UserEventDispatcher>,
        accountController: {
          getAccountUpgradeStatus: jest.fn(async () => ({ isUpgraded: false })),
        } as unknown as jest.Mocked<AccountController>,
        title: 'permissionRequestTitle' as MessageKey,
        subtitle: 'permissionRequestSubtitle' as MessageKey,
        permissionRequest: mockPermissionRequest,
        tokenCaip19s: [mockBalanceTokenCaip19],
        balanceTokenCaip19: mockBalanceTokenCaip19,
        tokenMetadataCoordinator: loadingCoordinator,
        renderBody: jest.fn(async () => Promise.resolve(mockBodyContent)),
      });

      const confirmationContent =
        await confirmationShell.createConfirmationContent({
          context: mockContext,
          metadata: mockMetadata,
          origin: mockOrigin,
          chainId: 1,
          scanDappUrlResult: null,
          scanAddressResult: null,
          existingPermissionsStatus: ExistingPermissionsState.None,
          isGrantDisabled: false,
        });

      expect(JSON.stringify(confirmationContent)).toContain('Skeleton');
    });

    it('calls syncCoordinator again when the account is changed', async () => {
      const {
        getBoundEvent,
        syncCoordinator,
        updateContext,
        bindSessionEvents,
      } = setupTest();
      bindSessionEvents();

      const accountSelectorChangeHandler = getBoundEvent({
        elementName: 'account-selector',
        eventType: 'InputChangeEvent',
        interfaceId: mockInterfaceId,
      });

      await accountSelectorChangeHandler?.({
        event: {
          value: { addresses: [`eip155:1:${mockAddress2}`] } as any,
          name: 'account-selector',
          type: UserInputEventType.InputChangeEvent,
        },
        interfaceId: mockInterfaceId,
      });

      expect(syncCoordinator).toHaveBeenCalledTimes(2);
      expect(updateContext).toHaveBeenCalled();
    });

    it('unbinds the event handlers when the confirmation is resolved', async () => {
      const {
        confirmationShell,
        getUnboundEvent,
        getBoundEvent,
        bindSessionEvents,
      } = setupTest();
      bindSessionEvents();

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
      confirmationShell.resolveSession();

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

    it('binds rule handlers even when isAdjustmentAllowed is false', async () => {
      const rule: RuleDefinition<TestContextType, TestMetadataType> = {
        name: 'amountPerSecond',
        label: 'amountLabel',
        type: 'number',
        getRuleData: () => ({
          value: '0x1',
          isVisible: true,
          isEditable: false,
        }),
        updateContext: (context) => context,
      };
      const { getBoundEvent, bindSessionEvents } = setupTest({
        rules: [rule],
      });
      bindSessionEvents();

      // Try to get a rule input handler - it should still be bound
      const ruleInputHandler = getBoundEvent({
        elementName: 'amountPerSecond', // Example rule input field
        eventType: 'InputChangeEvent',
        interfaceId: mockInterfaceId,
      });

      expect(ruleInputHandler).toBeDefined();

      // Account selector should still be bound (it's allowed even when adjustment is not allowed)
      const accountSelectorHandler = getBoundEvent({
        elementName: 'account-selector',
        eventType: 'InputChangeEvent',
        interfaceId: mockInterfaceId,
      });

      expect(accountSelectorHandler).toBeDefined();
    });

    it('skips balance sync when no balance token is configured', () => {
      const tokenMetadataCoordinator = createMockTokenMetadataCoordinator();
      const syncCoordinator = jest.fn();
      const confirmationShell = new ConfirmationShell({
        userEventDispatcher: {
          on: jest.fn(() => ({ unbind: jest.fn(), dispatcher: {} })),
          off: jest.fn(),
          createUserInputEventHandler: jest.fn(),
          waitForPendingHandlers: jest.fn(),
        } as unknown as jest.Mocked<UserEventDispatcher>,
        accountController: {
          getAccountUpgradeStatus: jest.fn(async () => ({ isUpgraded: false })),
        } as unknown as jest.Mocked<AccountController>,
        title: 'permissionRequestTitle' as MessageKey,
        subtitle: 'permissionRequestSubtitle' as MessageKey,
        permissionRequest: mockPermissionRequest,
        tokenCaip19s: [],
        tokenMetadataCoordinator,
        renderBody: jest.fn(async () => Promise.resolve(mockBodyContent)),
      });

      confirmationShell.bindSessionEvents({
        interfaceId: mockInterfaceId,
        initialContext: mockContext,
        rules: [],
        updateContext: jest.fn(async () => Promise.resolve()),
        onExistingPermissionsViewChange: jest.fn(async () => Promise.resolve()),
        tokenMetadataCoordinator,
        syncCoordinator,
      });

      expect(syncCoordinator).toHaveBeenCalledTimes(1);
      expect(syncCoordinator).toHaveBeenCalledWith(mockContext);
    });
  });
});
