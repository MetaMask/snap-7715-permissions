import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Box,
  Tooltip,
  Icon,
  Input,
  Button,
} from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import { weiToEth } from '../../../utils';

type BaseRuleProps = {
  text: string;
  tooltip: string;
  inputName: string;
  removeName: string;
};

export type AllowanceRuleProps = BaseRuleProps & {
  allowance: Hex | 'Unlimited';
};

export type TimestampRuleProps = BaseRuleProps & {
  timestamp: number;
};

/**
 * Converts a unix timestamp(in seconds) to a human-readable date format (MM/DD/YYYY).
 *
 * @param timestamp - The unix timestamp in seconds.
 * @returns The formatted date string.
 */
const convertTimestampToReadableDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const formattedDate = date.toLocaleDateString('en-US', options);
  const [month, day, year] = formattedDate.split('/');
  if (!month || !day || !year) {
    throw new Error('Invalid date format');
  }

  // Format the date as MM/DD/YYYY
  return `${month}/${day}/${year}`;
};

/**
 * Renders a tooltip with text and an close icon.
 *
 * @param text - The text to display.
 * @param tooltip - The tooltip text to display.
 * @param removeName - The name of the remove button.
 * @returns The JSX element to render.
 */
const renderRuleItemDetails = (
  text: string,
  tooltip: string,
  removeName: string,
) => (
  <Box direction="horizontal" alignment="space-between">
    <Box direction="horizontal">
      <Text>{text}</Text>
      <Tooltip content={<Text>{tooltip}</Text>}>
        <Icon name="question" size="inherit" color="muted" />
      </Tooltip>
    </Box>
    <Button name={removeName}>
      <Icon name="close" size="inherit" color="primary" />
    </Button>
  </Box>
);

/**
 * Renders a rule item with an allowance input field.
 *
 * @param props - The rule item props.
 * @param props.text - The text to display.
 * @param props.tooltip - The tooltip text to display.
 * @param props.inputName - The name of the input field.
 * @param props.removeName - The name of the remove button.
 * @param props.allowance - The allowance value to display.
 * @returns The JSX element to render.
 */
export const AllowanceRule: SnapComponent<AllowanceRuleProps> = ({
  text,
  tooltip,
  inputName,
  removeName,
  allowance,
}) => (
  <Box direction="vertical">
    {renderRuleItemDetails(text, tooltip, removeName)}
    <Input
      name={inputName}
      type="number"
      placeholder={allowance === 'Unlimited' ? allowance : weiToEth(allowance)}
      value={allowance}
      disabled={true}
    />
  </Box>
);

/**
 * Renders a rule item with a timestamp input field.
 *
 * @param props - The rule item props.
 * @param props.text - The text to display.
 * @param props.tooltip - The tooltip text to display.
 * @param props.inputName - The name of the input field.
 * @param props.removeName - The name of the remove button.
 * @param props.timestamp - The timestamp value to display.
 * @returns The JSX element to render.
 */
export const TimestampRule: SnapComponent<TimestampRuleProps> = ({
  text,
  tooltip,
  inputName,
  removeName,
  timestamp,
}) => (
  <Box direction="vertical">
    {renderRuleItemDetails(text, tooltip, removeName)}
    <Input
      name={inputName}
      type="text"
      placeholder={convertTimestampToReadableDate(timestamp)}
      value={convertTimestampToReadableDate(timestamp)}
      disabled={true}
    />
  </Box>
);
