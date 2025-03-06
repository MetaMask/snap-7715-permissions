import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Text,
  Icon,
  Box,
  Address,
  Tooltip,
  Selector,
  SelectorOption,
  Section,
  Card,
} from '@metamask/snaps-sdk/jsx';
import { type Hex } from 'viem';

import { weiToEth } from '../../utils';
import { ACCOUNT_SELECTOR } from '../userInputConstant';

export type AccountDetailsProps = {
  accounts: {
    address: Hex;
    balance: Hex;
    asset: string;
  }[];
  permissionIndex: number;
};

export const AccountDetails: SnapComponent<AccountDetailsProps> = ({
  accounts,
  permissionIndex,
}) => {
  const genSelectorOption = accounts.map((account) => (
    <SelectorOption value={account.address}>
      <Card
        title={<Address address={account.address} displayName={true} />}
        description="Spending Account"
        value={`${weiToEth(account.balance)} ${account.asset}`}
      />
    </SelectorOption>
  ));

  return (
    <Section>
      <Box direction="vertical">
        <Box direction="horizontal" alignment="space-between">
          <Box direction="horizontal">
            <Text>Account</Text>
            <Tooltip content={<Text>Tooltip text</Text>}>
              <Icon name="question" size="inherit" color="muted" />
            </Tooltip>
          </Box>
          <Icon name="edit" size="inherit" color="primary" />
        </Box>

        {/*
         * We need to make the interactive `name` dynamic so we get a new selector interface `state` for each permission request.
         * This allows the user to select different account for different permissions.
         */}
        <Selector
          name={`${ACCOUNT_SELECTOR}-${permissionIndex}`}
          title="Select an option"
        >
          {genSelectorOption}
        </Selector>
      </Box>
    </Section>
  );
};
