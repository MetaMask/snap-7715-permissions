import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Section } from '@metamask/snaps-sdk/jsx';

import type { PermissionSpecificRulesProps } from '../../../types';
import { TokenValueRule, TimestampRule } from '../Rules';

export enum NativeTokenStreamRulesElementNames {
  InitialAmount = 'native-token-stream-rules:initial-allowance',
  InitialAmountRemove = 'native-token-stream-rules:initial-allowance-remove',

  MaxAllowance = 'native-token-stream-rules:max-allowance',
  MaxAllowanceRemove = 'native-token-stream-rules:max-allowance-remove',

  StartTime = 'native-token-stream-rules:start-time',
  StartTimeRemove = 'native-token-stream-rules:start-time-remove',

  Expiry = 'native-token-stream-rules:expiry',
  ExpiryRemove = 'native-token-stream-rules:expiry-remove',
}

/**
 * Renders the native-token-stream attenuation adjusted permission rules.
 *
 * @param props - The permission rules props.
 * @param props.permissionSpecificRules - The permission rules.
 * @param props.expiry - The unix timestamp in seconds when the granted permission is set to expire.
 * @returns The JSX element to render.
 */
export const NativeTokenStreamRules: SnapComponent<
  PermissionSpecificRulesProps<'native-token-stream'>
> = ({ permissionSpecificRules, expiry }) => {
  const { maxAllowance, initialAmount, startTime } = permissionSpecificRules;
  return (
    <Section>
      {initialAmount ? (
        <TokenValueRule
          text="Initial amount"
          tooltip="tooltip text"
          inputName={NativeTokenStreamRulesElementNames.InitialAmount}
          removeRuleButtonName={
            NativeTokenStreamRulesElementNames.InitialAmountRemove
          }
          allowance={initialAmount}
        />
      ) : null}

      {maxAllowance ? (
        <TokenValueRule
          text="Max allowance"
          tooltip="tooltip text"
          inputName={NativeTokenStreamRulesElementNames.MaxAllowance}
          removeRuleButtonName={
            NativeTokenStreamRulesElementNames.MaxAllowanceRemove
          }
          allowance={maxAllowance}
        />
      ) : null}

      {startTime ? (
        <TimestampRule
          text="Start date"
          tooltip="tooltip text"
          inputName={NativeTokenStreamRulesElementNames.StartTime}
          removeRuleButtonName={
            NativeTokenStreamRulesElementNames.StartTimeRemove
          }
          timestamp={startTime}
        />
      ) : null}

      {expiry ? (
        <TimestampRule
          text="Expiration date"
          tooltip="tooltip text"
          inputName={NativeTokenStreamRulesElementNames.Expiry}
          removeRuleButtonName={NativeTokenStreamRulesElementNames.ExpiryRemove}
          timestamp={expiry}
        />
      ) : null}
    </Section>
  );
};
