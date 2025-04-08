import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { getAddress } from 'viem';

import {
  handleToggleBooleanClicked,
  NativeTokenStreamDialogElementNames,
  TimePeriod,
  type PermissionConfirmationContext,
} from '../../src/ui';

describe('Confirmation Dialog event handlers', () => {
  const address = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
  const mockSnapsProvider = createMockSnapsProvider();
  beforeEach(() => {
    mockSnapsProvider.request.mockReset();
  });

  describe('native-token-stream confirmation dialog', () => {
    const mockNativeTokenStreamContext: PermissionConfirmationContext<'native-token-stream'> =
      {
        permissionType: 'native-token-stream',
        justification: 'shh...permission 2',
        address,
        siteOrigin: 'http://localhost:3000',
        balance: '0x1',
        expiry: 1,
        chainId: 11155111,
        valueFormattedAsCurrency: '$1,000.00',
        state: {
          [NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded]:
            false,
          [NativeTokenStreamDialogElementNames.MaxAmountInput]: '0x2',
          [NativeTokenStreamDialogElementNames.PeriodInput]: TimePeriod.WEEKLY,
          [NativeTokenStreamDialogElementNames.MaxAllowanceRule]: 'Unlimited',
          [NativeTokenStreamDialogElementNames.InitialAmountRule]: '0x1',
          [NativeTokenStreamDialogElementNames.StartTimeRule]: 1222333,
          [NativeTokenStreamDialogElementNames.ExpiryRule]: 1,
          [NativeTokenStreamDialogElementNames.AddMoreRulesToggle]: false,
          [NativeTokenStreamDialogElementNames.SelectedRuleDropdown]: '',
        },
      };

    describe('handleToggleBooleanClicked - event', () => {
      it('should mutate justification show more state', async () => {
        const stateBefore =
          mockNativeTokenStreamContext.state[
            NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded
          ];
        expect(stateBefore).toBe(false);

        await handleToggleBooleanClicked({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded,
          },
          attenuatedContext: mockNativeTokenStreamContext,
          snapsProvider: mockSnapsProvider,
          interfaceId: 'mockInterfaceId',
          permissionType: 'native-token-stream',
        });

        expect(mockSnapsProvider.request).toHaveBeenCalled();
      });

      it('should not mutate justification show more state if it is not found in context', async () => {
        const contextWithEmptyState = {
          ...mockNativeTokenStreamContext,
          state: {} as any,
        };
        const stateBefore =
          contextWithEmptyState.state[
            NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded
          ];
        expect(stateBefore).toBeUndefined();

        // mutate state
        await handleToggleBooleanClicked({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded,
          },
          attenuatedContext: contextWithEmptyState,
          snapsProvider: mockSnapsProvider,
          interfaceId: 'mockInterfaceId',
          permissionType: 'native-token-stream',
        });

        expect(mockSnapsProvider.request).not.toHaveBeenCalled();
      });

      it('should not mutate justification show more state if event name in incorrect', async () => {
        const stateBefore =
          mockNativeTokenStreamContext.state[
            NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded
          ];
        expect(stateBefore).toBe(false);

        // mutate state
        await handleToggleBooleanClicked({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: 'some other event name',
          },
          attenuatedContext: mockNativeTokenStreamContext,
          snapsProvider: mockSnapsProvider,
          interfaceId: 'mockInterfaceId',
          permissionType: 'native-token-stream',
        });

        expect(mockSnapsProvider.request).not.toHaveBeenCalled();
      });
    });
  });
});
