import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { getAddress } from 'viem';

import {
  handleToggleBooleanClicked,
  handleReplaceValueInput,
  handleReplaceTextInput,
  handleFormSubmit,
  handleRemoveRuleClicked,
  NativeTokenStreamDialogElementNames,
  RulesSelectorElementNames,
  TimePeriod,
  type PermissionConfirmationContext,
} from '../../src/ui';

describe('Confirmation Dialog event handlers', () => {
  const address = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');
  const mockSnapsProvider = createMockSnapsProvider();
  beforeEach(() => {
    mockSnapsProvider.request.mockReset();
    // eslint-disable-next-line no-restricted-globals
    (global as any).snap = mockSnapsProvider;
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
          [NativeTokenStreamDialogElementNames.StreamAmountInput]: '0x2',
          [NativeTokenStreamDialogElementNames.PeriodInput]: TimePeriod.WEEKLY,
          [RulesSelectorElementNames.AddMoreRulesPageToggle]: false,
          [NativeTokenStreamDialogElementNames.SelectedRuleDropdown]: '',
          [NativeTokenStreamDialogElementNames.SelectedRuleInput]: '',
          rules: {
            [NativeTokenStreamDialogElementNames.MaxAllowanceRule]: 'Unlimited',
            [NativeTokenStreamDialogElementNames.InitialAmountRule]: '3.0',
            [NativeTokenStreamDialogElementNames.StartTimeRule]: '01/07/2025',
            [NativeTokenStreamDialogElementNames.ExpiryRule]: '01/07/2026',
          },
          [NativeTokenStreamDialogElementNames.MaxAllowanceDropdown]: '',
        },
        isAdjustmentAllowed: true,
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

        await expect(
          handleToggleBooleanClicked({
            event: {
              type: UserInputEventType.ButtonClickEvent,
              name: NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded,
            },
            attenuatedContext: contextWithEmptyState,
            interfaceId: 'mockInterfaceId',
            permissionType: 'native-token-stream',
          }),
        ).rejects.toThrow(
          'Event name justification-show-more-button-native-token-stream not found in state',
        );
      });

      it('should not mutate justification show more state if event name in incorrect', async () => {
        const stateBefore =
          mockNativeTokenStreamContext.state[
            NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded
          ];
        expect(stateBefore).toBe(false);

        await expect(
          handleToggleBooleanClicked({
            event: {
              type: UserInputEventType.ButtonClickEvent,
              name: 'some other event name',
            },
            attenuatedContext: mockNativeTokenStreamContext,
            interfaceId: 'mockInterfaceId',
            permissionType: 'native-token-stream',
          }),
        ).rejects.toThrow(
          'Event name some other event name not found in state',
        );
      });

      it('should handle undefined event name', async () => {
        await expect(
          handleToggleBooleanClicked({
            event: {
              type: UserInputEventType.ButtonClickEvent,
              name: undefined,
            },
            attenuatedContext: mockNativeTokenStreamContext,
            interfaceId: 'mockInterfaceId',
            permissionType: 'native-token-stream',
          }),
        ).rejects.toThrow('Event name  not found in state');
      });
    });

    describe('handleReplaceValueInput - event', () => {
      it('should update max amount input value', async () => {
        const newValue = '100';
        await handleReplaceValueInput({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: NativeTokenStreamDialogElementNames.StreamAmountInput,
            value: newValue,
          },
          attenuatedContext: mockNativeTokenStreamContext,
          interfaceId: 'mockInterfaceId',
          permissionType: 'native-token-stream',
        });

        expect(mockSnapsProvider.request).toHaveBeenCalled();
      });

      it('should throw error if event name is not found in state', async () => {
        await expect(
          handleReplaceValueInput({
            event: {
              type: UserInputEventType.InputChangeEvent,
              name: 'unknown-input',
              value: '100',
            },
            attenuatedContext: mockNativeTokenStreamContext,
            interfaceId: 'mockInterfaceId',
            permissionType: 'native-token-stream',
          }),
        ).rejects.toThrow('Event name unknown-input not found in state');
      });
    });

    describe('handleReplaceTextInput - event', () => {
      it('should update selected rule input value', async () => {
        const newValue = '01/07/2025';
        await handleReplaceTextInput({
          event: {
            type: UserInputEventType.InputChangeEvent,
            name: NativeTokenStreamDialogElementNames.SelectedRuleInput,
            value: newValue,
          },
          attenuatedContext: mockNativeTokenStreamContext,
          interfaceId: 'mockInterfaceId',
          permissionType: 'native-token-stream',
        });

        expect(mockSnapsProvider.request).toHaveBeenCalled();
      });

      it('should throw error if event name is not found in state', async () => {
        await expect(
          handleReplaceTextInput({
            event: {
              type: UserInputEventType.InputChangeEvent,
              name: 'unknown-input',
              value: 'New Value',
            },
            attenuatedContext: mockNativeTokenStreamContext,
            interfaceId: 'mockInterfaceId',
            permissionType: 'native-token-stream',
          }),
        ).rejects.toThrow('Event name unknown-input not found in state');
      });
    });

    describe('handleFormSubmit - event', () => {
      it('should update rules and reset form values', async () => {
        const ruleName = NativeTokenStreamDialogElementNames.MaxAllowanceRule;
        const newValue = '1000';

        await handleFormSubmit({
          event: {
            type: UserInputEventType.FormSubmitEvent,
            name: 'form-submit',
            value: {
              [NativeTokenStreamDialogElementNames.SelectedRuleDropdown]:
                ruleName,
              [NativeTokenStreamDialogElementNames.SelectedRuleInput]: newValue,
            },
          },
          attenuatedContext: mockNativeTokenStreamContext,
          interfaceId: 'mockInterfaceId',
          permissionType: 'native-token-stream',
        });

        expect(mockSnapsProvider.request).toHaveBeenCalled();
      });

      it('should throw error if event name or value is missing', async () => {
        await expect(
          handleFormSubmit({
            event: {
              type: UserInputEventType.FormSubmitEvent,
              name: 'form-submit',
              value: {
                [NativeTokenStreamDialogElementNames.SelectedRuleInput]: '1000',
              },
            },
            attenuatedContext: mockNativeTokenStreamContext,
            interfaceId: 'mockInterfaceId',
            permissionType: 'native-token-stream',
          }),
        ).rejects.toThrow('Invalid event name or value');
      });
    });

    describe('handleRemoveRuleClicked - event', () => {
      it('should remove a rule from the rules object', async () => {
        await handleRemoveRuleClicked({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: NativeTokenStreamDialogElementNames.MaxAllowanceRule,
          },
          attenuatedContext: mockNativeTokenStreamContext,
          interfaceId: 'mockInterfaceId',
          permissionType: 'native-token-stream',
        });

        expect(mockSnapsProvider.request).toHaveBeenCalled();
      });

      it('should handle undefined event name', async () => {
        await handleRemoveRuleClicked({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: undefined,
          },
          attenuatedContext: mockNativeTokenStreamContext,
          interfaceId: 'mockInterfaceId',
          permissionType: 'native-token-stream',
        });

        expect(mockSnapsProvider.request).toHaveBeenCalled();
      });
    });
  });
});
