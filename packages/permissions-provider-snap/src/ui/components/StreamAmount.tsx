import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Section,
  Box,
  Tooltip,
  Icon,
  Option,
  Input,
  Dropdown,
} from '@metamask/snaps-sdk/jsx';
import { formatUnits, type Hex } from 'viem';

import { formatTokenBalance } from '../../utils';

type StreamAmountProps = {
  streamAmount: Hex;
  streamAmountElementName: string;
  period: TimePeriod;
  periodElementName: string;
  isAdjustmentAllowed: boolean;
};

/**
 * An enum representing the time periods for which the stream rate can be calculated.
 */
export enum TimePeriod {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}

/**
 * A mapping of time periods to their equivalent seconds.
 */
export const TIME_PERIOD_TO_SECONDS: Record<TimePeriod, bigint> = {
  [TimePeriod.DAILY]: 60n * 60n * 24n, // 86,400(seconds)
  [TimePeriod.WEEKLY]: 60n * 60n * 24n * 7n, // 604,800(seconds)
  // Monthly is difficult because months are not consistent in length.
  // We approximate by calculating the number of seconds in 1/12th of a year.
  [TimePeriod.MONTHLY]: (60n * 60n * 24n * 365n) / 12n, // 2,629,760(seconds)
};

/**
 * Calculate the stream rate for the given total balance and time period.
 * - stream rate = total balance of asset / time period(in seconds).
 *
 * @param streamAmountPerPeriod - The stream amount per period.
 * @param timePeriod - The time period for which the stream rate is calculated.
 * @param tokenDecimal - The decimal places for the token.
 * @returns The stream rate for the given total balance and time period.
 */
export const formatStreamRatePerSecond = (
  streamAmountPerPeriod: Hex,
  timePeriod: TimePeriod,
  tokenDecimal = 18,
): string => {
  const streamRatePerSecond =
    BigInt(streamAmountPerPeriod) / TIME_PERIOD_TO_SECONDS[timePeriod];

  const streamRatePerSecondFormatted = formatUnits(
    streamRatePerSecond,
    tokenDecimal,
  );

  return streamRatePerSecondFormatted;
};

/**
 * Helper function to display text and tooltip for input fields.
 *
 * @param leftText - The text to display on the left side.
 * @param tooltip - The tooltip text.
 * @returns Return a component with text and tooltip.
 */
const inputDetails = (leftText: string, tooltip: string) => (
  <Box direction="horizontal" alignment="space-between">
    <Box direction="horizontal">
      <Text>{leftText}</Text>
      <Tooltip content={<Text>{tooltip}</Text>}>
        <Icon name="question" size="inherit" color="muted" />
      </Tooltip>
    </Box>
  </Box>
);

export const StreamAmount: SnapComponent<StreamAmountProps> = ({
  streamAmount,
  streamAmountElementName,
  period,
  periodElementName,
  isAdjustmentAllowed,
}) => {
  const streamRate = formatStreamRatePerSecond(streamAmount, period);
  return (
    <Section>
      {inputDetails(
        'Stream amount',
        'Number of tokens streamed in the specified time period.',
      )}
      <Input
        name={streamAmountElementName}
        type="number"
        placeholder={formatTokenBalance(streamAmount)}
        value={streamAmount}
        disabled={!isAdjustmentAllowed}
      />

      {inputDetails(
        'Period',
        'The time period over which the streaming rate is specified. The calculated streaming rate is per second.',
      )}
      <Dropdown
        name={periodElementName}
        value={period}
        disabled={!isAdjustmentAllowed}
      >
        <Option value={TimePeriod.MONTHLY}>{TimePeriod.MONTHLY}</Option>
        <Option value={TimePeriod.WEEKLY}>{TimePeriod.WEEKLY}</Option>
        <Option value={TimePeriod.DAILY}>{TimePeriod.DAILY}</Option>
      </Dropdown>

      {inputDetails(
        'Stream rate',
        'How many tokens are available each second.',
      )}
      <Input
        name="stream-rate"
        type="text"
        placeholder={`${streamRate} ETH/sec`}
        value={`${streamRate} ETH/sec`}
        disabled={true}
      />
    </Section>
  );
};
