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
import type { Hex } from 'viem';
import { formatUnits } from 'viem';

import { formatTokenBalance } from '../../utils';

type StreamAmountProps = {
  streamAmount: Hex;
  streamAmountElementName: string;
  period: TimePeriod;
  periodElementName: string;
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
export const TIME_PERIOD_TO_SECOND: Record<TimePeriod, number> = {
  [TimePeriod.DAILY]: 60 * 60 * 24, // 86,400(seconds)
  [TimePeriod.WEEKLY]: 60 * 60 * 24 * 7, // 604,800(seconds)
  [TimePeriod.MONTHLY]: 60 * 60 * 24 * 30, // 2,592,000(seconds)
};

/**
 * Calculate the stream rate for the given total balance and time period.
 * - stream rate = total balance of asset / time period(in seconds).
 *
 * @param wei - The total balance of the asset.
 * @param timePeriod - The time period for which the stream rate is calculated.
 * @param tokenDecimal - The decimal places for the token.
 * @returns The stream rate for the given total balance and time period.
 */
const calculateStreamRate = (
  wei: Hex,
  timePeriod: TimePeriod,
  tokenDecimal = 18,
): string => {
  const tokenBalance = formatUnits(BigInt(wei), tokenDecimal);
  const tokenBalanceNum = parseFloat(tokenBalance);
  return (tokenBalanceNum / TIME_PERIOD_TO_SECOND[timePeriod]).toFixed(
    tokenDecimal,
  );
};

/**
 * Helper function to display text and tooltip for input fields.
 *
 * @param leftText - The text to display on the left side.
 * @param rightText - The text to display on the right side.
 * @param tooltip - The tooltip text.
 * @returns Return a component with text and tooltip.
 */
const inputDetails = (leftText: string, rightText: string, tooltip: string) => (
  <Box direction="horizontal" alignment="space-between">
    <Box direction="horizontal">
      <Text>{leftText}</Text>
      <Tooltip content={<Text>{tooltip}</Text>}>
        <Icon name="question" size="inherit" color="muted" />
      </Tooltip>
    </Box>
    <Text color="alternative">{rightText}</Text>
  </Box>
);

export const StreamAmount: SnapComponent<StreamAmountProps> = ({
  streamAmount,
  streamAmountElementName,
  period,
  periodElementName,
}) => {
  return (
    <Section>
      {inputDetails('Stream Amount', 'Required', 'tooltip text')}
      <Input
        name={streamAmountElementName}
        type="number"
        placeholder={formatTokenBalance(streamAmount)}
        value={streamAmount}
      />

      {inputDetails('Period', 'Required', 'tooltip text')}
      <Dropdown name={periodElementName} value={period}>
        <Option value={TimePeriod.MONTHLY}>{TimePeriod.MONTHLY}</Option>
        <Option value={TimePeriod.WEEKLY}>{TimePeriod.WEEKLY}</Option>
        <Option value={TimePeriod.DAILY}>{TimePeriod.DAILY}</Option>
      </Dropdown>

      {inputDetails(
        'Stream rate',
        `${calculateStreamRate(streamAmount, period)} ETH/sec`,
        'tooltip text',
      )}
    </Section>
  );
};
