import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Text, Box, Section, Avatar } from '@metamask/snaps-sdk/jsx';
import { type Hex } from 'viem';
import { TooltipIcon } from './TooltipIcon';

import { formatTokenBalance } from '../../utils/balance';

export type AccountDetailsProps = {
  account: {
    address: Hex;
    balanceFormattedAsCurrency: string;
    balance: string;
  };
  title: string;
  tooltip: string;
};

export const AccountDetails: SnapComponent<AccountDetailsProps> = ({
  account,
  title,
  tooltip,
}) => {
  const { address, balance, balanceFormattedAsCurrency } = account;
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
          <Text color="muted">{balanceFormattedAsCurrency}</Text>
          <Text color="alternative">
            {`${formatTokenBalance(balance)}`} available
          </Text>
        </Box>
      </Box>
    </Section>
  );
};
