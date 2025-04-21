import {
  zHexStr,
  zMetaMaskPermissionData,
  zPermission,
} from '@metamask/7715-permissions-shared/types';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';
import { z } from 'zod';

import type { RulesSelectorElementNames, TimePeriod } from '../../confirmation';

/**
 * The event names for the native-token-stream permission confirmation page.
 * These events are used to handle user interactions with the confirmation page.
 */
export enum NativeTokenStreamDialogElementNames {
  JustificationShowMoreExpanded = 'justification-show-more-button-native-token-stream',
  StreamAmountInput = 'max-amount-input-native-token-stream',
  PeriodInput = 'period-input-native-token-stream',

  AddMoreRulesFormSubmit = 'add-more-rules-form-submit-native-token-stream',
  SelectedRuleDropdown = 'selected-rule-dropdown-native-token-stream',
  SelectedRuleInput = 'selected-rule-input-native-token-stream',

  InitialAmountRule = 'initial-amount-rule-native-token-stream',
  MaxAllowanceRule = 'max-allowance-rule-native-token-stream',
  StartTimeRule = 'start-time-rule-native-token-stream',
  ExpiryRule = 'expiry-rule-native-token-stream',
  MaxAllowanceDropdown = 'max-allowance-dropdown-native-token-stream',
}

export type NativeTokenStreamPermission = z.infer<
  typeof zNativeTokenStreamPermission
>;

export const zNativeTokenStreamPermission = zPermission.extend({
  type: z.literal('native-token-stream'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      initialAmount: zHexStr.optional(),
      maxAmount: zHexStr.optional(),
      amountPerSecond: zHexStr,
      startTime: z.number(),
    }),
  ),
});

declare module '../types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-shadow
  interface PermissionTypeMapping {
    'native-token-stream': JsonObject & NativeTokenStreamPermission; // JsonObject & NativeTokenStreamPermission to be compatible with the Snap JSON object type
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-shadow
  interface PermissionConfirmationStateMapping {
    'native-token-stream': JsonObject & {
      [RulesSelectorElementNames.AddMoreRulesPageToggle]: boolean;
      [NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded]: boolean;
      [NativeTokenStreamDialogElementNames.StreamAmountInput]: Hex;
      [NativeTokenStreamDialogElementNames.PeriodInput]: TimePeriod;
      rules: {
        [NativeTokenStreamDialogElementNames.MaxAllowanceRule]: string | null;
        [NativeTokenStreamDialogElementNames.InitialAmountRule]: string | null;
        [NativeTokenStreamDialogElementNames.StartTimeRule]: string | null;
        [NativeTokenStreamDialogElementNames.ExpiryRule]: string | null;
      };
      [NativeTokenStreamDialogElementNames.SelectedRuleDropdown]: string;
      [NativeTokenStreamDialogElementNames.SelectedRuleInput]: string;
      [NativeTokenStreamDialogElementNames.MaxAllowanceDropdown]: string;
    };
  }
}
