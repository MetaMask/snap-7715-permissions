import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Section } from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import { TokenValueRule, TimestampRule } from '../Rules';

export type NativeTokenStreamRulesProps = {
  initialAmount: Hex | null;
  maxAllowance: Hex | null | 'Unlimited';
  startTime: number | null;
  expiry: number | null;

  initialAmountRemoveEventName: string;
  initialAmountInputEventName: string;

  maxAllowanceRemoveEventName: string;
  maxAllowanceInputEventName: string;

  startTimeRemoveEventName: string;
  startTimeInputEventName: string;

  expiryRemoveEventName: string;
  expiryInputEventName: string;
};

/**
 * Renders the native-token-stream attenuation adjusted permission rules.
 *
 * @param props - The permission rules props.
 * @param props.initialAmount - The initial amount of the native token stream.
 * @param props.maxAllowance - The max allowance of the native token stream.
 * @param props.startTime - The start time of the native token stream.
 * @param props.expiry - The unix timestamp in seconds when the granted permission is set to expire.
 * @param props.initialAmountRemoveEventName - The event name for the initial amount remove.
 * @param props.initialAmountInputEventName - The event name for the initial amount input.
 * @param props.maxAllowanceRemoveEventName - The event name for the max allowance remove.
 * @param props.maxAllowanceInputEventName - The event name for the max allowance input.
 * @param props.startTimeRemoveEventName - The event name for the start time remove.
 * @param props.startTimeInputEventName - The event name for the start time input.
 * @param props.expiryRemoveEventName - The event name for the expiry remove.
 * @param props.expiryInputEventName - The event name for the expiry input.
 * @returns The JSX element to render.
 */
export const NativeTokenStreamRules: SnapComponent<
  NativeTokenStreamRulesProps
> = ({
  maxAllowance,
  initialAmount,
  startTime,
  expiry,
  initialAmountRemoveEventName,
  initialAmountInputEventName,
  maxAllowanceRemoveEventName,
  maxAllowanceInputEventName,
  startTimeRemoveEventName,
  startTimeInputEventName,
  expiryRemoveEventName,
  expiryInputEventName,
}) => {
  return (
    <Section>
      {initialAmount ? (
        <TokenValueRule
          text="Initial amount"
          tooltip="tooltip text"
          inputName={initialAmountInputEventName}
          removeRuleButtonName={initialAmountRemoveEventName}
          allowance={initialAmount}
        />
      ) : null}

      {maxAllowance ? (
        <TokenValueRule
          text="Max allowance"
          tooltip="tooltip text"
          inputName={maxAllowanceInputEventName}
          removeRuleButtonName={maxAllowanceRemoveEventName}
          allowance={maxAllowance}
        />
      ) : null}

      {startTime ? (
        <TimestampRule
          text="Start date"
          tooltip="tooltip text"
          inputName={startTimeInputEventName}
          removeRuleButtonName={startTimeRemoveEventName}
          timestamp={startTime}
        />
      ) : null}

      {expiry ? (
        <TimestampRule
          text="Expiration date"
          tooltip="tooltip text"
          inputName={expiryInputEventName}
          removeRuleButtonName={expiryRemoveEventName}
          timestamp={expiry}
        />
      ) : null}
    </Section>
  );
};
