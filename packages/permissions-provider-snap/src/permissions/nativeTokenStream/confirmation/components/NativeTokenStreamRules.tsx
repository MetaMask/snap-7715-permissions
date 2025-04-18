import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Section } from '@metamask/snaps-sdk/jsx';

import { TextRule } from '../../../../confirmation';

export type NativeTokenStreamRulesProps = {
  initialAmount: string | null;
  maxAllowance: string | null | 'Unlimited';
  startTime: string | null;
  expiry: string | null;

  initialAmountEventName: string;
  maxAllowanceEventName: string;
  startTimeEventName: string;
  expiryEventName: string;
  isAdjustmentAllowed: boolean;
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
 * @param props.isAdjustmentAllowed - Whether the permission can be adjusted.
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
  isAdjustmentAllowed,
}) => {
  return (
    <Section>
      {initialAmount ? (
        <TextRule
          text="Initial allowance"
          tooltip="The amount that can be taken out by the recipient immediately after the start date."
          inputName={`${initialAmountEventName}-input`}
          removeRuleButtonName={initialAmountEventName}
          textValue={initialAmount}
          isAdjustmentAllowed={isAdjustmentAllowed}
        />
      ) : null}

      {maxAllowance ? (
        <TextRule
          text="Max allowance"
          tooltip="The token stream stops when the max allowance is reached. This includes the initial allowance and the streaming amount each period."
          inputName={`${maxAllowanceEventName}-input`}
          removeRuleButtonName={maxAllowanceEventName}
          textValue={maxAllowance}
          isAdjustmentAllowed={isAdjustmentAllowed}
        />
      ) : null}

      {startTime ? (
        <TextRule
          text="Start date"
          tooltip="Start date for the token stream allowance."
          inputName={`${startTimeEventName}-input`}
          removeRuleButtonName={startTimeEventName}
          textValue={startTime}
          isAdjustmentAllowed={isAdjustmentAllowed}
        />
      ) : null}

      {expiry ? (
        <TextRule
          text="Expiration date"
          tooltip="Date when tokens can no longer be taken out by the receiver."
          inputName={`${expiryEventName}-input`}
          removeRuleButtonName={expiryEventName}
          textValue={expiry}
          isAdjustmentAllowed={isAdjustmentAllowed}
        />
      ) : null}
    </Section>
  );
};
