import type { Hex } from '@metamask/delegation-core';
import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Text, Box, Section, AccountSelector } from '@metamask/snaps-sdk/jsx';

import { TooltipIcon } from './TooltipIcon';
import { formatUnitsFromHex } from '../../utils/value';
import { Caip10Address } from '../../core/types';

export type AccountDetailsProps = {
  account: {
    address: Caip10Address;
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
  accountSelectorName: string;
};

export const AccountDetails: SnapComponent<AccountDetailsProps> = ({
  account,
  tokenMetadata,
  title,
  tooltip,
  accountSelectorName,
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
        </Box>
        <AccountSelector
          name={accountSelectorName}
          chainIds={['eip155:1']}
          switchGlobalAccount={false}
          value={address}
        />

        <Box direction="horizontal" alignment="end">
          <Text color="muted">{balanceFormattedAsCurrency}</Text>
          <Text color="alternative">
            {`${formatUnitsFromHex({
              value: balance,
              allowUndefined: false,
              decimals,
            })} `}
            available
          </Text>
        </Box>
      </Box>
    </Section>
  );
};
