import { UserInputEventType } from '@metamask/snaps-sdk';
import { getAddress } from 'viem';

import type { PermissionTypeMapping } from '../../src/orchestrators';
import {
  shouldToggleBool,
  NativeTokenStreamDialogEventNames,
  type PermissionConfirmationContext,
} from '../../src/ui';

describe('Confirmation Dialog event handlers', () => {
  const address = getAddress('0x016562aA41A8697720ce0943F003141f5dEAe008');

  describe('native-token-stream confirmation dialog', () => {
    const mockNativeTokenStreamContext: PermissionConfirmationContext<'native-token-stream'> =
      {
        permission: {
          type: 'native-token-stream',
          data: {
            justification: 'shh...permission 2',
            initialAmount: '0x1',
            amountPerSecond: '0x1',
            startTime: 1000,
            maxAmount: '0x2',
          },
        } as PermissionTypeMapping['native-token-stream'],
        address,
        siteOrigin: 'http://localhost:3000',
        balance: '0x1',
        expiry: 1,
        chainId: 11155111,
        valueFormattedAsCurrency: '$1,000.00',
        permissionSpecificRules: {
          maxAllowance: 'Unlimited',
        },
        state: {
          [NativeTokenStreamDialogEventNames.ShowMoreButton]: false,
        },
      };

    describe('shouldToggleBool - event', () => {
      it('should mutate show more state', async () => {
        const stateBefore =
          mockNativeTokenStreamContext.state[
            NativeTokenStreamDialogEventNames.ShowMoreButton
          ];
        expect(stateBefore).toBe(false);

        // mutate state
        const updatedContext = await shouldToggleBool({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: NativeTokenStreamDialogEventNames.ShowMoreButton,
          },
          attenuatedContext: mockNativeTokenStreamContext,
        });

        expect(updatedContext).toBeDefined();
        const stateAfter = (
          updatedContext as PermissionConfirmationContext<'native-token-stream'>
        ).state[NativeTokenStreamDialogEventNames.ShowMoreButton];
        expect(stateAfter).toBe(true);
      });

      it('should not mutate show more state if it is not found in context', async () => {
        const contextWithEmptyState = {
          ...mockNativeTokenStreamContext,
          state: {} as any,
        };
        const stateBefore =
          contextWithEmptyState.state[
            NativeTokenStreamDialogEventNames.ShowMoreButton
          ];
        expect(stateBefore).toBeUndefined();

        // mutate state
        const updatedContext = await shouldToggleBool({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: NativeTokenStreamDialogEventNames.ShowMoreButton,
          },
          attenuatedContext: contextWithEmptyState,
        });

        expect(updatedContext).toBeDefined();
        const stateAfter = (
          updatedContext as PermissionConfirmationContext<'native-token-stream'>
        ).state[NativeTokenStreamDialogEventNames.ShowMoreButton];
        expect(stateAfter).toBeUndefined();
      });

      it('should not mutate show more state if event name in incorrect', async () => {
        const stateBefore =
          mockNativeTokenStreamContext.state[
            NativeTokenStreamDialogEventNames.ShowMoreButton
          ];
        expect(stateBefore).toBe(false);

        // mutate state
        const updatedContext = await shouldToggleBool({
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: 'some other event name',
          },
          attenuatedContext: mockNativeTokenStreamContext,
        });

        expect(updatedContext).toBeDefined();
        const stateAfter = (
          updatedContext as PermissionConfirmationContext<'native-token-stream'>
        ).state[NativeTokenStreamDialogEventNames.ShowMoreButton];
        expect(stateAfter).toBe(false);
      });
    });
  });
});
