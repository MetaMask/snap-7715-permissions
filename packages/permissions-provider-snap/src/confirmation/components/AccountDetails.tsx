import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Icon,
  Box,
  Tooltip,
  Section,
  Avatar,
} from '@metamask/snaps-sdk/jsx';
import { type Hex } from 'viem';

import { formatTokenBalance } from '../../utils';

export type AccountDetailsProps = {
  account: {
    address: Hex;
    valueFormattedAsCurrency: string;
    balance: string;
  };
  senderDetails: {
    title: string;
    tooltip: string;
  };
};

export const AccountDetails: SnapComponent<AccountDetailsProps> = ({
  account,
  senderDetails,
}) => {
  const { address, balance, valueFormattedAsCurrency } = account;
  const { title, tooltip } = senderDetails;
  return (
    <Section>
      <Box direction="vertical">
        <Box direction="horizontal" alignment="space-between">
          <Box direction="horizontal">
            <Text>{title}</Text>
            <Tooltip content={<Text>{tooltip}</Text>}>
              <Icon name="question" size="inherit" color="muted" />
            </Tooltip>
          </Box>

          <Box direction="horizontal">
            <Avatar address={`eip155:1:${address}`} size="sm" />
            <Text color="default">Gator Account</Text>
          </Box>
        </Box>

        <Box direction="horizontal" alignment="end">
          <Text color="muted">{valueFormattedAsCurrency}</Text>
          <Text color="alternative">
            {`${formatTokenBalance(balance)}`} available
          </Text>
        </Box>
      </Box>
    </Section>
  );
};
