import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Text, Box, Section, Avatar } from '@metamask/snaps-sdk/jsx';
import { formatUnits } from 'viem';
import type { Hex } from '@metamask/delegation-core';

import { TooltipIcon } from './TooltipIcon';

export type AccountDetailsProps = {
  account: {
    address: Hex;
    balanceFormattedAsCurrency: string;
    balance: Hex;
  };
  tokenMetadata: {
    decimals: number;
    symbol: string;
    iconDataBase64: string | null;
  };
  title: string;
  tooltip: string;
};

export const AccountDetails: SnapComponent<AccountDetailsProps> = ({
  account,
  tokenMetadata,
  title,
  tooltip,
}) => {
  const { address, balance, balanceFormattedAsCurrency } = account;
  const { decimals } = tokenMetadata;

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
            {`${formatUnits(BigInt(balance), decimals)}`} available
          </Text>
        </Box>
      </Box>
    </Section>
  );
};
