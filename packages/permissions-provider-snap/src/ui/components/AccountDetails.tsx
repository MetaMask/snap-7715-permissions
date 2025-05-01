import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Text, Box, Section, Avatar } from '@metamask/snaps-sdk/jsx';
import { type Hex } from 'viem';
import { TooltipIcon } from './TooltipIcon';

import { formatTokenBalance } from '../../utils/balance';

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
            <TooltipIcon tooltip={tooltip} />
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
