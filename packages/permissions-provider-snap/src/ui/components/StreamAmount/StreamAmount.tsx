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

import { weiToEth } from '../../../utils';

export enum StreamAmountEventNames {
  StreamAmount = 'stream-amount:amount',
  Period = 'stream-amount:period',
}

type StreamAmountProps = {
  maxAmount: Hex;
};

/**
 * Helper function to display text and tooltip for input fields.
 *
 * @param text - The text to display.
 * @param tooltip - The tooltip text.
 * @returns Return a component with text and tooltip.
 */
const inputDetails = (text: string, tooltip: string) => (
  <Box direction="horizontal" alignment="space-between">
    <Box direction="horizontal">
      <Text>{text}</Text>
      <Tooltip content={<Text>{tooltip}</Text>}>
        <Icon name="question" size="inherit" color="muted" />
      </Tooltip>
    </Box>
    <Text color="muted">Required</Text>
  </Box>
);

export const StreamAmount: SnapComponent<StreamAmountProps> = ({
  maxAmount,
}) => {
  return (
    <Section>
      {inputDetails('Stream Amount', 'tooltip text')}
      <Input
        name={StreamAmountEventNames.StreamAmount}
        type="number"
        placeholder={weiToEth(maxAmount)}
        value={maxAmount}
        disabled={true}
      />

      {inputDetails('Period', 'tooltip text')}
      <Dropdown
        name={StreamAmountEventNames.Period}
        disabled={true}
        value="Weekly"
      >
        <Option value="Monthly">Monthly</Option>
        <Option value="Weekly">Weekly</Option>
        <Option value="Daily">Daily</Option>
      </Dropdown>
    </Section>
  );
};
