import {
  createCaveatBuilder,
  getDeleGatorEnvironment,
} from '@metamask-private/delegator-core-viem';
import type { Permission } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import { getAddress, toHex } from 'viem';
import { sepolia } from 'viem/chains';

import type {
  Orchestrator,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../src/orchestrators';
import { createPermissionOrchestrator } from '../src/orchestrators';
import {
  NativeTokenStreamDialogElementNames,
  type PermissionConfirmationContext,
  NativeTokenStreamConfirmationPage,
  TimePeriod,
  RulesSelectorElementNames,
} from '../src/ui';
import { convertTimestampToReadableDate } from '../src/utils';

describe('native-token-stream Orchestrator', () => {
  const mockStartTime = 789501501; // Example fixed time (January 7, 1995 5:58:21 PM GMT)
  const mockbasePermission: Permission = {
    type: 'native-token-stream',
    data: {
      justification: 'shh...permission 2',
      initialAmount: '0x1',
      amountPerSecond: '0x1',
      startTime: mockStartTime,
      maxAmount: '0x2',
    },
  };
  const mockPermissionType = extractPermissionName(
    mockbasePermission.type,
  ) as SupportedPermissionTypes;

  const address = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
  const sessionAccount = getAddress(
    '0x016562aA41A8697720ce0943F003141f5dEAe006',
  );
  const mockUiContext: PermissionConfirmationContext<
    typeof mockPermissionType
  > = {
    permissionType: mockPermissionType,
    justification: mockbasePermission.data.justification,
    address,
    siteOrigin: 'http://localhost:3000',
    balance: '0x1',
    expiry: 1,
    chainId: 11155111,
    valueFormattedAsCurrency: '$1,000.00',
    state: {
      [NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded]:
        false,
      [NativeTokenStreamDialogElementNames.MaxAmountInput]:
        mockbasePermission.data.maxAmount,
      [NativeTokenStreamDialogElementNames.PeriodInput]: TimePeriod.WEEKLY,
      [RulesSelectorElementNames.AddMoreRulesPageToggle]: false,
      [NativeTokenStreamDialogElementNames.SelectedRuleDropdown]: '',
      [NativeTokenStreamDialogElementNames.SelectedRuleInput]: '',
      rules: {
        [NativeTokenStreamDialogElementNames.MaxAllowanceRule]: 'Unlimited',
        [NativeTokenStreamDialogElementNames.InitialAmountRule]:
          mockbasePermission.data.initialAmount,
        [NativeTokenStreamDialogElementNames.StartTimeRule]:
          convertTimestampToReadableDate(mockbasePermission.data.startTime),
        [NativeTokenStreamDialogElementNames.ExpiryRule]:
          convertTimestampToReadableDate(10000000),
      },
    },
  };

  const mockPage = (
    <NativeTokenStreamConfirmationPage
      siteOrigin={mockUiContext.siteOrigin}
      address={mockUiContext.address}
      justification={mockUiContext.justification}
      balance={mockUiContext.balance}
      expiry={mockUiContext.expiry}
      chainId={mockUiContext.chainId}
      valueFormattedAsCurrency={mockUiContext.valueFormattedAsCurrency}
      state={mockUiContext.state}
    />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseAndValidate', () => {
    let orchestrator: Orchestrator<'native-token-stream'>;

    beforeEach(() => {
      orchestrator = createPermissionOrchestrator(mockPermissionType);
    });

    it('should return as parsed permission when parseAndValidate called with valid permission that is supported', async () => {
      const res = await orchestrator.parseAndValidate(mockbasePermission);

      expect(res).toStrictEqual({
        data: {
          justification: 'shh...permission 2',
          amountPerSecond: '0x1',
          initialAmount: '0x1',
          startTime: mockStartTime,
          maxAmount: '0x2',
        },
        type: 'native-token-stream',
      });
    });

    it('should throw error when validate called with permission that is not valid', async () => {
      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {},
        } as unknown as Permission),
      ).rejects.toThrow('Failed type validation: data.justification: Required');
    });

    it('should throw error with a negative initial amount', async () => {
      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {
            justification: 'shh...permission 2',
            initialAmount: toHex(0n),
            amountPerSecond: toHex(1n),
            startTime: mockStartTime,
            maxAmount: toHex(1n),
          },
        }),
      ).rejects.toThrow('Invalid initialAmount: must be greater than zero');
    });

    it('should throw error with a non-positive max amount', async () => {
      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {
            justification: 'shh...permission 2',
            initialAmount: toHex(1n),
            amountPerSecond: toHex(1n),
            startTime: mockStartTime,
            maxAmount: toHex(0n),
          },
        }),
      ).rejects.toThrow('Invalid maxAmount: must be a positive number');
    });

    it('should throw error when max amount is less than initial amount', async () => {
      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {
            justification: 'shh...permission 2',
            initialAmount: toHex(2n),
            amountPerSecond: toHex(1n),
            startTime: mockStartTime,
            maxAmount: toHex(1n),
          },
        }),
      ).rejects.toThrow(
        'Invalid maxAmount: must be greater than initialAmount',
      );
    });

    it('should throw error with a non-positive amount per second', async () => {
      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {
            justification: 'shh...permission 2',
            initialAmount: toHex(1n),
            amountPerSecond: toHex(0n),
            startTime: mockStartTime,
            maxAmount: toHex(2n),
          },
        }),
      ).rejects.toThrow('Invalid amountPerSecond: must be a positive number');
    });

    it('should throw error with a non-positive start time', async () => {
      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {
            justification: 'shh...permission 2',
            initialAmount: toHex(1n),
            amountPerSecond: toHex(1n),
            startTime: 0,

            maxAmount: toHex(2n),
          },
        }),
      ).rejects.toThrow('Invalid startTime: must be a positive number');
    });

    it('should throw an error if startTime is not an integer', async () => {
      await expect(
        orchestrator.parseAndValidate({
          ...mockbasePermission,
          data: {
            justification: 'shh...permission 2',
            initialAmount: toHex(1n),
            amountPerSecond: toHex(1n),
            startTime: mockStartTime + 0.5,
            maxAmount: toHex(2n),
          },
        }),
      ).rejects.toThrow('Invalid startTime: must be an integer');
    });
  });

  describe('buildPermissionConfirmation', () => {
    it('should return the native-token-stream confirmation page', async () => {
      const orchestrator = createPermissionOrchestrator(mockPermissionType);

      const res = orchestrator.buildPermissionConfirmation(mockUiContext);

      expect(res).toStrictEqual(mockPage);
    });
  });

  describe('appendPermissionCaveats', () => {
    it('should return a caveat builder with caveats added for the attenuated permission', async () => {
      const orchestrator = createPermissionOrchestrator(mockPermissionType);

      const updatedCaveatBuilder = await orchestrator.appendPermissionCaveats({
        address,
        sessionAccount,
        chainId: 11155111,
        attenuatedPermission:
          mockbasePermission as PermissionTypeMapping[typeof mockPermissionType],
        caveatBuilder: createCaveatBuilder(getDeleGatorEnvironment(sepolia.id)),
      });

      expect(updatedCaveatBuilder.build()).toStrictEqual([
        {
          // native token stream enforcer
          enforcer: '0xD10b97905a320b13a0608f7E9cC506b56747df19',
          terms:
            '0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000002f0ed63d',
          args: '0x',
        },
        {
          // exact calldata enforcer
          enforcer: '0x99F2e9bF15ce5eC84685604836F71aB835DBBdED',
          terms: '0x',
          args: '0x',
        },
      ]);
    });
  });

  describe('getTokenCaipAssetType', () => {
    let orchestrator: Orchestrator<'native-token-stream'>;

    beforeEach(() => {
      orchestrator = createPermissionOrchestrator(mockPermissionType);
    });

    it('should return the caip19 asset type for the permission', async () => {
      const res = orchestrator.getTokenCaipAssetType(
        mockbasePermission as PermissionTypeMapping[typeof mockPermissionType],
        11155111,
      );

      expect(res).toStrictEqual('eip155:1/slip44:60');
    });
  });

  describe('getConfirmationDialogEventHandlers', () => {
    let orchestrator: Orchestrator<'native-token-stream'>;

    beforeEach(() => {
      orchestrator = createPermissionOrchestrator(mockPermissionType);
    });

    it('should return confirmation dialog EventHandlers', async () => {
      const parsedPermission = await orchestrator.parseAndValidate(
        mockbasePermission,
      );
      const { dialogContentEventHandlers } =
        orchestrator.getConfirmationDialogEventHandlers(
          parsedPermission,
          mockUiContext.expiry,
        );
      expect(dialogContentEventHandlers.length).toStrictEqual(11);
    });
  });
});
