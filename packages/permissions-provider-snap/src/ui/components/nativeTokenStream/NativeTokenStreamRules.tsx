import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Section } from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import { TokenValueRule, TimestampRule } from '../Rules';

export type NativeTokenStreamRulesProps = {
  initialAmount: Hex | null;
  maxAllowance: Hex | null | 'Unlimited';
  startTime: number | null;
  expiry: number | null;

  initialAmountEventName: string;
  maxAllowanceEventName: string;
  startTimeEventName: string;
  expiryEventName: string;
};

/**
 * Renders the native-token-stream attenuation adjusted permission rules.
 *
 * @param props - The permission rules props.
 * @param props.initialAmount - The initial amount of the native token stream.
 * @param props.maxAllowance - The max allowance of the native token stream.
 * @param props.startTime - The start time of the native token stream.
 * @param props.expiry - The unix timestamp in seconds when the granted permission is set to expire.
 * @param props.initialAmountEventName - The event name for the initial amount .
 * @param props.maxAllowanceEventName - The event name for the max allowance .
 * @param props.startTimeEventName - The event name for the start time .
 * @param props.expiryEventName - The event name for the expiry remove.
 * @returns The JSX element to render.
 */
export const NativeTokenStreamRules: SnapComponent<
  NativeTokenStreamRulesProps
> = ({
  maxAllowance,
  initialAmount,
  startTime,
  expiry,
  initialAmountEventName,
  maxAllowanceEventName,
  startTimeEventName,
  expiryEventName,
}) => {
  return (
    <Section>
      {initialAmount ? (
        <TokenValueRule
          text="Initial amount"
          tooltip="tooltip text"
          inputName={`${initialAmountEventName}-input`}
          removeRuleButtonName={initialAmountEventName}
          allowance={initialAmount}
        />
      ) : null}

      {maxAllowance ? (
        <TokenValueRule
          text="Max allowance"
          tooltip="tooltip text"
          inputName={`${maxAllowanceEventName}-input`}
          removeRuleButtonName={maxAllowanceEventName}
          allowance={maxAllowance}
        />
      ) : null}

      {startTime ? (
        <TimestampRule
          text="Start date"
          tooltip="tooltip text"
          inputName={`${startTimeEventName}-input`}
          removeRuleButtonName={startTimeEventName}
          timestamp={startTime}
        />
      ) : null}

      {expiry ? (
        <TimestampRule
          text="Expiration date"
          tooltip="tooltip text"
          inputName={`${expiryEventName}-input`}
          removeRuleButtonName={expiryEventName}
          timestamp={expiry}
        />
      ) : null}
    </Section>
  );
};
